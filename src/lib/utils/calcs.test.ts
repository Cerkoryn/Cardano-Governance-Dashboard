import { describe, it, expect } from 'vitest';
import fixture from '../../../tests/fixtures/dashboard.json';
import { calculateKeyIndicators, calculateProposals, cumulativeStakeSeries, minimumCoalition, isStale, STALE_AFTER_MS } from './calcs';
import { validateDashboard } from './data';
const data = () => validateDashboard(structuredClone(fixture));
const half = { numerator: 1, denominator: 2 };

describe('exact coalition calculation', () => {
  it('rounds the required power upward beyond Number.MAX_SAFE_INTEGER', () => {
    expect(minimumCoalition([9007199254740992n, 1n], 18014398509481985n, half)).toBe(2);
  });
  it('sorts without mutating candidates and ignores zero balances', () => {
    const rows = [0n, 1n, 6n, 3n];
    expect(minimumCoalition(rows, 10n, { numerator: 7, denominator: 10 })).toBe(2);
    expect(rows).toEqual([0n, 1n, 6n, 3n]);
  });
  it('distinguishes unreachable, empty, exact, and automatic-only outcomes', () => {
    expect(minimumCoalition([4n], 10n, half)).toBeNull();
    expect(minimumCoalition([], 0n, half)).toBeNull();
    expect(minimumCoalition([], 0n, { numerator: 0, denominator: 1 })).toBe(0);
    expect(minimumCoalition([5n], 10n, half)).toBe(1);
    expect(minimumCoalition([], 10n, half, 5n)).toBe(0);
  });
});
describe('governance rules', () => {
  it('uses current hard-fork thresholds and excludes automatic options as actors', () => {
    const proposals = calculateProposals(data(), false);
    expect(proposals.find(p => p.id === 'hard_fork')?.drep.count).toBe(2);
    expect(proposals.find(p => p.id === 'no_confidence')?.drep.count).toBe(1);
    expect(proposals.find(p => p.id === 'constitution')?.drep.count).toBeNull(); // 70% discretionary, 75% required
  });
  it('can meet no confidence with no discretionary dReps', () => {
    const d = data();
    d.governance.rows.forEach(r => { r.voting_power_lovelace = r.drep_id === 'drep_always_no_confidence' ? '100' : '0'; });
    expect(calculateProposals(d, false).find(p => p.id === 'no_confidence')?.drep.count).toBe(0);
    expect(calculateProposals(d, false).find(p => p.id === 'hard_fork')?.drep.count).toBeNull();
  });
  it('keeps observed indicators unchanged when simulating inactive participation', () => {
    const d = data(); const before = calculateKeyIndicators(d);
    const normal = calculateProposals(d, false), simulated = calculateProposals(d, true);
    expect(normal.find(p => p.id === 'hard_fork')?.drep.count).toBe(2);
    expect(simulated.find(p => p.id === 'hard_fork')?.drep.count).toBe(3);
    expect(calculateKeyIndicators(d)).toEqual(before);
    expect(before.activeDReps).toBe(4);
    expect(before.drepDelegatedPercent).toBe(65);
  });
  it('keeps network, economic and technical thresholds independent and both security totals', () => {
    const d = data();
    d.governance.thresholds.network.drep = half;
    d.governance.thresholds.economic.drep = { numerator: 7, denominator: 10 };
    d.governance.thresholds.technical.drep = { numerator: 4, denominator: 10 };
    const ps = calculateProposals(d, false);
    expect(['network', 'economic', 'technical'].map(id => ps.find(p => p.id === id)?.drep.count)).toEqual([2, 3, 1]);
    const network = ps.find(p => p.id === 'network')!;
    expect(network.total).toBe(7); expect(network.securityTotal).toBe(9);
  });
  it('uses committee quorum and fails closed below the minimum size', () => {
    const d = data(); d.governance.committee.eligible_members = 6;
    expect(calculateProposals(d, false).find(p => p.id === 'hard_fork')?.cc.count).toBe(4);
    d.governance.committee.eligible_members = 4;
    expect(calculateProposals(d, false).find(p => p.id === 'hard_fork')?.total).toBeNull();
    expect(calculateProposals(d, false).find(p => p.id === 'no_confidence')?.cc.required).toBe(false);
  });
});
describe('operator grouping', () => {
  it('excludes SINGLEPOOL as a candidate while retaining its stake in the denominator', () => {
    const d = data(); const conc = cumulativeStakeSeries(d.spo.rows);
    expect(conc.series.map(p => p.cumulativePercent)).toEqual([40, 70, 80]);
    expect(conc.minSPOsFor51).toBe(2); expect(conc.knownStakePercent).toBe(80);
    d.spo.rows.find(p => p.is_aggregate)!.stake_lovelace = '18000000000000000';
    expect(cumulativeStakeSeries(d.spo.rows).minSPOsFor51).toBeNull();
  });
});
it('flags stale, invalid and future timestamps', () => {
  const now = Date.parse('2026-09-13T12:00:00Z');
  expect(isStale(new Date(now - STALE_AFTER_MS).toISOString(), now)).toBe(false);
  expect(isStale(new Date(now - STALE_AFTER_MS - 1).toISOString(), now)).toBe(true);
  expect(isStale('invalid', now)).toBe(true);
  expect(isStale(new Date(now + 300001).toISOString(), now)).toBe(true);
});
