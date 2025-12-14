import { describe, it, expect } from 'vitest';
import { normalizeIPv6Addresses } from '../../../src/lib/utils/ipv6-normalize';

describe('ipv6-normalize', () => {
  describe('normalizeIPv6Addresses', () => {
    it('should normalize basic IPv6 addresses', () => {
      const inputs = ['2001:0db8:0000:0000:0000:0000:0000:0001'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations).toHaveLength(1);
      expect(result.normalizations[0].isValid).toBe(true);
      expect(result.normalizations[0].normalized).toBe('2001:db8::1');
      expect(result.normalizations[0].compressionApplied).toBe(true);
      expect(result.normalizations[0].leadingZerosRemoved).toBe(true);
      expect(result.normalizations[0].lowercaseApplied).toBe(false);
    });

    it('should handle uppercase letters', () => {
      const inputs = ['2001:DB8::1'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations[0].isValid).toBe(true);
      expect(result.normalizations[0].normalized).toBe('2001:db8::1');
      expect(result.normalizations[0].lowercaseApplied).toBe(true);
    });

    it('should compress longest zero sequence', () => {
      const inputs = ['2001:0:0:0:0:0:0:1'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations[0].isValid).toBe(true);
      expect(result.normalizations[0].normalized).toBe('2001::1');
      expect(result.normalizations[0].compressionApplied).toBe(true);
    });

    it('should handle already normalized addresses', () => {
      const inputs = ['2001:db8::1'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations[0].isValid).toBe(true);
      expect(result.normalizations[0].normalized).toBe('2001:db8::1');
      expect(result.normalizations[0].input).toBe(result.normalizations[0].normalized);
      expect(result.summary.alreadyNormalizedInputs).toBe(1);
    });

    it('should handle IPv4-mapped IPv6 addresses', () => {
      const inputs = ['::ffff:192.0.2.1'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations[0].isValid).toBe(true);
      expect(result.normalizations[0].normalized).toBe('::ffff:c000:201');
    });

    it('should handle loopback address', () => {
      const inputs = ['0000:0000:0000:0000:0000:0000:0000:0001'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations[0].isValid).toBe(true);
      expect(result.normalizations[0].normalized).toBe('::1');
    });

    it('should handle all zeros address', () => {
      const inputs = ['0000:0000:0000:0000:0000:0000:0000:0000'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations[0].isValid).toBe(true);
      expect(result.normalizations[0].normalized).toBe('::');
    });

    it('should compress only the first longest sequence', () => {
      const inputs = ['2001:0:0:1:0:0:0:1'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations[0].isValid).toBe(true);
      expect(result.normalizations[0].normalized).toBe('2001:0:0:1::1');
    });

    it('should not compress single zero groups', () => {
      const inputs = ['2001:db8:0:1:0:2:0:3'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations[0].isValid).toBe(true);
      expect(result.normalizations[0].normalized).toBe('2001:db8:0:1:0:2:0:3');
      expect(result.normalizations[0].compressionApplied).toBe(false);
    });

    it('should handle zone identifiers', () => {
      const inputs = ['fe80::1%eth0'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations[0].isValid).toBe(true);
      expect(result.normalizations[0].normalized).toBe('fe80::1%eth0');
    });

    it('should handle zone identifiers with compression', () => {
      const inputs = ['fe80:0000:0000:0000:0000:0000:0000:0001%eth0'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations[0].isValid).toBe(true);
      expect(result.normalizations[0].normalized).toBe('fe80::1%eth0');
    });

    it('should track normalization steps', () => {
      const inputs = ['2001:0DB8:0000:0000:0000:0000:0000:0001'];
      const result = normalizeIPv6Addresses(inputs);

      const steps = result.normalizations[0].steps;
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.some(step => step.description.includes('lowercase'))).toBe(true);
      expect(steps.some(step => step.description.includes('leading zeros'))).toBe(true);
      expect(steps.some(step => step.description.includes('Compress'))).toBe(true);
    });

    it('should handle invalid addresses', () => {
      const inputs = ['invalid::address::double', 'not-an-ipv6', '2001:db8::g'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations).toHaveLength(3);
      expect(result.normalizations.every(n => !n.isValid)).toBe(true);
      expect(result.summary.invalidInputs).toBe(3);
      expect(result.errors).toHaveLength(3);
    });

    it('should handle mixed valid and invalid addresses', () => {
      const inputs = ['2001:db8::1', 'invalid', 'fe80::1'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations).toHaveLength(3);
      expect(result.summary.validInputs).toBe(2);
      expect(result.summary.invalidInputs).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it('should ignore empty inputs', () => {
      const inputs = ['2001:db8::1', '', '  ', 'fe80::1'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations).toHaveLength(2);
      expect(result.summary.totalInputs).toBe(2);
    });

    it('should handle addresses that need no normalization steps', () => {
      const inputs = ['2001:db8::1'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations[0].normalized).toBe('2001:db8::1');
      expect(result.normalizations[0].input).toBe(result.normalizations[0].normalized);
    });

    it('should handle edge case with compression at start', () => {
      const inputs = ['::1:2:3:4:5'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations[0].isValid).toBe(true);
      expect(result.normalizations[0].normalized).toBe('::1:2:3:4:5');
    });

    it('should handle edge case with compression at end', () => {
      const inputs = ['1:2:3:4:5::'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations[0].isValid).toBe(true);
      expect(result.normalizations[0].normalized).toBe('1:2:3:4:5::');
    });

    it('should validate IPv4 part in IPv4-mapped addresses', () => {
      const inputs = ['::ffff:256.1.1.1']; // Invalid IPv4
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations[0].isValid).toBe(false);
    });

    it('should handle full form IPv6 addresses', () => {
      const inputs = ['2001:db8:85a3:8d3:1319:8a2e:370:7348'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations[0].isValid).toBe(true);
      expect(result.normalizations[0].normalized).toBe('2001:db8:85a3:8d3:1319:8a2e:370:7348');
    });

    it('should reject addresses with invalid characters', () => {
      const inputs = ['2001:db8::g001']; // Invalid hex character 'g'
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations[0].isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should reject addresses with groups too long', () => {
      const inputs = ['2001:db8::12345']; // Group too long
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations[0].isValid).toBe(false);
    });

    it('should reject addresses with triple colons', () => {
      const inputs = ['2001:::db8::1'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations[0].isValid).toBe(false);
    });

    it('should reject addresses with multiple :: sequences', () => {
      const inputs = ['2001::db8::1'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations[0].isValid).toBe(false);
    });

    it('should handle complex IPv4-mapped normalization', () => {
      const inputs = ['0000:0000:0000:0000:0000:ffff:192.0.2.1'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations[0].isValid).toBe(true);
      expect(result.normalizations[0].normalized).toBe('::ffff:c000:201');
    });

    it('should preserve zone identifier in normalization', () => {
      const inputs = ['FE80:0000:0000:0000:0000:0000:0000:0001%LO0'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.normalizations[0].isValid).toBe(true);
      expect(result.normalizations[0].normalized).toBe('fe80::1%LO0');
    });

    it('should calculate summary statistics correctly', () => {
      const inputs = ['2001:db8::1', 'invalid', 'fe80::1', '::1'];
      const result = normalizeIPv6Addresses(inputs);

      expect(result.summary.totalInputs).toBe(4);
      expect(result.summary.validInputs).toBe(3);
      expect(result.summary.invalidInputs).toBe(1);
      expect(result.summary.alreadyNormalizedInputs).toBeGreaterThanOrEqual(0);
    });

    it('should handle addresses requiring all normalization steps', () => {
      const inputs = ['2001:0DB8:0000:0000:0000:0000:0000:0001%ETH0'];
      const result = normalizeIPv6Addresses(inputs);

      const norm = result.normalizations[0];
      expect(norm.isValid).toBe(true);
      expect(norm.normalized).toBe('2001:db8::1%ETH0');
      expect(norm.lowercaseApplied).toBe(true);
      expect(norm.leadingZerosRemoved).toBe(true);
      expect(norm.compressionApplied).toBe(true);
    });
  });
});