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
