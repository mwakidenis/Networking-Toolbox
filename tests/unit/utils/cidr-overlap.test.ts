import { describe, it, expect } from 'vitest';
import { computeCIDROverlap } from '../../../src/lib/utils/cidr-overlap';

describe('cidr-overlap.ts', () => {
  describe('computeCIDROverlap', () => {
    it('identifies overlapping CIDRs', () => {
      const setA = '192.168.0.0/16\n10.0.0.0/8';
      const setB = '192.168.1.0/24\n172.16.0.0/16';

      const result = computeCIDROverlap(setA, setB);

      expect(result.hasOverlap).toBe(true);
      expect(result.ipv4.length).toBeGreaterThan(0);
      expect(result.stats).toBeDefined();
    });

    it('identifies non-overlapping CIDRs', () => {
      const setA = '192.168.1.0/24';
      const setB = '10.0.0.0/24';

      const result = computeCIDROverlap(setA, setB);

      expect(result.hasOverlap).toBe(false);
      expect(result.stats).toBeDefined();
      expect(result.stats.setA.count).toBe(1);
      expect(result.stats.setB.count).toBe(1);
    });

    it('handles identical CIDR sets', () => {
      const cidrs = '192.168.1.0/24\n10.0.0.0/8';

      const result = computeCIDROverlap(cidrs, cidrs);

      expect(result.hasOverlap).toBe(true);
      expect(result.stats.setA.count).toBe(2);
      expect(result.stats.setB.count).toBe(2);
    });

    it('handles IPv6 CIDR overlaps', () => {
      const setA = '2001:db8::/32';
      const setB = '2001:db8:1234::/48\n2001:db9::/32';

      const result = computeCIDROverlap(setA, setB);

      expect(result.hasOverlap).toBe(true);
      expect(result.stats).toBeDefined();
    });

    it('handles mixed IPv4 and IPv6', () => {
      const setA = '192.168.0.0/16\n2001:db8::/32';
      const setB = '192.168.1.0/24\n2001:db8:1234::/48';

      const result = computeCIDROverlap(setA, setB);

      expect(result.hasOverlap).toBe(true);
      expect(result.stats.setA.count).toBe(2);
      expect(result.stats.setB.count).toBe(2);
    });

    it('provides comprehensive statistics', () => {
      const setA = '192.168.0.0/16\n10.0.0.0/8';
      const setB = '192.168.1.0/24\n172.16.0.0/16';

      const result = computeCIDROverlap(setA, setB);

      expect(result.hasOverlap).toBe(true);
      expect(result.stats.setA).toBeDefined();
      expect(result.stats.setB).toBeDefined();
      expect(result.stats.intersection).toBeDefined();
    });

    it('handles invalid input gracefully', () => {
      const setA = 'invalid-cidr';
      const setB = '192.168.1.0/24';

      const result = computeCIDROverlap(setA, setB);

      expect(result.hasOverlap).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('handles empty input', () => {
      const result = computeCIDROverlap('', '');

      expect(result.stats.setA.count).toBe(0);
      expect(result.stats.setB.count).toBe(0);
      expect(result.ipv4).toHaveLength(0);
      expect(result.ipv6).toHaveLength(0);
    });

    it('handles single CIDR in each set', () => {
      const setA = '192.168.1.0/24';
      const setB = '192.168.1.128/25';

      const result = computeCIDROverlap(setA, setB);

      expect(result.stats.setA.count).toBe(1);
      expect(result.stats.setB.count).toBe(1);
      expect(result.hasOverlap).toBe(true);
    });

    it('handles large CIDR sets efficiently', () => {
      const setA = '192.168.0.0/16\n10.0.0.0/8\n172.16.0.0/12';
      const setB = '192.168.1.0/24\n192.168.2.0/24\n10.1.0.0/16';

      const result = computeCIDROverlap(setA, setB);

      expect(result.hasOverlap).toBe(true);
      expect(result.stats).toBeDefined();
    });

    it('identifies containment relationships', () => {
      const setA = '192.168.0.0/16';
      const setB = '192.168.1.0/24';

      const result = computeCIDROverlap(setA, setB);

      expect(result.hasOverlap).toBe(true);
      expect(result.ipv4.length).toBeGreaterThan(0);
    });

    it('handles complex overlap scenarios', () => {
      const setA = '192.168.0.0/22\n10.0.0.0/16';
      const setB = '192.168.1.0/24\n192.168.3.0/25\n10.0.1.0/24';

      const result = computeCIDROverlap(setA, setB);

      expect(result.hasOverlap).toBe(true);
      expect(result.stats.intersection.count).toBeGreaterThan(0);
    });
  });
});