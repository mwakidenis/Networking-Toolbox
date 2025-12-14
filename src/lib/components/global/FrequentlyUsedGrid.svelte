<script lang="ts">
  import { frequentlyUsedTools } from '$lib/stores/toolUsage';
  import ToolsGrid from '$lib/components/global/ToolsGrid.svelte';
  import Icon from '$lib/components/global/Icon.svelte';

  export let hideOther: boolean = false;

  $: tools = $frequentlyUsedTools.map((tool, index) => ({
    href: tool.href,
    label: tool.label || 'Tool',
    description: tool.description || '',
    icon: tool.icon,
    keywords: [],
    animationDelay: index * 0.1,
  }));
</script>

{#if $frequentlyUsedTools.length > 0}
  <div class="frequently-used-container" aria-live="polite">
    <div class="frequently-used-header">
      <div class="tools-grid-sub-header">
        <Icon name="clock" size="md" />
        <h2>Most Used Tools</h2>
        <span class="count">{$frequentlyUsedTools.length}</span>
      </div>
    </div>

    <div class="frequently-used-grid">
      <ToolsGrid {tools} idPrefix="frequent" />
    </div>
  </div>
{:else if !hideOther}
  <div class="empty-frequently-used">
    <div class="empty-icon">
      <Icon name="clock" size="lg" />
    </div>
    <h3>No frequently used tools yet</h3>
    <p>Start using tools to see your most frequently accessed ones here</p>
  </div>
{/if}

<style lang="scss">
  .frequently-used-container {
    animation: slideIn 0.3s ease-out;
  }

  .frequently-used-grid {
    animation: subtleFadeIn 0.2s ease-out;

    :global(.tool-card) {
      animation: subtleSlideIn 0.3s ease-out forwards;
      opacity: 0;
    }
    :global(.tool-card:nth-child(1)) {
      animation-delay: 0.05s;
    }
    :global(.tool-card:nth-child(2)) {
      animation-delay: 0.1s;
    }
    :global(.tool-card:nth-child(3)) {
      animation-delay: 0.15s;
    }
    :global(.tool-card:nth-child(4)) {
      animation-delay: 0.2s;
    }
    :global(.tool-card:nth-child(5)) {
      animation-delay: 0.25s;
    }
    :global(.tool-card:nth-child(6)) {
      animation-delay: 0.3s;
    }
    :global(.tool-card:nth-child(n + 7)) {
      animation-delay: 0.35s;
    }
  }

  .empty-frequently-used {
    background: var(--bg-secondary);
    margin: var(--spacing-xl) auto;
    padding: var(--spacing-xl) var(--spacing-lg);
    border-radius: var(--radius-lg);
    text-align: center;
    opacity: 0.85;
    animation: fadeIn 0.2s ease;
    .empty-icon {
      :global(svg) {
        color: var(--text-secondary);
        opacity: 0.5;
      }
    }
    h3 {
      font-size: var(--font-size-lg);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-sm) 0;
    }
    p {
      color: var(--text-secondary);
      max-width: 24rem;
      margin: 0 auto;
      line-height: 1.5;
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes subtleFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes subtleSlideIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }
</style>
