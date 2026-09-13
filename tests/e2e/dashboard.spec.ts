import { test, expect } from '@playwright/test';
import fixture from '../fixtures/dashboard.json' with { type: 'json' };
const fresh = () => {
  const d = structuredClone(fixture);
  d.spo.updated_at = d.governance.updated_at = new Date().toISOString();
  return d;
};

test('loads through the Python API, labels all roles, and keeps observed counts when toggled', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const response = page.waitForResponse('**/api/get_dashboard');
  await page.goto('/'); expect((await response).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Key Indicators' })).toBeVisible();
  const active = page.locator('.card').filter({ hasText: 'Active dReps' });
  const delegated = page.locator('.card').filter({ hasText: 'ADA Delegated to dReps' });
  await expect(active.locator('.value')).toHaveText('4');
  await expect(delegated.locator('.value')).toHaveText('65.0%');
  await expect(page.locator('article')).toHaveCount(10);
  const fork = page.getByRole('article', { name: 'Initiate a hard fork' });
  await expect(fork.getByText('dReps', { exact: true })).toBeVisible();
  await expect(fork.getByText('SPO groups', { exact: true })).toBeVisible();
  await expect(fork.getByText('CC members', { exact: true })).toBeVisible();
  await expect(fork.getByText('60% threshold')).toBeVisible();
  await expect(fork.getByText('5 of 7 · 66.67%')).toBeVisible();
  const network = page.getByRole('article', { name: 'Change a network parameter' });
  await expect(network.locator('.total .num')).toHaveText(['8', '10']);
  await page.getByRole('checkbox', { name: 'Include inactive dReps' }).check();
  await expect(page.getByText(/Hypothetical scenario:/)).toBeVisible();
  await expect(active.locator('.value')).toHaveText('4');
  await expect(delegated.locator('.value')).toHaveText('65.0%');
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(page.locator('body')).toHaveClass(/dark-mode/);
  await page.getByRole('button', { name: 'Refresh data', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Refresh data', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('exposes tooltips to keyboard users and the chart as an accessible data table', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('article')).toHaveCount(10);
  const info = page.getByRole('button', { name: 'More information' }).first();
  await info.focus(); await expect(page.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('tooltip')).toHaveCount(0);
  await page.getByText('Methodology and full chart data', { exact: true }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('cell', { name: '80.00%', exact: true })).toBeVisible();
});

test('shows HTTP failure and recovers on retry', async ({ page }) => {
  await page.route('**/api/get_dashboard', route => route.fulfill({ status: 503, json: { error: 'Unavailable' } }));
  await page.goto('/'); await expect(page.getByRole('alert')).toContainText('HTTP 503');
  await expect(page.getByText('Loading data…', { exact: true })).toHaveCount(0);
  await page.unroute('**/api/get_dashboard');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(10);
});

test('retains successful snapshots after refresh failure', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('article')).toHaveCount(10);
  await page.route('**/api/get_dashboard', route => route.fulfill({ status: 503, json: {} }));
  await page.getByRole('button', { name: 'Refresh data', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('last successfully loaded snapshots');
  await expect(page.locator('article')).toHaveCount(10);
});

test('labels stale snapshots and mismatched source epochs', async ({ page }) => {
  const d = fresh(); d.spo.updated_at = new Date(Date.now() - 40 * 3600000).toISOString(); d.spo.source_epochs.koios--;
  await page.route('**/api/get_dashboard', route => route.fulfill({ json: d }));
  await page.goto('/'); await expect(page.getByText(/Stale — refresh overdue/)).toBeVisible();
  await expect(page.getByText(/different chain epochs/)).toBeVisible();
});

for (const kind of ['malformed', 'empty', 'network'] as const) {
  test(`leaves loading state on ${kind} failure`, async ({ page }) => {
    await page.route('**/api/get_dashboard', route => kind === 'network' ? route.abort() : route.fulfill({ json: kind === 'empty' ? { ...fresh(), spo: { ...fresh().spo, rows: [] } } : { value: [] } }));
    await page.goto('/'); await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeEnabled();
    await expect(page.locator('article')).toHaveCount(0);
  });
}

test('request timeout has a retry state', async ({ page }) => {
  await page.clock.install();
  await page.route('**/api/get_dashboard', async () => { /* Intentionally no response. */ });
  const pending = page.waitForRequest('**/api/get_dashboard');
  await page.goto('/'); await pending;
  await expect(page.getByText('Loading data…', { exact: true })).toBeVisible();
  await page.clock.fastForward(16_000);
  await expect(page.getByRole('alert')).toContainText('timed out');
});

test('works when local storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('disabled'); } }); });
  await page.goto('/'); await expect(page.locator('article')).toHaveCount(10);
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(page.locator('body')).toHaveClass(/dark-mode/);
});
