# Navigation & User Customization

The app provides extensive customization options allowing users to tailor their experience through themes, bookmarks, accessibility settings, and navigation preferences.

## Navigation System

### Core Navigation Structure

The navigation is centrally managed in [`src/lib/constants/nav.ts`](https://github.com/Lissy93/networking-toolbox/blob/main/src/lib/constants/nav.ts), providing a hierarchical structure for the app's 100+ tools.

```typescript
// Main navigation sections
export const TOP_NAV = [
  { href: '/subnetting', label: 'Subnetting', icon: 'Calculator' },
  { href: '/cidr', label: 'CIDR', icon: 'Network' },
  { href: '/ip-address-convertor', label: 'IP Tools', icon: 'Shuffle' },
  // ... other sections
];

// Individual tools
export const SUB_NAV = [
  { href: '/subnetting/ipv4-subnet-calculator', label: 'IPv4 Subnet Calculator' },
  // ... 100+ other tools
];
```

### Path Resolution

The `makePath()` function handles dynamic base path resolution for various deployment scenarios:

```typescript
import { resolve } from '$app/paths';

export const makePath = (path: string): string => {
  return resolve(path);
};
```

This ensures the app works correctly when deployed on:
- Root domains (`example.com`)
- Subdomains (`tools.example.com`)
- Subdirectories (`example.com/networking-tools/`)

### Navigation Utilities

The nav.ts file provides several utility functions:

| Function | Purpose |
|----------|---------|
| `getPageDetails(href)` | Get tool metadata by URL |
| `extractAllNavItems()` | Flatten navigation into single array |
| `isActive(current, target)` | Check if navigation item is active |
| `findSectionKey(href)` | Determine which section a tool belongs to |

## User Customization Features

### Bookmarks System

Users can bookmark frequently used tools for quick access via [`src/lib/stores/bookmarks.ts`](https://github.com/Lissy93/networking-toolbox/blob/main/src/lib/stores/bookmarks.ts).

#### Bookmark Management

```typescript
import { bookmarks } from '$lib/stores/bookmarks';

// Add a bookmark
bookmarks.add({
  href: '/subnetting/ipv4-subnet-calculator',
  label: 'IPv4 Calculator',
  description: 'Calculate subnet details',
  icon: 'Calculator'
});

// Remove bookmark
bookmarks.remove('/subnetting/ipv4-subnet-calculator');

// Toggle bookmark status
bookmarks.toggle(tool);

// Check if bookmarked
const isBookmarked = bookmarks.isBookmarked(href, $bookmarks);
```

#### Offline Integration

Bookmarks automatically integrate with the offline system:
- **Automatic caching** - Bookmarked tools are cached for offline access
- **Service worker integration** - Background caching without blocking UI
- **Bulk operations** - All existing bookmarks cached on app initialization

### Theme Customization

The theming system (detailed in [theming.md](./theming.md)) provides 11 built-in themes:

```typescript
import { theme } from '$lib/stores/theme';

// Set theme
theme.setTheme('cyberpunk');

// Get available themes
const allThemes = theme.getAvailableThemes();

// Check theme properties
const isDark = theme.isDark($theme);
```

### Accessibility Settings

The app includes comprehensive accessibility options via [`src/lib/stores/accessibility.ts`](https://github.com/Lissy93/networking-toolbox/blob/main/src/lib/stores/accessibility.ts).

#### Available Options

The accessibility system provides 8 customization options across 4 categories:

<details>
<summary><strong>Visual Options</strong></summary>

- **High contrast** - Increased visual contrast
- **Large text** - Larger font sizes across the app
- **Always underline links** - Persistent link underlines
- **Hide decorative icons** - Reduce visual clutter
- **Dark mode high contrast** - Extra contrast for dark themes

</details>

<details>
<summary><strong>Motion Options</strong></summary>

- **Reduce motion** - Minimize animations and transitions

</details>

<details>
<summary><strong>Reading Options</strong></summary>

- **Dyslexia-friendly font** - Uses OpenDyslexic font for better readability

</details>

<details>
<summary><strong>Interaction Options</strong></summary>

- **Enhanced focus indicators** - More visible keyboard focus

</details>

#### System Preference Detection

The accessibility system automatically detects and respects system preferences:

```typescript
// Automatically enables reduced motion based on system preference
systemPreference: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

#### CSS Integration

Accessibility options apply via CSS classes on the document root:

```scss
.reduce-motion * {
  animation-duration: 0.001ms !important;
  transition-duration: 0.001ms !important;
}

.contrast-high {
  --text-primary: #ffffff;
  --bg-primary: #000000;
}

.scale-large {
  font-size: 1.25em;
}

.dyslexia-font {
  font-family: 'OpenDyslexic', monospace !important;
}
```

### Navigation Display Options

Users can customize the top navigation bar appearance via [`src/lib/stores/navbarDisplay.ts`](https://github.com/Lissy93/networking-toolbox/blob/main/src/lib/stores/navbarDisplay.ts).

#### Display Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **Default** | Show all navigation sections | First-time users, browsing |
| **Bookmarked** | Show only bookmarked tools | Power users with favourites |
| **Frequent** | Show most-used tools | Regular users |
| **None** | Hide navigation links | Minimal interface preference |

```typescript
import { navbarDisplay } from '$lib/stores/navbarDisplay';

// Set navigation mode
navbarDisplay.setMode('bookmarked');

// Get current mode info
const currentOption = navbarDisplay.getOption($navbarDisplay);
```

## Global Search

The search system (`src/lib/components/global/GlobalSearch.svelte`) provides comprehensive tool discovery.

### Search Capabilities

- **Real-time filtering** - Instant results as you type
- **Multi-field matching** - Searches labels, descriptions, and keywords
- **Keyboard navigation** - Arrow keys and Enter support
- **Category filtering** - Filter by tool sections

### Search Algorithm

The search uses a weighted scoring system:

```typescript
// Exact label match (highest priority)
if (item.label.toLowerCase() === query.toLowerCase()) score += 100;

// Label starts with query
if (item.label.toLowerCase().startsWith(query.toLowerCase())) score += 50;

// Description contains query
if (item.description?.toLowerCase().includes(query.toLowerCase())) score += 20;

// Keywords match
item.keywords?.forEach(keyword => {
  if (keyword.toLowerCase().includes(query.toLowerCase())) score += 10;
});
```

### Keyboard Shortcuts

The search supports full keyboard navigation:

- <kbd>Cmd/Ctrl</kbd> + <kbd>K</kbd> - Open search
- <kbd>↑</kbd> / <kbd>↓</kbd> - Navigate results
- <kbd>Enter</kbd> - Select result
- <kbd>Esc</kbd> - Close search

## Tool Usage Tracking

The app tracks tool usage to power the "frequently used" features via [`src/lib/stores/toolUsage.ts`](https://github.com/Lissy93/networking-toolbox/blob/main/src/lib/stores/toolUsage.ts).

### Usage Analytics

```typescript
import { toolUsage } from '$lib/stores/toolUsage';

// Record tool usage
toolUsage.recordUsage('/subnetting/ipv4-subnet-calculator');

// Get frequently used tools
const frequentTools = toolUsage.getFrequentlyUsed($toolUsage, 5);

// Get usage statistics
const stats = toolUsage.getUsageStats($toolUsage, '/some-tool');
```

### Privacy-First Design

The usage tracking is designed with privacy in mind:
- **Local storage only** - Data never leaves the user's device
- **Anonymous** - No personally identifiable information
- **Aggregated** - Only tool paths and usage counts
- **User controlled** - Can be cleared or disabled

## Offline Functionality

The app includes comprehensive offline support through service workers and caching strategies.

### Offline Features

- **Tool caching** - Bookmarked tools automatically cached
- **Offline indicator** - Visual indicator when offline
- **Background sync** - Updates when connection restored
- **Asset caching** - Static assets cached for performance

### Service Worker Integration

The offline system integrates with user preferences:

```typescript
// Cache bookmarked tools for offline access
export const cacheBookmark = async (href: string) => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.active?.postMessage({
        type: 'CACHE_TOOL',
        url: href
      });
    });
  }
};
```

## Settings Persistence

All user preferences are automatically persisted to localStorage with graceful fallbacks:

### Storage Keys

| Setting | Key | Default |
|---------|-----|---------|
| Theme | `theme` | `'dark'` |
| Bookmarks | `bookmarked-tools` | `[]` |
| Accessibility | `accessibility-settings` | System preferences |
| Navigation | `navbar-display` | `'default'` |
| Tool Usage | `tool-usage` | `{}` |

### Error Handling

The stores include robust error handling:

```typescript
// Graceful localStorage failure handling
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  return JSON.parse(stored);
} catch {
  return defaultValue; // Fallback to defaults
}
```

## Integration Examples

### Complete Settings Component

```svelte
<script>
  import { theme } from '$lib/stores/theme';
  import { accessibility } from '$lib/stores/accessibility';
  import { navbarDisplay } from '$lib/stores/navbarDisplay';

  // Reactive declarations for all settings
  $: currentTheme = $theme;
  $: a11ySettings = $accessibility;
  $: navMode = $navbarDisplay;
</script>

<!-- Theme selector -->
<select bind:value={currentTheme} on:change={() => theme.setTheme(currentTheme)}>
  {#each theme.getAvailableThemes() as themeOption}
    <option value={themeOption.id}>{themeOption.name}</option>
  {/each}
</select>

<!-- Accessibility options -->
{#each a11ySettings.options as option}
  <label>
    <input
      type="checkbox"
      checked={option.enabled}
      on:change={() => accessibility.toggle(option.id)}
    />
    {option.name}
  </label>
{/each}

<!-- Navigation mode -->
<select bind:value={navMode} on:change={() => navbarDisplay.setMode(navMode)}>
  {#each navbarDisplay.getAllOptions() as option}
    <option value={option.id}>{option.name}</option>
  {/each}
</select>
```

This comprehensive customization system ensures users can tailor the networking toolbox to their specific needs and preferences while maintaining accessibility and performance.