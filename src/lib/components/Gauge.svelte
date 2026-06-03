<script lang="ts">
	export let value: string;            // center number, e.g. "25" or "N/A"
	export let fillPercent: number = 0;  // arc fill = governance threshold %
	export let label: string = '';       // e.g. "67% threshold"
	export let accent: 'accent' | 'positive' | 'warning' = 'accent';
	export let disabled: boolean = false;
	const R = 50;
	const HALF = Math.PI * R;
	$: dash = `${(Math.max(0, Math.min(100, fillPercent)) / 100) * HALF} ${HALF}`;
	$: stroke = disabled ? 'var(--neutral)' : `var(--${accent})`;
</script>
<div class="gauge" class:disabled>
	<svg viewBox="0 0 120 70" width="120" height="70">
		<path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="var(--neutral)" stroke-width="12" stroke-linecap="round" />
		{#if !disabled}
			<path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke={stroke} stroke-width="12" stroke-linecap="round" stroke-dasharray={dash} />
		{/if}
		<text x="60" y="54" text-anchor="middle" class="val" fill={disabled ? 'var(--text-muted)' : 'var(--text)'}>{value}</text>
	</svg>
	{#if label}<div class="label">{label}</div>{/if}
</div>
<style>
	.gauge { display: flex; flex-direction: column; align-items: center; gap: 4px; }
	.val { font-size: 22px; font-weight: 700; }
	.label { font-size: 0.78rem; color: var(--text-muted); }
	.disabled .label { opacity: 0.8; }
</style>
