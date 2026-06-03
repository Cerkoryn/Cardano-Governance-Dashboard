<script lang="ts">
	import TooltipIcon from '$lib/components/TooltipIcon.svelte';
	export let label: string;
	export let value: string;
	export let subline: string = '';
	export let progress: number | null = null; // 0-100
	export let accent: 'accent' | 'positive' | 'warning' = 'accent';
	export let tooltip: string = '';
	$: barColor = `var(--${accent})`;
</script>
<div class="card">
	<div class="top">
		<span class="label">{label}</span>
		{#if tooltip}<TooltipIcon message={tooltip} />{/if}
	</div>
	<div class="value" style="color:{barColor}">{value}</div>
	{#if progress !== null}
		<div class="track"><div class="fill" style="width:{Math.min(100, progress)}%; background:{barColor}"></div></div>
	{/if}
	{#if subline}<div class="subline">{subline}</div>{/if}
</div>
<style>
	.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: 20px; display: flex; flex-direction: column; gap: 10px; }
	.top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
	.label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
	.value { font-size: 2.4rem; font-weight: 700; line-height: 1; }
	.track { height: 8px; border-radius: 999px; background: var(--neutral); overflow: hidden; }
	.fill { height: 100%; border-radius: 999px; }
	.subline { font-size: 0.8rem; color: var(--text-muted); }
</style>
