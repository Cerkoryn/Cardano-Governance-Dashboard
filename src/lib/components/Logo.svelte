<script lang="ts">
	export let size = 38;
	export let darkMode = false;
</script>

<img
	class="logo"
	src={darkMode ? '/cardano-starburst-white.svg' : '/cardano-starburst-blue.svg'}
	alt="Cardano"
	style="height: {size}px"
/>

<style>
	.logo {
		display: block;
		width: auto;
		flex: none;
	}
</style>
