<script lang="ts">
	import Gauge from '$lib/components/Gauge.svelte';
	import TooltipIcon from '$lib/components/TooltipIcon.svelte';
	import type { Proposal, Chart } from '$lib/types/types';
	import { proposalDisplay } from '$lib/constants/display';
	export let proposal: Proposal;
	$: display = proposalDisplay[proposal.title] ?? { title: proposal.title, description: '' };
	$: total = proposal.charts.find((c) => c.title === 'Total');
	$: drep = proposal.charts.find((c) => c.title === 'dReps');
	$: spo = proposal.charts.find((c) => c.title === 'SPOs');
	$: cc = proposal.charts.find((c) => c.title === 'CC');
	let open = false;
	const gray = (c?: Chart) => !c || c.chartType === 'gray';
</script>
<div class="tc">
	<div class="ctx">
		<h4>{display.title} {#if total?.tooltipMessage}<TooltipIcon message={total.tooltipMessage} />{/if}</h4>
		<p>{display.description}</p>
		<div class="total">
			<span class="num">{total?.displayValue ?? '—'}</span>
			<span class="cap">total minimum actors</span>
		</div>
	</div>
	<div class="gauges">
		<Gauge value={gray(drep) ? 'N/A' : (drep?.displayValue ?? '—')} fillPercent={drep?.threshold ?? 0}
			label={gray(drep) ? 'Not required' : `${Math.round(drep?.threshold ?? 0)}% threshold`}
			accent="accent" disabled={gray(drep)} />
		<Gauge value={gray(spo) ? 'N/A' : (spo?.displayValue ?? '—')} fillPercent={spo?.threshold ?? 0}
			label={gray(spo) ? 'Not required' : `${Math.round(spo?.threshold ?? 0)}% threshold`}
			accent="positive" disabled={gray(spo)} />
		<Gauge value={gray(cc) ? 'N/A' : '5'} fillPercent={71.4285}
			label={gray(cc) ? 'Not required' : '5 of 7'}
			accent="warning" disabled={gray(cc)} />
	</div>
</div>
{#if total?.tooltipMessage}
	<button class="calc" on:click={() => (open = !open)}>{open ? '▾' : '▸'} View calculation</button>
	{#if open}<div class="calcbody">{@html total.tooltipMessage}</div>{/if}
{/if}
<style>
	.tc { display: grid; grid-template-columns: 280px 1fr; gap: var(--gap); padding: 20px; }
	.ctx h4 { margin: 0 0 6px; font-size: 1rem; color: var(--text); display: flex; gap: 6px; align-items: center; }
	.ctx p { margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; }
	.total { margin-top: 14px; }
	.total .num { font-size: 1.8rem; font-weight: 700; color: var(--accent-strong); }
	.total .cap { display: block; font-size: 0.78rem; color: var(--text-muted); }
	.gauges { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; align-items: end; }
	.calc { margin: 0 20px 16px; background: none; border: none; color: var(--accent); cursor: pointer; font-size: 0.85rem; padding: 0; }
	.calcbody { margin: 0 20px 16px; font-size: 0.82rem; color: var(--text-muted); line-height: 1.5; }
	@media (max-width: 768px) { .tc { grid-template-columns: 1fr; } }
</style>
