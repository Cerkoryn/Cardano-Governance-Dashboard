<script lang="ts">
	export let size = 36;
</script>

<svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" class="logo">
	<!-- outer ring: 12 dots -->
	<g fill="var(--accent)">
		<circle cx="34" cy="20" r="1.5" />
		<circle cx="32.12" cy="27" r="1.5" />
		<circle cx="27" cy="32.12" r="1.5" />
		<circle cx="20" cy="34" r="1.5" />
		<circle cx="13" cy="32.12" r="1.5" />
		<circle cx="7.88" cy="27" r="1.5" />
		<circle cx="6" cy="20" r="1.5" />
		<circle cx="7.88" cy="13" r="1.5" />
		<circle cx="13" cy="7.88" r="1.5" />
		<circle cx="20" cy="6" r="1.5" />
		<circle cx="27" cy="7.88" r="1.5" />
		<circle cx="32.12" cy="13" r="1.5" />
	</g>
	<!-- inner ring: 6 dots + center -->
	<g fill="var(--accent-strong)">
		<circle cx="27" cy="20" r="2" />
		<circle cx="23.5" cy="26.06" r="2" />
		<circle cx="16.5" cy="26.06" r="2" />
		<circle cx="13" cy="20" r="2" />
		<circle cx="16.5" cy="13.94" r="2" />
		<circle cx="23.5" cy="13.94" r="2" />
		<circle cx="20" cy="20" r="2.4" />
	</g>
</svg>

<style>
	.logo {
		display: block;
		flex: none;
	}
</style>
