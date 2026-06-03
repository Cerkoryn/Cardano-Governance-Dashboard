import { describe, it, expect } from 'vitest';
import { calculateKeyIndicators } from '$lib/utils/calcs';
import type { Pool, dRep } from '$lib/types/types';

const spo: Pool[] = [
	{ label: 'A', stake: 600 }, { label: 'B', stake: 300 }, { label: 'SINGLEPOOL', stake: 100 }
];
const dreps: dRep[] = [
	{ drep_id: 'd1', is_active: true, active_power: 4_000_000, label: 'd1' },
	{ drep_id: 'd2', is_active: false, active_power: 2_000_000, label: 'd2' },
	{ drep_id: 'drep_always_abstain', is_active: true, active_power: 1_000_000, label: 'abstain' },
	{ drep_id: 'drep_always_no_confidence', is_active: true, active_power: 0, label: 'noconf' }
];

describe('calculateKeyIndicators', () => {
	it('computes pool delegation percent against circulating ADA', () => {
		const k = calculateKeyIndicators(spo, dreps, 2000, false);
		expect(k.poolDelegatedPercent).toBeCloseTo(50, 5);
	});
	it('dRep percent includes abstain power and excludes inactive when toggle off', () => {
		const k = calculateKeyIndicators(spo, dreps, 2000, false);
		expect(k.drepDelegatedPercent).toBeCloseTo(0.25, 5);
	});
	it('dRep percent includes inactive when toggle on', () => {
		const k = calculateKeyIndicators(spo, dreps, 2000, true);
		expect(k.drepDelegatedPercent).toBeCloseTo(0.35, 5);
	});
	it('counts active real dReps excluding pseudo entries', () => {
		const k = calculateKeyIndicators(spo, dreps, 2000, false);
		expect(k.activeDReps).toBe(1);
	});
	it('min SPOs for 51% counts from largest, SINGLEPOOL last', () => {
		const k = calculateKeyIndicators(spo, dreps, 2000, false);
		expect(k.minSPOsFor51).toBe(1);
	});
});

import { cumulativeStakeSeries } from '$lib/utils/calcs';

describe('cumulativeStakeSeries', () => {
	const spo: Pool[] = [
		{ label: 'A', stake: 600 }, { label: 'B', stake: 300 }, { label: 'SINGLEPOOL', stake: 100 }
	];
	it('produces cumulative percentages by rank with SINGLEPOOL last', () => {
		const { series } = cumulativeStakeSeries(spo);
		expect(series.map((p) => p.rank)).toEqual([1, 2, 3]);
		expect(series[0].cumulativePercent).toBeCloseTo(60, 5);
		expect(series[1].cumulativePercent).toBeCloseTo(90, 5);
		expect(series[2].cumulativePercent).toBeCloseTo(100, 5);
	});
	it('reports minSPOsFor51 consistent with calculateKeyIndicators', () => {
		expect(cumulativeStakeSeries(spo).minSPOsFor51).toBe(1);
	});
});

import { groupThresholdProposals } from '$lib/utils/calcs';
import type { Proposal } from '$lib/types/types';

describe('groupThresholdProposals', () => {
	it('groups known threshold proposals by category and drops non-threshold ones', () => {
		const proposals: Proposal[] = [
			{ title: '% of Circulating ADA Delegated to dReps', charts: [] },
			{ title: 'Fewest # Needed to Pass a Vote of No Confidence in Constitutional Committee', charts: [] },
			{ title: 'Fewest # Needed to Withdraw from the Cardano Treasury', charts: [] }
		];
		const groups = groupThresholdProposals(proposals);
		const cc = groups.find((g) => g.category === 'Constitutional Committee');
		const tr = groups.find((g) => g.category === 'Treasury');
		expect(cc?.proposals).toHaveLength(1);
		expect(tr?.proposals).toHaveLength(1);
		expect(groups.flatMap((g) => g.proposals).some((p) => p.title.includes('Delegated'))).toBe(false);
	});
});
