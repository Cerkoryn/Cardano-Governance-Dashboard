<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Chart from 'chart.js/auto';
	import type { Plugin } from 'chart.js';
	import TooltipIcon from '$lib/components/TooltipIcon.svelte';
	import type { CumulativePoint } from '$lib/utils/calcs';
	export let series: CumulativePoint[] = [];
	export let minSPOsFor51: number;
	// Lets the chart restyle when the theme toggles (its colors are read from CSS tokens).
	export let darkMode = false;
	let canvas: HTMLCanvasElement;
	let chart: Chart<'line', number[], string> | null = null;
	let methodOpen = false;

	// Explanatory diagram: show the leading SPOs around the 51% crossing rather than
	// the full long tail, so the crossing is readable (like the reference design).
	$: visibleCount = Math.min(series.length, Math.max(41, minSPOsFor51 + 8));
	$: visible = series.slice(0, visibleCount);

	function cssVar(name: string) {
		return getComputedStyle(document.body).getPropertyValue(name).trim();
	}

	function hexToRgba(hex: string, alpha: number) {
		const h = hex.replace('#', '');
		const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
		const r = parseInt(n.slice(0, 2), 16);
		const g = parseInt(n.slice(2, 4), 16);
		const b = parseInt(n.slice(4, 6), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.arcTo(x + w, y, x + w, y + h, r);
		ctx.arcTo(x + w, y + h, x, y + h, r);
		ctx.arcTo(x, y + h, x, y, r);
		ctx.arcTo(x, y, x + w, y, r);
		ctx.closePath();
	}

	// Draws the 51% crosshair, the marker dot, the "N SPOs reach 51%" callout and the 51% axis label.
	const marker: Plugin<'line'> = {
		id: 'marker51',
		afterDatasetsDraw(c) {
			const meta = c.getDatasetMeta(0);
			const point = meta.data[minSPOsFor51 - 1];
			if (!point) return;
			const { ctx, chartArea, scales } = c;
			const xN = point.x;
			const y51 = scales.y.getPixelForValue(51);
			const accent = cssVar('--accent');
			const muted = cssVar('--text-muted');
			const surface = cssVar('--surface');

			ctx.save();
			// dashed crosshair
			ctx.setLineDash([5, 4]);
			ctx.lineWidth = 1.5;
			ctx.strokeStyle = accent;
			ctx.beginPath();
			ctx.moveTo(chartArea.left, y51);
			ctx.lineTo(xN, y51);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(xN, y51);
			ctx.lineTo(xN, chartArea.bottom);
			ctx.stroke();
			ctx.setLineDash([]);

			// 51% axis label
			ctx.fillStyle = accent;
			ctx.font = '600 12px Inter, system-ui, sans-serif';
			ctx.textAlign = 'right';
			ctx.textBaseline = 'middle';
			ctx.fillText('51%', chartArea.left - 8, y51);

			// callout bubble above the dot
			const w = 96;
			const h = 44;
			let bx = xN - w / 2;
			bx = Math.max(chartArea.left, Math.min(bx, chartArea.right - w));
			const by = y51 - 24 - h;
			ctx.fillStyle = surface;
			ctx.strokeStyle = cssVar('--border');
			ctx.lineWidth = 1;
			roundRect(ctx, bx, by, w, h, 8);
			ctx.fill();
			ctx.stroke();
			// tail
			ctx.beginPath();
			ctx.moveTo(xN - 6, by + h);
			ctx.lineTo(xN + 6, by + h);
			ctx.lineTo(xN, by + h + 9);
			ctx.closePath();
			ctx.fillStyle = surface;
			ctx.fill();
			// callout text
			ctx.textAlign = 'center';
			ctx.fillStyle = accent;
			ctx.font = '700 17px Inter, system-ui, sans-serif';
			ctx.fillText(`${minSPOsFor51} SPOs`, bx + w / 2, by + 17);
			ctx.fillStyle = muted;
			ctx.font = '400 12px Inter, system-ui, sans-serif';
			ctx.fillText('reach 51%', bx + w / 2, by + 33);

			// marker dot at the crossing
			ctx.beginPath();
			ctx.arc(xN, y51, 5.5, 0, Math.PI * 2);
			ctx.fillStyle = accent;
			ctx.fill();
			ctx.lineWidth = 2.5;
			ctx.strokeStyle = surface;
			ctx.stroke();
			ctx.restore();
		}
	};

	function applyThemeColors() {
		if (!chart) return;
		const accent = cssVar('--accent');
		const muted = cssVar('--text-muted');
		chart.data.datasets[0].borderColor = accent;
		chart.data.datasets[0].backgroundColor = hexToRgba(accent, darkMode ? 0.18 : 0.1);
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
		const accent = cssVar('--accent');
		chart = new Chart<'line', number[], string>(ctx, {
			type: 'line',
			data: {
				labels: visible.map((p) => String(p.rank)),
				datasets: [
					{
						label: 'Cumulative Delegated Stake',
						data: visible.map((p) => p.cumulativePercent),
						borderColor: accent,
						backgroundColor: hexToRgba(accent, darkMode ? 0.18 : 0.1),
						borderWidth: 2,
						pointRadius: 0,
						pointHoverRadius: 4,
						tension: 0.25,
						fill: 'origin'
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				layout: { padding: { top: 24, left: 8 } },
				scales: {
					y: {
						min: 0,
						max: 100,
						ticks: { stepSize: 20, callback: (v) => `${v}%`, color: cssVar('--text-muted') },
						grid: { color: cssVar('--border') }
					},
					x: {
						title: { display: true, text: 'Number of SPOs', color: cssVar('--text-muted') },
						ticks: { color: cssVar('--text-muted'), maxTicksLimit: 9 },
						grid: { display: false }
					}
				},
				plugins: {
					legend: { display: false },
					tooltip: { callbacks: { label: (c) => `${(c.raw as number).toFixed(1)}% after ${c.label} SPOs` } }
				}
			},
			plugins: [marker]
		});
	});
	onDestroy(() => chart?.destroy());

	// Re-read token colors after the theme class flips on <body>.
	$: if (chart) {
		darkMode;
		applyThemeColors();
	}
</script>

<div class="conc card-surface">
	<div class="explain">
		<h3>
			Minimum SPOs controlling 51% of delegated stake
			<TooltipIcon message="Smallest number of SPOs whose combined delegated stake reaches or exceeds 51%. It does not imply these SPOs collaborate." />
		</h3>
		<p>
			This shows the smallest number of SPOs whose combined delegated stake reaches or exceeds 51%.
			It does not imply these SPOs are collaborating.
		</p>
		<div class="big"><span>{minSPOsFor51}</span> SPOs reach 51%</div>
		<button class="method" on:click={() => (methodOpen = !methodOpen)}>{methodOpen ? '▾' : '▸'} Methodology</button>
		{#if methodOpen}
			<div class="method-body">
				<p>
					Stake pool operators are ranked by delegated stake, largest first. The line adds them up
					until the running total reaches 51% of all delegated stake; that count is the figure shown.
				</p>
				<p>
					Why delegated stake and not total ADA? On Cardano only delegated stake takes part in block
					production, so undelegated ADA, treasury and reserves do not count. About 56% of all ADA is
					currently delegated, so 51% of delegated stake is roughly 29% of the total supply.
				</p>
				<p>
					Single pool operators are combined into one SINGLEPOOL group and placed last, since
					thousands of independent small operators are not a realistic coordinating bloc.
				</p>
			</div>
		{/if}
	</div>
	<div class="chartside">
		<div class="legend"><span class="legend-mark"></span> Cumulative Delegated Stake</div>
		<div class="chartwrap"><canvas bind:this={canvas}></canvas></div>
	</div>
</div>

<style>
	.conc {
		max-width: var(--maxw);
		margin: 0 auto;
		padding: 24px;
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: var(--gap);
	}
	h3 {
		margin: 0 0 8px;
		font-size: 1rem;
		color: var(--text);
		display: flex;
		gap: 6px;
		align-items: center;
	}
	.explain p {
		font-size: 0.85rem;
		color: var(--text-muted);
		line-height: 1.5;
	}
	.big {
		margin-top: 16px;
		font-size: 0.95rem;
		color: var(--text-muted);
	}
	.big span {
		font-size: 2rem;
		font-weight: 700;
		color: var(--accent);
	}
	.method {
		margin-top: 14px;
		padding: 0;
		background: none;
		border: none;
		color: var(--accent);
		cursor: pointer;
		font: inherit;
		font-size: 0.85rem;
	}
	.method-body {
		margin-top: 8px;
		font-size: 0.8rem;
		color: var(--text-muted);
		line-height: 1.5;
	}
	.method-body p {
		margin: 0 0 8px;
	}
	.method-body p:last-child {
		margin-bottom: 0;
	}
	.chartside {
		min-width: 0;
	}
	.legend {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.82rem;
		color: var(--text-muted);
		margin-bottom: 4px;
	}
	.legend-mark {
		width: 20px;
		height: 2px;
		border-radius: 2px;
		background: var(--accent);
	}
	.chartwrap {
		position: relative;
		height: 320px;
		min-width: 0;
	}
	@media (max-width: 768px) {
		.conc {
			grid-template-columns: 1fr;
		}
	}
</style>
