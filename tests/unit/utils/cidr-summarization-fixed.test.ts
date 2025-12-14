import { describe, it, expect } from 'vitest';
import { parseInput, summarizeCIDRs } from '../../../src/lib/utils/cidr-summarization-fixed';

describe('cidr-summarization-fixed', () => {
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

    it('should parse IPv4 CIDR notation', () => {
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

    it('should parse IPv6 CIDR notation', () => {
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

    it('should throw error for invalid prefix', () => {
      expect(() => parseInput('192.168.1.0/33')).toThrow('Invalid prefix: 33');
      expect(() => parseInput('2001:db8::/129')).toThrow('Invalid prefix: 129');
    });

    it('should throw error for mixed version range', () => {
      expect(() => parseInput('192.168.1.1-2001:db8::1')).toThrow(
        'Range must use same IP version'
      );
    });

    it('should throw error for unrecognized format', () => {
      expect(() => parseInput('invalid')).toThrow('Cannot determine IP version');
    });
  });

  describe('summarizeCIDRs', () => {
    it('should summarize single IPv4 CIDR', () => {
      const result = summarizeCIDRs('192.168.1.0/24');

      expect(result.errors).toHaveLength(0);
      expect(result.ipv4).toContain('192.168.1.0/24');
      expect(result.ipv6).toHaveLength(0);
      expect(result.stats.originalIpv4Count).toBe(1);
      expect(result.stats.summarizedIpv4Count).toBe(1);
    });

    it('should summarize single IPv6 CIDR', () => {
      const result = summarizeCIDRs('2001:db8::/64');

      expect(result.errors).toHaveLength(0);
      expect(result.ipv4).toHaveLength(0);
      expect(result.ipv6.length).toBeGreaterThan(0);
      expect(result.stats.originalIpv6Count).toBe(1);
    });

    it('should merge adjacent IPv4 ranges', () => {
      const input = '192.168.1.0/25\n192.168.1.128/25';
      const result = summarizeCIDRs(input);

      expect(result.errors).toHaveLength(0);
      expect(result.ipv4).toContain('192.168.1.0/24');
      expect(result.stats.originalIpv4Count).toBe(2);
      expect(result.stats.summarizedIpv4Count).toBe(1);
    });

    it('should merge overlapping ranges', () => {
      const input = '192.168.1.0/24\n192.168.1.128/25';
      const result = summarizeCIDRs(input);

      expect(result.errors).toHaveLength(0);
      expect(result.ipv4).toContain('192.168.1.0/24');
      expect(result.stats.summarizedIpv4Count).toBe(1);
    });

    it('should handle non-adjacent ranges', () => {
      const input = '192.168.1.0/24\n192.168.3.0/24';
      const result = summarizeCIDRs(input);

      expect(result.errors).toHaveLength(0);
      expect(result.ipv4).toHaveLength(2);
      expect(result.stats.originalIpv4Count).toBe(2);
      expect(result.stats.summarizedIpv4Count).toBe(2);
    });

    it('should handle mixed IPv4 and IPv6', () => {
      const input = '192.168.1.0/24\n2001:db8::/64';
      const result = summarizeCIDRs(input);

      expect(result.errors).toHaveLength(0);
      expect(result.ipv4.length).toBeGreaterThan(0);
      expect(result.ipv6.length).toBeGreaterThan(0);
      expect(result.stats.originalIpv4Count).toBe(1);
      expect(result.stats.originalIpv6Count).toBe(1);
    });

    it('should handle single IP addresses', () => {
      const input = '192.168.1.1\n192.168.1.2\n192.168.1.3';
      const result = summarizeCIDRs(input);

      expect(result.errors).toHaveLength(0);
      expect(result.ipv4.length).toBeGreaterThan(0);
      expect(result.stats.originalIpv4Count).toBe(3);
    });

    it('should handle IP ranges', () => {
      const input = '192.168.1.1-192.168.1.10';
      const result = summarizeCIDRs(input);

      expect(result.errors).toHaveLength(0);
      expect(result.ipv4.length).toBeGreaterThan(0);
      expect(result.stats.originalIpv4Count).toBe(1);
    });

    it('should handle empty input', () => {
      const result = summarizeCIDRs('');

      expect(result.ipv4).toHaveLength(0);
      expect(result.ipv6).toHaveLength(0);
      expect(result.stats.originalIpv4Count).toBe(0);
      expect(result.stats.originalIpv6Count).toBe(0);
    });

    it('should handle invalid inputs gracefully', () => {
      const input = 'invalid-ip\n192.168.1.0/24';
      const result = summarizeCIDRs(input);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Line 1');
      expect(result.ipv4).toContain('192.168.1.0/24');
      expect(result.stats.originalIpv4Count).toBe(1);
    });

    it('should work with minimal-cover mode', () => {
      const input = '192.168.1.0/25\n192.168.1.128/25';
      const result = summarizeCIDRs(input, 'minimal-cover');

      expect(result.errors).toHaveLength(0);
      expect(result.ipv4.length).toBeGreaterThan(0);
      expect(result.stats.originalIpv4Count).toBe(2);
    });

    it('should work with exact-merge mode', () => {
      const input = '192.168.1.0/25\n192.168.1.128/25';
      const result = summarizeCIDRs(input, 'exact-merge');

      expect(result.errors).toHaveLength(0);
      expect(result.ipv4).toContain('192.168.1.0/24');
      expect(result.stats.summarizedIpv4Count).toBe(1);
    });

    it('should handle whitespace and empty lines', () => {
      const input = '\n192.168.1.0/24\n  \n192.168.2.0/24  \n';
      const result = summarizeCIDRs(input);

      expect(result.errors).toHaveLength(0);
      expect(result.stats.originalIpv4Count).toBe(2);
    });

    it('should calculate statistics correctly', () => {
      const input = '192.168.1.0/24\n192.168.2.0/24';
      const result = summarizeCIDRs(input);

      expect(result.stats.originalIpv4Count).toBe(2);
      expect(result.stats.originalIpv6Count).toBe(0);
      expect(result.stats.summarizedIpv4Count).toBe(2);
      expect(result.stats.summarizedIpv6Count).toBe(0);
      expect(result.stats.totalAddressesCovered).toBe('512');
    });

    it('should handle complex IPv6 summarization', () => {
      const input = '2001:db8::/65\n2001:db8:8000::/65';
      const result = summarizeCIDRs(input);

      expect(result.errors).toHaveLength(0);
      expect(result.ipv6.length).toBeGreaterThan(0);
      expect(result.stats.originalIpv6Count).toBe(2);
    });

    it('should prevent infinite loops with safety counter', () => {
      const input = '0.0.0.0/0'; // Very large range
      const result = summarizeCIDRs(input);

      expect(result.errors).toHaveLength(0);
      expect(result.ipv4.length).toBeGreaterThan(0);
      expect(result.ipv4.length).toBeLessThan(100); // Should not generate too many blocks
    });

    it('should handle edge case prefixes', () => {
      const input = '192.168.1.1/32\n10.0.0.0/8';
      const result = summarizeCIDRs(input);

      expect(result.errors).toHaveLength(0);
      expect(result.ipv4).toHaveLength(2);
      expect(result.stats.originalIpv4Count).toBe(2);
      expect(result.stats.summarizedIpv4Count).toBe(2);
    });

    it('should merge consecutive single IPs into ranges', () => {
      const input = '192.168.1.1\n192.168.1.2\n192.168.1.3\n192.168.1.4';
      const result = summarizeCIDRs(input);

      expect(result.errors).toHaveLength(0);
      expect(result.stats.originalIpv4Count).toBe(4);
      expect(result.stats.summarizedIpv4Count).toBeLessThan(4);
    });
  });
});