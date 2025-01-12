<script lang="ts">
    import { onMount } from 'svelte';
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
    export let message: string = '';
  
    let tooltipText: HTMLElement;
    let tooltipContainer: HTMLElement;
  
    const adjustTooltipPosition = () => {
      // Reset styles
      tooltipText.style.right = 'auto';
      tooltipText.style.left = '50%';
      tooltipText.style.transform = 'translateX(-50%)';
  
      const rect = tooltipText.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
  
      // Adjust horizontally
      if (rect.left < 0) {
        tooltipText.style.left = '0';
        tooltipText.style.transform = 'none';
      } else if (rect.right > viewportWidth) {
        tooltipText.style.right = '0';
        tooltipText.style.left = 'auto';
        tooltipText.style.transform = 'none';
      }
  
      // Adjust vertically if needed (e.g., if tooltip goes below the viewport)
      if (rect.bottom > viewportHeight) {
        tooltipText.style.top = 'auto';
        tooltipText.style.bottom = '125%';
      }
    };
  
    const showTooltip = () => {
      tooltipText.style.visibility = 'visible';
      tooltipText.style.opacity = '1';
      adjustTooltipPosition();
    };
  
    const hideTooltip = () => {
      tooltipText.style.visibility = 'hidden';
      tooltipText.style.opacity = '0';
      // Reset vertical position
      tooltipText.style.top = '125%';
      tooltipText.style.bottom = 'auto';
    };
  </script>
  
  <div
    class="tooltip-container"
    bind:this={tooltipContainer}
    on:mouseenter={showTooltip}
    on:mouseleave={hideTooltip}
    role="button"
    tabindex="0"
    aria-haspopup="true"
    aria-expanded="false"
  >
    <FontAwesomeIcon icon="{faQuestionCircle}" class="tooltip-icon" />
    <div class="tooltip-text" bind:this={tooltipText}>
      {@html message}
    </div>
  </div>
  
  <style>
    .tooltip-container {
      position: relative;
      display: inline-block;
      cursor: pointer;
      margin-left: 4px;
    }
  
    .tooltip-text {
      visibility: hidden;
      width: max-content;
      max-width: 200px;
      background-color: var(--tooltip-background-color, #333);
      color: var(--tooltip-text-color, #fff);
      text-align: left;
      border-radius: 6px;
      padding: 8px;
      position: absolute;
      z-index: 10;
      top: 125%;
      left: 50%;
      transform: translateX(-50%);
      opacity: 0;
      transition: opacity 0.3s;
      font-size: 14px;
      margin-top: 5px;
    }
  
    .tooltip-text::after {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      margin-left: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: var(--tooltip-background-color, #333) transparent transparent transparent;
      transform: translateY(-100%);
    }
  </style>