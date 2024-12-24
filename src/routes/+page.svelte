<script lang=ts>
    import Header from '$lib/components/Header.svelte';
    import Footer from '$lib/components/Footer.svelte';
    import Container from '$lib/components/Container.svelte';
    import { fetchData, calculateProposals } from '$lib/utils/calcs';
    import type { Proposal, Pool, dRep } from '$lib/types';
    import { isDarkMode, includeInactiveDReps } from '$lib/stores/stores';
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';

    let darkMode = get(isDarkMode);
    let proposals: Proposal[] = [];
    let spoData: Pool[] = [];    
    let drepData: dRep[] = [];
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
        proposals = calculateProposals(spoData, drepData, get(includeInactiveDReps));
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
        proposals = calculateProposals(spoData, drepData, $includeInactiveDReps);
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
            {#each proposals as proposal, index}
                <Container 
                    {proposal} 
                    {index} 
                    isLastTwoProposals={index >= proposals.length - 2}
                />
            {/each}
        </div>
    {/if}
</main>

<Footer />

<style>
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

    .content {
        width: 100%;
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