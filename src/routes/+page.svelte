<script lang=ts>
    import DonutChart from '$lib/DonutChart.svelte';
    import { onMount } from 'svelte';
    import { isDarkMode } from '$lib/stores';
    import { get } from 'svelte/store';

    let proposals: Proposal[] = [];
    let darkMode = get(isDarkMode);

    onMount(async () => {
        const response = await fetch('/tmp/spos.json');
        const spoData = await response.json();
        const response2 = await fetch('/tmp/dreps.json');
        const drepData = await response2.json();

        proposals = calculateProposals(spoData, drepData);
    });

    function toggleTheme() {
        darkMode = !darkMode;
        isDarkMode.set(darkMode);
    }

    $: {
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

    type Pool = {
        stake: number;
        label: string;
    };

    type dRep = {
        votingPower: number;
        label: string;
    };

    type Chart = {
        title: string;
        threshold: number;
        size?: 'large' | 'medium' | 'small';
        chartType?: 'default' | 'gray' | 'yellow';
        subtitle?: string;
        values?: { label: string; stake: number }[] | { label: string; votingPower: number }[];
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

    function calculatedRepMAV(values: { label: string; votingPower: number }[], threshold: number) {
        const totalStake = values.reduce((acc, value) => acc + value.votingPower, 0); 
        const thresholdValue = (threshold / 100) * totalStake;
        let sum = 0;
        let count = 0;
        for (let value of values) {
            sum += value.votingPower;
            count++;
            if (sum >= thresholdValue) break;
        }
        return count;
    }

    function calculateCombinedMAV(drepValues: { label: string; stake: number }[], spoValues: { label: string; stake: number }[], drepThreshold: number, spoThreshold: number, greyStatus: { CC: boolean; dRep: boolean; SPO: boolean }) {
        const drepMAV = calculatedRepMAV(drepValues.map(({ label, stake }) => ({ label, votingPower: stake })), drepThreshold);
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
        drepData.sort((a, b) => b.votingPower - a.votingPower);

        // Move the item with label === "SINGLEPOOL" to the end
        const singlePoolIndex = spoData.findIndex(pool => pool.label === "SINGLEPOOL");
        if (singlePoolIndex !== -1) {
            const [singlePool] = spoData.splice(singlePoolIndex, 1);
            spoData.push(singlePool);
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
                    chart.values = drepData.map(pool => ({ label: pool.label, votingPower: pool.votingPower }));
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
                    const { totalMAV, totalValues } = calculateCombinedMAV(drepData.map(pool => ({ label: pool.label, stake: pool.votingPower})), spoData.map(pool => ({ label: pool.label, stake: pool.stake})), drepThreshold, spoThreshold, grayStatus);
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
            <div class="proposal-container {index === 0 ? 'bg-black' : ''}">
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
                    <div class="grid grid-cols-4">
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
                            />
                                {#if index >= proposals.length - 2 && chartIndex == proposal.charts.length}
                                    <p class="sub-header">*SPOs only vote on security parameters</p>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
                {#if index >= proposals.length - 2}
                    <p class="sub-header">*SPOs only vote on security parameters</p>
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
        font-size: 3rem; 
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

    .grid-cols-4 {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
    }

    .proposal-container {
        margin-bottom: 2rem;
        background-color: var(--proposal-bg-color); 
        border-radius: 4rem; /* Rounded corners */
        padding: 1rem 0rem 3rem 0rem;
        overflow: visible;
    }

    .proposal-wrapper {
        padding: 0 30rem; 
    }

    .proposal-wrapper:last-child {
        margin-bottom: 6rem;
    }

    h2 {
        font-size: 2rem;
    }

    .chart-item {
        display: flex;
        justify-content: center; 
        align-items: center; 
    }

    .sub-header {
        text-align: right;
        color:  #fd551f;
        padding-top: 1rem; 
        padding-right: 1rem;
    }
    .bg-black {
        background-color: var(--proposal-bg-color);
    }

    .footer-icon {
        font-size: 2rem; 
        color: var(--footer-icon-color);
        text-decoration: none;
        margin-left: 2rem
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
</style>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">