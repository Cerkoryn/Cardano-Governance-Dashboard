<script lang=ts>
    import Header from '$lib/components/Header.svelte';
    import Footer from '$lib/components/Footer.svelte';
    import Container from '$lib/components/Container.svelte';
    import { fetchData, calculateProposals } from '$lib/utils/calcs';
    import type { Proposal, Pool, dRep } from '$lib/types/types';
    import { isDarkMode, includeInactiveDReps } from '$lib/stores/stores';
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';

    let darkMode = get(isDarkMode);
    let proposals: Proposal[] = [];
    let filteredProposals: Proposal[] = [];
    let spoData: Pool[] = [];    
    let drepData: dRep[] = [];
    let total_pools = 0;
    let total_spos = 0;
    let total_pool_delegators = 0;
    let circulatingADA = 0;
    let loading = true; 

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
        total_pool_delegators = data.totalData.total_pool_delegators;
        circulatingADA = data.totalData.circulating_ada;
        proposals = calculateProposals(spoData, drepData, circulatingADA, get(includeInactiveDReps));
        filterProposals();
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

    function filterProposals() {
        filteredProposals = proposals.filter(proposal => 
            proposal.title === 'Total dRep Delegation' || 
            proposal.title === 'Total Stake Pool Delegation'
        );
    }

    $: updateBodyClass();

    // Recalculate proposals whenever includeInactiveDReps changes
    $: if (spoData.length && drepData.length) {
        proposals = calculateProposals(spoData, drepData, circulatingADA, $includeInactiveDReps);
    }
</script>

<Header {darkMode} {toggleTheme} />

<main>
    {#if loading}
      <div class="loading-container">
        <p class="loading-text">Loading data...</p>
      </div>
    {:else}
      <div class="content">
        <!-- Arrange the first three proposals side by side -->
        {#if proposals.length > 0}
          <div class="triple-container">
            {#if proposals.length > 1}
              <div class="side-container">
                <Container 
                  proposal={proposals[1]} 
                  index={1}
                >
                <p class="total-number">dRep Count: 300</p>
                <p class="total-number">dRep Delegator Count: 1000</p>
                <br/>
                </Container>
              </div>
            {/if}
            <div class="center-container">
              <Container 
                proposal={proposals[0]} 
                index={0}
              />
            </div>
            {#if proposals.length > 2}
              <div class="side-container">
                <Container 
                  proposal={proposals[2]} 
                  index={2}
                >
                <p class="total-number">Stake Pool Count: {total_pools}</p>
                <p class="total-number">Stake Pool Operator Count: {total_spos}</p>
                <p class="total-number">Stake Pool Delegator Count: {total_pool_delegators}</p>
                <br/>
                </Container>
              </div>
            {/if}
          </div>
        {/if}
  
        <!-- Remaining proposals each on their own row -->
        {#each proposals.slice(3) as proposal, index}
          <div class="single-container">
            <Container 
              proposal={proposal} 
              index={index + 3}
            />
          </div>
        {/each}
      </div>
    {/if}
  </main>

<Footer />

<style>
    *, *::before, *::after {
        box-sizing: border-box;
    }

    main {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: calc(100vh - var(--header-height) - var(--footer-height));
        padding-top: calc(var(--header-height) + 2rem);
        background-color: var(--dashboard-bg);
    }

    .loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }

    .loading-text {
        font-size: 48px; 
        font-weight: bold;
        text-align: center;
        color: inherit; 
    }

    .triple-container {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        justify-content: center;
        margin-bottom: 0rem;
        gap: 16px;
    }

    .side-container, .center-container {
        flex: 1;
        max-width: 300px;
    }

    .center-container {
        max-width: 600px; 
    }

    .single-container {
        width: 100%;
        max-width: 800px; 
        margin: 0 auto;
        padding: 0;
        margin-bottom: 1rem; 
    }

    .total-number {
        text-align: left;
        font-size: 15px;
        padding-left: 1px;
        padding-right: 0px;
    }

    @media (max-width: 768px) {
        .triple-container {
            flex-direction: column;
            align-items: center;
        }
        .side-container, .center-container {
            max-width: 100%;
            padding: 0;
            margin: 0; 
        }
        .single-container {
            max-width: 100%; 
        }
    }

    .content {
        width: 100%;
        padding: 0; 
        margin: 0 auto; 
    }

    :global(body) {
        margin: 0;
        padding: 0;
    }
    :global(body.dark-mode) {
        background-color: #1d1d1b;
        color: #f5f3eb;
    }
    :global(body.light-mode) {
        background-color: #f5f3eb;
        color: #1d1d1b;
    }
    :global(body.dark-mode) {
        --title-bg-color: #1d1d1b;
        --title-text-color: #f5f3eb;
        --proposal-bg-color: #333333;
        --footer-bg-color: #333333;
        --margin-icon-color: #f5f3eb;
        --margin-icon-hover-color: #ccc;
    }
    :global(body.light-mode) {
        --title-bg-color: #2353ff;
        --title-text-color: #f5f3eb;
        --proposal-bg-color: #d0e1ff;
        --footer-bg-color: #2353ff;
        --margin-icon-color: #f5f3eb;
        --margin-icon-hover-color: #4a90e2;
    }
</style>