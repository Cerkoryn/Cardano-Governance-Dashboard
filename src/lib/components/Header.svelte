<script lang="ts">
	import TooltipIcon from '$lib/components/TooltipIcon.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import { includeInactiveDReps } from '$lib/stores/stores';
	import { SITE_NAME, SITE_TAGLINE } from '$lib/constants/display';
	export let darkMode: boolean;
	export let toggleTheme: () => void;
	const HELP = 'These charts show the smallest number of entities that could collectively meet or exceed the required threshold for each Cardano governance action (a Minimum Attack Vector / Nakamoto-style metric).';
</script>

<header class="header">
	<div class="brand">
		<Logo size={38} />
		<span class="name">{SITE_NAME}</span>
		<span class="divider" aria-hidden="true"></span>
		<p class="tagline">{SITE_TAGLINE}</p>
	</div>
	<div class="controls">
		<span class="help">What do these charts mean? <TooltipIcon message={HELP} /></span>
		<label class="toggle">
			<input type="checkbox" bind:checked={$includeInactiveDReps} />
			Include inactive dReps
		</label>
		<button class="theme" on:click={toggleTheme} aria-label="Toggle theme">
			{#if darkMode}
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></svg>
			{:else}
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
			{/if}
		</button>
	</div>
</header>

<style>
	.header {
		display: flex; align-items: center; justify-content: space-between;
		gap: var(--gap); flex-wrap: wrap;
		max-width: var(--maxw); margin: 0 auto; padding: 20px 24px;
	}
	.brand { display: flex; align-items: center; gap: 14px; }
	.name { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.01em; color: var(--accent-strong); }
	.divider { width: 1px; align-self: stretch; min-height: 34px; background: var(--border); }
	.tagline { margin: 0; font-size: 0.85rem; line-height: 1.3; color: var(--text-muted); max-width: 240px; }
	.controls { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
	.help { display: inline-flex; align-items: center; gap: 6px; font-size: 0.9rem; color: var(--accent); cursor: default; }
	.toggle { display: inline-flex; align-items: center; gap: 8px; font-size: 0.9rem; color: var(--text-muted); }
	.theme { background: none; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 6px; color: var(--text); cursor: pointer; line-height: 0; }
	.theme:hover { background: var(--surface-2); }
	@media (max-width: 768px) {
		.header { flex-direction: column; align-items: flex-start; }
	}
</style>
