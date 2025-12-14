import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isMacOS, getModifierKey, formatShortcut } from '../../../src/lib/utils/keyboard';

// Mock browser environment
vi.mock('$app/environment', () => ({
  browser: true,
}));

describe('keyboard utilities', () => {
  describe('isMacOS', () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it('returns true for Mac user agents', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        writable: true,
        configurable: true,
      });

      expect(isMacOS()).toBe(true);
    });

    it('returns true for MacIntel user agents', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (MacIntel)',
        writable: true,
        configurable: true,
      });

      expect(isMacOS()).toBe(true);
    });

    it('returns false for Windows user agents', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true,
        configurable: true,
      });

      expect(isMacOS()).toBe(false);
    });

    it('returns false for Linux user agents', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64)',
        writable: true,
        configurable: true,
      });

      expect(isMacOS()).toBe(false);
    });
  });

  describe('getModifierKey', () => {
    it('returns ⌘ for macOS', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        writable: true,
        configurable: true,
      });

      expect(getModifierKey()).toBe('⌘');
    });

    it('returns Ctrl for non-macOS', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true,
        configurable: true,
      });

      expect(getModifierKey()).toBe('Ctrl');
    });
  });

  describe('formatShortcut', () => {
    describe('on macOS', () => {
      beforeEach(() => {
        Object.defineProperty(global.navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          writable: true,
          configurable: true,
        });
      });

      it('formats shorthand notation correctly', () => {
        expect(formatShortcut('^K')).toBe('⌘K');
        expect(formatShortcut('^/')).toBe('⌘/');
        expect(formatShortcut('^H')).toBe('⌘H');
      });

      it('formats full notation correctly', () => {
        expect(formatShortcut('Ctrl+K')).toBe('⌘K');
        expect(formatShortcut('Ctrl + K')).toBe('⌘K');
        expect(formatShortcut('Ctrl  +  K')).toBe('⌘K');
      });

      it('handles ranges correctly', () => {
        expect(formatShortcut('^1-9')).toBe('⌘1-9');
      });

      it('is case insensitive for Ctrl', () => {
        expect(formatShortcut('ctrl+K')).toBe('⌘K');
        expect(formatShortcut('CTRL+K')).toBe('⌘K');
      });
    });

    describe('on non-macOS', () => {
      beforeEach(() => {
        Object.defineProperty(global.navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          writable: true,
          configurable: true,
        });
      });

      it('formats shorthand notation correctly', () => {
        expect(formatShortcut('^K')).toBe('Ctrl + K');
        expect(formatShortcut('^/')).toBe('Ctrl + /');
        expect(formatShortcut('^H')).toBe('Ctrl + H');
      });

      it('formats full notation correctly', () => {
        expect(formatShortcut('Ctrl+K')).toBe('Ctrl + K');
        expect(formatShortcut('Ctrl + K')).toBe('Ctrl + K');
        expect(formatShortcut('Ctrl  +  K')).toBe('Ctrl + K');
      });

      it('handles ranges correctly', () => {
        expect(formatShortcut('^1-9')).toBe('Ctrl + 1-9');
      });

      it('is case insensitive for Ctrl', () => {
        expect(formatShortcut('ctrl+K')).toBe('Ctrl + K');
        expect(formatShortcut('CTRL+K')).toBe('Ctrl + K');
      });
    });
  });
});
