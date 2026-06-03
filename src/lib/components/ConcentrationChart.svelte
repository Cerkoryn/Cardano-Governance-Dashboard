<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Chart from 'chart.js/auto';
	import TooltipIcon from '$lib/components/TooltipIcon.svelte';
	import type { CumulativePoint } from '$lib/utils/calcs';
	export let series: CumulativePoint[] = [];
	export let minSPOsFor51: number;
	// Lets the chart restyle when the theme toggles (its colors are read from CSS tokens).
	export let darkMode = false;
	let canvas: HTMLCanvasElement;
	let chart: Chart<'line', number[], string> | null = null;

	function cssVar(name: string) {
		return getComputedStyle(document.body).getPropertyValue(name).trim();
	}

	function applyThemeColors() {
		if (!chart) return;
		chart.data.datasets[0].borderColor = cssVar('--accent');
		const muted = cssVar('--text-muted');
		const yScale = chart.options.scales?.y;
		const xScale = chart.options.scales?.x;
		if (yScale) {
			if (yScale.ticks) yScale.ticks.color = muted;
			if (yScale.grid) yScale.grid.color = cssVar('--border');
		}
		if (xScale) {
			if (xScale.ticks) xScale.ticks.color = muted;
			if (xScale.title) xScale.title.color = muted;
		}
		chart.update();
	}

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		chart = new Chart<'line', number[], string>(ctx, {
			type: 'line',
			data: {
				labels: series.map((p) => String(p.rank)),
				datasets: [{
					label: 'Cumulative delegated stake',
					data: series.map((p) => p.cumulativePercent),
					borderColor: cssVar('--accent'),
					backgroundColor: 'transparent',
					borderWidth: 2,
					pointRadius: 0,
					tension: 0.25
				}]
			},
			options: {
				responsive: true, maintainAspectRatio: false,
				scales: {
					y: { min: 0, max: 100, ticks: { callback: (v) => `${v}%`, color: cssVar('--text-muted') }, grid: { color: cssVar('--border') } },
					x: { title: { display: true, text: 'Number of SPOs', color: cssVar('--text-muted') }, ticks: { color: cssVar('--text-muted'), maxTicksLimit: 10 }, grid: { display: false } }
				},
				plugins: {
					legend: { display: false },
					tooltip: { callbacks: { label: (c) => `${(c.raw as number).toFixed(1)}% after ${c.label} SPOs` } }
				}
			}
		});
	});
	onDestroy(() => chart?.destroy());

	// Re-read token colors after the theme class flips on <body>.
	$: if (chart) { darkMode; applyThemeColors(); }
</script>

<div class="conc card-surface">
	<div class="explain">
		<h3>Minimum SPOs controlling 51% of delegated stake <TooltipIcon message="Smallest number of SPOs whose combined delegated stake reaches or exceeds 51%. It does not imply these SPOs collaborate." /></h3>
		<p>This shows the smallest number of SPOs whose combined delegated stake reaches or exceeds 51%. It does not imply these SPOs are collaborating.</p>
		<div class="big"><span>{minSPOsFor51}</span> SPOs reach 51%</div>
	</div>
	<div class="chartwrap"><canvas bind:this={canvas}></canvas></div>
</div>

<style>
	.conc { max-width: var(--maxw); margin: 0 auto; padding: 24px; display: grid; grid-template-columns: 280px 1fr; gap: var(--gap); }
	h3 { margin: 0 0 8px; font-size: 1rem; color: var(--text); display: flex; gap: 6px; align-items: center; }
	.explain p { font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; }
	.big { margin-top: 16px; font-size: 0.95rem; color: var(--text-muted); }
	.big span { font-size: 2rem; font-weight: 700; color: var(--accent); }
	.chartwrap { position: relative; height: 320px; min-width: 0; }
	@media (max-width: 768px) { .conc { grid-template-columns: 1fr; } }
</style>
