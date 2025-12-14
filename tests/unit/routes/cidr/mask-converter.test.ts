import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { writable, get } from 'svelte/store';
import { cidrToMask, maskToCidr } from '$lib/utils/ip-calculations';
import { validateSubnetMask } from '$lib/utils/ip-validation';
import { COMMON_SUBNETS } from '$lib/constants/networks';

// Mock the navigation functions
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

vi.mock('$app/stores', () => ({
  page: writable({
    url: {
      pathname: '/cidr/mask-converter/cidr-to-subnet-mask'
    }
  })
}));

describe('CIDR Mask Converter Integration', () => {
  describe('Core Conversion Logic', () => {
    it('should convert CIDR to subnet mask correctly', () => {
      const testCases = [
        { cidr: 8, expected: '255.0.0.0' },
        { cidr: 16, expected: '255.255.0.0' },
        { cidr: 24, expected: '255.255.255.0' },
        { cidr: 25, expected: '255.255.255.128' },
        { cidr: 26, expected: '255.255.255.192' },
        { cidr: 27, expected: '255.255.255.224' },
        { cidr: 28, expected: '255.255.255.240' },
        { cidr: 29, expected: '255.255.255.248' },
        { cidr: 30, expected: '255.255.255.252' }
      ];

      testCases.forEach(({ cidr, expected }) => {
        const result = cidrToMask(cidr);
        expect(result.octets.join('.')).toBe(expected);
      });
    });

    it('should convert subnet mask to CIDR correctly', () => {
      const testCases = [
        { mask: '255.0.0.0', expected: 8 },
        { mask: '255.255.0.0', expected: 16 },
        { mask: '255.255.255.0', expected: 24 },
        { mask: '255.255.255.128', expected: 25 },
        { mask: '255.255.255.192', expected: 26 },
        { mask: '255.255.255.224', expected: 27 },
        { mask: '255.255.255.240', expected: 28 },
        { mask: '255.255.255.248', expected: 29 },
        { mask: '255.255.255.252', expected: 30 }
      ];

      testCases.forEach(({ mask, expected }) => {
        const result = maskToCidr(mask);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Context Integration', () => {
    let cidr: any;
    let mask: any;
    let handleMaskChange: any;
    let getSubnetInfo: any;

    beforeEach(() => {
      // Setup the context logic
      cidr = writable<number>(24);
      mask = writable<string>('255.255.255.0');

      cidr.subscribe(($cidr: number) => {
        const m = cidrToMask($cidr).octets.join('.');
        if (get(mask) !== m) mask.set(m);
      });

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

    it('should synchronize CIDR and mask bidirectionally', () => {
      // Test CIDR to mask
      cidr.set(16);
      expect(get(mask)).toBe('255.255.0.0');

      // Test mask to CIDR
      handleMaskChange('255.255.255.128');
      expect(get(cidr)).toBe(25);

      // Test round trip
      cidr.set(30);
      expect(get(mask)).toBe('255.255.255.252');
      handleMaskChange(get(mask));
      expect(get(cidr)).toBe(30);
    });

    it('should handle invalid mask input gracefully', () => {
      const originalCidr = get(cidr);

      // Test invalid masks
      handleMaskChange('invalid.mask');
      expect(get(mask)).toBe('invalid.mask');
      expect(get(cidr)).toBe(originalCidr); // Should not change

      handleMaskChange('256.255.255.0');
      expect(get(mask)).toBe('256.255.255.0');
      expect(get(cidr)).toBe(originalCidr); // Should not change

      // Test non-contiguous mask
      handleMaskChange('255.255.0.255');
      expect(get(mask)).toBe('255.255.0.255');
      expect(get(cidr)).toBe(originalCidr); // Should not change
    });

    it('should provide correct subnet information', () => {
      // Test common subnets
      COMMON_SUBNETS.forEach(subnet => {
        const info = getSubnetInfo(subnet.cidr);
        expect(info).toEqual(subnet);
      });

      // Test calculated subnet
      const info = getSubnetInfo(22);
      expect(info.cidr).toBe(22);
      expect(info.mask).toBe('255.255.252.0');
      expect(info.hosts).toBe(1022); // 2^10 - 2
    });
  });

  describe('Component State Management', () => {
    it('should handle slider value changes correctly', () => {
      const cidr = writable<number>(24);
      const mask = writable<string>('255.255.255.0');

      // Set up synchronization like in the actual component
      cidr.subscribe(($cidr: number) => {
        const m = cidrToMask($cidr).octets.join('.');
        if (get(mask) !== m) mask.set(m);
      });

      // Simulate slider changes
      const testValues = [8, 16, 20, 24, 26, 28, 30];

      testValues.forEach(value => {
        cidr.set(value);
        const expectedMask = cidrToMask(value).octets.join('.');

        // Check that mask gets updated
        expect(get(mask)).toBe(expectedMask);
      });
    });

    it('should validate mask input correctly', () => {
      const validMasks = [
        '255.255.255.0',
        '255.255.0.0',
        '255.0.0.0',
        '255.255.255.128',
        '255.255.255.192'
      ];

      const invalidMasks = [
        'invalid',
        '256.255.255.0',
        '255.255.0.255',
        '255.255.255.127'
      ];

      validMasks.forEach(mask => {
        const result = validateSubnetMask(mask);
        expect(result.valid).toBe(true);
      });

      invalidMasks.forEach(mask => {
        const result = validateSubnetMask(mask);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('Common Subnet Selection', () => {
    it('should handle common subnet button clicks', () => {
      const cidr = writable<number>(24);
      const mask = writable<string>('255.255.255.0');

      // Sync mask when CIDR changes
      cidr.subscribe(($cidr: number) => {
        const m = cidrToMask($cidr).octets.join('.');
        if (get(mask) !== m) mask.set(m);
      });

      // Test clicking different common subnets
      COMMON_SUBNETS.forEach(subnet => {
        cidr.set(subnet.cidr);
        expect(get(mask)).toBe(subnet.mask);
        expect(get(cidr)).toBe(subnet.cidr);
      });
    });

    it('should show active state for current subnet', () => {
      const currentCidr = 24;
      const activeSubnet = COMMON_SUBNETS.find(s => s.cidr === currentCidr);

      expect(activeSubnet).toBeDefined();
      expect(activeSubnet?.cidr).toBe(24);
      expect(activeSubnet?.mask).toBe('255.255.255.0');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle rapid value changes efficiently', () => {
      const cidr = writable<number>(24);
      const mask = writable<string>('255.255.255.0');

      cidr.subscribe(($cidr: number) => {
        const m = cidrToMask($cidr).octets.join('.');
        if (get(mask) !== m) mask.set(m);
      });

      const startTime = performance.now();

      // Rapid changes
      for (let i = 0; i < 1000; i++) {
        const randomCidr = Math.floor(Math.random() * 33);
        cidr.set(randomCidr);
        expect(get(mask)).toBe(cidrToMask(randomCidr).octets.join('.'));
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    it('should handle edge CIDR values correctly', () => {
      const testCases = [
        { cidr: 0, mask: '0.0.0.0' },
        { cidr: 1, mask: '128.0.0.0' },
        { cidr: 31, mask: '255.255.255.254' },
        { cidr: 32, mask: '255.255.255.255' }
      ];

      testCases.forEach(({ cidr, mask }) => {
        const result = cidrToMask(cidr);
        expect(result.octets.join('.')).toBe(mask);

        const backToCidr = maskToCidr(mask);
        expect(backToCidr).toBe(cidr);
      });
    });
  });

  describe('Host Calculation Accuracy', () => {
    it('should calculate host counts correctly', () => {
      const testCases = [
        { cidr: 24, expectedHosts: 254 },
        { cidr: 25, expectedHosts: 126 },
        { cidr: 26, expectedHosts: 62 },
        { cidr: 27, expectedHosts: 30 },
        { cidr: 28, expectedHosts: 14 },
        { cidr: 29, expectedHosts: 6 },
        { cidr: 30, expectedHosts: 2 }
      ];

      testCases.forEach(({ cidr, expectedHosts }) => {
        const calculatedHosts = Math.pow(2, 32 - cidr) - 2;
        expect(calculatedHosts).toBe(expectedHosts);
      });
    });

    it('should match COMMON_SUBNETS host counts', () => {
      COMMON_SUBNETS.forEach(subnet => {
        const calculatedHosts = Math.pow(2, 32 - subnet.cidr) - 2;
        expect(calculatedHosts).toBe(subnet.hosts);
      });
    });
  });

  describe('Binary Representation Accuracy', () => {
    it('should produce correct binary patterns for subnet masks', () => {
      const testCases = [
        {
          cidr: 24,
          mask: '255.255.255.0',
          binary: '11111111111111111111111100000000'
        },
        {
          cidr: 25,
          mask: '255.255.255.128',
          binary: '11111111111111111111111110000000'
        },
        {
          cidr: 26,
          mask: '255.255.255.192',
          binary: '11111111111111111111111111000000'
        }
      ];

      testCases.forEach(({ cidr, mask, binary }) => {
        const result = cidrToMask(cidr);
        expect(result.octets.join('.')).toBe(mask);

        const actualBinary = result.octets
          .map(octet => octet.toString(2).padStart(8, '0'))
          .join('');
        expect(actualBinary).toBe(binary);
      });
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle common network design scenarios', () => {
      const scenarios = [
        {
          name: 'Small office network',
          cidr: 24,
          mask: '255.255.255.0',
          hosts: 254,
          description: 'Typical small business network'
        },
        {
          name: 'Point-to-point link',
          cidr: 30,
          mask: '255.255.255.252',
          hosts: 2,
          description: 'Router-to-router connection'
        },
        {
          name: 'Large corporate segment',
          cidr: 16,
          mask: '255.255.0.0',
          hosts: 65534,
          description: 'Large department network'
        },
        {
          name: 'VLAN segment',
          cidr: 26,
          mask: '255.255.255.192',
          hosts: 62,
          description: 'Small department VLAN'
        }
      ];

      scenarios.forEach(scenario => {
        const maskResult = cidrToMask(scenario.cidr);
        expect(maskResult.octets.join('.')).toBe(scenario.mask);

        const cidrResult = maskToCidr(scenario.mask);
        expect(cidrResult).toBe(scenario.cidr);

        const hostCount = Math.pow(2, 32 - scenario.cidr) - 2;
        expect(hostCount).toBe(scenario.hosts);
      });
    });

    it('should handle subnet planning workflow', () => {
      // Simulate a network administrator planning subnets
      const requirements = [
        { department: 'Engineering', requiredHosts: 100, selectedCidr: 25 }, // 126 hosts
        { department: 'Sales', requiredHosts: 50, selectedCidr: 26 },        // 62 hosts
        { department: 'Admin', requiredHosts: 20, selectedCidr: 27 },        // 30 hosts
        { department: 'Guest', requiredHosts: 10, selectedCidr: 28 }         // 14 hosts
      ];

      requirements.forEach(req => {
        const availableHosts = Math.pow(2, 32 - req.selectedCidr) - 2;
        expect(availableHosts).toBeGreaterThanOrEqual(req.requiredHosts);

        const mask = cidrToMask(req.selectedCidr).octets.join('.');
        const validation = validateSubnetMask(mask);
        expect(validation.valid).toBe(true);
      });
    });
  });
});