<script lang="ts">
	// epoch/lastUpdated are optional; populated once the backend persists them.
	// TODO(provenance): wire epoch + lastUpdated from get_* endpoints (see spec TODOs).
	export let epoch: number | undefined = undefined;
	export let lastUpdated: string | undefined = undefined;
</script>

<div class="prov">
	<div class="maxw">
		{#if epoch || lastUpdated}
			<span>Last updated:{epoch ? ` Epoch ${epoch}` : ''}{lastUpdated ? ` · ${lastUpdated}` : ''}</span>
			<span class="dot">·</span>
		{/if}
		<span>Data source: on-chain via <a href="https://koios.rest/" target="_blank" rel="noreferrer">Koios</a> + <a href="https://www.balanceanalytics.io/" target="_blank" rel="noreferrer">Balance Analytics</a></span>
	</div>
</div>

<style>
	.prov { background: var(--surface-2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
	.maxw { max-width: var(--maxw); margin: 0 auto; padding: 10px 24px; font-size: 0.82rem; color: var(--text-muted); display: flex; gap: 8px; flex-wrap: wrap; }
	a { color: var(--accent); text-decoration: none; }
	a:hover { text-decoration: underline; }
	.dot { opacity: 0.5; }
</style>
