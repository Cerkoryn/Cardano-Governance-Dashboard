<script lang=ts>
    import DonutChart from '$lib/DonutChart.svelte';
    import { onMount } from 'svelte';

    let proposals: Proposal[] = [];

    onMount(async () => {
        const response = await fetch('/data/mergeddata.json');
        const mavData = await response.json();

        proposals = calculateProposals(mavData);
    });

    type Pool = {
        stake: number;
        label: string;
    };

    type Chart = {
        title: string;
        threshold: number;
        size?: 'large' | 'medium' | 'small';
        chartType?: 'default' | 'gray';
        subtitle?: string;
        values?: { label: string; stake: number }[];
        displayValue?: string;
        minPools?: number;
    };

    type Proposal = {
        title: string;
        charts: Chart[];
    };

    // Function to calculate the minimum number of pools to surpass the threshold
    function calculateSPOMAV(values: { label: string; stake: number }[], threshold: number) {
        const totalStake = values.reduce((acc, value) => acc + value.stake, 0); // Updated to use stake
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

    function calculatedRepMAV(values: { label: string; stake: number }[], threshold: number) {
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

    function calculateProposals(data: Pool[]): Proposal[] {
        data.sort((a, b) => b.stake - a.stake);

        // Move the item with label === "SINGLEPOOL" to the end
        const singlePoolIndex = data.findIndex(pool => pool.label === "SINGLEPOOL");
        if (singlePoolIndex !== -1) {
            const [singlePool] = data.splice(singlePoolIndex, 1);
            data.push(singlePool);
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
                { title: 'SPOs', threshold: 51, subtitle: 'Threshold - 51%', chartType: 'gray' }
            ]},
            { title: 'Parameter Change (Governance Group)', charts: [
                { title: 'Total', threshold: 50, size: 'medium' },
                { title: 'CC', threshold: 71.42857143, subtitle: 'Threshold - 5 of 7' },
                { title: 'dReps', threshold: 75, subtitle: 'Threshold - 75%' },
                { title: 'SPOs', threshold: 51, subtitle: 'Threshold - 51%', chartType: 'gray' }
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
            let totalMav = 0;
            proposal.charts.forEach(chart => {
                if (chart.chartType === 'gray') {
                    chart.values = [{ label: 'N/A', stake: 100 }];
                    chart.displayValue = 'N/A';
                } else if (chart.title === 'CC') {
                    chart.values = ccNames;
                    chart.displayValue = '5';
                    totalMav += 5;
                } else if (chart.title === 'dReps') {
                    chart.values = data.map(pool => ({ label: pool.label, stake: pool.stake }));
                    chart.minPools = calculatedRepMAV(chart.values, chart.threshold);
                    chart.displayValue = chart.minPools.toString();
                    totalMav += chart.minPools;
                } else if (chart.title === 'SPOs') {
                    chart.values = data.map(pool => ({ label: pool.label, stake: pool.stake }));
                    chart.minPools = calculateSPOMAV(chart.values, chart.threshold);
                    chart.displayValue = chart.minPools.toString();
                    totalMav += chart.minPools;
                }
            });
            // Calculate the Total chart after all other charts have been processed
            proposal.charts.forEach(chart => {
                if (chart.title === 'Total') {
                    let combinedValues = data.map(pool => ({ label: pool.label, stake: pool.stake })).concat(data.map(pool => ({ label: pool.label, stake: pool.stake })));
                    chart.values = combinedValues.sort((a, b) => b.stake - a.stake);
                    chart.minPools = calculateSPOMAV(combinedValues, chart.threshold);
                    chart.displayValue = totalMav.toString();
                }
            });
        });

        return proposalTypes;
    }
</script>

<main class="container mx-auto p-4 bg-dashboard-bg text-center">
    <div class="proposal-wrapper">
        <div class="title-container">
            <h1 class="title-text">Cardano Governance Dashboard</h1>
        </div>
    </div>
    
    {#each proposals as proposal, index}
        <div class="proposal-wrapper">
            <div class="proposal-container {index === 0 ? 'bg-black' : ''}">
                <h2 class="text-xl font-bold mb-4 text-white">{proposal.title}</h2>
                {#if index === 0} 
                    <div class="flex flex-col items-center chart-item">
                        <DonutChart values={proposal.charts[0].values ?? []} title={proposal.charts[0].title} subtitle={proposal.charts[0].subtitle} size={proposal.charts[0].size} chartType={proposal.charts[0].chartType} minPools={proposal.charts[0].minPools ?? 0} displayValue={proposal.charts[0].displayValue ?? 'ERROR'}/>
                    </div>
                {:else}
                    <div class="grid grid-cols-4">
                        {#each proposal.charts as chart}
                            <div class="flex flex-col items-center chart-item">
                                <DonutChart values={chart.values ?? []} title={chart.title} subtitle={chart.subtitle} size={chart.size} chartType={chart.chartType} minPools={chart.minPools ?? 0} displayValue={chart.displayValue ?? 'ERROR'} />
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    {/each}

    <div class="proposal-wrapper">
        <div class="footer-container">
            <a href="https://github.com/Cerkoryn/Cardano-Governance-Dashboard" target="_blank" class="footer-icon">
                <i class="fab fa-github"></i>
            </a>
            <a href="https://twitter.com/cerkoryn" target="_blank" class="footer-icon">
                <i class="fab fa-x-twitter"></i>
            </a>
        </div>
    </div>
</main>

<style>
    :global(body) {
        background-color: #1a1a1a;
        color: white;
    }

    main, main * {
        text-align: center;
    }

    .title-container {
        margin-top: 0.5rem;
        margin-bottom: 0.5rem;
        background-color: #2d2d2d; 
        border-radius: 4rem; /* Rounded corners */
        padding: 0rem 0rem 0.5rem 0rem;
    }

    .title-text {
        margin-top: 2rem;
        font-size: 3rem; 
        color: white;
    }

    .grid-cols-4 {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
    }

    .proposal-container {
        margin-bottom: 2rem;
        background-color: #2d2d2d; 
        border-radius: 4rem; /* Rounded corners */
        padding: 1rem 0rem 4rem 0rem;
    }

    .proposal-wrapper {
        padding: 0 30rem; 
    }

    h2 {
        font-size: 2rem;
    }

    .chart-item {
        display: flex;
        justify-content: center; 
        align-items: center; 
    }
    .bg-black {
        background-color: #1a1a1a;
    }

    .footer-container {
        margin-top: 0rem;
        margin-bottom: 2rem;
        background-color: #2d2d2d; 
        border-radius: 4rem; /* Rounded corners */
        padding: 0rem 0rem 0.5rem 0rem;
    }

    .footer-icon {
        margin-top: 1rem;
        font-size: 2rem; 
        color: white;
        text-decoration: none;
        padding: 0 1rem;
    }

    .footer-icon:hover {
        color: #ccc; /* Change color on hover */
    }

</style>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">