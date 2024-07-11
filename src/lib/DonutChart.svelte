<script lang="ts">
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';

    export let values: { label: string; stake: number }[]; // Updated type
    export let title: string;
    export let subtitle: string = '';
    export let size: 'large' | 'medium' | 'small' = 'small';
    export let chartType: 'default' | 'gray' = 'default';
    export let minPools: number;
    export let displayValue: string;

    let canvas: HTMLCanvasElement;

    onMount(() => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: values.map(value => value.label), 
                    datasets: [{
                        data: values.map(value => value.stake), 
                        backgroundColor: chartType === 'gray' 
                            ? ['#808080'] 
                            : title === 'CC' 
                                ? values.map((_, index) => index < 5 ? '#f44336' : '#4caf50') 
                                : values.map((_, index) => index < minPools ? '#f44336' : '#4caf50'),
                    borderWidth: 0
                    }]
                },
                options: {
                    cutout: '50%',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            enabled: true,
                            callbacks: {
                                label: function(context) {
                                    if (chartType === 'gray') {
                                        return '';
                                    }
                                    const totalStake = values.reduce((acc, value) => acc + value.stake, 0); 
                                    const value = context.raw as number;
                                    const percentage = ((value / totalStake) * 100).toFixed(2);
                                    let label;
                                    switch (title) {
                                        case 'Total':
                                            label = `${percentage}% of total`;
                                            break;
                                        case 'CC':
                                            label = `1 of 7 votes`;
                                            break;
                                        case 'dReps':
                                            label = `${percentage}% of voting power`;
                                            break;
                                        default:
                                            label = `${percentage}% of total stake`;
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        }
    });
</script>

<div class="chart-container {size}">
    <canvas bind:this={canvas}></canvas>
    <div class="chart-value">{displayValue}</div>
    {#if title}
        <div class="chart-title">{title}</div>
    {/if}
    {#if subtitle && chartType !== 'gray'}
        <div class="chart-subtitle">{subtitle}</div>
    {/if}
</div>
  
<style>
    .chart-container {
        position: relative;
        margin: 1rem auto 0 auto;
    }
    .chart-container.large {
        width: 350px;
        height: 350px;
    }
    .chart-container.medium {
        width: 200px;
        height: 200px;
    }
    .chart-container.small {
        width: 150px;
        height: 150px;
    }
    .chart-value {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-weight: bold;
        color: white;
    }
    .chart-container.large .chart-value {
        font-size: 5rem;
    }
    .chart-container.medium .chart-value {
        font-size: 2.5rem; 
    }
    .chart-container.small .chart-value {
        font-size: 1.5rem; 
    }
    .chart-title {
        position: absolute;
        bottom: -30px;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 0.9rem;
        color: white;
    }
    .chart-subtitle {
        position: absolute;
        bottom: -50px;
        left: 0;
        right: 0;
        text-align: center;
        color: #888;
    }
</style>