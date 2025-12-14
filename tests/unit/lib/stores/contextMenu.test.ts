import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { activeContextMenu } from '../../../../src/lib/stores/contextMenu';

describe('contextMenu store', () => {
  it('initializes with closed state', () => {
    const value = get(activeContextMenu);
    expect(value).toEqual({ id: null, x: 0, y: 0 });
  });

  it('opens context menu with specified position', () => {
    activeContextMenu.open('test-menu', 100, 200);

    const value = get(activeContextMenu);
    expect(value).toEqual({ id: 'test-menu', x: 100, y: 200 });
  });

  it('closes context menu', () => {
    activeContextMenu.open('test-menu', 100, 200);
    activeContextMenu.close();

    const value = get(activeContextMenu);
    expect(value).toEqual({ id: null, x: 0, y: 0 });
  });

  it('opens different context menus', () => {
    activeContextMenu.open('menu1', 50, 50);
    expect(get(activeContextMenu).id).toBe('menu1');

    activeContextMenu.open('menu2', 150, 150);
    expect(get(activeContextMenu).id).toBe('menu2');
    expect(get(activeContextMenu).x).toBe(150);
    expect(get(activeContextMenu).y).toBe(150);
  });

  it('handles multiple open and close cycles', () => {
    activeContextMenu.open('menu1', 10, 20);
    expect(get(activeContextMenu).id).toBe('menu1');

    activeContextMenu.close();
    expect(get(activeContextMenu).id).toBeNull();

    activeContextMenu.open('menu2', 30, 40);
    expect(get(activeContextMenu).id).toBe('menu2');

    activeContextMenu.close();
    expect(get(activeContextMenu).id).toBeNull();
  });

  it('handles edge case positions', () => {
    activeContextMenu.open('menu', 0, 0);
    let value = get(activeContextMenu);
    expect(value).toEqual({ id: 'menu', x: 0, y: 0 });

    activeContextMenu.open('menu', -10, -10);
    value = get(activeContextMenu);
    expect(value).toEqual({ id: 'menu', x: -10, y: -10 });

    activeContextMenu.open('menu', 9999, 9999);
    value = get(activeContextMenu);
    expect(value).toEqual({ id: 'menu', x: 9999, y: 9999 });
  });
});
