<script lang="ts">
  import { isOnline, isOfflineCapable, isDownloadableTool } from '$lib/stores/offline';
  import { page } from '$app/stores';
  import { resolve } from '$app/paths';
  import Icon from '$lib/components/global/Icon.svelte';

  $: currentPath = $page.url?.pathname ?? '/';
  $: isOfflinePage = currentPath === '/offline';
  $: isActualTool = isDownloadableTool(currentPath);
  $: worksOffline = isOfflineCapable(currentPath);

  // Determine message and properties
  $: messageData = isOfflinePage
    ? { message: 'Currently offline. Awaiting internet connection...', showLink: false, isError: false }
    : isActualTool
      ? { message: 'You are offline. This tool has been downloaded.', showLink: false, isError: false }
      : !worksOffline
        ? { message: 'This tool may not function correctly without network access', showLink: false, isError: true }
        : { message: 'Offline, limited functionality available.', showLink: true, isError: false };

  $: message = messageData.message;
  $: showOfflineLink = messageData.showLink;
  $: isError = messageData.isError;
</script>

{#if !$isOnline}
  <div class="offline-indicator" class:error={isError}>
    <Icon name="offline" size="sm" />
    <span>{message}</span>
    {#if showOfflineLink}
      <a href={resolve('/offline')}>View tools</a>
    {/if}
    <button onclick={(e) => e.currentTarget.parentElement?.remove()}>✕</button>
  </div>
{/if}

<style lang="scss">
  .offline-indicator {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: 0.9rem;
    text-align: center;
    backdrop-filter: blur(8px);
    background: color-mix(in srgb, var(--color-warning), transparent 85%);
    border-bottom: 1px solid color-mix(in srgb, var(--color-warning), transparent 70%);
    color: var(--color-warning);
    animation: slideDown 0.3s ease-out;
    backdrop-filter: blur(12px) saturate(120%);

    &.error {
      background: color-mix(in srgb, var(--color-error), transparent 85%);
      border-bottom-color: color-mix(in srgb, var(--color-error), transparent 70%);
      color: var(--color-error);
    }

    a {
      color: inherit;
      text-decoration: underline;
      font-weight: 500;

      &:hover {
        text-decoration: none;
      }
    }

    button {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: var(--spacing-2xs);
      border-radius: var(--radius-sm);
      margin-left: auto;
      transition: background-color 0.2s;

      &:hover {
        background: color-mix(in srgb, currentColor, transparent 85%);
      }
    }
  }

  @keyframes slideDown {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    .offline-indicator {
      font-size: 0.85rem;
      padding: var(--spacing-sm);
    }
  }
</style>
