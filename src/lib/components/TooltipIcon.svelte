<script lang="ts">
  import { onMount } from 'svelte';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

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
  <FontAwesomeIcon icon={faQuestionCircle} class="tooltip-icon" />
</div>

<style>  
  :global(.tooltip-text) {
    visibility: hidden;
    opacity: 0;
    width: max-content;
    max-width: 250px;
    background-color: var(--tooltip-background-color, #333);
    color: var(--tooltip-text-color, #fff);
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
    border-color: transparent transparent var(--tooltip-background-color, #333) transparent;
  }
</style>