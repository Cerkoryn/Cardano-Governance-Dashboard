<script lang="ts">
  import '@fontsource/inter/400.css';
  import '@fontsource/inter/500.css';
  import '@fontsource/inter/600.css';
  import '@fontsource/inter/700.css';
  import '$lib/styles/tokens.css';
  import Header from '$lib/components/Header.svelte';
  import ProvenanceBar from '$lib/components/ProvenanceBar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import SectionHeading from '$lib/components/SectionHeading.svelte';
  import ThresholdCard from '$lib/components/ThresholdCard.svelte';
  import IndicatorCard from '$lib/components/IndicatorCard.svelte';
  import ConcentrationChart from '$lib/components/ConcentrationChart.svelte';
  import { calculateProposals, calculateKeyIndicators, cumulativeStakeSeries, groupThresholdProposals } from '$lib/utils/calcs';
  import { fetchDashboard } from '$lib/utils/data';
  import type { Dashboard } from '$lib/types/types';
  import { isDarkMode, includeInactiveDReps } from '$lib/stores/stores';
  import { onMount } from 'svelte';

  let darkMode = false;
  let data: Dashboard | null = null;
  let loading = true;
  let error = '';
  let now = Date.now();
  let controller: AbortController | undefined;
  let disposed = false;
  async function load() {
    controller?.abort();
    const request = new AbortController();
    controller = request;
    loading = true;
    error = '';
    const timeout = setTimeout(() => request.abort(), 15_000);
    try { const result = await fetchDashboard(request.signal); if (!disposed) data = result; }
    catch (e) { if (!disposed) error = e instanceof Error && e.name !== 'AbortError' ? e.message : 'The data request timed out. Please retry.'; }
    finally { clearTimeout(timeout); if (!disposed) loading = false; }
  }
  function applyTheme() {
    isDarkMode.set(darkMode);
    document.body.classList.toggle('dark-mode', darkMode);
    document.body.classList.toggle('light-mode', !darkMode);
  }
  function toggleTheme() {
    darkMode = !darkMode;
    applyTheme();
    try { localStorage.setItem('theme', darkMode ? 'dark' : 'light'); } catch { /* Theme still works without storage. */ }
  }
  onMount(() => {
    try { darkMode = localStorage.getItem('theme') === 'dark'; } catch { /* Use light theme. */ }
    applyTheme();
    void load();
    const clock = setInterval(() => now = Date.now(), 60_000);
    return () => { disposed = true; controller?.abort(); clearInterval(clock); };
  });
  $: keyIndicators = data ? calculateKeyIndicators(data) : null;
  $: conc = data ? cumulativeStakeSeries(data.spo.rows) : null;
  $: thresholdGroups = data ? groupThresholdProposals(calculateProposals(data, $includeInactiveDReps)) : [];
  const percentage = (n: number | null) => n === null ? 'Unavailable' : `${n.toFixed(1)}%`;
</script>

<svelte:head><title>ChangWatch · Cardano Governance Dashboard</title><meta name="description" content="Cardano governance participation and qualified voting concentration estimates, with current protocol thresholds and source timestamps." /></svelte:head>
<Header {darkMode} {toggleTheme} />
<ProvenanceBar {data} {now} />
<main aria-busy={loading}>
  <div class="status">
    {#if error}<p role="alert">{error} {data ? 'Showing the last successfully loaded snapshots.' : 'No reliable dashboard data is available yet.'}</p>{/if}
    {#if loading}<p role="status">{data ? 'Refreshing data…' : 'Loading data…'}</p>{/if}
    <button class="refresh" disabled={loading} on:click={load}>{error ? 'Retry' : 'Refresh data'}</button>
  </div>
  {#if data && keyIndicators && conc}
    <div class="content">
      <SectionHeading title="Key Indicators" subtitle="Overview of participation and concentration" />
      <div class="grid four">
        <IndicatorCard label="ADA Delegated to dReps" value={percentage(keyIndicators.drepDelegatedPercent)} progress={keyIndicators.drepDelegatedPercent}
          subline={`${data.governance.totals.registered_dreps.toLocaleString()} registered dReps`}
          tooltip="Share of circulating ADA delegated to registered dReps and the two predefined voting options, including inactive dReps. Independent of the simulation toggle." />
        <IndicatorCard label="ADA Delegated to Stake Pools" value={percentage(keyIndicators.poolDelegatedPercent)} progress={keyIndicators.poolDelegatedPercent} accent="positive"
          subline={`${data.spo.totals.total_pools.toLocaleString()} pools · ${data.spo.totals.total_spos.toLocaleString()} estimated operators`}
          tooltip="Share of circulating ADA in the Balance Analytics delegated-stake dataset. Pool registry and grouping may have different update times." />
        <IndicatorCard label="Identified Groups for 51% Stake" value={keyIndicators.minSPOsFor51?.toLocaleString() ?? 'Unavailable'} accent="warning"
          subline="Qualified estimate from known operator groups"
          tooltip="Ranks identified groups only. SINGLEPOOL remains in total stake but is excluded as a candidate. This is not an exact minimum across all individual operators." />
        <IndicatorCard label="Active dReps" value={keyIndicators.activeDReps.toLocaleString()} subline="Registered and active, including zero voting power" />
      </div>
      <SectionHeading title="Stake Concentration" />
      {#if conc.series.length}
        <div class="section-wrap"><ConcentrationChart series={conc.series} minSPOsFor51={conc.minSPOsFor51} knownStakePercent={conc.knownStakePercent} {darkMode} /></div>
      {:else}<p class="status">No identified operator groups are available for a concentration estimate.</p>{/if}
      <SectionHeading title="Governance Thresholds" subtitle="Estimated voting positions under the assumptions below. Roles can overlap." />
      {#if $includeInactiveDReps}<p class="notice" role="status">Hypothetical scenario: all registered inactive dReps become active. Participation indicators remain based on the observed data.</p>{/if}
      <details class="methodology" open>
        <summary>Methodology and limitations</summary>
        <p>These estimates assume non-coalition voters do not abstain. Actual proposal outcomes also depend on abstentions, pool voting defaults, proposal validity, and ledger voting snapshots. They do not predict a vote or establish control by distinct people.</p>
        <p>dRep calculations exclude inactive representatives by default and exclude Always Abstain from the denominator. Always No Confidence contributes automatic Yes power to no-confidence motions and No power to other actions; it never counts as a representative.</p>
        <p>SPO figures use identified Balance Analytics groups as candidates and all reported delegated stake as the denominator. The SINGLEPOOL aggregate contains many independent operators and is never counted as one voter. Missing ownership detail means the result is a qualified grouping estimate.</p>
        <p>Totals add voting positions across dReps, SPO groups, and constitutional committee members. One entity may occupy several roles. Protocol thresholds and committee eligibility come from the governance snapshot; percentages are display values, while coalition calculations use exact lovelace integers.</p>
        <p>Parameter changes touching several groups must meet the highest applicable dRep threshold. Security-relevant changes also require SPO approval. The cards show both totals. <a href="https://cips.cardano.org/cip/CIP-1694">Governance design</a> · <a href="https://github.com/IntersectMBO/cardano-ledger/tree/master/eras/conway/impl/src/Cardano/Ledger/Conway/Rules">Ledger rules</a></p>
      </details>
      {#each thresholdGroups as group}
        <div class="cat">
          <h3 class="catname">{group.category}</h3>
          <div class="catcards">{#each group.proposals as proposal}<div class="card-surface"><ThresholdCard {proposal} eligibleMembers={data.governance.committee.eligible_members} /></div>{/each}</div>
        </div>
      {/each}
    </div>
  {/if}
</main>
<Footer />
<style>
    main {
        min-height: 60vh;
        padding-bottom: 48px;
    }

    .content {
        width: 100%;
        padding: 0;
        margin: 0 auto;
    }

    .grid { max-width: var(--maxw); margin: 0 auto; padding: 0 24px; display: grid; gap: var(--gap); }
    .grid.four { grid-template-columns: repeat(4, 1fr); }
    .section-wrap { padding: 0 24px; }
    @media (max-width: 900px) { .grid.four { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 520px) { .grid.four { grid-template-columns: 1fr; } }
    .cat { max-width: var(--maxw); margin: 0 auto 24px; padding: 0 24px; }
    .catname { font-size: 0.95rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin: 24px 0 12px; }
    .catcards { display: flex; flex-direction: column; gap: 16px; }
    .status, .notice, .methodology { max-width: var(--maxw); margin: 16px auto; padding: 0 24px; font-size: .9rem; line-height: 1.6; }
    .status { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .status p { margin: 0; }
    .refresh { font: inherit; color: var(--accent-strong); background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 8px 16px; cursor: pointer; }
    .refresh:disabled { opacity: .6; cursor: wait; }
    .notice { border-left: 4px solid var(--warning); font-weight: 600; }
    .methodology { color: var(--text-muted); }
    summary { cursor: pointer; color: var(--text); font-weight: 600; }
    a { color: var(--accent-strong); }
</style>