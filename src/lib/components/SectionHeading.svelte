<script lang="ts">
	export let title: string;
	export let subtitle: string = '';
</script>
<div class="sh">
	<h2>{title}</h2>
	{#if subtitle}<p>{subtitle}</p>{/if}
</div>
<style>
	.sh { max-width: var(--maxw); margin: 40px auto 16px; padding: 0 24px; }
	h2 { margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text); }
	p { margin: 4px 0 0; font-size: 0.9rem; color: var(--text-muted); }
</style>
