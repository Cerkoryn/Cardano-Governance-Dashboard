import type { Dashboard, Pool, Proposal, Ratio, VoteEstimate } from '$lib/types/types';
import { actions, categoryOrder } from '$lib/constants/display';

export const STALE_AFTER_MS = 36 * 60 * 60 * 1000;
const PSEUDO = new Set(['drep_always_abstain', 'drep_always_no_confidence']);
const HALF_PLUS = { numerator: 51, denominator: 100 };
const sum = (values: bigint[]) => values.reduce((a, b) => a + b, 0n);
const descending = (a: bigint, b: bigint) => a > b ? -1 : a < b ? 1 : 0;

/** Candidates are discretionary voters; automatic Yes power never adds an actor. */
export function minimumCoalition(candidates: bigint[], denominator: bigint, threshold: Ratio, automaticYes = 0n): number | null {
  if (threshold.numerator === 0) return 0;
  if (denominator <= 0n) return null;
  const required = (denominator * BigInt(threshold.numerator) + BigInt(threshold.denominator) - 1n) / BigInt(threshold.denominator);
  let power = automaticYes;
  if (power >= required) return 0;
  let count = 0;
  for (const amount of [...candidates].filter(v => v > 0n).sort(descending)) {
    power += amount;
    count++;
    if (power >= required) return count;
  }
  return null;
}

export function percent(part: bigint, total: bigint): number | null {
  return total > 0n ? Number(part * 1_000_000n / total) / 10_000 : null;
}
export function thresholdPercent(ratio: Ratio | null): number { return ratio ? 100 * ratio.numerator / ratio.denominator : 0; }
export function thresholdLabel(ratio: Ratio | null): string {
  return ratio ? `${thresholdPercent(ratio).toLocaleString(undefined, { maximumFractionDigits: 2 })}%` : 'Not required';
}
export function isStale(updatedAt: string, now = Date.now()): boolean {
  const updated = Date.parse(updatedAt);
  return !Number.isFinite(updated) || updated > now + 300_000 || now - updated > STALE_AFTER_MS;
}
export function orderedSpoData(rows: Pool[]): Pool[] {
  return rows.filter(p => !p.is_aggregate).sort((a, b) => descending(BigInt(a.stake_lovelace), BigInt(b.stake_lovelace)) || a.label.localeCompare(b.label));
}
export type CumulativePoint = { rank: number; cumulativePercent: number };
export function cumulativeStakeSeries(rows: Pool[]) {
  const total = sum(rows.map(p => BigInt(p.stake_lovelace)));
  let accumulated = 0n;
  const known = orderedSpoData(rows);
  return {
    series: known.map((p, i): CumulativePoint => {
      accumulated += BigInt(p.stake_lovelace);
      return { rank: i + 1, cumulativePercent: percent(accumulated, total) ?? 0 };
    }),
    minSPOsFor51: minimumCoalition(known.map(p => BigInt(p.stake_lovelace)), total, HALF_PLUS),
    knownStakePercent: percent(sum(known.map(p => BigInt(p.stake_lovelace))), total)
  };
}
export function calculateKeyIndicators(data: Dashboard) {
  const supply = BigInt(data.spo.totals.circulating_lovelace);
  return {
    drepDelegatedPercent: percent(sum(data.governance.rows.map(d => BigInt(d.voting_power_lovelace))), supply),
    poolDelegatedPercent: percent(sum(data.spo.rows.map(p => BigInt(p.stake_lovelace))), supply),
    minSPOsFor51: cumulativeStakeSeries(data.spo.rows).minSPOsFor51,
    activeDReps: data.governance.rows.filter(d => d.is_active && !PSEUDO.has(d.drep_id)).length
  };
}
const notRequired = (): VoteEstimate => ({ count: 0, threshold: null, required: false });
function totalVotes(votes: VoteEstimate[]): number | null {
  return votes.some(v => v.required && v.count === null) ? null : votes.reduce((n, v) => n + (v.required ? v.count ?? 0 : 0), 0);
}
export function calculateProposals(data: Dashboard, includeInactive: boolean): Proposal[] {
  const dreps = data.governance.rows.filter(d => !PSEUDO.has(d.drep_id) && (d.is_active || includeInactive));
  const powers = dreps.map(d => BigInt(d.voting_power_lovelace));
  const noConfidence = BigInt(data.governance.rows.find(d => d.drep_id === 'drep_always_no_confidence')?.voting_power_lovelace ?? '0');
  const denominator = sum(powers) + noConfidence;
  const spoPower = orderedSpoData(data.spo.rows).map(p => BigInt(p.stake_lovelace));
  const totalStake = sum(data.spo.rows.map(p => BigInt(p.stake_lovelace)));
  const committee = data.governance.committee;
  return actions.map(action => {
    const thresholds = data.governance.thresholds[action.id];
    const drep: VoteEstimate = { required: true, threshold: thresholds.drep,
      count: minimumCoalition(powers, denominator, thresholds.drep, action.id === 'no_confidence' ? noConfidence : 0n),
      reason: 'Available dRep voting power cannot meet this threshold.' };
    const spo: VoteEstimate = thresholds.spo ? { required: true, threshold: thresholds.spo,
      count: minimumCoalition(spoPower, totalStake, thresholds.spo),
      reason: 'Unavailable from identified operator groups.' } : notRequired();
    const cc: VoteEstimate = action.cc ? { required: true, threshold: committee.quorum,
      count: committee.eligible_members < committee.minimum_size ? null : Math.ceil(committee.eligible_members * committee.quorum.numerator / committee.quorum.denominator),
      reason: 'Committee has fewer eligible members than the protocol minimum.' } : notRequired();
    return { ...action, securityConditional: !!action.securityConditional, drep, spo, cc,
      total: totalVotes(action.securityConditional ? [drep, cc] : [drep, spo, cc]),
      securityTotal: action.securityConditional ? totalVotes([drep, spo, cc]) : null };
  });
}
export function groupThresholdProposals(proposals: Proposal[]) {
  return categoryOrder.map(category => ({ category, proposals: proposals.filter(p => p.category === category) })).filter(g => g.proposals.length);
}
