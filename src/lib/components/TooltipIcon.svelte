<script lang="ts">
  import { tick } from 'svelte';
  let { message = '' }: { message?: string } = $props();
  const id = $props.id();
  let open = $state(false);
  let button: HTMLButtonElement = $state()!;
  let tooltip: HTMLSpanElement = $state()!;
  let left = $state(8);
  let top = $state(8);
  async function show() {
    open = true;
    await tick();
    if (!open || !button || !tooltip) return;
    const rect = button.getBoundingClientRect();
    left = Math.max(8, Math.min(rect.left, window.innerWidth - tooltip.offsetWidth - 8));
    top = Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - tooltip.offsetHeight - 8));
  }
</script>
<svelte:window onscroll={() => open = false} onresize={() => open = false} onkeydown={(event) => { if (event.key === 'Escape') open = false; }} />
<button bind:this={button} type="button" class="help" aria-label="More information" aria-describedby={open ? id : undefined}
  onmouseenter={show} onmouseleave={() => open = false} onfocus={show} onblur={() => open = false}
  onclick={show}>?</button>
{#if open}<span bind:this={tooltip} {id} role="tooltip" style={`left:${left}px;top:${top}px`}>{message}</span>{/if}
<style>
  .help { border: 1px solid currentColor; border-radius: 50%; width: 24px; height: 24px; flex-shrink: 0; color: var(--text-muted); background: transparent; cursor: help; font: inherit; font-size: 14px; }
  [role=tooltip] { position: fixed; z-index: 100; width: max-content; max-width: min(280px, calc(100vw - 16px)); padding: 10px; border-radius: 6px; background: var(--text); color: var(--surface); font-size: 14px; line-height: 1.5; font-weight: 400; box-shadow: var(--shadow); pointer-events: none; }
</style>
