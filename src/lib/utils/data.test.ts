import { expect, it, vi, afterEach } from 'vitest';
import fixture from '../../../tests/fixtures/dashboard.json';
import { fetchDashboard, validateDashboard } from './data';
afterEach(() => vi.unstubAllGlobals());
it('validates the complete snapshot contract', () => expect(validateDashboard(fixture)).toBe(fixture));
it.each([
  (d: any) => d.spo.rows = [],
  (d: any) => d.governance.rows.pop(),
  (d: any) => d.spo.rows.push(d.spo.rows[0]),
  (d: any) => d.spo.rows[0].stake_lovelace = 9007199254740993,
  (d: any) => d.spo.rows[0].stake_lovelace = '-1',
  (d: any) => d.spo.rows[2].is_aggregate = false,
  (d: any) => d.spo.totals.circulating_lovelace = '0',
  (d: any) => d.governance.thresholds.hard_fork.drep.denominator = 0,
  (d: any) => delete d.governance.thresholds.technical,
  (d: any) => d.governance.totals.active_dreps++,
  (d: any) => d.spo.schema_version = 2,
  (d: any) => d.spo.updated_at = 'broken'
])('rejects malformed or inconsistent data (%#)', mutate => {
  const d = structuredClone(fixture); mutate(d); expect(() => validateDashboard(d)).toThrow(/invalid/);
});
it('rejects non-success HTTP even when it includes JSON', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(fixture), { status: 404 })));
  await expect(fetchDashboard()).rejects.toThrow('HTTP 404');
});
it('passes cancellation and fetches the single snapshot endpoint without browser caching', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(fixture)));
  vi.stubGlobal('fetch', fetch); const signal = new AbortController().signal;
  await fetchDashboard(signal);
  expect(fetch).toHaveBeenCalledWith('/api/get_dashboard', { signal, cache: 'no-store' });
});
