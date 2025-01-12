<script lang="ts">
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';
    import TooltipIcon from '$lib/components/TooltipIcon.svelte';

    export let values: { label: string; stake: number }[] | { label: string; active_power: number }[];
    export let title: string;
    export let subtitle: string = '';
    export let size: 'large' | 'medium' | 'small' = 'small';
    export let chartType: 'default' | 'gray' | 'yellow' = 'default';
    export let minPools: number;
    export let secondaryMinPools: number = 0;
    export let displayValue: string;
    export let secondaryDisplayValue: string;
    export let showSecondarySubtitle: boolean = false;
    export let tooltipMessage: string = '';

    let canvas: HTMLCanvasElement;
    let chartInstance: Chart<'doughnut', number[], string>;

    function getBackgroundColors() {
    return values.map((value, index) => {
        let color: string;

        // Make the color white if the dRep/SPO is inactive
        if ('is_active' in value && value.is_active === false) {
            color = '#ffffff'; 
            return color
        }

        // Determine base color based on chartType and index
        if (chartType === 'gray') {
            color = '#808080';
        } else if (chartType === 'yellow') {
            color = index < minPools ? '#e65100' : '#fec104';
        } else if (title === 'CC') {
            color = index < 5 ? '#f44336' : '#4caf50';
        } else if (values.length === 2) { // Applies to total dRep and total SPO charts.
            color = index >= 1 ? '#f44336' : '#4caf50';
        } else {
            if (
                secondaryMinPools !== 0 &&
                index >= secondaryMinPools &&
                index < minPools
            ) {
                color = '#e65100';
            } else {
                color = index < minPools ? '#f44336' : '#4caf50';
            }
        }
        return color;
    });
}

    function customTooltip(context: any) {
    // Tooltip Element
    let tooltipEl = document.getElementById('chartjs-tooltip');

    // Create element on first render
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'chartjs-tooltip';
        tooltipEl.innerHTML = '<table></table>';
        document.body.appendChild(tooltipEl);
    }

    // Hide if no tooltip
    const tooltipModel = context.tooltip;
    if (tooltipModel.opacity === 0) {
        tooltipEl.style.opacity = '0';
        return;
    }

    // Set caret Position
    tooltipEl.classList.remove('above', 'below', 'no-transform');
    if (tooltipModel.yAlign) {
        tooltipEl.classList.add(tooltipModel.yAlign);
    } else {
        tooltipEl.classList.add('no-transform');
    }

    function getBody(bodyItem: { lines: string[] }) {
        return bodyItem.lines;
    }

    // Set Text
    if (tooltipModel.body) {
        const titleLines = tooltipModel.title || [];
        const bodyLines = tooltipModel.body.map(getBody);

        let innerHtml = '<thead>';

        titleLines.forEach(function (title: string) {
            innerHtml += '<tr><th>' + title + '</th></tr>';
        });
        innerHtml += '</thead><tbody>';

        bodyLines.forEach(function (body: string[], i: number) {
            const colors = tooltipModel.labelColors[i];
            const style = 'background:' + colors.backgroundColor + '; width: 10px; height: 10px; display: inline-block; margin-right: 5px;';
            const span = '<span style="' + style + '"></span>';
            innerHtml += '<tr><td>' + span + body + '</td></tr>';
        });
        innerHtml += '</tbody>';

        const tableRoot = tooltipEl.querySelector('table');
        if (tableRoot) {
            tableRoot.innerHTML = innerHtml;
        }
    }

    const position = context.chart.canvas.getBoundingClientRect();

    // Display, position, and set styles for font
    tooltipEl.style.opacity = '1';
    tooltipEl.style.position = 'absolute';
    tooltipEl.style.left = position.left + window.scrollX + tooltipModel.caretX + 'px';
    tooltipEl.style.top = position.top + window.scrollY + tooltipModel.caretY + 'px';
    tooltipEl.style.fontFamily = tooltipModel.options.bodyFont.family;
    tooltipEl.style.fontSize = tooltipModel.options.bodyFont.size + 'px';
    tooltipEl.style.fontStyle = tooltipModel.options.bodyFont.style;
    tooltipEl.style.pointerEvents = 'none';
    tooltipEl.style.zIndex = '9999'; // Ensure tooltip is on top
    tooltipEl.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    tooltipEl.style.color = 'white';
    tooltipEl.style.textAlign = 'left';
    tooltipEl.style.padding = '2px';
    tooltipEl.style.transition = 'opacity 0.4s ease, transform 0.3s ease-in-out, background-color 0.4s linear';
}

    onMount(() => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            chartInstance = new Chart<'doughnut', number[], string>(ctx, {
                type: 'doughnut',
                data: {
                    labels: values.map(value => value.label), 
                    datasets: [
                        {
                            data: values.map((value) =>
                                'stake' in value ? value.stake : value.active_power
                            ),
                            backgroundColor: getBackgroundColors(),
                            borderWidth: 0.1,
                            borderColor: 'black',
                        },
                    ],
                },
                options: {
                    cutout: '50%',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            enabled: false,
                            external: customTooltip,
                            position: 'nearest',
                            callbacks: {
                                label: function(context: any) {
                                    if (chartType === 'gray') {
                                        return '';
                                    }
                                    const totalStake = values.reduce((acc, value) => acc + ('stake' in value ? value.stake : value.active_power), 0); 
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

    $: if (chartInstance) {
        chartInstance.data.labels = values.map((value) => value.label);
        chartInstance.data.datasets[0].data = values.map((value) =>
            'stake' in value ? value.stake : value.active_power
        );
        chartInstance.data.datasets[0].backgroundColor = getBackgroundColors();
        chartInstance.update();
    }
</script>

<div class="chart-container {size}">
    <canvas bind:this={canvas}></canvas>
    <div class="chart-value-container">
        <div class="chart-value" class:chart-value-yellow={chartType === 'yellow'}>{displayValue}</div>
        {#if secondaryDisplayValue}
            <div class="chart-secondary-value">{secondaryDisplayValue}</div>
        {/if}
    </div>
    {#if title}
        <div class="chart-title">{title}</div>
    {/if}
    {#if subtitle && chartType !== 'gray'}
        <div class="chart-subtitle">{subtitle}</div>
    {/if}
    {#if showSecondarySubtitle}
        <div class="chart-secondary-subtitle">*SPOs only vote on security parameters</div>
    {/if}
    {#if tooltipMessage}
        <div class="tooltip-icon-container">
            <TooltipIcon message={tooltipMessage} />
        </div>
    {/if}
</div>
  
<style>
    .chart-container {
        position: relative;
        margin: 0 auto;
        z-index: 1;
        overflow: visible;
    }
    .chart-container.large {
        width: 100%;
        max-width: 350px;
        height: 350px;
    }
    .chart-container.medium {
        width: 100%;
        max-width: 200px;
        height: 200px;
    }
    .chart-container.small {
        width: 100%;
        max-width: 150px;
        height: 150px;
    }
    .chart-value-container {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .chart-value {
        font-weight: bold;
        color: var(--chart-value-color);
    }
    .chart-secondary-value {
        font-size: 1.2rem;
        color: var(--chart-secondary-value-color);
        margin-top: 0rem;
    }
    .chart-value-yellow {
        color: #fd551f;
    }
    .chart-container.large .chart-value {
        font-size: 5rem;
    }
    .chart-container.medium .chart-value {
        font-size: 2rem; 
    }
    .chart-container.small .chart-value {
        font-size: 1.5rem; 
    }
    .chart-title {
        position: absolute;
        bottom: -20px;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 0.9rem;
        color: var(--chart-title-color);
    }

    .chart-subtitle {
        position: absolute;
        bottom: -40px; 
        left: 0;
        right: 0;
        text-align: center;
        color: var(--chart-subtitle-color);
    }

    .chart-secondary-subtitle {
        position: absolute;
        bottom: -65px; 
        left: 0;
        right: 0;
        text-align: center;
        color: #fd551f;
        font-size: 0.7rem;
    }
    
    .tooltip-icon-container {
        position: absolute;
        top: 0;
        right: 0;
        padding: 5px;
    }
    :global(body.dark-mode) {
        --chart-value-color: #f5f3eb;
        --chart-secondary-value-color: #fd551f;
        --chart-title-color: #f5f3eb;
        --chart-subtitle-color: #888;
    }
    :global(body.light-mode) {
        --chart-value-color: #1d1d1b;
        --chart-secondary-value-color: #fd551f;
        --chart-title-color: #1d1d1b;
        --chart-subtitle-color: #666;
    }
</style>