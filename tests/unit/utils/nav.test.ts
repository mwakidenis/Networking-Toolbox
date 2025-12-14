import { describe, it, expect } from 'vitest';
import { extractNavItems } from '../../../src/lib/utils/nav';
import type { NavItem, NavGroup } from '../../../src/lib/constants/nav';

describe('nav utilities', () => {
  describe('extractNavItems', () => {
    it('returns empty array for empty input', () => {
      const result = extractNavItems([]);
      expect(result).toEqual([]);
    });

    it('extracts NavItems from flat array', () => {
      const navItems: NavItem[] = [
        { href: '/tool1', label: 'Tool 1', description: 'First tool' },
        { href: '/tool2', label: 'Tool 2', description: 'Second tool' },
      ];

      const result = extractNavItems(navItems);
      expect(result).toEqual(navItems);
      expect(result).toHaveLength(2);
    });

    it('extracts NavItems from NavGroups', () => {
      const navGroup: NavGroup = {
        title: 'Group 1',
        items: [
          { href: '/tool1', label: 'Tool 1', description: 'First tool' },
          { href: '/tool2', label: 'Tool 2', description: 'Second tool' },
        ],
      };

      const result = extractNavItems([navGroup]);
      expect(result).toHaveLength(2);
      expect(result[0].href).toBe('/tool1');
      expect(result[1].href).toBe('/tool2');
    });

    it('extracts NavItems from mixed array of NavItems and NavGroups', () => {
      const navItem: NavItem = { href: '/standalone', label: 'Standalone', description: 'A standalone tool' };
      const navGroup: NavGroup = {
        title: 'Group',
        items: [
          { href: '/grouped1', label: 'Grouped 1', description: 'First grouped tool' },
          { href: '/grouped2', label: 'Grouped 2', description: 'Second grouped tool' },
        ],
      };

      const result = extractNavItems([navItem, navGroup]);
      expect(result).toHaveLength(3);
      expect(result[0].href).toBe('/standalone');
      expect(result[1].href).toBe('/grouped1');
      expect(result[2].href).toBe('/grouped2');
    });

    it('handles multiple NavGroups', () => {
      const navGroup1: NavGroup = {
        title: 'Group 1',
        items: [{ href: '/g1t1', label: 'G1 T1', description: 'Group 1 Tool 1' }],
      };
      const navGroup2: NavGroup = {
        title: 'Group 2',
        items: [{ href: '/g2t1', label: 'G2 T1', description: 'Group 2 Tool 1' }],
      };

      const result = extractNavItems([navGroup1, navGroup2]);
      expect(result).toHaveLength(2);
      expect(result[0].href).toBe('/g1t1');
      expect(result[1].href).toBe('/g2t1');
    });

    it('preserves NavItem properties', () => {
      const navItem: NavItem = {
        href: '/tool',
        label: 'Test Tool',
        description: 'A test tool',
        icon: 'test-icon',
        keywords: ['test', 'tool'],
      };

      const result = extractNavItems([navItem]);
      expect(result[0]).toEqual(navItem);
      expect(result[0].icon).toBe('test-icon');
      expect(result[0].keywords).toEqual(['test', 'tool']);
    });

    it('handles NavGroups with empty items array', () => {
      const navGroup: NavGroup = {
        title: 'Empty Group',
        items: [],
      };

      const result = extractNavItems([navGroup]);
      expect(result).toEqual([]);
    });
  });
});
