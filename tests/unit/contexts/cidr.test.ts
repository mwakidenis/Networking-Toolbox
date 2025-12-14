import { describe, it, expect, beforeEach } from 'vitest';
import { writable, get } from 'svelte/store';
import { cidrToMask, maskToCidr } from '$lib/utils/ip-calculations';
import { validateSubnetMask } from '$lib/utils/ip-validation';
import { COMMON_SUBNETS } from '$lib/constants/networks';

describe('CIDR Context Logic', () => {
  let cidr: any;
  let mask: any;
  let handleMaskChange: any;
  let getSubnetInfo: any;

  beforeEach(() => {
    // Recreate the context logic for testing
    cidr = writable<number>(24);
    mask = writable<string>('255.255.255.0');

    // Keep mask in sync when CIDR changes
    cidr.subscribe(($cidr: number) => {
      const m = cidrToMask($cidr).octets.join('.');
      if (get(mask) !== m) mask.set(m);
    });

    // Mask changes -> attempt to update CIDR (only when valid)
    handleMaskChange = (value: string) => {
      mask.set(value);
      if (validateSubnetMask(value).valid) {
        const newCidr = maskToCidr(value);
        if (get(cidr) !== newCidr) cidr.set(newCidr);
      }
    };

    getSubnetInfo = (c: number) => {
      const subnet = COMMON_SUBNETS.find((s) => s.cidr === c);
      return subnet || {
        cidr: c,
        mask: cidrToMask(c).octets.join('.'),
        hosts: Math.pow(2, 32 - c) - 2
      };
    };
  });

  describe('CIDR to Mask synchronization', () => {
    it('should update mask when CIDR changes', () => {
      cidr.set(16);
      expect(get(mask)).toBe('255.255.0.0');

      cidr.set(8);
      expect(get(mask)).toBe('255.0.0.0');

      cidr.set(30);
      expect(get(mask)).toBe('255.255.255.252');
    });

    it('should handle edge CIDR values', () => {
      cidr.set(0);
      expect(get(mask)).toBe('0.0.0.0');

      cidr.set(32);
      expect(get(mask)).toBe('255.255.255.255');

      cidr.set(1);
      expect(get(mask)).toBe('128.0.0.0');

      cidr.set(31);
      expect(get(mask)).toBe('255.255.255.254');
    });

    it('should handle all common subnet values', () => {
      COMMON_SUBNETS.forEach(subnet => {
        cidr.set(subnet.cidr);
        expect(get(mask)).toBe(subnet.mask);
      });
    });
  });

  describe('Mask to CIDR synchronization', () => {
    it('should update CIDR when valid mask changes', () => {
      handleMaskChange('255.255.0.0');
      expect(get(cidr)).toBe(16);

      handleMaskChange('255.0.0.0');
      expect(get(cidr)).toBe(8);

      handleMaskChange('255.255.255.252');
      expect(get(cidr)).toBe(30);
    });

    it('should handle edge mask values', () => {
      handleMaskChange('0.0.0.0');
      expect(get(cidr)).toBe(0);

      handleMaskChange('255.255.255.255');
      expect(get(cidr)).toBe(32);

      handleMaskChange('128.0.0.0');
      expect(get(cidr)).toBe(1);

      handleMaskChange('255.255.255.254');
      expect(get(cidr)).toBe(31);
    });

    it('should not update CIDR for invalid masks', () => {
      const originalCidr = get(cidr);

      // Invalid IP format
      handleMaskChange('256.255.255.0');
      expect(get(cidr)).toBe(originalCidr);

      // Non-contiguous mask
      handleMaskChange('255.255.0.255');
      expect(get(cidr)).toBe(originalCidr);

      // Invalid format
      handleMaskChange('invalid.mask');
      expect(get(cidr)).toBe(originalCidr);

      // Empty string
      handleMaskChange('');
      expect(get(cidr)).toBe(originalCidr);
    });

    it('should update mask store even for invalid values', () => {
      handleMaskChange('invalid.mask');
      expect(get(mask)).toBe('invalid.mask');

      handleMaskChange('256.255.255.0');
      expect(get(mask)).toBe('256.255.255.0');
    });
  });

  describe('getSubnetInfo function', () => {
    it('should return common subnet info for known CIDR values', () => {
      COMMON_SUBNETS.forEach(expectedSubnet => {
        const result = getSubnetInfo(expectedSubnet.cidr);
        expect(result).toEqual(expectedSubnet);
      });
    });

    it('should calculate info for uncommon CIDR values', () => {
      const testCases = [
        { cidr: 12, expectedHosts: Math.pow(2, 32 - 12) - 2 },
        { cidr: 18, expectedHosts: Math.pow(2, 32 - 18) - 2 },
        { cidr: 22, expectedHosts: Math.pow(2, 32 - 22) - 2 },
        { cidr: 31, expectedHosts: Math.pow(2, 32 - 31) - 2 }
      ];

      testCases.forEach(({ cidr, expectedHosts }) => {
        const result = getSubnetInfo(cidr);
        expect(result.cidr).toBe(cidr);
        expect(result.mask).toBe(cidrToMask(cidr).octets.join('.'));
        expect(result.hosts).toBe(expectedHosts);
      });
    });

    it('should handle edge cases', () => {
      const result0 = getSubnetInfo(0);
      expect(result0.cidr).toBe(0);
      expect(result0.mask).toBe('0.0.0.0');
      expect(result0.hosts).toBe(Math.pow(2, 32) - 2);

      const result32 = getSubnetInfo(32);
      expect(result32.cidr).toBe(32);
      expect(result32.mask).toBe('255.255.255.255');
      expect(result32.hosts).toBe(Math.pow(2, 0) - 2); // -1 effectively
    });

    it('should return consistent results', () => {
      for (let i = 0; i < 10; i++) {
        const result1 = getSubnetInfo(24);
        const result2 = getSubnetInfo(24);
        expect(result1).toEqual(result2);
      }
    });
  });

  describe('Bidirectional synchronization', () => {
    it('should maintain consistency during rapid changes', () => {
      const testSequence = [8, 16, 24, 25, 26, 27, 28, 29, 30];

      testSequence.forEach(targetCidr => {
        // Change via CIDR
        cidr.set(targetCidr);
        const maskAfterCidrChange = get(mask);

        // Change back via mask
        handleMaskChange(maskAfterCidrChange);
        const cidrAfterMaskChange = get(cidr);

        expect(cidrAfterMaskChange).toBe(targetCidr);
        expect(get(mask)).toBe(maskAfterCidrChange);
      });
    });

    it('should handle complex change sequences', () => {
      // Start with known state
      cidr.set(24);
      expect(get(mask)).toBe('255.255.255.0');

      // Change mask to different value
      handleMaskChange('255.255.255.128');
      expect(get(cidr)).toBe(25);

      // Change CIDR to another value
      cidr.set(26);
      expect(get(mask)).toBe('255.255.255.192');

      // Change mask back
      handleMaskChange('255.255.255.0');
      expect(get(cidr)).toBe(24);
    });

    it('should recover from invalid mask input', () => {
      cidr.set(24);
      const originalMask = get(mask);

      // Enter invalid mask
      handleMaskChange('invalid.mask');
      expect(get(mask)).toBe('invalid.mask');
      expect(get(cidr)).toBe(24); // Should remain unchanged

      // Enter valid mask
      handleMaskChange('255.255.0.0');
      expect(get(cidr)).toBe(16);
      expect(get(mask)).toBe('255.255.0.0');

      // Return to original via CIDR
      cidr.set(24);
      expect(get(mask)).toBe(originalMask);
    });
  });

  describe('Real-world usage patterns', () => {
    it('should handle user typing a mask gradually', () => {
      const typingSequence = [
        '2',
        '25',
        '255',
        '255.',
        '255.2',
        '255.25',
        '255.255',
        '255.255.',
        '255.255.2',
        '255.255.25',
        '255.255.255',
        '255.255.255.',
        '255.255.255.0'
      ];

      let finalCidr = get(cidr);

      typingSequence.forEach((partialMask, index) => {
        handleMaskChange(partialMask);
        expect(get(mask)).toBe(partialMask);

        // Only the final complete mask should update CIDR
        if (partialMask === '255.255.255.0') {
          expect(get(cidr)).toBe(24);
          finalCidr = 24;
        } else {
          // CIDR should remain unchanged for incomplete input
          expect(get(cidr)).toBe(finalCidr);
        }
      });
    });

    it('should handle common subnet selection workflow', () => {
      // Simulate user clicking through common subnets
      const commonCidrs = [24, 25, 26, 27, 28, 29, 30];

      commonCidrs.forEach(selectedCidr => {
        cidr.set(selectedCidr);
        const expectedMask = COMMON_SUBNETS.find(s => s.cidr === selectedCidr)?.mask ||
                           cidrToMask(selectedCidr).octets.join('.');
        expect(get(mask)).toBe(expectedMask);

        const subnetInfo = getSubnetInfo(selectedCidr);
        expect(subnetInfo.cidr).toBe(selectedCidr);
        expect(subnetInfo.mask).toBe(get(mask));
      });
    });

    it('should handle slider input simulation', () => {
      // Simulate dragging slider through values
      for (let sliderValue = 0; sliderValue <= 32; sliderValue++) {
        cidr.set(sliderValue);
        const currentMask = get(mask) as string;

        // Verify the mask is valid
        const validation = validateSubnetMask(currentMask);
        expect(validation.valid).toBe(true);

        // Verify round-trip conversion
        const convertedBack = maskToCidr(currentMask);
        expect(convertedBack).toBe(sliderValue);
      }
    });
  });

  describe('State consistency and integrity', () => {
    it('should maintain state integrity under stress', () => {
      const operations = [
        () => cidr.set(Math.floor(Math.random() * 33)),
        () => handleMaskChange('255.255.255.0'),
        () => handleMaskChange('255.255.0.0'),
        () => handleMaskChange('255.0.0.0'),
        () => cidr.set(24),
        () => cidr.set(16),
        () => cidr.set(8)
      ];

      for (let i = 0; i < 100; i++) {
        const operation = operations[Math.floor(Math.random() * operations.length)];
        operation();

        // Verify state is always consistent
        const currentCidr = get(cidr) as number;
        const currentMask = get(mask) as string;

        expect(currentCidr).toBeGreaterThanOrEqual(0);
        expect(currentCidr).toBeLessThanOrEqual(32);

        if (validateSubnetMask(currentMask).valid) {
          const expectedCidr = maskToCidr(currentMask);
          expect(currentCidr).toBe(expectedCidr);
        }

        const expectedMask = cidrToMask(currentCidr).octets.join('.');
        if (validateSubnetMask(currentMask).valid) {
          expect(currentMask).toBe(expectedMask);
        }
      }
    });

    it('should handle concurrent updates gracefully', () => {
      // Simulate rapid concurrent updates
      const updates = [];
      for (let i = 0; i < 50; i++) {
        updates.push(() => cidr.set(i % 33));
        updates.push(() => handleMaskChange(cidrToMask(i % 33).octets.join('.')));
      }

      // Execute all updates
      updates.forEach(update => update());

      // Verify final state is consistent
      const finalCidr = get(cidr) as number;
      const finalMask = get(mask) as string;
      const expectedMask = cidrToMask(finalCidr).octets.join('.');

      expect(finalMask).toBe(expectedMask);
      expect(maskToCidr(finalMask)).toBe(finalCidr);
    });
  });
});