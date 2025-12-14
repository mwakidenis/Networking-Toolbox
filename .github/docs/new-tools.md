# Adding New Tools & Components

This guide covers creating new networking tools and components for the app. The process involves creating a Svelte component, adding it to the navigation, and integrating it with the app's systems.

## Tool Structure Overview

Tools in the app follow a consistent structure:

1. **Utility Functions** (`src/lib/utils/`) - Core calculation logic
2. **Tool Component** (`src/lib/components/tools/`) - UI and interaction
3. **Page Component** (`src/routes/section/tool-name/+page.svelte`) - Route wrapper
4. **Navigation Entry** (`src/lib/constants/nav.ts`) - Menu integration
5. **Tests** (`tests/unit/` and `tests/e2e/`) - Quality assurance

## Step-by-Step Guide

### 1. Create Utility Functions

Start by implementing the core business logic in `src/lib/utils/`:

```typescript
// src/lib/utils/my-network-tool.ts

export interface MyToolResult {
  input: string;
  output: string;
  details: string[];
}

export function calculateMyTool(input: string): MyToolResult {
  // Input validation
  if (!input || input.trim() === '') {
    throw new Error('Input is required');
  }

  // Core calculation logic
  const result = performCalculation(input);

  return {
    input: input.trim(),
    output: result,
    details: getCalculationDetails(result)
  };
}

function performCalculation(input: string): string {
  // Your calculation logic here
  return processedInput;
}
```

### 2. Create Tool Component

Implement the UI component in `src/lib/components/tools/`:

```svelte
<!-- src/lib/components/tools/MyNetworkTool.svelte -->
<script lang="ts">
  import { calculateMyTool, type MyToolResult } from '$lib/utils/my-network-tool.js';
  import { validateInput } from '$lib/utils/validation.js';
  import Tooltip from '$lib/components/global/Tooltip.svelte';
  import SvgIcon from '$lib/components/global/SvgIcon.svelte';
  import { tooltip } from '$lib/actions/tooltip.js';

  // Reactive state using Svelte 5 $state
  let input = $state('example-input');
  let result: MyToolResult | null = $state(null);
  let error = $state('');
  let isCalculating = $state(false);
  let hasEverShownResults = $state(false);

  // Reactive calculation using $effect
  $effect(() => {
    if (input && validateInput(input)) {
      isCalculating = true;
      try {
        result = calculateMyTool(input);
        error = '';
        if (!hasEverShownResults) {
          hasEverShownResults = true;
        }
      } catch (err) {
        error = err instanceof Error ? err.message : 'Calculation failed';
        result = null;
      } finally {
        isCalculating = false;
      }
    } else {
      result = null;
      error = '';
    }
  });

  // Clipboard functionality
  let copiedStates = $state<Record<string, boolean>>({});

  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      copiedStates[id] = true;
      setTimeout(() => { copiedStates[id] = false; }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
</script>

<div class="tool-container">
  <section class="input-section">
    <h2>My Network Tool</h2>
    <p>Description of what this tool does and how to use it.</p>

    <div class="input-group">
      <label for="tool-input">Input:</label>
      <input
        id="tool-input"
        type="text"
        bind:value={input}
        placeholder="Enter your input here"
        class="input-field"
        use:tooltip={{ content: "Helpful tooltip text" }}
      />
    </div>

    {#if error}
      <div class="error-message">
        <SvgIcon name="alert-circle" />
        {error}
      </div>
    {/if}
  </section>

  {#if result}
    <section class="results-section">
      <h3>Results</h3>

      <div class="result-item">
        <span class="label">Output:</span>
        <span class="value">{result.output}</span>
        <button
          class="copy-btn"
          onclick={() => copyToClipboard(result.output, 'output')}
        >
          <SvgIcon name={copiedStates.output ? 'check' : 'copy'} />
        </button>
      </div>

      {#if result.details.length > 0}
        <div class="details">
          <h4>Details:</h4>
          <ul>
            {#each result.details as detail}
              <li>{detail}</li>
            {/each}
          </ul>
        </div>
      {/if}
    </section>
  {/if}
</div>

<style lang="scss">
  .tool-container {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--spacing-lg);
  }

  .input-section {
    margin-bottom: var(--spacing-lg);

    h2 {
      color: var(--text-primary);
      margin-bottom: var(--spacing-sm);
    }

    p {
      color: var(--text-secondary);
      margin-bottom: var(--spacing-lg);
    }
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);

    label {
      font-weight: 500;
      color: var(--text-primary);
    }
  }

  .input-field {
    padding: var(--spacing-sm);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-family: var(--font-mono);

    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--color-error);
    margin-top: var(--spacing-sm);
    padding: var(--spacing-sm);
    background: color-mix(in srgb, var(--color-error), transparent 90%);
    border-radius: var(--radius-md);
  }

  .results-section {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: var(--spacing-lg);
    border: 1px solid var(--border-primary);
  }

  .result-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);

    .label {
      font-weight: 500;
      color: var(--text-secondary);
      min-width: 80px;
    }

    .value {
      font-family: var(--font-mono);
      color: var(--text-primary);
      flex: 1;
    }
  }

  .copy-btn {
    background: none;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    padding: var(--spacing-xs);
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: var(--surface-hover);
      color: var(--color-primary);
    }
  }

  .details {
    ul {
      list-style: none;
      padding: 0;

      li {
        padding: var(--spacing-xs) 0;
        color: var(--text-secondary);
        font-family: var(--font-mono);
        font-size: var(--font-size-sm);
      }
    }
  }
</style>
```

### 3. Create Page Route

Create the route file that wraps your component:

```svelte
<!-- src/routes/networking/my-tool/+page.svelte -->
<script lang="ts">
  import MyNetworkTool from '$lib/components/tools/MyNetworkTool.svelte';
  import '../../../styles/pages.scss';
</script>

<MyNetworkTool />
```

### 4. Add to Navigation

Update the navigation configuration in [`src/lib/constants/nav.ts`](https://github.com/Lissy93/networking-toolbox/blob/main/src/lib/constants/nav.ts):

```typescript
// Add to the appropriate section in SUB_NAV
{
  href: '/networking/my-tool',
  label: 'My Network Tool',
  description: 'Brief description of what the tool does',
  keywords: ['keyword1', 'keyword2', 'calculation', 'networking'],
  icon: 'calculator' // Choose from icon-map.ts
}
```

### 5. Add Icon (if needed)

If you need a custom icon, add it to [`src/lib/constants/icon-map.ts`](https://github.com/Lissy93/networking-toolbox/blob/main/src/lib/constants/icon-map.ts):

```typescript
export const iconMap: Record<string, string> = {
  // ... existing icons
  'my-tool-icon': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
    <!-- Your SVG path here -->
  </svg>`,
};
```

### 6. Write Tests

Create unit tests for your utility functions:

```typescript
// tests/unit/utils/my-network-tool.test.ts
import { describe, test, expect } from 'vitest';
import { calculateMyTool } from '$lib/utils/my-network-tool';

describe('My Network Tool', () => {
  test('should calculate correctly with valid input', () => {
    const result = calculateMyTool('valid-input');

    expect(result.input).toBe('valid-input');
    expect(result.output).toBeDefined();
    expect(result.details).toBeInstanceOf(Array);
  });

  test('should throw error with invalid input', () => {
    expect(() => calculateMyTool('')).toThrow('Input is required');
    expect(() => calculateMyTool('invalid')).toThrow();
  });

  test('should handle edge cases', () => {
    // Test boundary conditions
    const result = calculateMyTool('edge-case-input');
    expect(result.output).toBe('expected-output');
  });
});
```

Add E2E tests for the complete user flow:

```typescript
// tests/e2e/tools/my-network-tool.spec.ts
import { test, expect } from '@playwright/test';

test.describe('My Network Tool', () => {
  test('should calculate results when valid input provided', async ({ page }) => {
    await page.goto('/networking/my-tool');

    // Fill input
    await page.fill('input[id="tool-input"]', 'test-input');

    // Verify results appear
    await expect(page.locator('.results-section')).toBeVisible();
    await expect(page.locator('.result-item .value')).toContainText('expected-output');
  });

  test('should show error for invalid input', async ({ page }) => {
    await page.goto('/networking/my-tool');

    await page.fill('input[id="tool-input"]', 'invalid-input');

    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('should copy results to clipboard', async ({ page }) => {
    await page.goto('/networking/my-tool');

    await page.fill('input[id="tool-input"]', 'valid-input');
    await page.click('.copy-btn');

    // Verify copy success (check icon change)
    await expect(page.locator('.copy-btn svg')).toContainText('check');
  });
});
```

## Component Patterns & Best Practices

### State Management

Use Svelte 5's `$state` for reactive state:

```typescript
// Good: Reactive state
let input = $state('');
let result = $state(null);
let loading = $state(false);

// Good: Reactive calculations
$effect(() => {
  if (input) {
    loading = true;
    try {
      result = calculateSomething(input);
    } finally {
      loading = false;
    }
  }
});
```

### Input Validation

Implement consistent input validation:

```typescript
// Good: Comprehensive validation
function validateInput(input: string): ValidationResult {
  if (!input || input.trim() === '') {
    return { valid: false, error: 'Input is required' };
  }

  if (input.length > 1000) {
    return { valid: false, error: 'Input too long' };
  }

  if (!inputPattern.test(input)) {
    return { valid: false, error: 'Invalid format' };
  }

  return { valid: true };
}
```

### Error Handling

Provide meaningful error messages:

```typescript
// Good: Specific error messages
try {
  const result = complexCalculation(input);
  return result;
} catch (error) {
  if (error instanceof ValidationError) {
    throw new Error(`Invalid input: ${error.message}`);
  } else if (error instanceof CalculationError) {
    throw new Error(`Calculation failed: ${error.details}`);
  } else {
    throw new Error('An unexpected error occurred');
  }
}
```

### Accessibility

Ensure your tools are accessible:

```svelte
<!-- Good: Accessible form -->
<div class="input-group">
  <label for="cidr-input">CIDR Network:</label>
  <input
    id="cidr-input"
    type="text"
    bind:value={input}
    aria-describedby="cidr-help"
    aria-invalid={!!error}
  />
  <div id="cidr-help" class="help-text">
    Enter a CIDR notation like 192.168.1.0/24
  </div>
  {#if error}
    <div class="error" role="alert" aria-live="polite">
      {error}
    </div>
  {/if}
</div>
```

### Performance

Optimize for large calculations:

```typescript
// Good: Debounced calculations
let debounceTimer: number;

$effect(() => {
  clearTimeout(debounceTimer);

  if (input) {
    debounceTimer = setTimeout(() => {
      performExpensiveCalculation(input);
    }, 300);
  }
});
```

## Integration Checklist

Before submitting your new tool:

- [ ] **Utility functions** tested with 85%+ coverage
- [ ] **Component** follows Svelte 5 patterns
- [ ] **Navigation** entry added with appropriate keywords
- [ ] **Icon** available (existing or custom)
- [ ] **E2E tests** cover main user flows
- [ ] **Error handling** provides helpful messages
- [ ] **Accessibility** features implemented
- [ ] **Documentation** includes usage examples
- [ ] **Performance** optimized for typical inputs

## Common Patterns

### IP Address Tools

```typescript
// Pattern for IP-related tools
export function validateIPAddress(ip: string): boolean {
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}
```

### CIDR Tools

```typescript
// Pattern for CIDR-related tools
export function parseCIDR(cidr: string): { ip: string; prefix: number } {
  const [ip, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr, 10);

  if (!validateIPAddress(ip) || prefix < 0 || prefix > 32) {
    throw new Error('Invalid CIDR notation');
  }

  return { ip, prefix };
}
```

### DNS Tools

```typescript
// Pattern for DNS-related tools
export function validateDomain(domain: string): boolean {
  const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainPattern.test(domain) && domain.length <= 253;
}
```

Your new tool will automatically integrate with:
- **Global search** - Keywords make it discoverable
- **Bookmarks system** - Users can save favourite tools
- **Accessibility** - CSS variables and ARIA support
- **Offline mode** - Service worker caching
- **Theme system** - CSS variables adapt to all themes

IPv6 addresses can contain up to 39 characters in their compressed form. Consider this when designing input validation for IPv6-related tools.