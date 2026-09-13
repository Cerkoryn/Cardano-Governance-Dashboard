import type { Dashboard } from '$lib/types/types';
import { actions } from '$lib/constants/display';

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const integer = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const amount = (v: unknown): v is string => typeof v === 'string' && /^(0|[1-9][0-9]{0,19})$/.test(v);
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
function ratio(v: unknown): boolean {
  return object(v) && integer(v.numerator) && integer(v.denominator) && v.denominator > 0 && v.numerator <= v.denominator;
}
function snapshot(v: unknown, kind: string): v is Record<string, any> {
  return object(v) && v.schema_version === 1 && v.kind === kind && text(v.snapshot_id)
    && text(v.updated_at) && Number.isFinite(Date.parse(v.updated_at))
    && object(v.source_epochs) && Object.keys(v.source_epochs).length > 0 && Object.values(v.source_epochs).every(integer)
    && Array.isArray(v.rows) && v.rows.length > 0 && object(v.totals);
}

/** Reject incomplete or unsafe data before any BigInt calculation or UI rendering. */
export function validateDashboard(value: unknown): Dashboard {
  const invalid = () => { throw new Error('The dashboard returned incomplete or invalid data.'); };
  if (!object(value) || !snapshot(value.spo, 'spo') || !snapshot(value.governance, 'governance')) return invalid();
  const { spo, governance: gov } = value;
  if (!integer(spo.source_epochs.koios) || !integer(spo.source_epochs.balance) || !integer(spo.source_epochs.supply)
    || !integer(gov.source_epochs.koios)
    || !spo.rows.every((p: unknown) => object(p) && text(p.label) && amount(p.stake_lovelace)
      && typeof p.is_aggregate === 'boolean' && p.is_aggregate === (p.label === 'SINGLEPOOL'))
    || new Set(spo.rows.map((p: any) => p.label)).size !== spo.rows.length
    || !gov.rows.every((d: unknown) => object(d) && text(d.drep_id) && typeof d.is_active === 'boolean' && amount(d.voting_power_lovelace))
    || new Set(gov.rows.map((d: any) => d.drep_id)).size !== gov.rows.length) return invalid();
  const pseudo = new Set(['drep_always_abstain', 'drep_always_no_confidence']);
  if ([...pseudo].some(id => !gov.rows.some((d: any) => d.drep_id === id && d.is_active))) return invalid();
  const real = gov.rows.filter((d: any) => !pseudo.has(d.drep_id));
  if (!integer(gov.totals.registered_dreps) || gov.totals.registered_dreps !== real.length
    || !integer(gov.totals.active_dreps) || gov.totals.active_dreps !== real.filter((d: any) => d.is_active).length
    || !integer(spo.totals.total_pools) || !integer(spo.totals.total_spos)
    || spo.totals.total_pools < spo.totals.total_spos || !amount(spo.totals.circulating_lovelace)) return invalid();
  const supply = BigInt(spo.totals.circulating_lovelace);
  const stake = spo.rows.reduce((n: bigint, p: any) => n + BigInt(p.stake_lovelace), 0n);
  const voting = gov.rows.reduce((n: bigint, d: any) => n + BigInt(d.voting_power_lovelace), 0n);
  if (supply <= 0n || stake <= 0n || stake > supply || voting > supply) return invalid();
  if (!object(gov.committee) || !integer(gov.committee.eligible_members) || !integer(gov.committee.minimum_size)
    || !ratio(gov.committee.quorum) || !object(gov.thresholds)
    || !actions.every(a => {
      const t = gov.thresholds[a.id];
      const needsSpo = !['constitution', 'treasury'].includes(a.id);
      return object(t) && ratio(t.drep) && (needsSpo ? ratio(t.spo) : t.spo === null);
    })) return invalid();
  return value as unknown as Dashboard;
}

export async function fetchDashboard(signal?: AbortSignal): Promise<Dashboard> {
  const response = await fetch('/api/get_dashboard', { signal, cache: 'no-store' });
  if (!response.ok) throw new Error(`Dashboard data is temporarily unavailable (HTTP ${response.status}).`);
  return validateDashboard(await response.json());
}
