import { describe, it, expect } from 'vitest';
import { computeCIDRContains } from '../../../src/lib/utils/cidr-contains';

describe('cidr-contains.ts', () => {
  describe('computeCIDRContains', () => {
    it('identifies when CIDRs contain other CIDRs', () => {
      const containers = '192.168.0.0/16';
      const candidates = '192.168.1.0/24\n192.168.2.0/24';
      
      const result = computeCIDRContains(containers, candidates);
      
      expect(result.checks).toHaveLength(2);
      expect(result.checks[0].status).toBe('inside');
      expect(result.checks[1].status).toBe('inside');
      expect(result.checks[0].coverage).toBe(100);
    });

    it('identifies when CIDRs are outside containers', () => {
      const containers = '192.168.0.0/24';
      const candidates = '10.0.0.0/24\n172.16.0.0/24';
      
      const result = computeCIDRContains(containers, candidates);
      
      expect(result.checks).toHaveLength(2);
      expect(result.checks[0].status).toBe('outside');
      expect(result.checks[1].status).toBe('outside');
      expect(result.checks[0].coverage).toBe(0);
    });

    it('handles equal CIDRs', () => {
      const containers = '192.168.1.0/24';
      const candidates = '192.168.1.0/24';
      
      const result = computeCIDRContains(containers, candidates);
      
      expect(result.checks).toHaveLength(1);
      expect(result.checks[0].status).toBe('inside');
      expect(result.checks[0].coverage).toBe(100);
    });

    it('identifies partial containment', () => {
      const containers = '192.168.1.0/25';  // 192.168.1.0-127
      const candidates = '192.168.1.0/24';  // 192.168.1.0-255 (partially contained)
      
      const result = computeCIDRContains(containers, candidates);
      
      expect(result.checks).toHaveLength(1);
      expect(result.checks[0].status).toBe('partial');
      expect(result.checks[0].coverage).toBe(50);
      expect(result.checks[0].gaps).toHaveLength(1);
    });

    it('handles IPv6 addresses', () => {
      const containers = '2001:db8::/32';
      const candidates = '2001:db8:1234::/48\n2001:db9::/48';
      
      const result = computeCIDRContains(containers, candidates);
      
      expect(result.checks).toHaveLength(2);
      expect(result.checks[0].status).toBe('inside');
      expect(result.checks[1].status).toBe('outside');
    });

    it('handles mixed IPv4 and IPv6', () => {
      const containers = '192.168.0.0/16\n2001:db8::/32';
      const candidates = '192.168.1.0/24\n2001:db8:1234::/48';
      
      const result = computeCIDRContains(containers, candidates);
      
      expect(result.checks).toHaveLength(2);
      expect(result.checks[0].status).toBe('inside');
      expect(result.checks[1].status).toBe('inside');
    });

    it('provides comprehensive statistics', () => {
      const containers = '192.168.0.0/16\n10.0.0.0/8';
      const candidates = '192.168.1.0/24\n192.168.2.0/24\n172.16.0.0/16';
      
      const result = computeCIDRContains(containers, candidates);
      
      expect(result.stats).toBeDefined();
      expect(result.stats.totalChecked).toBe(3);
      expect(result.stats.inside).toBe(2);
      expect(result.stats.setA.count).toBe(2);
    });

    it('handles invalid input gracefully', () => {
      const containers = '192.168.0.0/16\ninvalid-cidr';
      const candidates = '192.168.1.0/24\ninvalid-candidate';
      
      const result = computeCIDRContains(containers, candidates);
      
      // Should process valid entries and skip invalid ones
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.stats.totalChecked).toBeGreaterThan(0);
    });

    it('handles empty input', () => {
      const result = computeCIDRContains('', '');
      
      expect(result.checks).toHaveLength(0);
      expect(result.stats.totalChecked).toBe(0);
    });

    it('handles merge containers option', () => {
      const containers = '192.168.0.0/24\n192.168.1.0/24';
      const candidates = '192.168.0.0/16';
      
      const resultMerged = computeCIDRContains(containers, candidates, true);
      const resultUnmerged = computeCIDRContains(containers, candidates, false);
      
      expect(resultMerged.stats).toBeDefined();
      expect(resultUnmerged.stats).toBeDefined();
      // Both should process the check but may differ in internal logic
      expect(resultMerged.checks).toHaveLength(1);
      expect(resultUnmerged.checks).toHaveLength(1);
    });

    it('handles strict equality option', () => {
      const containers = '192.168.1.0/24';
      const candidates = '192.168.1.0/24';
      
      const resultStrict = computeCIDRContains(containers, candidates, true, true);
      const resultNormal = computeCIDRContains(containers, candidates, true, false);
      
      expect(resultStrict.checks).toHaveLength(1);
      expect(resultNormal.checks).toHaveLength(1);
      // Both should identify as equal, but strict mode may have different behavior
    });
  });
});