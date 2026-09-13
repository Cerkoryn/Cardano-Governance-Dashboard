<script lang=ts>
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
    import { fetchData, calculateProposals, calculateKeyIndicators, cumulativeStakeSeries, groupThresholdProposals } from '$lib/utils/calcs';
    import type { KeyIndicators } from '$lib/utils/calcs';
    import type { Proposal, Pool, dRep } from '$lib/types/types';
    import { isDarkMode, includeInactiveDReps } from '$lib/stores/stores';
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';

    let darkMode = get(isDarkMode);
    let proposals: Proposal[] = [];
    let spoData: Pool[] = [];
    let drepData: dRep[] = [];
    let total_pools = 0;
    let total_spos = 0;
    let circulatingADA = 0;
    let total_dreps = 0;
    let loading = true;
    let keyIndicators: KeyIndicators | null = null;

    onMount(async () => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            darkMode = storedTheme === 'dark';
        } else {
            darkMode = false; // Default to light mode
        }
        isDarkMode.set(darkMode);
        updateBodyClass();
        
        const data = await fetchData();
        spoData = data.spoData;
        drepData = data.drepData;
        total_pools = data.totalData.total_pools;
        total_spos = data.totalData.total_spos;
        circulatingADA = data.totalData.circulating_ada;
        total_dreps = data.totalData.total_dreps;
        loading = false;
    });

    function toggleTheme() {
        darkMode = !darkMode;
        isDarkMode.set(darkMode);
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');
        updateBodyClass();
    }

    function updateBodyClass() {
        if (typeof document !== 'undefined') {
            if (darkMode) {
                document.body.classList.add('dark-mode');
                document.body.classList.remove('light-mode');
            } else {
                document.body.classList.add('light-mode');
                document.body.classList.remove('dark-mode');
            }
        }
    }

    $: updateBodyClass();

    // Recalculate proposals whenever includeInactiveDReps changes
    $: if (spoData.length && drepData.length) {
        proposals = calculateProposals(spoData, drepData, circulatingADA, $includeInactiveDReps);
        keyIndicators = calculateKeyIndicators(spoData, drepData, circulatingADA, $includeInactiveDReps);
    }
    $: conc = spoData.length ? cumulativeStakeSeries(spoData) : { series: [], minSPOsFor51: 0 };
    $: thresholdGroups = proposals.length ? groupThresholdProposals(proposals) : [];
</script>

<Header {darkMode} {toggleTheme} />
<ProvenanceBar />

<main>
    {#if loading}
      <div class="loading-container">
        <p class="loading-text">Loading data...</p>
      </div>
    {:else}
      <div class="content">
        <SectionHeading title="Key Indicators" subtitle="Overview of participation and concentration" />
        {#if keyIndicators}
        <div class="grid four">
          <IndicatorCard label="ADA Delegated to dReps" value={`${keyIndicators.drepDelegatedPercent.toFixed(1)}%`}
            progress={keyIndicators.drepDelegatedPercent} accent="accent"
            subline={`${total_dreps.toLocaleString()} dReps`}
            tooltip="Share of circulating ADA delegated to dReps as voting power." />
          <IndicatorCard label="ADA Delegated to Stake Pools" value={`${keyIndicators.poolDelegatedPercent.toFixed(1)}%`}
            progress={keyIndicators.poolDelegatedPercent} accent="positive"
            subline={`${total_pools.toLocaleString()} Stake Pools · ${total_spos.toLocaleString()} Operators`}
            tooltip="Share of circulating ADA delegated to stake pools." />
          <IndicatorCard label="Minimum SPOs for 51% Stake" value={keyIndicators.minSPOsFor51.toLocaleString()}
            accent="warning"
            subline="SPOs needed to control 51% of delegated stake"
            tooltip="Smallest set of SPOs whose combined delegated stake reaches 51%. Does not imply coordination." />
          <IndicatorCard label="Active dReps" value={keyIndicators.activeDReps.toLocaleString()}
            accent="accent"
            subline="Active dReps participating in governance" />
        </div>
        {/if}

        <SectionHeading title="Stake Concentration" />
        {#if conc.series.length}
          <div class="section-wrap"><ConcentrationChart series={conc.series} minSPOsFor51={conc.minSPOsFor51} {darkMode} /></div>
        {/if}

        <SectionHeading title="Governance Thresholds" subtitle="Smallest coalitions that could meet the required threshold for each action." />
        {#each thresholdGroups as group}
          <div class="cat">
            <h3 class="catname">{group.category}</h3>
            <div class="catcards">
              {#each group.proposals as proposal}
                <div class="card-surface"><ThresholdCard {proposal} /></div>
              {/each}
            </div>
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

    .loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 50vh;
    }

    .loading-text {
        font-size: 1.1rem;
        color: var(--text-muted);
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
</style>