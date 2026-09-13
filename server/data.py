"""Bounded upstream reads and atomic, backwards-compatible dashboard snapshots."""
from datetime import datetime, timezone
from decimal import Decimal
from fractions import Fraction
import json
import os
import time
import uuid

import requests

KOIOS = 'https://api.koios.rest/api/v1/'
BALANCE = 'https://www.balanceanalytics.io/api/'
PSEUDO = {'drep_always_abstain', 'drep_always_no_confidence'}
SNAPSHOT_KEYS = ['changwatch:v1:spo', 'changwatch:v1:governance']
THRESHOLDS = {
    'no_confidence': ('dvt_motion_no_confidence', 'pvt_motion_no_confidence'),
    'committee_normal': ('dvt_committee_normal', 'pvt_committee_normal'),
    'committee_no_confidence': ('dvt_committee_no_confidence', 'pvt_committee_no_confidence'),
    'constitution': ('dvt_update_to_constitution', None),
    'hard_fork': ('dvt_hard_fork_initiation', 'pvt_hard_fork_initiation'),
    'network': ('dvt_p_p_network_group', 'pvtpp_security_group'),
    'economic': ('dvt_p_p_economic_group', 'pvtpp_security_group'),
    'technical': ('dvt_p_p_technical_group', 'pvtpp_security_group'),
    'governance': ('dvt_p_p_gov_group', 'pvtpp_security_group'),
    'treasury': ('dvt_treasury_withdrawal', None),
}


class DataError(Exception):
    """Safe, non-secret diagnostic suitable for structured logs."""


def integer(value):
    if isinstance(value, bool):
        raise DataError('Invalid integer')
    try:
        number = Decimal(str(value))
        if not number.is_finite() or number < 0 or number != number.to_integral_value():
            raise ValueError()
        return int(number)
    except (ValueError, ArithmeticError):
        raise DataError('Invalid nonnegative integer') from None


def lovelace(ada):
    try:
        return str(integer(Decimal(str(ada)) * 1_000_000))
    except ArithmeticError:
        raise DataError('Invalid ADA amount') from None


def ratio(value):
    try:
        f = Fraction(str(value))
        if not 0 <= f <= 1:
            raise ValueError()
        return {'numerator': f.numerator, 'denominator': f.denominator}
    except (ValueError, ZeroDivisionError):
        raise DataError('Invalid voting threshold') from None


class Client:
    def __init__(self, budget=45, session=None):
        self.deadline = time.monotonic() + budget
        self.session = session or requests.Session()

    def request(self, method, url, *, retry=True, **kwargs):
        for attempt in range(2 if retry else 1):
            remaining = self.deadline - time.monotonic()
            if remaining < 0.5:
                raise DataError('Upstream time budget exceeded')
            try:
                response = self.session.request(method, url,
                    timeout=(min(2, remaining / 2), min(5, remaining / 2)),
                    allow_redirects=False, **kwargs)
                if response.status_code == 429 or response.status_code >= 500:
                    raise requests.RequestException('Transient upstream failure')
                if not 200 <= response.status_code < 300:
                    raise DataError('Upstream rejected request')
                return response.json(parse_float=Decimal)
            except (requests.RequestException, ValueError):
                if attempt == (1 if retry else 0):
                    raise DataError('Upstream request failed') from None
                time.sleep(0.15)
        raise DataError('Upstream request failed')

    def koios(self, endpoint, payload=None):
        data = self.request('GET' if payload is None else 'POST', KOIOS + endpoint,
                            **({} if payload is None else {'json': payload}))
        if not isinstance(data, list):
            raise DataError('Expected Koios rows')
        return data

    def pages(self, endpoint):
        rows = []
        separator = '&' if '?' in endpoint else '?'
        for offset in range(0, 100_000, 500):
            page = self.koios(f'{endpoint}{separator}offset={offset}&limit=500')
            if not page:
                return rows
            rows.extend(page)
        raise DataError('Pagination limit exceeded')


def epoch(client):
    tip = client.koios('tip')
    if len(tip) != 1:
        raise DataError('Missing chain tip')
    return integer(tip[0]['epoch_no'])


def snapshot(kind, rows, totals, epochs, **extra):
    return {'schema_version': 1, 'snapshot_id': str(uuid.uuid4()), 'kind': kind,
            'updated_at': datetime.now(timezone.utc).isoformat(),
            'source_epochs': epochs, 'rows': rows, 'totals': totals, **extra}


def collect_governance(client):
    current = epoch(client)
    registered = client.pages('drep_list?select=drep_id,registered&order=drep_id.asc')
    ids = {r['drep_id'] for r in registered if r.get('registered') is True} - PSEUDO
    if not ids:
        raise DataError('Empty dRep registry')
    wanted = sorted(ids | PSEUDO)
    rows = []
    seen = set()
    for start in range(0, len(wanted), 50):
        batch = wanted[start:start + 50]
        data = client.koios('drep_info?select=drep_id,active,amount', {'_drep_ids': batch})
        if {r['drep_id'] for r in data} != set(batch) or len(data) != len(batch):
            raise DataError('Incomplete dRep batch')
        for d in data:
            ident = d['drep_id']
            active = True if ident in PSEUDO else d.get('active')
            if not isinstance(active, bool) or ident in seen:
                raise DataError('Invalid dRep registration')
            seen.add(ident)
            rows.append({'drep_id': ident, 'is_active': active,
                         'voting_power_lovelace': str(integer(0 if d['amount'] is None else d['amount']))})
    params = client.koios(f'epoch_params?_epoch_no={current}')
    params = [p for p in params if p.get('epoch_no') == current]
    if len(params) != 1:
        raise DataError('Missing current protocol parameters')
    p = params[0]
    thresholds = {key: {'drep': ratio(p[drep]), 'spo': ratio(p[spo]) if spo else None}
                  for key, (drep, spo) in THRESHOLDS.items()}
    committees = client.koios('committee_info')
    if len(committees) != 1:
        raise DataError('Missing committee state')
    committee = committees[0]
    members = committee['members']
    eligible = sum(m['status'] == 'authorized' and integer(m['expiration_epoch']) >= current
                   for m in members)
    denominator = integer(committee['quorum_denominator'])
    if denominator == 0:
        raise DataError('Invalid committee quorum')
    quorum = ratio(Fraction(integer(committee['quorum_numerator']), denominator))
    if epoch(client) != current:
        raise DataError('Epoch changed during governance refresh')
    rows.sort(key=lambda r: (-int(r['voting_power_lovelace']), r['drep_id']))
    return snapshot('governance', rows, {'registered_dreps': len(ids),
                    'active_dreps': sum(r['is_active'] for r in rows if r['drep_id'] not in PSEUDO)},
                    {'koios': current}, thresholds=thresholds,
                    committee={'eligible_members': eligible,
                               'minimum_size': integer(p['committee_min_size']), 'quorum': quorum})


def collect_spo(client):
    current = epoch(client)
    data = client.request('GET', BALANCE + 'mavdata.json')['api_data']
    if not data:
        raise DataError('Empty operator data')
    source_epochs = {integer(p['epoch']) for p in data}
    if len(source_epochs) != 1:
        raise DataError('Mixed operator source epochs')
    source_epoch = source_epochs.pop()
    if source_epoch > current or source_epoch < current - 1:
        raise DataError('Operator source epoch is out of date')
    groups = {}
    for p in data:
        label = 'SINGLEPOOL' if p['class'] == 'sSPO' else p['label']
        if not isinstance(label, str) or not label.strip():
            raise DataError('Missing operator group label')
        groups[label] = groups.get(label, 0) + int(lovelace(p['stake']))
    rows = [{'label': name, 'stake_lovelace': str(amount), 'is_aggregate': name == 'SINGLEPOOL'}
            for name, amount in groups.items()]
    rows.sort(key=lambda r: (-int(r['stake_lovelace']), r['label']))
    if sum(int(r['stake_lovelace']) for r in rows) == 0:
        raise DataError('Empty delegated stake')
    totals = client.koios('totals?order=epoch_no.desc&limit=2')
    available = [t for t in totals if integer(t['epoch_no']) <= current]
    if not available:
        raise DataError('Missing supply')
    supply = max(available, key=lambda t: integer(t['epoch_no']))
    circulating = integer(supply['supply'])
    if circulating <= 0 or sum(int(r['stake_lovelace']) for r in rows) > circulating:
        raise DataError('Inconsistent circulating supply')
    if integer(supply['epoch_no']) < current - 1:
        raise DataError('Supply source epoch is out of date')
    pools = client.pages('pool_list?select=pool_id_bech32,pool_status&order=pool_id_bech32.asc')
    active = {p['pool_id_bech32'] for p in pools if p['pool_status'] != 'retired'}
    if not active:
        raise DataError('Empty pool registry')
    grouping = client.request('GET', BALANCE + 'groupdata.json')[0]['pool_group_json']
    mapped = {p['pool_hash']: p['pool_group'] for p in grouping if p['pool_hash'] in active}
    operators = {('pool', pool) if mapped.get(pool, 'SINGLEPOOL') == 'SINGLEPOOL'
                 else ('group', mapped[pool]) for pool in active}
    if epoch(client) != current:
        raise DataError('Epoch changed during SPO refresh')
    return snapshot('spo', rows, {'total_pools': len(active), 'total_spos': len(operators),
                    'circulating_lovelace': str(circulating)},
                    {'koios': current, 'balance': source_epoch, 'supply': integer(supply['epoch_no'])})


class Store:
    def __init__(self, client=None):
        self.url = os.environ.get('KV_REST_API_URL', '').rstrip('/')
        token = os.environ.get('KV_REST_API_TOKEN', '')
        if not self.url.startswith('https://') or not token:
            raise DataError('Storage is not configured')
        self.headers = {'Authorization': 'Bearer ' + token}
        self.client = client or Client(budget=8)

    def command(self, args):
        response = self.client.request('POST', self.url, json=args, headers=self.headers, retry=False)
        if not isinstance(response, dict) or 'result' not in response or 'error' in response:
            raise DataError('Storage command failed')
        return response['result']

    def read(self, key):
        raw = self.command(['GET', key])
        if raw is None:
            raise DataError('Snapshot is not available')
        try:
            return json.loads(raw)
        except (ValueError, TypeError):
            raise DataError('Invalid stored snapshot') from None

    def dashboard(self):
        raw = self.command(['MGET', *SNAPSHOT_KEYS])
        try:
            if not isinstance(raw, list) or len(raw) != 2:
                raise ValueError()
            spo, governance = [json.loads(r) for r in raw]
            for value, kind in [(spo, 'spo'), (governance, 'governance')]:
                if (value['schema_version'] != 1 or value['kind'] != kind
                    or not isinstance(value['rows'], list) or not value['rows']
                    or not isinstance(value['totals'], dict)
                    or not isinstance(value['source_epochs'], dict) or not value['source_epochs']
                    or not isinstance(value['snapshot_id'], str) or not value['snapshot_id']):
                    raise ValueError()
                datetime.fromisoformat(value['updated_at'])
                for source_epoch in value['source_epochs'].values():
                    integer(source_epoch)
                if kind == 'governance' and (not isinstance(value['committee'], dict)
                    or not all(key in value['thresholds'] for key in THRESHOLDS)):
                    raise ValueError()
            return {'spo': spo, 'governance': governance}
        except (ValueError, TypeError, KeyError):
            raise DataError('Dashboard snapshots are not available') from None

    def publish(self, value):
        """SET-only transaction: full snapshot and legacy responses become visible together."""
        if value['kind'] == 'spo':
            key = SNAPSHOT_KEYS[0]
            rows = [{'label': r['label'], 'stake': int(r['stake_lovelace']) / 1_000_000} for r in value['rows']]
            totals = {k: value['totals'][k] for k in ['total_spos', 'total_pools']}
            totals['circulating_ada'] = int(value['totals']['circulating_lovelace']) / 1_000_000
            legacy = {'spo_data': rows, 'spo_totals': totals}
        else:
            key = SNAPSHOT_KEYS[1]
            rows = [{'drep_id': r['drep_id'], 'is_active': r['is_active'],
                     'active_power': int(r['voting_power_lovelace']), 'given_name': None} for r in value['rows']]
            legacy = {'drep_data': rows, 'drep_totals': {'total_dreps': value['totals']['registered_dreps'] + 2}}
        values = {key: value, **{k: {'value': v} for k, v in legacy.items()}}
        commands = [['SET', k, json.dumps(v)] for k, v in values.items()]
        result = self.client.request('POST', self.url + '/multi-exec', json=commands,
                                     headers=self.headers, retry=False)
        if not isinstance(result, list) or len(result) != len(commands) or any(r.get('result') != 'OK' for r in result):
            raise DataError('Snapshot publication failed')
