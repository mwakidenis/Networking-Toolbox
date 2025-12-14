import { browser } from '$app/environment';

/**
 * Detect if the user is on macOS
 */
export function isMacOS(): boolean {
  if (!browser) return false;
  return /Mac|Macintosh|MacIntel/i.test(navigator.userAgent);
}

/**
 * Get the appropriate modifier key symbol based on platform
 * @returns '⌘' for Mac, 'Ctrl' for other platforms
 */
export function getModifierKey(): string {
  return isMacOS() ? '⌘' : 'Ctrl';
}

/**
 * Format a keyboard shortcut for display based on platform
 * Supports shorthand notation (^K) and full notation (Ctrl+K)
 *
 * @param shortcut - The shortcut string. Can be specified like:
 *   - Shorthand: '^K', '^/', '^H' etc.
 *   - Full: 'Ctrl+K', 'Ctrl + K', etc.
 * @returns Formatted shortcut
 *   - macOS: '⌘K'
 *   - Others: 'Ctrl + K'
 *
 * @example
 * formatShortcut('^K')        // Returns '⌘K' on Mac, 'Ctrl + K' elsewhere
 * formatShortcut('Ctrl+K')    // Returns '⌘K' on Mac, 'Ctrl + K' elsewhere
 * formatShortcut('^1-9')      // Returns '⌘1-9' on Mac, 'Ctrl + 1-9' elsewhere
 */
export function formatShortcut(shortcut: string): string {
  const isMac = isMacOS();
  const modKey = isMac ? '⌘' : 'Ctrl';
  const separator = isMac ? '' : ' + ';

  // Handle shorthand notation (^K, ^/, etc.)
  if (shortcut.startsWith('^')) {
    const key = shortcut.slice(1); // Remove the ^ prefix
    return `${modKey}${separator}${key}`;
  }

  // Handle full notation (Ctrl+K, Ctrl + K, etc.)
  // Replace 'Ctrl' with platform-specific modifier and separator
  return shortcut.replace(/Ctrl\s*\+?\s*/gi, `${modKey}${separator}`);
}
