<script lang="ts">
    import type { Proposal } from '$lib/types/types';
    import DonutChart from '$lib/components/DonutChart.svelte';

    export let proposal: Proposal;
    export let index: number;
    export let isLastTwoProposals: boolean = false; 
</script>

<div class="proposal-wrapper">
    <div class="proposal-container {index === 0 ? 'bg-black' : ''}">
        <h2>{proposal.title}</h2>
        {#if index === 0} 
            <div class="chart-item">
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
                    tooltipMessage={proposal.charts[0].tooltipMessage ?? ''}
                />
            </div>
        {:else}
            <div class="chart-container">
                {#each proposal.charts as chart, chartIndex}
                    <div class="chart-item">
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
                            showSecondarySubtitle={chartIndex === 3 && isLastTwoProposals}
                            tooltipMessage={chart.tooltipMessage ?? ''}
                        />
                    </div>
                {/each}
            </div>
        {/if}
        <slot />
    </div>
</div>

<style>
    .proposal-container {
        margin-bottom: 1rem;
        background-color: var(--proposal-bg-color); 
        border-radius: 2.5rem; 
        padding: 1rem;
        overflow: visible;
        width: 100%; 
        margin: 0 auto; 
        text-align: center;
    }

    .proposal-wrapper {
        padding: 0 1rem; 
    }

    .proposal-wrapper:last-child {
        margin-bottom: 2rem; 
    }
    h2 {
        font-size: 1.25rem;
        text-align: center;
    }
    .chart-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 4px;
        flex-direction: row;
        align-items: flex-start; 
    }
    .chart-item {
        flex: 1 1 20%;
        padding-top: 0rem;
        padding-bottom: 5rem;
        width: auto; 
        margin-bottom: 0;
    }
    .chart-item:first-child {
        flex: 1 1 30%;
        padding-bottom: 2rem
    }
    .bg-black {
        background-color: var(--proposal-bg-color);
    }
        @media (max-width: 768px) {
        .proposal-container {
            padding: 0.5rem;
        }
            .chart-container {
            flex-direction: column;
            align-items: center;
        }

        .chart-item {
            flex: none;
            width: 100%;
            padding-bottom: 1.5rem;
            margin-bottom: 1.5rem;   
        }

        .chart-item:first-child {
            padding-bottom: 1.5rem;
        }
    }

</style>