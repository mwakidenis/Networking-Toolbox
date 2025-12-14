import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import type { ToolUsage } from '../../../../src/lib/stores/toolUsage';

// Mock browser environment
vi.mock('$app/environment', () => ({
  browser: true,
}));

describe('toolUsage store', () => {
  let mockLocalStorage: Record<string, string> = {};
  let mockDateNow: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset localStorage mock
    mockLocalStorage = {};

    global.localStorage = {
      getItem: (key: string) => mockLocalStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockLocalStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockLocalStorage[key];
      },
      clear: () => {
        mockLocalStorage = {};
      },
      length: Object.keys(mockLocalStorage).length,
      key: (index: number) => Object.keys(mockLocalStorage)[index] || null,
    } as Storage;

    // Mock Date.now()
    mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(1000000);

    // Clear module cache to reset store
    vi.resetModules();
  });

  it('initializes with empty object when no stored data', async () => {
    const { toolUsage } = await import('../../../../src/lib/stores/toolUsage');
    const value = get(toolUsage);
    expect(value).toEqual({});
  });

  it('initializes with stored data from localStorage', async () => {
    const storedUsage: ToolUsage = {
      '/tool1': { count: 5, lastVisited: 1000, label: 'Tool 1' },
      '/tool2': { count: 3, lastVisited: 2000, label: 'Tool 2' },
    };
    mockLocalStorage['networking-toolbox-tool-usage'] = JSON.stringify(storedUsage);

    const { toolUsage } = await import('../../../../src/lib/stores/toolUsage');
    const value = get(toolUsage);
    expect(value).toEqual(storedUsage);
  });

  it('handles invalid JSON in localStorage gracefully', async () => {
    mockLocalStorage['networking-toolbox-tool-usage'] = 'invalid json {';
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { toolUsage } = await import('../../../../src/lib/stores/toolUsage');
    const value = get(toolUsage);
    expect(value).toEqual({});
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('tracks first visit to a tool', async () => {
    const { toolUsage } = await import('../../../../src/lib/stores/toolUsage');

    toolUsage.trackVisit('/test-tool', 'Test Tool', 'icon', 'Description');

    const value = get(toolUsage);
    expect(value['/test-tool']).toEqual({
      count: 1,
      lastVisited: 1000000,
      label: 'Test Tool',
      icon: 'icon',
      description: 'Description',
    });
  });

  it('increments count on subsequent visits', async () => {
    const { toolUsage } = await import('../../../../src/lib/stores/toolUsage');

    toolUsage.trackVisit('/test-tool', 'Test Tool');
    mockDateNow.mockReturnValue(2000000);
    toolUsage.trackVisit('/test-tool');

    const value = get(toolUsage);
    expect(value['/test-tool'].count).toBe(2);
    expect(value['/test-tool'].lastVisited).toBe(2000000);
  });

  it('updates metadata on subsequent visits', async () => {
    const { toolUsage } = await import('../../../../src/lib/stores/toolUsage');

    toolUsage.trackVisit('/test-tool', 'Old Label', 'old-icon');
    toolUsage.trackVisit('/test-tool', 'New Label', 'new-icon', 'New Description');

    const value = get(toolUsage);
    expect(value['/test-tool'].label).toBe('New Label');
    expect(value['/test-tool'].icon).toBe('new-icon');
    expect(value['/test-tool'].description).toBe('New Description');
  });

  it('saves to localStorage after tracking visit', async () => {
    const { toolUsage } = await import('../../../../src/lib/stores/toolUsage');

    toolUsage.trackVisit('/test-tool', 'Test Tool');

    const stored = mockLocalStorage['networking-toolbox-tool-usage'];
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored);
    expect(parsed['/test-tool']).toBeDefined();
  });

  it('removes a specific tool from usage', async () => {
    const storedUsage: ToolUsage = {
      '/tool1': { count: 5, lastVisited: 1000 },
      '/tool2': { count: 3, lastVisited: 2000 },
    };
    mockLocalStorage['networking-toolbox-tool-usage'] = JSON.stringify(storedUsage);

    const { toolUsage } = await import('../../../../src/lib/stores/toolUsage');
    toolUsage.remove('/tool1');

    const value = get(toolUsage);
    expect(value['/tool1']).toBeUndefined();
    expect(value['/tool2']).toBeDefined();
  });

  it('clears all usage data', async () => {
    const storedUsage: ToolUsage = {
      '/tool1': { count: 5, lastVisited: 1000 },
      '/tool2': { count: 3, lastVisited: 2000 },
    };
    mockLocalStorage['networking-toolbox-tool-usage'] = JSON.stringify(storedUsage);

    const { toolUsage } = await import('../../../../src/lib/stores/toolUsage');
    toolUsage.clear();

    const value = get(toolUsage);
    expect(value).toEqual({});
    expect(mockLocalStorage['networking-toolbox-tool-usage']).toBeUndefined();
  });

  it('init loads data from localStorage', async () => {
    const storedUsage: ToolUsage = {
      '/tool1': { count: 5, lastVisited: 1000 },
    };
    mockLocalStorage['networking-toolbox-tool-usage'] = JSON.stringify(storedUsage);

    const { toolUsage } = await import('../../../../src/lib/stores/toolUsage');
    toolUsage.init();

    const value = get(toolUsage);
    expect(value).toEqual(storedUsage);
  });

  describe('frequentlyUsedTools derived store', () => {
    it('filters tools by threshold visits', async () => {
      const storedUsage: ToolUsage = {
        '/tool1': { count: 5, lastVisited: 1000, label: 'Tool 1' },
        '/tool2': { count: 3, lastVisited: 2000, label: 'Tool 2' }, // Below threshold
        '/tool3': { count: 10, lastVisited: 3000, label: 'Tool 3' },
      };
      mockLocalStorage['networking-toolbox-tool-usage'] = JSON.stringify(storedUsage);

      const { frequentlyUsedTools } = await import('../../../../src/lib/stores/toolUsage');
      const value = get(frequentlyUsedTools);

      expect(value).toHaveLength(2);
      expect(value[0].href).toBe('/tool3'); // Highest count first
      expect(value[1].href).toBe('/tool1');
    });

    it('sorts by count in descending order', async () => {
      const storedUsage: ToolUsage = {
        '/tool1': { count: 5, lastVisited: 1000, label: 'Tool 1' },
        '/tool2': { count: 10, lastVisited: 2000, label: 'Tool 2' },
        '/tool3': { count: 7, lastVisited: 3000, label: 'Tool 3' },
      };
      mockLocalStorage['networking-toolbox-tool-usage'] = JSON.stringify(storedUsage);

      const { frequentlyUsedTools } = await import('../../../../src/lib/stores/toolUsage');
      const value = get(frequentlyUsedTools);

      expect(value[0].count).toBe(10);
      expect(value[1].count).toBe(7);
      expect(value[2].count).toBe(5);
    });

    it('limits results to maxItems', async () => {
      const storedUsage: ToolUsage = {};
      for (let i = 0; i < 20; i++) {
        storedUsage[`/tool${i}`] = { count: 5, lastVisited: i, label: `Tool ${i}` };
      }
      mockLocalStorage['networking-toolbox-tool-usage'] = JSON.stringify(storedUsage);

      const { frequentlyUsedTools } = await import('../../../../src/lib/stores/toolUsage');
      const value = get(frequentlyUsedTools);

      expect(value.length).toBeLessThanOrEqual(12); // maxItems = 12
    });
  });

  describe('recentlyUsedTools derived store', () => {
    it('sorts by lastVisited in descending order', async () => {
      const storedUsage: ToolUsage = {
        '/tool1': { count: 1, lastVisited: 1000, label: 'Tool 1' },
        '/tool2': { count: 1, lastVisited: 3000, label: 'Tool 2' },
        '/tool3': { count: 1, lastVisited: 2000, label: 'Tool 3' },
      };
      mockLocalStorage['networking-toolbox-tool-usage'] = JSON.stringify(storedUsage);

      const { recentlyUsedTools } = await import('../../../../src/lib/stores/toolUsage');
      const value = get(recentlyUsedTools);

      expect(value[0].href).toBe('/tool2'); // Most recent
      expect(value[1].href).toBe('/tool3');
      expect(value[2].href).toBe('/tool1');
    });

    it('includes all tools regardless of count', async () => {
      const storedUsage: ToolUsage = {
        '/tool1': { count: 1, lastVisited: 1000, label: 'Tool 1' },
        '/tool2': { count: 100, lastVisited: 2000, label: 'Tool 2' },
      };
      mockLocalStorage['networking-toolbox-tool-usage'] = JSON.stringify(storedUsage);

      const { recentlyUsedTools } = await import('../../../../src/lib/stores/toolUsage');
      const value = get(recentlyUsedTools);

      expect(value).toHaveLength(2);
    });

    it('limits results to maxItems', async () => {
      const storedUsage: ToolUsage = {};
      for (let i = 0; i < 20; i++) {
        storedUsage[`/tool${i}`] = { count: 1, lastVisited: i, label: `Tool ${i}` };
      }
      mockLocalStorage['networking-toolbox-tool-usage'] = JSON.stringify(storedUsage);

      const { recentlyUsedTools } = await import('../../../../src/lib/stores/toolUsage');
      const value = get(recentlyUsedTools);

      expect(value.length).toBeLessThanOrEqual(12); // maxItems = 12
    });
  });
});
