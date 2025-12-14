import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import type { BookmarkedTool } from '../../../../src/lib/stores/bookmarks';

// Mock browser environment
vi.mock('$app/environment', () => ({
  browser: true,
}));

// Mock offline caching functions
vi.mock('../../../../src/lib/stores/offline', () => ({
  cacheBookmark: vi.fn(),
  cacheAllBookmarks: vi.fn(),
}));

describe('bookmarks store', () => {
  let mockLocalStorage: Record<string, string> = {};

  const testTool: BookmarkedTool = {
    href: '/test-tool',
    label: 'Test Tool',
    description: 'A test tool',
    icon: 'test-icon',
  };

  const testTool2: BookmarkedTool = {
    href: '/another-tool',
    label: 'Another Tool',
    description: 'Another test tool',
    icon: 'another-icon',
  };

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

    // Clear module cache to reset store
    vi.resetModules();
  });

  it('initializes with empty array when no stored bookmarks', async () => {
    const { bookmarks } = await import('../../../../src/lib/stores/bookmarks');
    const value = get(bookmarks);
    expect(value).toEqual([]);
  });

  it('initializes with stored bookmarks from localStorage', async () => {
    const storedBookmarks = [testTool, testTool2];
    mockLocalStorage['bookmarked-tools'] = JSON.stringify(storedBookmarks);

    const { bookmarks } = await import('../../../../src/lib/stores/bookmarks');
    const value = get(bookmarks);
    expect(value).toEqual(storedBookmarks);
  });

  it('handles invalid JSON in localStorage gracefully', async () => {
    mockLocalStorage['bookmarked-tools'] = 'invalid json {';

    const { bookmarks } = await import('../../../../src/lib/stores/bookmarks');
    const value = get(bookmarks);
    expect(value).toEqual([]);
  });

  it('adds a new bookmark', async () => {
    const { bookmarks } = await import('../../../../src/lib/stores/bookmarks');

    bookmarks.add(testTool);

    const value = get(bookmarks);
    expect(value).toEqual([testTool]);
    expect(mockLocalStorage['bookmarked-tools']).toBe(JSON.stringify([testTool]));
  });

  it('does not add duplicate bookmarks', async () => {
    const { bookmarks } = await import('../../../../src/lib/stores/bookmarks');

    bookmarks.add(testTool);
    bookmarks.add(testTool);

    const value = get(bookmarks);
    expect(value).toHaveLength(1);
    expect(value).toEqual([testTool]);
  });

  it('removes a bookmark', async () => {
    mockLocalStorage['bookmarked-tools'] = JSON.stringify([testTool, testTool2]);
    const { bookmarks } = await import('../../../../src/lib/stores/bookmarks');

    bookmarks.remove(testTool.href);

    const value = get(bookmarks);
    expect(value).toEqual([testTool2]);
    expect(mockLocalStorage['bookmarked-tools']).toBe(JSON.stringify([testTool2]));
  });

  it('toggle adds bookmark when not present', async () => {
    const { bookmarks } = await import('../../../../src/lib/stores/bookmarks');

    bookmarks.toggle(testTool);

    const value = get(bookmarks);
    expect(value).toEqual([testTool]);
  });

  it('toggle removes bookmark when present', async () => {
    mockLocalStorage['bookmarked-tools'] = JSON.stringify([testTool]);
    const { bookmarks } = await import('../../../../src/lib/stores/bookmarks');

    bookmarks.toggle(testTool);

    const value = get(bookmarks);
    expect(value).toEqual([]);
  });

  it('isBookmarked returns true for bookmarked href', async () => {
    const { bookmarks } = await import('../../../../src/lib/stores/bookmarks');

    const bookmarksList = [testTool, testTool2];
    expect(bookmarks.isBookmarked(testTool.href, bookmarksList)).toBe(true);
    expect(bookmarks.isBookmarked(testTool2.href, bookmarksList)).toBe(true);
  });

  it('isBookmarked returns false for non-bookmarked href', async () => {
    const { bookmarks } = await import('../../../../src/lib/stores/bookmarks');

    const bookmarksList = [testTool];
    expect(bookmarks.isBookmarked('/non-existent', bookmarksList)).toBe(false);
  });

  it('init loads bookmarks from localStorage', async () => {
    const storedBookmarks = [testTool];
    mockLocalStorage['bookmarked-tools'] = JSON.stringify(storedBookmarks);

    const { bookmarks } = await import('../../../../src/lib/stores/bookmarks');
    bookmarks.init();

    const value = get(bookmarks);
    expect(value).toEqual(storedBookmarks);
  });
});
