import copy
import io
import json
import os
from pathlib import Path
import unittest
from unittest.mock import Mock, patch
from decimal import Decimal
import requests
from server.data import Client, DataError, Store, THRESHOLDS, collect_governance, collect_spo, integer, lovelace
from server.http import ReadHandler, RefreshHandler

FIXTURE = json.loads((Path(__file__).parent / 'fixtures/dashboard.json').read_text())
ENV = {'KV_REST_API_URL': 'https://storage.example', 'KV_REST_API_TOKEN': 'test-token', 'CRON_SECRET': 'test-secret'}

class Sources:
    def __init__(self):
        self.tip = 655
        self.dreps = [{'drep_id': r['drep_id'], 'active': r['is_active'], 'amount': r['voting_power_lovelace']} for r in FIXTURE['governance']['rows']]
        self.committee = {'members': [{'status': 'authorized', 'expiration_epoch': 655} for _ in range(7)], 'quorum_numerator': 2, 'quorum_denominator': 3}
        self.params = {'epoch_no': 655, 'committee_min_size': 5}
        for key, (drep, spo) in THRESHOLDS.items():
            self.params[drep] = Decimal('.60') if key == 'hard_fork' else Decimal('.67')
            if spo: self.params[spo] = Decimal('.51')
        self.operator = [{'label': 'A', 'class': 'MPO', 'epoch': 655, 'stake': Decimal('1000.000001')},
                         {'label': 's1', 'class': 'sSPO', 'epoch': 655, 'stake': Decimal('2000.000002')}]
        self.incomplete = False
        self.calls = []
    def pages(self, endpoint):
        self.calls.append(endpoint)
        if endpoint.startswith('drep_list'):
            return [{'drep_id': r['drep_id'], 'registered': True} for r in self.dreps]
        return [{'pool_id_bech32': 'pool1', 'pool_status': 'registered'}, {'pool_id_bech32': 'pool2', 'pool_status': 'registered'}, {'pool_id_bech32': 'pool3', 'pool_status': 'retired'}]
    def koios(self, endpoint, payload=None):
        self.calls.append(endpoint)
        if endpoint == 'tip': return [{'epoch_no': self.tip}]
        if endpoint.startswith('drep_info'):
            rows = [d for d in self.dreps if d['drep_id'] in payload['_drep_ids']]
            return rows[:-1] if self.incomplete else rows
        if endpoint.startswith('epoch_params'): return [self.params]
        if endpoint == 'committee_info': return [self.committee]
        if endpoint.startswith('totals'): return [{'epoch_no': 655, 'supply': '20000000000'}]
        raise AssertionError(endpoint)
    def request(self, method, url):
        self.calls.append(url)
        if url.endswith('mavdata.json'): return {'api_data': self.operator}
        if url.endswith('groupdata.json'): return [{'pool_group_json': [{'pool_hash': 'pool1', 'pool_group': 'A'}]}]
        raise AssertionError(url)

class CollectorTests(unittest.TestCase):
    def test_exact_decimal_conversion(self):
        self.assertEqual(lovelace(Decimal('21384442255.123456')), '21384442255123456')
        for value in [-1, 'NaN', 'Infinity', '1.1', True]:
            with self.assertRaises(DataError): integer(value)
        with self.assertRaises(DataError): lovelace('0.0000001')

    def test_registry_counts_include_zero_power_without_metadata_fetches(self):
        client = Sources()
        value = collect_governance(client)
        self.assertEqual(value['totals'], {'registered_dreps': 5, 'active_dreps': 4})
        self.assertEqual(value['thresholds']['hard_fork']['drep'], {'numerator': 3, 'denominator': 5})
        self.assertEqual(value['committee']['eligible_members'], 7)
        self.assertTrue(all('meta' not in call for call in client.calls))
        self.assertTrue(all(isinstance(r['voting_power_lovelace'], str) for r in value['rows']))

    def test_committee_expiry_resignation_and_authorization(self):
        client = Sources()
        client.committee['members'][0]['expiration_epoch'] = 654
        client.committee['members'][1]['status'] = 'resigned'
        client.committee['members'][2]['status'] = 'not_authorized'
        self.assertEqual(collect_governance(client)['committee']['eligible_members'], 4)

    def test_incomplete_drep_batches_fail(self):
        client = Sources(); client.incomplete = True
        with self.assertRaisesRegex(DataError, 'Incomplete'): collect_governance(client)

    def test_missing_drep_amount_is_rejected_instead_of_silently_zeroed(self):
        client = Sources(); del client.dreps[0]['amount']
        with self.assertRaises(KeyError): collect_governance(client)

    def test_epoch_transition_and_missing_parameters_fail(self):
        client = Sources(); client.params['epoch_no'] = 654
        with self.assertRaisesRegex(DataError, 'protocol'): collect_governance(client)
        client = Sources()
        with patch('server.data.epoch', side_effect=[655, 656]):
            with self.assertRaisesRegex(DataError, 'Epoch changed'): collect_governance(client)

    def test_spo_grouping_keeps_exact_stake_and_unmapped_individuals(self):
        value = collect_spo(Sources())
        self.assertEqual(value['totals']['total_pools'], 2)
        self.assertEqual(value['totals']['total_spos'], 2)
        self.assertEqual(value['rows'][0], {'label': 'SINGLEPOOL', 'stake_lovelace': '2000000002', 'is_aggregate': True})

    def test_empty_mixed_and_stale_operator_sources_fail(self):
        for rows in [[], [{'epoch': 650}], [{'epoch': 655}, {'epoch': 654}]]:
            client = Sources(); client.operator = rows
            with self.assertRaises(DataError): collect_spo(client)

class ClientTests(unittest.TestCase):
    @patch('server.data.time.sleep')
    def test_bounded_retry_and_no_redirects(self, sleep):
        session = Mock()
        response = Mock(status_code=200); response.json.return_value = []
        session.request.side_effect = [requests.Timeout(), response]
        self.assertEqual(Client(session=session).request('GET', 'https://example.test'), [])
        self.assertEqual(session.request.call_count, 2)
        self.assertFalse(session.request.call_args.kwargs['allow_redirects'])
        self.assertLessEqual(sum(session.request.call_args.kwargs['timeout']), 7)

    def test_storage_writes_are_not_retried(self):
        session = Mock(); session.request.side_effect = requests.Timeout()
        with self.assertRaises(DataError): Client(session=session).request('POST', 'https://example.test', retry=False)
        self.assertEqual(session.request.call_count, 1)

    def test_expired_deadline_never_requests(self):
        session = Mock()
        with self.assertRaises(DataError): Client(budget=0, session=session).request('GET', 'https://example.test')
        session.request.assert_not_called()

    def test_pagination_continues_after_partial_page(self):
        client = Client(); client.koios = Mock(side_effect=[[1, 2], [3], []])
        self.assertEqual(client.pages('drep_list?select=drep_id'), [1, 2, 3])
        self.assertIn('offset=500', client.koios.call_args_list[1].args[0])

@patch.dict(os.environ, ENV)
class StorageTests(unittest.TestCase):
    def test_preview_requires_prefix_and_production_rejects_it(self):
        for env, prefix in [('preview', ''), ('production', 'changwatch:preview:pr4:'), ('preview', '*'), ('preview', 'changwatch:v1:')]:
            with patch.dict(os.environ, {'VERCEL_ENV': env, 'CHANGWATCH_KEY_PREFIX': prefix}):
                with self.assertRaises(DataError): Store(Mock())

    def test_preview_prefix_covers_snapshots_legacy_keys_reads_and_locks(self):
        prefix = 'changwatch:preview:pr4:'
        with patch.dict(os.environ, {'VERCEL_ENV': 'preview', 'CHANGWATCH_KEY_PREFIX': prefix}):
            client = Mock(); store = Store(client)
            self.assertEqual(store.key('changwatch:lock:spo'), prefix + 'changwatch:lock:spo')
            for kind in ['spo', 'governance']:
                client.request.return_value = [{'result': 'OK'}] * 3
                store.publish(FIXTURE[kind])
                for command in client.request.call_args.kwargs['json']:
                    self.assertTrue(command[1].startswith(prefix))
                    self.assertEqual(command[-2:], ['EX', 604800])
            client.request.return_value = {'result': json.dumps({'value': []})}
            for key in ['spo_data', 'spo_totals', 'drep_data', 'drep_totals']:
                store.read(key)
                self.assertEqual(client.request.call_args.kwargs['json'], ['GET', prefix + key])
            client.request.return_value = {'result': [json.dumps(FIXTURE['spo']), json.dumps(FIXTURE['governance'])]}
            self.assertEqual(store.dashboard(), FIXTURE)
            self.assertEqual(client.request.call_args.kwargs['json'], ['MGET', prefix + 'changwatch:v1:spo', prefix + 'changwatch:v1:governance'])

    def test_snapshot_and_legacy_records_publish_in_one_transaction(self):
        for kind in ['spo', 'governance']:
            client = Mock(); client.request.return_value = [{'result': 'OK'}] * 3
            Store(client).publish(FIXTURE[kind])
            client.request.assert_called_once()
            call = client.request.call_args
            self.assertEqual(call.args, ('POST', 'https://storage.example/multi-exec'))
            self.assertFalse(call.kwargs['retry'])
            commands = call.kwargs['json']
            self.assertEqual(len(commands), 3)
            self.assertTrue(all(c[0] == 'SET' for c in commands))
            self.assertEqual(json.loads(commands[0][2]), FIXTURE[kind])
            for c in commands[1:]: self.assertIn('value', json.loads(c[2]))

    def test_read_requires_both_versioned_snapshots(self):
        client = Mock(); client.request.return_value = {'result': [json.dumps(FIXTURE['spo']), None]}
        with self.assertRaises(DataError): Store(client).dashboard()
        client.request.return_value = {'result': [json.dumps(FIXTURE['spo']), json.dumps(FIXTURE['governance'])]}
        self.assertEqual(Store(client).dashboard(), FIXTURE)
        broken = copy.deepcopy(FIXTURE['spo']); broken['rows'] = []
        client.request.return_value = {'result': [json.dumps(broken), json.dumps(FIXTURE['governance'])]}
        with self.assertRaises(DataError): Store(client).dashboard()

    def test_publication_failure_is_reported(self):
        client = Mock(); client.request.return_value = [{'error': 'failure'}]
        with self.assertRaises(DataError): Store(client).publish(FIXTURE['spo'])


def handler(cls, authorization=None):
    value = cls.__new__(cls)
    value.headers = {} if authorization is None else {'Authorization': authorization}
    value.send_json = Mock()
    return value

class HandlerTests(unittest.TestCase):
    @patch('server.http.Store')
    def test_unconfigured_and_unauthorized_cron_never_touch_storage(self, store):
        for env, auth in [({}, None), ({'CRON_SECRET': 'test'}, 'Bearer wrong'), ({'CRON_SECRET': 'test'}, 'Bearer é'), ({}, 'Bearer ')]:
            with patch.dict(os.environ, env, clear=True):
                h = handler(RefreshHandler, auth); h.do_GET()
                self.assertEqual(h.send_json.call_args.args[0], 403)
        store.assert_not_called()

    @patch('server.http.Store')
    def test_read_unavailable_returns_503(self, store):
        store.return_value.dashboard.side_effect = DataError('missing')
        h = handler(ReadHandler); h.do_GET()
        self.assertEqual(h.send_json.call_args.args[0], 503)

    @patch.dict(os.environ, ENV)
    @patch('server.http.collect_spo')
    @patch('server.http.Store')
    def test_failed_collection_retains_last_good_data_and_releases_owned_lock(self, store, collect):
        store.return_value.key.side_effect = lambda k: 'changwatch:preview:pr4:' + k
        store.return_value.command.return_value = 'OK'; collect.side_effect = DataError('Incomplete source')
        h = handler(RefreshHandler, 'Bearer test-secret'); h.do_GET()
        store.return_value.publish.assert_not_called()
        self.assertEqual(h.send_json.call_args.args[0], 503)
        self.assertEqual(store.return_value.command.call_args.args[0][0], 'EVAL')
        self.assertEqual(store.return_value.command.call_args.args[0][3], 'changwatch:preview:pr4:changwatch:lock:spo')

    @patch.dict(os.environ, ENV)
    @patch('server.http.collect_spo')
    @patch('server.http.Store')
    def test_overlapping_refresh_skips_without_collecting_or_unlocking(self, store, collect):
        store.return_value.command.return_value = None
        h = handler(RefreshHandler, 'Bearer test-secret'); h.do_GET()
        collect.assert_not_called(); store.return_value.command.assert_called_once()
        self.assertEqual(h.send_json.call_args.args[1]['status'], 'skipped')

    @patch.dict(os.environ, ENV)
    @patch('server.http.collect_spo')
    @patch('server.http.Store')
    def test_success_publishes_then_returns_snapshot_id(self, store, collect):
        store.return_value.key.side_effect = lambda k: 'changwatch:preview:pr4:' + k
        store.return_value.command.return_value = 'OK'; collect.return_value = FIXTURE['spo']
        h = handler(RefreshHandler, 'Bearer test-secret'); h.do_GET()
        store.return_value.publish.assert_called_once_with(FIXTURE['spo'])
        self.assertEqual(h.send_json.call_args.args, (200, {'status': 'ok', 'snapshot_id': 'fixture-spo'}))

    def test_json_response_sets_real_status_and_no_store(self):
        h = handler(ReadHandler); h.wfile = io.BytesIO()
        h.send_response = Mock(); h.send_header = Mock(); h.end_headers = Mock()
        from server.http import JSONHandler
        JSONHandler.send_json(h, 200, {'value': []})
        h.send_response.assert_called_once_with(200)
        h.send_header.assert_any_call('Cache-Control', 'no-store')
        self.assertEqual(json.loads(h.wfile.getvalue()), {'value': []})

if __name__ == '__main__': unittest.main()
