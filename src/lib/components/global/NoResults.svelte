<script lang="ts">
  import Icon from '$lib/components/global/Icon.svelte';

  export let searchQuery: string = '';
</script>

<div class="no-results-card">
  <div class="no-results-content">
    <Icon name="search-x" size="lg" />
    <h3>No tools found</h3>
    <p>
      {#if searchQuery}
        No results found for <strong>"{searchQuery}"</strong>
      {:else}
        Try a different search term
      {/if}
    </p>
    <div class="suggestions">
      <h4>Try searching for:</h4>
      <div class="suggestion-tags">
        <button
          class="suggestion-tag"
          onclick={() => window.dispatchEvent(new CustomEvent('search-suggestion', { detail: 'subnet' }))}
        >
          subnet
        </button>
        <button
          class="suggestion-tag"
          onclick={() => window.dispatchEvent(new CustomEvent('search-suggestion', { detail: 'cidr' }))}
        >
          cidr
        </button>
        <button
          class="suggestion-tag"
          onclick={() => window.dispatchEvent(new CustomEvent('search-suggestion', { detail: 'ipv6' }))}
        >
          ipv6
        </button>
        <button
          class="suggestion-tag"
          onclick={() => window.dispatchEvent(new CustomEvent('search-suggestion', { detail: 'converter' }))}
        >
          converter
        </button>
        <button
          class="suggestion-tag"
          onclick={() => window.dispatchEvent(new CustomEvent('search-suggestion', { detail: 'calculator' }))}
        >
          calculator
        </button>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  .no-results-card {
    max-width: 600px;
    margin: var(--spacing-xl) auto;
    padding: var(--spacing-xl);
    text-align: center;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }

  .no-results-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
  }

  :global(.no-results-icon) {
    color: var(--text-secondary);
    opacity: 0.7;
  }

  h3 {
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  p {
    color: var(--text-secondary);
    font-size: var(--font-size-md);
    line-height: 1.6;
    margin: 0;

    strong {
      color: var(--color-primary);
      font-weight: 600;
    }
  }

  .suggestions {
    margin-top: var(--spacing-lg);
    width: 100%;

    h4 {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 var(--spacing-md) 0;
    }
  }

  .suggestion-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    justify-content: center;
  }

  .suggestion-tag {
    padding: var(--spacing-xs) var(--spacing-md);
    background-color: var(--bg-tertiary);
    border: 1px solid var(--border-secondary);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    font-family: var(--font-mono);
    cursor: pointer;
    transition: all var(--transition-fast);

    &:hover {
      background-color: var(--surface-hover);
      border-color: var(--color-primary);
      color: var(--color-primary);
      transform: translateY(-1px);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    &:active {
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    .no-results-card {
      padding: var(--spacing-lg);
      margin: var(--spacing-lg) auto;
    }

    .suggestion-tags {
      justify-content: center;
    }
  }
</style>
