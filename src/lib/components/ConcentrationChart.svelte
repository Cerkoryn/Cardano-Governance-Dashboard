<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import Chart from 'chart.js/auto';
	import type { Plugin } from 'chart.js';
	import type { CumulativePoint } from '$lib/utils/calcs';
	export let series: CumulativePoint[] = [];
	export let minSPOsFor51: number | null;
	export let knownStakePercent: number | null;
	// Lets the chart restyle when the theme toggles (its colors are read from CSS tokens).
	export let darkMode = false;
	let canvas: HTMLCanvasElement;
	let chart: Chart<'line', number[], string> | null = null;

	// Explanatory diagram: show the leading SPOs around the 51% crossing rather than
	// the full long tail, so the crossing is readable (like the reference design).
	$: visibleCount = Math.min(series.length, Math.max(41, (minSPOsFor51 ?? 0) + 8));
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
			if (minSPOsFor51 === null) return;
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
			ctx.fillText(`${minSPOsFor51} groups`, bx + w / 2, by + 17);
			ctx.fillStyle = muted;
			ctx.font = '400 12px Inter, system-ui, sans-serif';
			ctx.fillText('reach 51%', bx + w / 2, by + 33);

			// marker dot at the crossing
			ctx.beginPath();
			ctx.arc(xN, point.y, 5.5, 0, Math.PI * 2);
			ctx.fillStyle = accent;
			ctx.fill();
			ctx.lineWidth = 2.5;
			ctx.strokeStyle = surface;
			ctx.stroke();
			ctx.restore();
		}
	};

	function applyThemeColors() {
		const instance = chart;
		if (!instance) return;
		instance.data.labels = visible.map(p => String(p.rank));
		instance.data.datasets[0].data = visible.map(p => p.cumulativePercent);
		const accent = cssVar('--accent');
		const muted = cssVar('--text-muted');
		instance.data.datasets[0].borderColor = accent;
		instance.data.datasets[0].backgroundColor = hexToRgba(accent, darkMode ? 0.18 : 0.1);
		const yScale = instance.options.scales?.y;
		const xScale = instance.options.scales?.x;
		if (yScale) {
			if (yScale.ticks) yScale.ticks.color = muted;
			if (yScale.grid) yScale.grid.color = cssVar('--border');
		}
		if (xScale) {
			if (xScale.ticks) xScale.ticks.color = muted;
			if (xScale.title) xScale.title.color = muted;
		}
		instance.update();
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
						tension: 0,
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
						title: { display: true, text: 'Identified operator groups', color: cssVar('--text-muted') },
						ticks: { color: cssVar('--text-muted'), maxTicksLimit: 9 },
						grid: { display: false }
					}
				},
				plugins: {
					legend: { display: false },
					tooltip: { callbacks: { label: (c) => `${(c.raw as number).toFixed(1)}% after ${c.label} groups` } }
				}
			},
			plugins: [marker]
		});
	});
	onDestroy(() => chart?.destroy());

	// Use a local Chart reference in the update function: mutating the Svelte
	// binding itself would schedule this effect again after tick().
	$: if (chart) {
		darkMode;
		visible;
		void tick().then(applyThemeColors);
	}

</script>

<div class="conc card-surface">
	<div class="conc-grid">
		<div class="explain">
      <h3>Identified operator groups reaching 51%</h3>
      <p>Known groups cover {knownStakePercent?.toFixed(1) ?? 'an unknown share'}% of reported delegated stake. This estimate uses those groups only and does not imply coordination.</p>
      <div class="big"><span>{minSPOsFor51 ?? 'N/A'}</span> {minSPOsFor51 === null ? '— identified groups cannot reach 51%' : 'groups reach 51%'}</div>
    </div>
		<div class="chartside">
			<div class="legend"><span class="legend-mark"></span> Cumulative Delegated Stake</div>
			<div class="chartwrap"><canvas bind:this={canvas} aria-label={`Cumulative delegated stake of identified operator groups. ${minSPOsFor51 === null ? "Identified groups cannot reach 51%." : `${minSPOsFor51} groups reach 51%.`} Full values are in the data table below.`}></canvas></div>
		</div>
	</div>
  <details class="method-body">
    <summary>Methodology and full chart data</summary>
    <p>Groups are ordered by stake, largest first. SINGLEPOOL is included in the denominator but excluded from the ranking: it combines many independent operators. The figure is not an exact minimum across every operator. The chart displays the leading {visibleCount} groups; the table includes all identified groups.</p>
    <table><caption>Cumulative share of all reported delegated stake</caption><thead><tr><th scope="col">Identified groups</th><th scope="col">Cumulative stake</th></tr></thead><tbody>{#each series as point}<tr><th scope="row">{point.rank}</th><td>{point.cumulativePercent.toFixed(2)}%</td></tr>{/each}</tbody></table>
  </details>
</div>

<style>
  summary { cursor: pointer; padding-top: 12px; }
  table { border-collapse: collapse; margin-top: 12px; }
  th, td { text-align: left; padding: 6px 16px 6px 0; }
	.conc {
		max-width: var(--maxw);
		margin: 0 auto;
		padding: 24px;
	}
	.conc-grid {
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
		.conc-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
