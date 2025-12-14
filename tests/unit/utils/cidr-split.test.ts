import { describe, it, expect } from 'vitest';
import { splitCIDRByCount, splitCIDRByPrefix } from '../../../src/lib/utils/cidr-split';

describe('cidr-split.ts', () => {
  describe('splitCIDRByPrefix', () => {
    it('splits IPv4 /24 into two /25 subnets', () => {
      const result = splitCIDRByPrefix('192.168.1.0/24', 25);

      expect(result.error).toBeUndefined();
      expect(result.subnets).toHaveLength(2);
      expect(result.subnets.map(s => s.cidr)).toContain('192.168.1.0/25');
      expect(result.subnets.map(s => s.cidr)).toContain('192.168.1.128/25');
    });

    it('splits IPv4 /22 into four /24 subnets', () => {
      const result = splitCIDRByPrefix('192.168.0.0/22', 24);

      expect(result.error).toBeUndefined();
      expect(result.subnets).toHaveLength(4);
      expect(result.subnets.map(s => s.cidr)).toContain('192.168.0.0/24');
      expect(result.subnets.map(s => s.cidr)).toContain('192.168.3.0/24');
    });

    it('rejects invalid prefix length (larger than current)', () => {
      const result = splitCIDRByPrefix('192.168.1.0/24', 23);

      expect(result.error).toBeDefined();
      expect(result.subnets).toHaveLength(0);
    });

    it('handles same prefix (no split)', () => {
      const result = splitCIDRByPrefix('192.168.1.0/24', 24);

      expect(result.error).toBeDefined();
      expect(result.subnets).toHaveLength(0);
    });

    it('handles IPv6 splits', () => {
      const result = splitCIDRByPrefix('2001:db8::/48', 64);

      expect(result.error).toBeUndefined();
      expect(result.subnets.length).toBeGreaterThan(1);
      expect(result.subnets[0].cidr).toContain('2001:db8:');
    });

    it('handles invalid CIDR input', () => {
      const result = splitCIDRByPrefix('invalid-cidr', 25);

      expect(result.error).toBeDefined();
      expect(result.subnets).toHaveLength(0);
    });

    it('provides split statistics', () => {
      const result = splitCIDRByPrefix('192.168.0.0/22', 24);

      expect(result.stats).toBeDefined();
      expect(result.stats.parentCIDR).toBe('192.168.0.0/22');
      expect(result.stats.childPrefix).toBe(24);
      expect(result.stats.childCount).toBe(4);
    });
  });

  describe('splitCIDRByCount', () => {
    it('splits into 2 equal subnets', () => {
      const result = splitCIDRByCount('192.168.1.0/24', 2);

      expect(result.error).toBeUndefined();
      expect(result.subnets).toHaveLength(2);
      expect(result.subnets.map(s => s.cidr)).toContain('192.168.1.0/25');
      expect(result.subnets.map(s => s.cidr)).toContain('192.168.1.128/25');
    });

    it('splits into 4 equal subnets', () => {
      const result = splitCIDRByCount('192.168.0.0/22', 4);

      expect(result.error).toBeUndefined();
      expect(result.subnets).toHaveLength(4);
      expect(result.subnets.map(s => s.cidr)).toContain('192.168.0.0/24');
    });

    it('handles non-power-of-2 splits by rounding up', () => {
      const result = splitCIDRByCount('192.168.1.0/24', 3);

      expect(result.error).toBeUndefined();
      expect(result.subnets).toHaveLength(3);
      expect(result.stats.childCount).toBe(3);
    });

    it('rejects impossible splits (too many subnets)', () => {
      const result = splitCIDRByCount('192.168.1.0/30', 8);

      expect(result.error).toBeDefined();
      expect(result.subnets).toHaveLength(0);
    });

    it('handles single subnet request', () => {
      const result = splitCIDRByCount('192.168.1.0/24', 1);

      expect(result.error).toBeUndefined();
      expect(result.subnets).toHaveLength(1);
      expect(result.subnets[0].cidr).toBe('192.168.1.0/24');
    });

    it('handles IPv6 subnet splitting', () => {
      const result = splitCIDRByCount('2001:db8::/48', 4);

      expect(result.error).toBeUndefined();
      expect(result.subnets).toHaveLength(4);
      expect(result.subnets[0].cidr).toContain('2001:db8:');
    });

    it('calculates correct prefix lengths for larger splits', () => {
      const result = splitCIDRByCount('192.168.0.0/20', 16);

      expect(result.error).toBeUndefined();
      expect(result.subnets).toHaveLength(16);
      expect(result.subnets.every(s => s.cidr.endsWith('/24'))).toBe(true);
    });

    it('provides comprehensive statistics', () => {
      const result = splitCIDRByCount('10.0.0.0/16', 64);

      expect(result.error).toBeUndefined();
      expect(result.stats).toBeDefined();
      expect(result.stats.childCount).toBe(64);
      expect(result.stats.childPrefix).toBeDefined();
      expect(result.stats.parentCIDR).toBe('10.0.0.0/16');
    });

    it('handles invalid CIDR input', () => {
      const result = splitCIDRByCount('invalid-cidr', 2);

      expect(result.error).toBeDefined();
      expect(result.subnets).toHaveLength(0);
    });

    it('handles edge cases with maximum splits', () => {
      const result = splitCIDRByCount('192.168.1.0/24', 256);

      expect(result.error).toBeUndefined();
      expect(result.subnets).toHaveLength(256);
      expect(result.subnets.every(s => s.cidr.endsWith('/32'))).toBe(true);
    });

    it('handles various split counts correctly', () => {
      expect(splitCIDRByCount('192.168.0.0/16', 2).error).toBeUndefined();
      expect(splitCIDRByCount('192.168.0.0/16', 4).error).toBeUndefined();
      expect(splitCIDRByCount('192.168.0.0/16', 8).error).toBeUndefined();
      expect(splitCIDRByCount('192.168.0.0/16', 16).error).toBeUndefined();

      expect(splitCIDRByCount('192.168.0.0/16', 3).error).toBeUndefined();
      expect(splitCIDRByCount('192.168.0.0/16', 5).error).toBeUndefined();
      expect(splitCIDRByCount('192.168.0.0/16', 7).error).toBeUndefined();
    });
  });
});