import { describe, it, expect } from 'vitest';
import { parseInput, computeCIDRDifference } from '../../../src/lib/utils/cidr-diff';

describe('cidr-diff', () => {
  describe('parseInput', () => {
    it('should parse single IPv4 address', () => {
      const result = parseInput('192.168.1.1');
      expect(result).toEqual({
        ip: '192.168.1.1',
        type: 'single',
        version: 4,
        range: {
          start: 3232235777n,
          end: 3232235777n,
          version: 4,
        },
      });
    });

    it('should parse single IPv6 address', () => {
      const result = parseInput('2001:db8::1');
      expect(result.type).toBe('single');
      expect(result.version).toBe(6);
      expect(result.range.start).toBe(result.range.end);
    });

    it('should parse IPv4 CIDR', () => {
      const result = parseInput('192.168.1.0/24');
      expect(result).toEqual({
        ip: '192.168.1.0/24',
        type: 'cidr',
        version: 4,
        range: {
          start: 3232235776n,
          end: 3232236031n,
          version: 4,
        },
      });
    });

    it('should parse IPv6 CIDR', () => {
      const result = parseInput('2001:db8::/32');
      expect(result.type).toBe('cidr');
      expect(result.version).toBe(6);
      expect(result.range.end).toBeGreaterThan(result.range.start);
    });

    it('should parse IPv4 range', () => {
      const result = parseInput('192.168.1.1-192.168.1.10');
      expect(result).toEqual({
        ip: '192.168.1.1-192.168.1.10',
        type: 'range',
        version: 4,
        range: {
          start: 3232235777n,
          end: 3232235786n,
          version: 4,
        },
      });
    });

    it('should parse IPv6 range', () => {
      const result = parseInput('2001:db8::1-2001:db8::10');
      expect(result.type).toBe('range');
      expect(result.version).toBe(6);
      expect(result.range.end).toBeGreaterThan(result.range.start);
    });

    it('should throw error for invalid IPv4', () => {
      expect(() => parseInput('256.1.1.1')).toThrow('Invalid IPv4 address');
    });

    it('should throw error for invalid CIDR prefix', () => {
      expect(() => parseInput('192.168.1.0/33')).toThrow('Invalid prefix: 33');
    });

    it('should throw error for mixed version range', () => {
      expect(() => parseInput('192.168.1.1-2001:db8::1')).toThrow(
        'Range must use same IP version'
      );
    });

    it('should throw error for invalid range order', () => {
      expect(() => parseInput('192.168.1.10-192.168.1.1')).toThrow(
        'Invalid range: start must be <= end'
      );
    });

    it('should throw error for unrecognized format', () => {
      expect(() => parseInput('invalid')).toThrow('Cannot determine IP version');
    });
  });

  describe('computeCIDRDifference', () => {
    it('should compute simple IPv4 difference', () => {
      const result = computeCIDRDifference('192.168.0.0/16', '192.168.1.0/24');

      expect(result.errors).toHaveLength(0);
      expect(result.ipv4.length).toBeGreaterThan(0);
      expect(result.ipv6).toHaveLength(0);
      expect(result.stats.efficiency).toBeLessThan(100);
      expect(result.stats.output.count).toBeGreaterThan(0);
    });

    it('should compute simple IPv6 difference', () => {
      const result = computeCIDRDifference('2001:db8::/32', '2001:db8:1::/48');

      expect(result.errors).toHaveLength(0);
      expect(result.ipv4).toHaveLength(0);
      expect(result.ipv6.length).toBeGreaterThan(0);
      expect(result.stats.efficiency).toBeLessThan(100);
    });

    it('should handle complete overlap', () => {
      const result = computeCIDRDifference('192.168.1.0/24', '192.168.0.0/16');

      expect(result.errors).toHaveLength(0);
      expect(result.ipv4).toHaveLength(0);
      expect(result.stats.efficiency).toBe(0);
    });

    it('should handle no overlap', () => {
      const result = computeCIDRDifference('192.168.1.0/24', '10.0.0.0/8');

      expect(result.errors).toHaveLength(0);
      expect(result.ipv4).toContain('192.168.1.0/24');
      expect(result.stats.efficiency).toBe(100);
    });

    it('should handle multiple inputs', () => {
      const inputA = '192.168.1.0/24\n192.168.2.0/24';
      const inputB = '192.168.1.128/25';
      const result = computeCIDRDifference(inputA, inputB);

      expect(result.errors).toHaveLength(0);
      expect(result.ipv4.length).toBeGreaterThan(1);
      expect(result.stats.inputA.count).toBe(2);
      expect(result.stats.inputB.count).toBe(1);
    });

    it('should handle range inputs', () => {
      const result = computeCIDRDifference(
        '192.168.1.1-192.168.1.100',
        '192.168.1.50-192.168.1.60'
      );

      expect(result.errors).toHaveLength(0);
      expect(result.ipv4.length).toBeGreaterThan(0);
      expect(result.stats.efficiency).toBeLessThan(100);
    });

    it('should handle mixed IPv4 and IPv6', () => {
      const inputA = '192.168.1.0/24\n2001:db8::/64';
      const inputB = '192.168.1.128/25\n2001:db8::1000/112';
      const result = computeCIDRDifference(inputA, inputB);

      expect(result.errors).toHaveLength(0);
      expect(result.ipv4.length).toBeGreaterThan(0);
      expect(result.ipv6.length).toBeGreaterThan(0);
    });

    it('should handle empty inputs', () => {
      const result = computeCIDRDifference('', '');

      expect(result.ipv4).toHaveLength(0);
      expect(result.ipv6).toHaveLength(0);
      expect(result.stats.efficiency).toBe(0);
    });

    it('should handle invalid inputs gracefully', () => {
      const result = computeCIDRDifference('invalid-ip', '192.168.1.0/24');

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Set A line 1');
    });

    it('should respect constrained alignment mode', () => {
      const result = computeCIDRDifference(
        '192.168.1.0/24',
        '192.168.1.128/25',
        'constrained',
        24
      );

      expect(result.errors).toHaveLength(0);
      expect(result.ipv4.length).toBeGreaterThan(0);
    });

    it('should handle single IP address inputs', () => {
      const result = computeCIDRDifference('192.168.1.1', '192.168.1.1');

      expect(result.ipv4).toHaveLength(0);
      expect(result.stats.efficiency).toBe(0);
    });

    it('should calculate correct statistics', () => {
      const result = computeCIDRDifference('192.168.0.0/24', '192.168.0.128/25');

      expect(result.stats.inputA.addresses).toBe('256');
      expect(result.stats.inputB.addresses).toBe('128');
      expect(result.stats.output.addresses).toBe('128');
      expect(result.stats.removed.addresses).toBe('128');
      expect(result.stats.efficiency).toBe(50);
    });

    it('should create visualization data', () => {
      const result = computeCIDRDifference('192.168.1.0/24', '192.168.1.128/25');

      expect(result.visualization).toBeDefined();
      expect(result.visualization.version).toBe(4);
      expect(result.visualization.setA).toHaveLength(1);
      expect(result.visualization.setB).toHaveLength(1);
      expect(result.visualization.result.length).toBeGreaterThan(0);
      expect(result.visualization.totalRange.start).toBeDefined();
      expect(result.visualization.totalRange.end).toBeDefined();
    });

    it('should handle whitespace and empty lines', () => {
      const inputA = '\n192.168.1.0/24\n  \n192.168.2.0/24  \n';
      const inputB = '  192.168.1.128/25  \n\n';
      const result = computeCIDRDifference(inputA, inputB);

      expect(result.errors).toHaveLength(0);
      expect(result.stats.inputA.count).toBe(2);
      expect(result.stats.inputB.count).toBe(1);
    });
  });
});