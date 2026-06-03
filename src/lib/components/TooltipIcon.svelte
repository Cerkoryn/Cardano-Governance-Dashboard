<script lang="ts">
  import { onMount } from 'svelte';

  export let message: string = '';

  let tooltipText: HTMLElement | null = null;
  let tooltipContainer: HTMLElement | null = null;

  const showTooltip = () => {
    if (tooltipText && tooltipContainer) {
      tooltipText.style.display = 'block';
      tooltipText.style.visibility = 'visible';
      tooltipText.style.opacity = '1';

      const rect = tooltipContainer.getBoundingClientRect();
      const tooltipRect = tooltipText.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      let left = rect.left + window.scrollX + rect.width / 2;

      // Adjust left position to keep tooltip within viewport
      if (left - tooltipRect.width / 2 < 0) {
        left = tooltipRect.width / 2 + 8; // Adding a small padding
      } else if (left + tooltipRect.width / 2 > viewportWidth) {
        left = viewportWidth - tooltipRect.width / 2 - 8; // Adding a small padding
      }

      tooltipText.style.top = `${rect.bottom + window.scrollY + 8}px`;
      tooltipText.style.left = `${left}px`;
      tooltipText.style.transform = 'translateX(-50%)';
    }
  };

  const hideTooltip = () => {
    if (tooltipText) {
      tooltipText.style.visibility = 'hidden';
      tooltipText.style.opacity = '0';
      tooltipText.style.display = 'none';
      tooltipText.style.top = '0';
      tooltipText.style.left = '0';
    }
  };

  onMount(() => {
    tooltipText = document.createElement('div');
    tooltipText.className = 'tooltip-text';
    tooltipText.innerHTML = message;
    document.body.appendChild(tooltipText);

    return () => {
      if (tooltipText && tooltipText.parentNode) {
        tooltipText.parentNode.removeChild(tooltipText);
      }
    };
  });
</script>

<div
  class="tooltip-container"
  bind:this={tooltipContainer}
  on:mouseenter={showTooltip}
  on:mouseleave={hideTooltip}
  on:focus={showTooltip}
  on:blur={hideTooltip}
  role="button"
  tabindex="0"
  aria-haspopup="true"
  aria-expanded="false"
>
  <svg class="tooltip-icon" width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14.5A6.5 6.5 0 1 1 8 1.5a6.5 6.5 0 0 1 0 13zM8 3.6c-1.45 0-2.4.83-2.4 2.05 0 .3.24.5.55.5.3 0 .5-.18.55-.45.1-.55.5-.86 1.2-.86.7 0 1.18.4 1.18.95 0 .47-.2.72-.86 1.12-.66.4-.96.83-.93 1.5l.01.27c.02.3.24.49.56.49.32 0 .54-.22.54-.55v-.1c0-.45.18-.68.87-1.1.7-.42 1.06-.9 1.06-1.68 0-1.13-.95-1.96-2.33-1.96zM8 11.9c.42 0 .73-.3.73-.7 0-.42-.31-.71-.73-.71-.42 0-.73.3-.73.7 0 .41.31.71.73.71z"/>
  </svg>
</div>

<style>  
  :global(.tooltip-text) {
    visibility: hidden;
    opacity: 0;
    width: max-content;
    max-width: 250px;
    background-color: var(--text);
    color: var(--surface);
    text-align: left;
    border-radius: 6px;
    padding: 8px;
    position: absolute;
    z-index: 10000;
    transition: opacity 0.3s, visibility 0.3s;
    pointer-events: none;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    top: 0;
    left: 0;
  }

  :global(.tooltip-text::after) {
    content: '';
    position: absolute;
    top: -5px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: transparent transparent var(--text) transparent;
  }
</style>