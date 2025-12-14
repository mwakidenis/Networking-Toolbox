import { describe, it, expect } from 'vitest';
import { cidrToMask, maskToCidr } from '$lib/utils/ip-calculations';
import { validateSubnetMask } from '$lib/utils/ip-validation';

describe('Mask Conversion Utilities', () => {
  describe('cidrToMask', () => {
    it('should convert common CIDR values to correct subnet masks', () => {
      expect(cidrToMask(8).octets.join('.')).toBe('255.0.0.0');
      expect(cidrToMask(16).octets.join('.')).toBe('255.255.0.0');
      expect(cidrToMask(24).octets.join('.')).toBe('255.255.255.0');
      expect(cidrToMask(25).octets.join('.')).toBe('255.255.255.128');
      expect(cidrToMask(26).octets.join('.')).toBe('255.255.255.192');
      expect(cidrToMask(27).octets.join('.')).toBe('255.255.255.224');
      expect(cidrToMask(28).octets.join('.')).toBe('255.255.255.240');
      expect(cidrToMask(29).octets.join('.')).toBe('255.255.255.248');
      expect(cidrToMask(30).octets.join('.')).toBe('255.255.255.252');
      expect(cidrToMask(31).octets.join('.')).toBe('255.255.255.254');
      expect(cidrToMask(32).octets.join('.')).toBe('255.255.255.255');
    });

    it('should handle edge cases', () => {
      expect(cidrToMask(0).octets.join('.')).toBe('0.0.0.0');
      expect(cidrToMask(1).octets.join('.')).toBe('128.0.0.0');
      expect(cidrToMask(7).octets.join('.')).toBe('254.0.0.0');
      expect(cidrToMask(9).octets.join('.')).toBe('255.128.0.0');
      expect(cidrToMask(15).octets.join('.')).toBe('255.254.0.0');
      expect(cidrToMask(17).octets.join('.')).toBe('255.255.128.0');
      expect(cidrToMask(23).octets.join('.')).toBe('255.255.254.0');
    });

    it('should return correct octets array', () => {
      const mask24 = cidrToMask(24);
      expect(mask24.octets).toEqual([255, 255, 255, 0]);

      const mask26 = cidrToMask(26);
      expect(mask26.octets).toEqual([255, 255, 255, 192]);

      const mask30 = cidrToMask(30);
      expect(mask30.octets).toEqual([255, 255, 255, 252]);
    });

    it('should handle all valid CIDR values (0-32)', () => {
      for (let cidr = 0; cidr <= 32; cidr++) {
        const result = cidrToMask(cidr);
        expect(result).toBeDefined();
        expect(result.octets.join('.')).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
        expect(result.octets).toHaveLength(4);
        expect(result.octets.every(octet => octet >= 0 && octet <= 255)).toBe(true);
      }
    });

    it('should produce valid subnet masks', () => {
      for (let cidr = 0; cidr <= 32; cidr++) {
        const mask = cidrToMask(cidr);
        const validation = validateSubnetMask(mask.octets.join('.'));
        expect(validation.valid).toBe(true);
      }
    });
  });

  describe('maskToCidr', () => {
    it('should convert common subnet masks to correct CIDR values', () => {
      expect(maskToCidr('255.0.0.0')).toBe(8);
      expect(maskToCidr('255.255.0.0')).toBe(16);
      expect(maskToCidr('255.255.255.0')).toBe(24);
      expect(maskToCidr('255.255.255.128')).toBe(25);
      expect(maskToCidr('255.255.255.192')).toBe(26);
      expect(maskToCidr('255.255.255.224')).toBe(27);
      expect(maskToCidr('255.255.255.240')).toBe(28);
      expect(maskToCidr('255.255.255.248')).toBe(29);
      expect(maskToCidr('255.255.255.252')).toBe(30);
      expect(maskToCidr('255.255.255.254')).toBe(31);
      expect(maskToCidr('255.255.255.255')).toBe(32);
    });

    it('should handle edge cases', () => {
      expect(maskToCidr('0.0.0.0')).toBe(0);
      expect(maskToCidr('128.0.0.0')).toBe(1);
      expect(maskToCidr('254.0.0.0')).toBe(7);
      expect(maskToCidr('255.128.0.0')).toBe(9);
      expect(maskToCidr('255.254.0.0')).toBe(15);
      expect(maskToCidr('255.255.128.0')).toBe(17);
      expect(maskToCidr('255.255.254.0')).toBe(23);
    });

    it('should handle less common valid subnet masks', () => {
      expect(maskToCidr('192.0.0.0')).toBe(2);
      expect(maskToCidr('224.0.0.0')).toBe(3);
      expect(maskToCidr('240.0.0.0')).toBe(4);
      expect(maskToCidr('248.0.0.0')).toBe(5);
      expect(maskToCidr('252.0.0.0')).toBe(6);
      expect(maskToCidr('255.192.0.0')).toBe(10);
      expect(maskToCidr('255.224.0.0')).toBe(11);
      expect(maskToCidr('255.240.0.0')).toBe(12);
      expect(maskToCidr('255.248.0.0')).toBe(13);
      expect(maskToCidr('255.252.0.0')).toBe(14);
    });

    it('should return values in the valid CIDR range', () => {
      const validMasks = [
        '0.0.0.0', '128.0.0.0', '192.0.0.0', '224.0.0.0', '240.0.0.0',
        '248.0.0.0', '252.0.0.0', '254.0.0.0', '255.0.0.0', '255.128.0.0',
        '255.192.0.0', '255.224.0.0', '255.240.0.0', '255.248.0.0',
        '255.252.0.0', '255.254.0.0', '255.255.0.0', '255.255.128.0',
        '255.255.192.0', '255.255.224.0', '255.255.240.0', '255.255.248.0',
        '255.255.252.0', '255.255.254.0', '255.255.255.0', '255.255.255.128',
        '255.255.255.192', '255.255.255.224', '255.255.255.240',
        '255.255.255.248', '255.255.255.252', '255.255.255.254', '255.255.255.255'
      ];

      validMasks.forEach(mask => {
        const cidr = maskToCidr(mask);
        expect(cidr).toBeGreaterThanOrEqual(0);
        expect(cidr).toBeLessThanOrEqual(32);
      });
    });
  });

  describe('validateSubnetMask', () => {
    it('should validate correct subnet masks', () => {
      const validMasks = [
        '255.255.255.0',
        '255.255.255.128',
        '255.255.255.192',
        '255.255.255.224',
        '255.255.255.240',
        '255.255.255.248',
        '255.255.255.252',
        '255.255.255.254',
        '255.255.255.255',
        '255.255.0.0',
        '255.0.0.0',
        '0.0.0.0'
      ];

      validMasks.forEach(mask => {
        const result = validateSubnetMask(mask);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid IP formats', () => {
      const invalidFormats = [
        '256.255.255.0',
        '255.256.255.0',
        '255.255.256.0',
        '255.255.255.256',
        '255.255.255',
        '255.255.255.0.0',
        'invalid.mask.format',
        '255.255.255.-1',
        '',
        '...'
      ];

      invalidFormats.forEach(mask => {
        const result = validateSubnetMask(mask);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should reject non-contiguous subnet masks', () => {
      const nonContiguousMasks = [
        '255.255.0.255',  // Gap in the middle
        '255.254.255.0',  // Gap in second octet
        '255.0.255.0',    // Gap in third octet
        '128.255.255.0',  // Gap in first octet
        '255.255.255.128', // Actually valid, but let's test edge case
        '255.255.255.254', // Valid
        '255.255.255.127', // Invalid - not contiguous
        '255.255.255.191', // Invalid - not contiguous
        '255.255.255.63',  // Invalid - not contiguous
        '255.255.128.128', // Invalid - gap
        '254.254.0.0',     // Invalid - non-contiguous
        '129.0.0.0'        // Invalid - non-contiguous
      ];

      // Filter to only test the actually non-contiguous ones
      const actuallyInvalid = [
        '255.255.0.255',
        '255.254.255.0',
        '255.0.255.0',
        '128.255.255.0',
        '255.255.255.127',
        '255.255.255.191',
        '255.255.255.63',
        '255.255.128.128',
        '254.254.0.0',
        '129.0.0.0'
      ];

      actuallyInvalid.forEach(mask => {
        const result = validateSubnetMask(mask);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('contiguous');
      });
    });

    it('should validate all generated CIDR-to-mask conversions', () => {
      for (let cidr = 0; cidr <= 32; cidr++) {
        const mask = cidrToMask(cidr);
        const validation = validateSubnetMask(mask.octets.join('.'));
        expect(validation.valid).toBe(true);
      }
    });
  });

  describe('Round-trip conversions', () => {
    it('should maintain accuracy in CIDR → Mask → CIDR conversions', () => {
      for (let originalCidr = 0; originalCidr <= 32; originalCidr++) {
        const mask = cidrToMask(originalCidr);
        const convertedCidr = maskToCidr(mask.octets.join('.'));
        expect(convertedCidr).toBe(originalCidr);
      }
    });

    it('should maintain accuracy in Mask → CIDR → Mask conversions', () => {
      const testMasks = [
        '0.0.0.0',
        '128.0.0.0',
        '255.0.0.0',
        '255.255.0.0',
        '255.255.255.0',
        '255.255.255.128',
        '255.255.255.192',
        '255.255.255.224',
        '255.255.255.240',
        '255.255.255.248',
        '255.255.255.252',
        '255.255.255.254',
        '255.255.255.255'
      ];

      testMasks.forEach(originalMask => {
        const cidr = maskToCidr(originalMask);
        const convertedMask = cidrToMask(cidr);
        expect(convertedMask.octets.join('.')).toBe(originalMask);
      });
    });
  });

  describe('Binary representation accuracy', () => {
    it('should produce masks with correct binary patterns', () => {
      const testCases = [
        { cidr: 8, expectedBinary: '11111111000000000000000000000000' },
        { cidr: 16, expectedBinary: '11111111111111110000000000000000' },
        { cidr: 24, expectedBinary: '11111111111111111111111100000000' },
        { cidr: 25, expectedBinary: '11111111111111111111111110000000' },
        { cidr: 26, expectedBinary: '11111111111111111111111111000000' },
        { cidr: 30, expectedBinary: '11111111111111111111111111111100' }
      ];

      testCases.forEach(({ cidr, expectedBinary }) => {
        const mask = cidrToMask(cidr);
        const actualBinary = mask.octets
          .map(octet => octet.toString(2).padStart(8, '0'))
          .join('');
        expect(actualBinary).toBe(expectedBinary);
      });
    });

    it('should parse binary correctly in maskToCidr', () => {
      const testMasks = [
        { mask: '255.0.0.0', expectedOnes: 8 },
        { mask: '255.255.0.0', expectedOnes: 16 },
        { mask: '255.255.255.0', expectedOnes: 24 },
        { mask: '255.255.255.128', expectedOnes: 25 },
        { mask: '255.255.255.192', expectedOnes: 26 },
        { mask: '255.255.255.252', expectedOnes: 30 }
      ];

      testMasks.forEach(({ mask, expectedOnes }) => {
        const cidr = maskToCidr(mask);
        expect(cidr).toBe(expectedOnes);
      });
    });
  });

  describe('Performance and stress tests', () => {
    it('should handle rapid conversions efficiently', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        for (let cidr = 0; cidr <= 32; cidr++) {
          const mask = cidrToMask(cidr);
          const backToCidr = maskToCidr(mask.octets.join('.'));
          expect(backToCidr).toBe(cidr);
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete 33,000 conversions in reasonable time (< 1 second, allowing some buffer)
      expect(duration).toBeLessThan(1100);
    });

    it('should maintain consistency across multiple rapid calls', () => {
      const results = new Set();

      for (let i = 0; i < 100; i++) {
        const mask24 = cidrToMask(24);
        results.add(mask24.octets.join('.'));
      }

      expect(results.size).toBe(1);
      expect(results.has('255.255.255.0')).toBe(true);
    });
  });

  describe('Edge cases and error conditions', () => {
    it('should handle boundary CIDR values correctly', () => {
      // Test exact boundaries
      expect(cidrToMask(0).octets.join('.')).toBe('0.0.0.0');
      expect(cidrToMask(32).octets.join('.')).toBe('255.255.255.255');

      // Test near boundaries
      expect(cidrToMask(1).octets.join('.')).toBe('128.0.0.0');
      expect(cidrToMask(31).octets.join('.')).toBe('255.255.255.254');
    });

    it('should handle boundary subnet masks correctly', () => {
      expect(maskToCidr('0.0.0.0')).toBe(0);
      expect(maskToCidr('255.255.255.255')).toBe(32);
      expect(maskToCidr('128.0.0.0')).toBe(1);
      expect(maskToCidr('255.255.255.254')).toBe(31);
    });

    it('should validate complex subnet mask patterns', () => {
      // Test various valid patterns
      const complexValid = [
        '255.255.255.0',   // Standard /24
        '255.255.254.0',   // /23
        '255.255.252.0',   // /22
        '255.255.248.0',   // /21
        '255.255.240.0',   // /20
        '255.255.224.0',   // /19
        '255.255.192.0',   // /18
        '255.255.128.0',   // /17
      ];

      complexValid.forEach(mask => {
        const validation = validateSubnetMask(mask);
        expect(validation.valid).toBe(true);

        const cidr = maskToCidr(mask);
        const backToMask = cidrToMask(cidr);
        expect(backToMask.octets.join('.')).toBe(mask);
      });
    });
  });
});
