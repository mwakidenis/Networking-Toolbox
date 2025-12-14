import { describe, it, expect } from 'vitest';
import { iconMap } from '$lib/constants/icon-map';

describe('Icon Map', () => {
  it('should export iconMap object', () => {
    expect(iconMap).toBeDefined();
    expect(typeof iconMap).toBe('object');
  });

  it('should have SVG content for each icon', () => {
    const icons = Object.keys(iconMap);
    expect(icons.length).toBeGreaterThan(0);

    icons.forEach((iconName) => {
      expect(iconMap[iconName]).toBeDefined();
      expect(typeof iconMap[iconName]).toBe('string');
      expect(iconMap[iconName]).toContain('<svg');
      expect(iconMap[iconName]).toContain('</svg>');
    });
  });

  it('should have commonly used icons', () => {
    const commonIcons = [
      'check',
      'alert-circle',
      'alert-triangle',
      'chevron-down',
      'chevron-right',
      'loader',
    ];

    commonIcons.forEach((iconName) => {
      expect(iconMap[iconName]).toBeDefined();
    });
  });

  it('should have valid SVG viewBox attributes', () => {
    const icons = Object.keys(iconMap);

    icons.forEach((iconName) => {
      const svg = iconMap[iconName];
      if (svg.includes('viewBox')) {
        expect(svg).toMatch(/viewBox="[^"]+"/);
      }
    });
  });
});
