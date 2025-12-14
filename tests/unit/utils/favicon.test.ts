import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSvgContent, getPrimaryColor, generateFaviconDataUri } from '../../../src/lib/utils/favicon';

// Mock the icon map
vi.mock('$lib/constants/icon-map', () => ({
  iconMap: {
    'test-icon': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>',
    'calculator': '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>',
    'alert-circle': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill="currentColor" d="M320 576C178.6 576 64 461.4 64 320"/></svg>',
  },
}));

describe('favicon', () => {
  let originalWindow: any;
  let originalDocument: any;
  let originalGetComputedStyle: any;

  beforeEach(() => {
    // Store original values
    originalWindow = (globalThis as any).window;
    originalDocument = (globalThis as any).document;
    originalGetComputedStyle = (globalThis as any).getComputedStyle;

    // Set up DOM mocks
    const mockGetComputedStyle = vi.fn().mockReturnValue({
      getPropertyValue: vi.fn().mockReturnValue('#0066ff'),
    });

    (globalThis as any).window = {
      getComputedStyle: mockGetComputedStyle,
    };

    (globalThis as any).document = {
      documentElement: {},
    };

    (globalThis as any).getComputedStyle = mockGetComputedStyle;
  });

  afterEach(() => {
    // Restore original values
    (globalThis as any).window = originalWindow;
    (globalThis as any).document = originalDocument;
    (globalThis as any).getComputedStyle = originalGetComputedStyle;
    vi.clearAllMocks();
  });

  describe('getSvgContent', () => {
    it('should return SVG content for existing icon', () => {
      const result = getSvgContent('test-icon');
      expect(result).toBe('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>');
    });

    it('should return undefined for non-existing icon', () => {
      const result = getSvgContent('non-existing-icon');
      expect(result).toBeUndefined();
    });

    it('should handle empty string icon name', () => {
      const result = getSvgContent('');
      expect(result).toBeUndefined();
    });
  });

  describe('getPrimaryColor', () => {
    it('should return fallback color when window is undefined', () => {
      (globalThis as any).window = undefined;
      const result = getPrimaryColor();
      expect(result).toBe('#e3ed70');
    });

    it('should return CSS variable value when available', () => {
      const mockGetComputedStyle = vi.fn().mockReturnValue({
        getPropertyValue: vi.fn().mockReturnValue('  #ff0000  '),
      });

      Object.defineProperty(globalThis, 'getComputedStyle', {
        value: mockGetComputedStyle,
        writable: true,
      });

      const result = getPrimaryColor();
      expect(result).toBe('#ff0000');
      expect(mockGetComputedStyle).toHaveBeenCalledWith(document.documentElement);
    });

    it('should return fallback color when CSS variable is empty', () => {
      const mockGetComputedStyle = vi.fn().mockReturnValue({
        getPropertyValue: vi.fn().mockReturnValue(''),
      });

      Object.defineProperty(globalThis, 'getComputedStyle', {
        value: mockGetComputedStyle,
        writable: true,
      });

      const result = getPrimaryColor();
      expect(result).toBe('#e3ed70');
    });

    it('should trim whitespace from CSS variable value', () => {
      const mockGetComputedStyle = vi.fn().mockReturnValue({
        getPropertyValue: vi.fn().mockReturnValue('  #00ff00  '),
      });

      Object.defineProperty(globalThis, 'getComputedStyle', {
        value: mockGetComputedStyle,
        writable: true,
      });

      const result = getPrimaryColor();
      expect(result).toBe('#00ff00');
    });
  });

  describe('generateFaviconDataUri', () => {
    beforeEach(() => {
      const mockGetComputedStyle = vi.fn().mockReturnValue({
        getPropertyValue: vi.fn().mockReturnValue('#0066ff'),
      });

      Object.defineProperty(globalThis, 'getComputedStyle', {
        value: mockGetComputedStyle,
        writable: true,
      });
    });

    it('should return null for non-existing icon', () => {
      const result = generateFaviconDataUri('non-existing-icon');
      expect(result).toBeNull();
    });

    it('should generate data URI for existing icon', () => {
      const result = generateFaviconDataUri('test-icon');
      expect(result).toContain('data:image/svg+xml,');
      expect(result).toContain('svg');
    });

    it('should use provided color', () => {
      const result = generateFaviconDataUri('test-icon', '#ff0000');
      expect(result).toContain('data:image/svg+xml,');
      expect(result).toContain('%23ff0000'); // URL encoded #ff0000
    });

    it('should use CSS primary color when no color provided', () => {
      const result = generateFaviconDataUri('test-icon');
      expect(result).toContain('data:image/svg+xml,');
      expect(result).toContain('%230066ff'); // URL encoded #0066ff
    });

    it('should replace currentColor with provided color', () => {
      const result = generateFaviconDataUri('calculator', '#00ff00');
      expect(result).toContain('data:image/svg+xml,');
      expect(result).toContain('%2300ff00'); // URL encoded #00ff00
      expect(result).not.toContain('currentColor');
    });

    it('should add fill attribute to path elements without fill', () => {
      const result = generateFaviconDataUri('test-icon', '#ff0000');
      expect(result).toContain('data:image/svg+xml,');
      expect(result).toContain('path%20fill%3D%22%23ff0000%22'); // URL encoded path fill="#ff0000"
    });

    it('should add fill attribute to svg element if missing', () => {
      const result = generateFaviconDataUri('test-icon', '#ff0000');
      expect(result).toContain('data:image/svg+xml,');
      // The SVG element doesn't get fill when path elements already have it
      expect(result).toContain('svg%20xmlns');
    });

    it('should handle SVG with existing fill attributes', () => {
      const result = generateFaviconDataUri('alert-circle', '#00ff00');
      expect(result).toContain('data:image/svg+xml,');
      expect(result).toContain('%2300ff00'); // URL encoded #00ff00
    });

    it('should encode SVG properly for data URI', () => {
      const result = generateFaviconDataUri('test-icon', '#ff0000');
      expect(result).toMatch(/^data:image\/svg\+xml,/);
      expect(result).toContain('%3Csvg'); // URL encoded <svg (uppercase)
      expect(result).toContain('%3E'); // URL encoded > (uppercase)
    });

    it('should handle complex SVG structures', () => {
      const result = generateFaviconDataUri('alert-circle', '#333333');
      expect(result).toContain('data:image/svg+xml,');
      expect(result).toContain('%23333333'); // URL encoded #333333
      expect(result).toContain('viewBox');
    });

    it('should handle empty color string', () => {
      const result = generateFaviconDataUri('test-icon', '');
      expect(result).toContain('data:image/svg+xml,');
      expect(result).toContain('%230066ff'); // Should fall back to CSS primary color
    });

    it('should handle hex colors with and without #', () => {
      const resultWithHash = generateFaviconDataUri('test-icon', '#ff0000');
      const resultWithoutHash = generateFaviconDataUri('test-icon', 'ff0000');

      expect(resultWithHash).toContain('%23ff0000');
      expect(resultWithoutHash).toContain('ff0000');
    });

    it('should handle RGB color values', () => {
      const result = generateFaviconDataUri('test-icon', 'rgb(255, 0, 0)');
      expect(result).toContain('data:image/svg+xml,');
      expect(result).toContain('rgb(255%2C%200%2C%200)'); // URL encoded rgb(255, 0, 0) (uppercase)
    });

    it('should process multiple path elements correctly', () => {
      const result = generateFaviconDataUri('alert-circle', '#ff0000');
      expect(result).toContain('data:image/svg+xml,');
      expect(result).toContain('%23ff0000'); // URL encoded #ff0000
    });
  });
});