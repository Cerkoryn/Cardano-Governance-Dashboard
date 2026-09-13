<script lang="ts">
  import type { Dashboard } from '$lib/types/types';
  import { isStale } from '$lib/utils/calcs';
  export let data: Dashboard | null = null;
  export let now = Date.now();
</script>
<aside class="prov" aria-label="Data provenance">
  <div class="maxw">
    <span>Sources: <a href="https://koios.rest/">Koios</a> and <a href="https://www.balanceanalytics.io/">Balance Analytics</a></span>
    {#if data}
      {#each [{ label: 'Governance', snapshot: data.governance }, { label: 'Stake pools', snapshot: data.spo }] as source}
        <span class:stale={isStale(source.snapshot.updated_at, now)}>
          {source.label}: <time datetime={source.snapshot.updated_at}>{new Date(source.snapshot.updated_at).toLocaleString()}</time>
          · {Object.entries(source.snapshot.source_epochs).map(([name, epoch]) => `${name} epoch ${epoch}`).join(' · ')}
          {#if isStale(source.snapshot.updated_at, now)} · Stale — refresh overdue{/if}
        </span>
      {/each}
      {#if data.spo.source_epochs.koios !== data.governance.source_epochs.koios}<span class="stale">Sources are from different chain epochs; comparisons are approximate.</span>{/if}
    {/if}
  </div>
</aside>
<style>
  .prov { background: var(--surface-2); border-block: 1px solid var(--border); }
  .maxw { max-width: var(--maxw); margin: 0 auto; padding: 10px 24px; font-size: .82rem; color: var(--text-muted); display: flex; gap: 8px; flex-direction: column; }
  a { color: var(--accent-strong); }
  .stale { color: var(--critical); font-weight: 600; }
</style>
