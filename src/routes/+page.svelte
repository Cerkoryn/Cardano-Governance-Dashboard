<script lang=ts>
    import DonutChart from '$lib/DonutChart.svelte';
    import { onMount } from 'svelte';
    import { isDarkMode } from '$lib/stores';
    import { get } from 'svelte/store';

    let proposals: Proposal[] = [];
    let darkMode = get(isDarkMode);

    onMount(() => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            darkMode = storedTheme === 'dark';
        } else {
            darkMode = false; // Default to light mode
        }
        isDarkMode.set(darkMode);
        updateBodyClass();
    });

    async function fetchData() {
        const response = await fetch('/api/get_spos'); 
        const spoData = await response.json();
        const response2 = await fetch('/api/get_dreps'); 
        const drepData = await response2.json();

        proposals = calculateProposals(spoData, drepData);
    }

    onMount(fetchData);

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

    type Pool = {
        stake: number;
        label: string;
    };

    type dRep = {
        live_power: number;
        active_power: number;
        drep_id: string;
        given_name?: string;
    };

    type Chart = {
        title: string;
        threshold: number;
        size?: 'large' | 'medium' | 'small';
        chartType?: 'default' | 'gray' | 'yellow';
        subtitle?: string;
        values?: { label: string; stake: number }[] | { label: string; active_power: number }[];
        displayValue?: string;
        secondaryDisplayValue?: string;
        minPools?: number;
        secondaryMinPools?: number;
    };

    type Proposal = {
        title: string;
        charts: Chart[];
    };

    function calculateSPOMAV(values: { label: string; stake: number }[], threshold: number) {
        const totalStake = values.reduce((acc, value) => acc + value.stake, 0);
        const thresholdValue = (threshold / 100) * totalStake;
        let sum = 0;
        let count = 0;
        for (let value of values) {
            sum += value.stake;
            count++;
            if (sum >= thresholdValue) break;
        }
        return count;
    }

    function calculatedRepMAV(values: { label: string; active_power: number }[], threshold: number) {
        const totalStake = values.reduce((acc, value) => acc + value.active_power, 0); 
        const thresholdValue = (threshold / 100) * totalStake;
        let sum = 0;
        let count = 0;
        for (let value of values) {
            sum += value.active_power;
            count++;
            if (sum >= thresholdValue) break;
        }
        return count;
    }

    function calculateCombinedMAV(drepValues: { label: string; stake: number }[], spoValues: { label: string; stake: number }[], drepThreshold: number, spoThreshold: number, greyStatus: { CC: boolean; dRep: boolean; SPO: boolean }) {
        const drepMAV = calculatedRepMAV(drepValues.map(({ label, stake }) => ({ label, active_power: stake })), drepThreshold);
        const spoMAV = calculateSPOMAV(spoValues, spoThreshold);
        const ccMAV = 5
        const ccLength = 7;
        const totalMAV = (greyStatus.dRep ? 0 : drepMAV) + (greyStatus.SPO ? 0 : spoMAV) + (greyStatus.CC ? 0 : ccMAV);
        let totalValues: { label: string; stake: number }[] = [];

        if (!greyStatus.CC) {
            const ccValues = Array.from({ length: ccLength }, () => ({ label: 'Any CC Member', stake: 1 }));
            ccValues.forEach((value, index) => {
                if (index < ccMAV) {
                    totalValues.push(value);
                }
            });
        }

        if (!greyStatus.dRep) {
            drepValues.forEach((value, index) => {
                if (index < drepMAV) {
                    totalValues.push({ label: value.label, stake: 1 });
                }
            });
        }

        if (!greyStatus.SPO) {
            spoValues.forEach((value, index) => {
                if (index < spoMAV) {
                    totalValues.push({ label: value.label, stake: 1 });
                }
            });
        }

        totalValues.push({ label: 'Other', stake: totalMAV });

        return { totalMAV, totalValues };
}

    function calculateProposals(spoData: Pool[], drepData: dRep[]): Proposal[] {
        spoData.sort((a, b) => b.stake - a.stake);
        drepData.sort((a, b) => b.active_power - a.active_power);

        // Move the item with label === "SINGLEPOOL" to the end
        const singlePoolIndex = spoData.findIndex(pool => pool.label === "SINGLEPOOL");
        if (singlePoolIndex !== -1) {
            const [singlePool] = spoData.splice(singlePoolIndex, 1);
            spoData.push(singlePool);
        }

        // Move the item with label === "drep_always_no_confidence" to the end
        const noConfidenceIndex = drepData.findIndex(drep => drep.drep_id === "drep_always_no_confidence");
        if (noConfidenceIndex !== -1) {
            const [noConfidenceDrep] = drepData.splice(noConfidenceIndex, 1);
            drepData.push(noConfidenceDrep);
        }

        // Move the item with label === "drep_always_abstain" to the end
        const abstainIndex = drepData.findIndex(drep => drep.drep_id === "drep_always_abstain");
        if (abstainIndex !== -1) {
            const [abstainDrep] = drepData.splice(abstainIndex, 1);
            //drepData.push(abstainDrep);                               // TODO: Make this a toggle later
        }

        const proposalTypes: Proposal[] = [
            { title: 'Uncontrolled Hard Fork', charts: [
                { title: 'SPOs', threshold: 50, size: 'large' } 
            ]},
            { title: 'No Confidence in Constitutional Committee', charts: [
                { title: 'Total', threshold: 50, size: 'medium' },
                { title: 'CC', threshold: 71.42857143, subtitle: 'Threshold - 5 of 7', chartType: 'gray' },
                { title: 'dReps', threshold: 67, subtitle: 'Threshold - 67%' },
                { title: 'SPOs', threshold: 51, subtitle: 'Threshold - 51%' }
            ]},
            { title: 'New Constitutional Committee (Normal State)', charts: [
                { title: 'Total', threshold: 50, size: 'medium' },
                { title: 'CC', threshold: 71.42857143, subtitle: 'Threshold - 5 of 7', chartType: 'gray' },
                { title: 'dReps', threshold: 67, subtitle: 'Threshold - 67%' },
                { title: 'SPOs', threshold: 51, subtitle: 'Threshold - 51%' }
            ]},
            { title: 'New Constitutional Committee (State of No Confidence)', charts: [
                { title: 'Total', threshold: 50, size: 'medium' },
                { title: 'CC', threshold: 71.42857143, subtitle: 'Threshold - 5 of 7', chartType: 'gray' },
                { title: 'dReps', threshold: 60, subtitle: 'Threshold - 60%' },
                { title: 'SPOs', threshold: 51, subtitle: 'Threshold - 51%' }
            ]},
            { title: 'Update Constitution', charts: [
                { title: 'Total', threshold: 50, size: 'medium' },
                { title: 'CC', threshold: 71.42857143, subtitle: 'Threshold - 5 of 7' },
                { title: 'dReps', threshold: 75, subtitle: 'Threshold - 75%' },
                { title: 'SPOs', threshold: 51, subtitle: 'Threshold - 51%', chartType: 'gray' }
            ]},
            { title: 'Initiate Hard Fork', charts: [
                { title: 'Total', threshold: 50, size: 'medium' },
                { title: 'CC', threshold: 71.42857143, subtitle: 'Threshold - 5 of 7' },
                { title: 'dReps', threshold: 67, subtitle: 'Threshold - 67%' },
                { title: 'SPOs', threshold: 51, subtitle: 'Threshold - 51%' }
            ]},
            { title: 'Treasury Withdrawal', charts: [
                { title: 'Total', threshold: 50, size: 'medium' },
                { title: 'CC', threshold: 71.42857143, subtitle: 'Threshold - 5 of 7' },
                { title: 'dReps', threshold: 67, subtitle: 'Threshold - 67%' },
                { title: 'SPOs', threshold: 51, subtitle: 'Threshold - 51%', chartType: 'gray' }
            ]},
            { title: 'Parameter Change (Network, Economic, and Technical Groups)', charts: [
                { title: 'Total', threshold: 50, size: 'medium' },
                { title: 'CC', threshold: 71.42857143, subtitle: 'Threshold - 5 of 7' },
                { title: 'dReps', threshold: 67, subtitle: 'Threshold - 67%' },
                { title: 'SPOs', threshold: 51, subtitle: 'Threshold - 51%', chartType: 'yellow' }
            ]},
            { title: 'Parameter Change (Governance Group)', charts: [
                { title: 'Total', threshold: 50, size: 'medium' },
                { title: 'CC', threshold: 71.42857143, subtitle: 'Threshold - 5 of 7' },
                { title: 'dReps', threshold: 75, subtitle: 'Threshold - 75%' },
                { title: 'SPOs', threshold: 51, subtitle: 'Threshold - 51%', chartType: 'yellow' }
            ]},
        ];

        const ccNames = [
            { label: 'IOG', stake: 1 },
            { label: 'Cardano Foundation', stake: 1 },
            { label: 'Emurgo', stake: 1 },
            { label: 'Intersect', stake: 1 },
            { label: 'Cardano Atlantic Council', stake: 1 },
            { label: 'Cardano Japan', stake: 1 },
            { label: 'Eastern Cardano Council', stake: 1 }
        ];

        proposalTypes.forEach(proposal => {
            let totalMav = 0, spoThreshold = 0, drepThreshold = 0;
            let grayStatus = { CC: false, dRep: false, SPO: false };
            proposal.charts.forEach(chart => {
                if (chart.chartType === 'gray') {
                    chart.values = [{ label: 'N/A', stake: 100 }];
                    chart.displayValue = 'N/A';
                    if (chart.title === 'CC') {
                        grayStatus.CC = true;
                    } else if (chart.title === 'dReps') {
                        grayStatus.dRep = true;
                    } else if (chart.title === 'SPOs') {
                        grayStatus.SPO = true;
                    }
                } else if (chart.title === 'CC') {
                    chart.values = ccNames;
                    chart.displayValue = '5';
                    totalMav += 5;
                } else if (chart.title === 'dReps') {
                    chart.values = drepData.map(dRep => ({ label: dRep.given_name ? dRep.given_name : dRep.drep_id, active_power: dRep.active_power }));
                    chart.minPools = calculatedRepMAV(chart.values, chart.threshold);
                    chart.displayValue = chart.minPools.toString();
                    totalMav += chart.minPools;
                    drepThreshold = chart.threshold
                } else if (chart.title === 'SPOs') {
                    chart.values = spoData.map(pool => ({ label: pool.label, stake: pool.stake }));
                    chart.minPools = calculateSPOMAV(chart.values, chart.threshold);
                    chart.displayValue = chart.minPools.toString();
                    totalMav += chart.minPools;
                    spoThreshold = chart.threshold
                }
            });
            // Calculate the Total chart after all other charts have been processed
            proposal.charts.forEach(chart => {
                if (chart.title === 'Total') {
                    const { totalMAV, totalValues } = calculateCombinedMAV(drepData.map(dRep => ({ label: dRep.drep_id, stake: dRep.active_power})), spoData.map(pool => ({ label: pool.label, stake: pool.stake})), drepThreshold, spoThreshold, grayStatus);
                    const spoMAV = calculateSPOMAV(spoData.map(pool => ({ label: pool.label, stake: pool.stake})), 51)
                    chart.minPools = totalMAV;
                    chart.values = totalValues;

                    if (proposal.title === 'Parameter Change (Network, Economic, and Technical Groups)' || proposal.title === 'Parameter Change (Governance Group)') {
                        chart.secondaryDisplayValue = totalMav.toString();
                        chart.displayValue = (totalMav - spoMAV).toString();
                        chart.secondaryMinPools = totalMAV - spoMAV;
                    } else {
                        chart.displayValue = totalMav.toString();
                    }
                }
            });
        });

        return proposalTypes;
    }
</script>

<main class="container mx-auto p-4 bg-dashboard-bg text-center">
    <div class="header-bar">
        <div class="title-wrapper">
            <h1 class="title-text">Cardano Governance Dashboard</h1>
        </div>
        <button on:click={toggleTheme}>
            <i class={darkMode ? 'fas fa-sun footer-icon' : 'fas fa-moon footer-icon'}></i>
        </button>
    </div>
    
    {#each proposals as proposal, index}
        <div class="proposal-wrapper">
            <div class="proposal-container mx-auto max-w-4xl {index === 0 ? 'bg-black' : ''}">
                <h2 class="text-xl font-bold mb-4 text-white">{proposal.title}</h2>
                {#if index === 0} 
                    <div class="flex flex-col items-center chart-item">
                        <DonutChart 
                            values={proposal.charts[0].values ?? []} 
                            title={proposal.charts[0].title} 
                            subtitle={proposal.charts[0].subtitle} 
                            size={proposal.charts[0].size} 
                            chartType={proposal.charts[0].chartType} 
                            minPools={proposal.charts[0].minPools ?? 0} 
                            secondaryMinPools={proposal.charts[0].secondaryMinPools ?? 0} 
                            displayValue={proposal.charts[0].displayValue ?? 'ERROR'} 
                            secondaryDisplayValue={proposal.charts[0].secondaryDisplayValue ?? ''} 
                        />
                    </div>
                {:else}
                <div class="chart-container">
                    {#each proposal.charts as chart, chartIndex}
                        <div class="flex flex-col items-center chart-item">
                            <DonutChart 
                                values={chart.values ?? []} 
                                title={chart.title} 
                                subtitle={chart.subtitle} 
                                size={chart.size} 
                                chartType={chart.chartType} 
                                minPools={chart.minPools ?? 0} 
                                secondaryMinPools={chart.secondaryMinPools ?? 0}
                                displayValue={chart.displayValue ?? 'ERROR'} 
                                secondaryDisplayValue={chart.secondaryDisplayValue ?? ''} 
                                showSecondarySubtitle={chartIndex === 3 && (index === proposals.length - 1 || index === proposals.length - 2)}
                            />
                        </div>
                    {/each}
                </div>
                {/if}
            </div>
        </div>
    {/each}

    <div class="footer-bar">
            <a href="https://github.com/Cerkoryn/Cardano-Governance-Dashboard" target="_blank" class="footer-icon">
                <i class="fab fa-github"></i>
            </a>
            <a href="https://twitter.com/cerkoryn" target="_blank" class="footer-icon">
                <i class="fab fa-x-twitter"></i>
            </a>
    </div>
</main>

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
    main, main * {
        text-align: center;
    }
    .header-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        max-width: 100%; 
        padding: 1rem 2rem; 
        box-sizing: border-box;
        background-color: var(--footer-bg-color);
        border-radius: 0;
        margin-bottom: 2rem;
    }
    .footer-bar {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        width: 100%;
        max-width: 100%; 
        padding: 1rem 2rem; 
        box-sizing: border-box;
        background-color: var(--footer-bg-color);
        border-radius: 0;
        margin-bottom: 0rem;
    }
    .title-text {
        margin: 0;
        font-size: 2rem; 
        color: var(--title-text-color);
    }
    .title-wrapper {
        flex-grow: 1;
        text-align: center;
    }
    button {
        font-size: 1rem;
        padding: 0rem 0rem;
        background-color: var(--button-bg-color);
        color: var(--button-text-color);
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
    }
    button:hover {
        background-color: var(--button-hover-bg-color);
    }
    .proposal-container {
        margin-bottom: 2rem;
        background-color: var(--proposal-bg-color); 
        border-radius: 2.5rem; 
        padding: 1rem;
        overflow: visible;
        max-width: 50%; 
        margin-left: auto;
        margin-right: auto;
        padding-top: 1rem;
        padding-bottom: 0rem; 
    }
    .proposal-wrapper {
        padding: 0 1rem; 
    }
    .proposal-wrapper:last-child {
        margin-bottom: 6rem;
    }
    h2 {
        font-size: 1.5rem;
    }
    .chart-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 4px;
    }
    .chart-item {
        flex: 1 1 20%;
        padding-top: 0rem;
        padding-bottom: 5rem;
    }
    .chart-item:first-child {
        flex: 1 1 30%;
        padding-bottom: 2rem
    }
    .bg-black {
        background-color: var(--proposal-bg-color);
    }
    .footer-icon {
        font-size: 2rem; 
        color: var(--footer-icon-color);
        text-decoration: none;
        margin-left: 1rem;
    }
    .footer-icon:hover {
        color: var(--footer-icon-hover-color); 
    }
    :global(body.dark-mode) {
        --title-bg-color: #1d1d1b;
        --title-text-color: #f5f3eb;
        --proposal-bg-color: #333333;
        --footer-bg-color: #333333;
        --footer-icon-color: #f5f3eb;
        --footer-icon-hover-color: #ccc;
    }
    :global(body.light-mode) {
        --title-bg-color: #2353ff;
        --title-text-color: #f5f3eb;
        --proposal-bg-color: #d0e1ff;
        --footer-bg-color: #2353ff;
        --footer-icon-color: #f5f3eb;
        --footer-icon-hover-color: #4a90e2;
    }
    @media (max-width: 768px) {
        .proposal-container {
            max-width: 100%; /* Make the container full width on narrow screens */
        }
    }
</style>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">