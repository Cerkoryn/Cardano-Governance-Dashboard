<script lang="ts">
  import type { Dashboard } from '$lib/types/types';
  import { isStale } from '$lib/utils/calcs';
  export let data: Dashboard | null = null;
  export let now = Date.now();
  $: staleSources = data ? [
    { label: 'Governance', snapshot: data.governance },
    { label: 'Stake pools', snapshot: data.spo }
  ].filter(source => isStale(source.snapshot.updated_at, now)) : [];
  $: differentEpochs = data && data.spo.source_epochs.koios !== data.governance.source_epochs.koios;
</script>
{#if staleSources.length || differentEpochs}
  <aside aria-label="Data freshness notices" role="status">
    {#each staleSources as source}
      <p>{source.label}: Stale — refresh overdue</p>
    {/each}
    {#if differentEpochs}<p>Sources are from different chain epochs; comparisons are approximate.</p>{/if}
  </aside>
{/if}
<style>
  aside { max-width: var(--maxw); margin: 16px auto; padding: 0 24px; color: var(--critical); font-size: .9rem; font-weight: 600; }
  p { margin: 4px 0; }
</style>
