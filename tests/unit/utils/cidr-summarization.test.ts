import { describe, it, expect } from 'vitest';
import { parseInput, summarizeCIDRs } from '../../../src/lib/utils/cidr-summarization.js';

describe('CIDR Summarization Utilities', () => {
  describe('parseInput - IPv4 only', () => {
    it('should parse IPv4 single address', () => {
      const result = parseInput('192.168.1.1');
      expect(result.type).toBe('single');
      expect(result.version).toBe(4);
      expect(result.ip).toBe('192.168.1.1');
      expect(result.range.start).toBe(result.range.end);
      expect(result.range.start).toBeGreaterThan(0n);
    });

    it('should parse IPv4 CIDR', () => {
      const result = parseInput('192.168.1.0/24');
      expect(result.type).toBe('cidr');
      expect(result.version).toBe(4);
      expect(result.ip).toBe('192.168.1.0/24');
      expect(result.range.start).toBeLessThan(result.range.end);
    });

    it('should parse IPv4 range', () => {
      const result = parseInput('192.168.1.1-192.168.1.10');
      expect(result.type).toBe('range');
      expect(result.version).toBe(4);
      expect(result.ip).toBe('192.168.1.1-192.168.1.10');
      expect(result.range.start).toBeLessThan(result.range.end);
    });

    it('should reject invalid IPv4 address', () => {
      expect(() => parseInput('256.256.256.256')).toThrow('Invalid IP address');
    });

    it('should reject invalid prefix length', () => {
      expect(() => parseInput('192.168.1.0/33')).toThrow('Invalid prefix length');
    });
  });

  describe('summarizeCIDRs - IPv4 only', () => {
    it('should handle single IPv4 address', () => {
      const result = summarizeCIDRs('192.168.1.1');
      expect(result.ipv4).toEqual(['192.168.1.1/32']);
      expect(result.ipv6).toEqual([]);
      expect(result.stats.originalIpv4Count).toBe(1);
      expect(result.stats.summarizedIpv4Count).toBe(1);
      expect(result.errors).toEqual([]);
    });

    it('should handle single CIDR block', () => {
      const result = summarizeCIDRs('192.168.1.0/24');
      expect(result.ipv4).toEqual(['192.168.1.0/24']);
      expect(result.ipv6).toEqual([]);
      expect(result.stats.originalIpv4Count).toBe(1);
      expect(result.stats.summarizedIpv4Count).toBe(1);
    });

    it('should handle simple range', () => {
      const result = summarizeCIDRs('192.168.1.1-192.168.1.2');
      expect(result.ipv4).toEqual(['192.168.1.1/32', '192.168.1.2/32']);
      expect(result.errors).toEqual([]);
      expect(result.stats.totalAddressesCovered).toBe('2');
    });

    it('should handle multiple non-overlapping CIDRs', () => {
      const input = `192.168.1.0/24
192.168.2.0/24`;
      const result = summarizeCIDRs(input);
      expect(result.ipv4).toHaveLength(2);
      expect(result.stats.originalIpv4Count).toBe(2);
      expect(result.stats.summarizedIpv4Count).toBe(2);
    });

    it('should collect parse errors', () => {
      const input = `192.168.1.0/24
invalid.ip`;
      const result = summarizeCIDRs(input);
      expect(result.ipv4).toEqual(['192.168.1.0/24']);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Line 2');
    });

    it('should handle empty input', () => {
      const result = summarizeCIDRs('');
      expect(result.ipv4).toEqual([]);
      expect(result.ipv6).toEqual([]);
      expect(result.stats.originalIpv4Count).toBe(0);
      expect(result.errors).toEqual([]);
    });
  });
});