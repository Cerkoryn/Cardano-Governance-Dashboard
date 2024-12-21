<script lang=ts>
    import Header from '$lib/components/Header.svelte'
    import Footer from '$lib/components/Footer.svelte'
    import Container from '$lib/components/Container.svelte';
    import { fetchData } from '$lib/utils/calcs';
    import type { Proposal } from '$lib/types';
    import { isDarkMode } from '$lib/stores/stores';
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';

    let proposals: Proposal[] = [];
    let darkMode = get(isDarkMode);

    onMount(async () => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            darkMode = storedTheme === 'dark';
        } else {
            darkMode = false; // Default to light mode
        }
        isDarkMode.set(darkMode);
        updateBodyClass();
        proposals = await fetchData();
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
</script>

<Header {darkMode} {toggleTheme} />

<main class="container mx-auto p-4 bg-dashboard-bg text-center">
    {#each proposals as proposal, index}
        <Container 
            {proposal} 
            {index} 
            isLastTwoProposals={index >= proposals.length - 2}
        />
    {/each}
</main>

<Footer />

<style>
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