import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Centralized logging - set to false for production
const DEBUG = false;
function log(...args: any[]) {
  if (DEBUG) {
    console.warn('[Version]', ...args);
  }
}

export const appVersion = writable('0.2.5'); // fallback version

// Fetch version from API when in browser
export async function initializeVersion() {
  if (!browser) return;

  try {
    const response = await fetch('/version');
    const data = await response.json();
    appVersion.set(data.version);
  } catch {
    log('Failed to fetch version from API, using fallback');
    // Keep fallback version
  }
}
