<script lang="ts">
  import Gauge from './Gauge.svelte';
  import type { Proposal } from '$lib/types/types';
  import { thresholdLabel, thresholdPercent } from '$lib/utils/calcs';
  export let proposal: Proposal;
  export let eligibleMembers: number;
  const display = (n: number | null) => n === null ? 'Unavailable' : n.toLocaleString();
  $: roles = [
    { name: 'dReps', key: 'drep', vote: proposal.drep, accent: 'accent' as const },
    { name: 'SPO groups', key: 'spo', vote: proposal.spo, accent: 'positive' as const },
    { name: 'CC members', key: 'cc', vote: proposal.cc, accent: 'warning' as const }
  ];
</script>
<article class="tc" aria-labelledby={`title-${proposal.id}`}>
  <div class="ctx">
    <h4 id={`title-${proposal.id}`}>{proposal.title}</h4>
    <p>{proposal.description}</p>
    <div class="total"><span class="num">{display(proposal.total)}</span><span class="cap">estimated voting positions{proposal.securityConditional ? ' without security changes' : ''}</span></div>
    {#if proposal.securityConditional}
      <div class="total security"><span class="num">{display(proposal.securityTotal)}</span><span class="cap">with security changes, including SPO groups</span></div>
    {/if}
  </div>
  <div class="gauges">
    {#each roles as role}
      <div>
        <Gauge id={`${proposal.id}-${role.key}`} roleName={role.name}
          value={role.vote.required ? (role.vote.count === null ? 'N/A' : String(role.vote.count)) : '—'}
          fillPercent={thresholdPercent(role.vote.threshold)} accent={role.accent} disabled={!role.vote.required}
          label={!role.vote.required ? 'Not required' : role.key === 'cc' && role.vote.count !== null ? `${role.vote.count} of ${eligibleMembers} · ${thresholdLabel(role.vote.threshold)}` : `${thresholdLabel(role.vote.threshold)} threshold`} />
        {#if role.key === 'spo' && proposal.securityConditional}<p class="note">Only for security changes</p>{/if}
        {#if role.vote.required && role.vote.count === null}<p class="note">{role.vote.reason}</p>{/if}
      </div>
    {/each}
  </div>
</article>
<style>
  .tc { display: grid; grid-template-columns: 280px 1fr; gap: var(--gap); padding: 20px; }
  .ctx h4 { margin: 0 0 6px; font-size: 1rem; color: var(--text); }
  .ctx p, .note { font-size: .85rem; color: var(--text-muted); line-height: 1.5; margin: 0; }
  .note { text-align: center; margin-top: 8px; font-size: .75rem; }
  .total { margin-top: 14px; }
  .num { font-size: 1.8rem; font-weight: 700; color: var(--accent-strong); }
  .security .num { font-size: 1.4rem; }
  .cap { display: block; font-size: .78rem; color: var(--text-muted); }
  .gauges { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; align-items: center; }
  @media (max-width: 768px) { .tc { grid-template-columns: 1fr; } }
</style>
