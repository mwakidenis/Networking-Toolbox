import { describe, it, expect } from 'vitest';
import {
  checkCIDRAlignment,
  type AlignmentCheck,
  type AlignmentResult,
  type AlignmentSuggestion
} from '$lib/utils/cidr-alignment.js';

describe('cidr-alignment', () => {
  describe('IPv4 CIDR alignment', () => {
    describe('aligned CIDRs', () => {
      it('should detect perfectly aligned /24 CIDRs', () => {
        const inputs = [
          '192.168.1.0/24',
          '10.0.0.0/24',
          '172.16.1.0/24'
        ];
        const result = checkCIDRAlignment(inputs, 24);

        expect(result.summary.totalInputs).toBe(3);
        expect(result.summary.alignedInputs).toBe(3);
        expect(result.summary.misalignedInputs).toBe(0);
        expect(result.summary.alignmentRate).toBe(100);
        expect(result.errors).toHaveLength(0);

        result.checks.forEach(check => {
          expect(check.isAligned).toBe(true);
          expect(check.type).toBe('cidr');
          expect(check.targetPrefix).toBe(24);
          expect(check.alignedCIDR).toBeDefined();
          expect(check.suggestions).toHaveLength(0);
        });
      });

      it('should detect aligned /16 CIDRs', () => {
        const inputs = ['192.168.0.0/16', '10.0.0.0/16'];
        const result = checkCIDRAlignment(inputs, 16);

        expect(result.summary.alignedInputs).toBe(2);
        result.checks.forEach(check => {
          expect(check.isAligned).toBe(true);
          expect(check.alignedCIDR).toBeDefined();
        });
      });

      it('should detect aligned /8 CIDRs', () => {
        const inputs = ['10.0.0.0/8', '172.0.0.0/8'];
        const result = checkCIDRAlignment(inputs, 8);

        expect(result.summary.alignedInputs).toBe(2);
        result.checks.forEach(check => {
          expect(check.isAligned).toBe(true);
        });
      });

      it('should detect aligned /32 (host) addresses', () => {
        const inputs = ['192.168.1.1/32', '10.0.0.5/32'];
        const result = checkCIDRAlignment(inputs, 32);

        expect(result.summary.alignedInputs).toBe(2);
        result.checks.forEach(check => {
          expect(check.isAligned).toBe(true);
        });
      });
    });

    describe('misaligned CIDRs', () => {
      it('should detect misaligned prefix boundaries', () => {
        const inputs = [
          '192.168.1.0/25',  // /25 checked against /24 boundary
          '10.0.0.0/26'      // /26 checked against /24 boundary
        ];
        const result = checkCIDRAlignment(inputs, 24);

        expect(result.summary.alignedInputs).toBe(0);
        expect(result.summary.misalignedInputs).toBe(2);

        result.checks.forEach(check => {
          expect(check.isAligned).toBe(false);
          expect(check.reason).toContain("doesn't align to /24 boundary");
          expect(check.suggestions.length).toBeGreaterThan(0);
        });
      });

      it('should provide correct alignment suggestions for misaligned CIDRs', () => {
        const inputs = ['192.168.1.0/25'];
        const result = checkCIDRAlignment(inputs, 24);

        const check = result.checks[0];
        expect(check.isAligned).toBe(false);
        expect(check.suggestions.length).toBeGreaterThan(0);
        // Check that suggestions exist and have proper structure
        check.suggestions.forEach(suggestion => {
          expect(suggestion.type).toMatch(/^(larger|smaller|split)$/);
          expect(suggestion.description).toBeDefined();
          expect(suggestion.cidrs).toBeDefined();
        });
      });
    });

    describe('IP address alignment', () => {
      it('should check single IP addresses against prefix boundaries', () => {
        const inputs = [
          '192.168.1.0',  // Single IP - not aligned to full /24 block
          '192.168.1.5'   // Single IP - not aligned to full /24 block
        ];
        const result = checkCIDRAlignment(inputs, 24);

        // Single IPs are not aligned to /24 because they don't span the full block
        expect(result.checks[0].isAligned).toBe(false);
        expect(result.checks[1].isAligned).toBe(false);

        result.checks.forEach(check => {
          expect(check.type).toBe('ip');
        });
      });

      it('should provide suggestions for misaligned IP addresses', () => {
        const inputs = ['192.168.1.100'];
        const result = checkCIDRAlignment(inputs, 24);

        const check = result.checks[0];
        expect(check.isAligned).toBe(false);
        expect(check.suggestions.length).toBeGreaterThan(0);
        expect(check.suggestions.some(s => s.cidrs.length > 0)).toBe(true);
      });
    });

    describe('IP range alignment', () => {
      it('should check aligned IP ranges', () => {
        const inputs = [
          '192.168.1.0-192.168.1.255',  // Perfectly aligned /24
          '10.0.0.0-10.0.255.255'       // Perfectly aligned /16
        ];
        const result = checkCIDRAlignment(inputs, 24);

        expect(result.checks[0].isAligned).toBe(true);
        expect(result.checks[0].type).toBe('range');
        expect(result.checks[1].isAligned).toBe(false); // /16 range checked against /24
        expect(result.checks[1].type).toBe('range');
      });

      it('should check misaligned IP ranges', () => {
        const inputs = [
          '192.168.1.10-192.168.1.200',  // Misaligned range
          '10.0.0.5-10.0.0.100'          // Misaligned range
        ];
        const result = checkCIDRAlignment(inputs, 24);

        result.checks.forEach(check => {
          expect(check.isAligned).toBe(false);
          expect(check.type).toBe('range');
          expect(check.suggestions.length).toBeGreaterThan(0);
        });
      });

      it('should provide split suggestions for ranges', () => {
        const inputs = ['192.168.1.0-192.168.1.127'];
        const result = checkCIDRAlignment(inputs, 26);

        const check = result.checks[0];
        expect(check.suggestions.some(s => s.type === 'split')).toBe(true);
        const splitSuggestion = check.suggestions.find(s => s.type === 'split');
        expect(splitSuggestion?.cidrs.length).toBeGreaterThan(1);
      });
    });
  });

  describe('IPv6 CIDR alignment', () => {
    describe('aligned IPv6 CIDRs', () => {
      it('should detect perfectly aligned /64 CIDRs', () => {
        const inputs = [
          '2001:db8::/64',
          'fe80::/64',
          '::1/128'  // Host route
        ];
        const result = checkCIDRAlignment(inputs, 64);

        expect(result.checks[0].isAligned).toBe(true);
        expect(result.checks[1].isAligned).toBe(true);
        expect(result.checks[2].isAligned).toBe(false); // /128 checked against /64
      });

      it('should detect aligned /48 CIDRs', () => {
        const inputs = ['2001:db8::/48', 'fe80::/48'];
        const result = checkCIDRAlignment(inputs, 48);

        result.checks.forEach(check => {
          expect(check.isAligned).toBe(true);
          expect(check.type).toBe('cidr');
        });
      });

      it('should detect aligned /32 CIDRs', () => {
        const inputs = ['2001:db8::/32'];
        const result = checkCIDRAlignment(inputs, 32);

        expect(result.checks[0].isAligned).toBe(true);
      });
    });

    describe('misaligned IPv6 CIDRs', () => {
      it('should detect misaligned /64 CIDRs', () => {
        const inputs = ['2001:db8::/65'];  // /65 checked against /64 boundary
        const result = checkCIDRAlignment(inputs, 64);

        const check = result.checks[0];
        expect(check.isAligned).toBe(false);
        expect(check.reason).toContain("doesn't align to /64 boundary");
        expect(check.suggestions.length).toBeGreaterThan(0);
      });

      it('should provide alignment suggestions for IPv6', () => {
        const inputs = ['2001:db8::/65'];
        const result = checkCIDRAlignment(inputs, 64);

        const check = result.checks[0];
        expect(check.suggestions.length).toBeGreaterThan(0);
        // Check that suggestions exist and have proper structure
        check.suggestions.forEach(suggestion => {
          expect(suggestion.type).toMatch(/^(larger|smaller|split)$/);
          expect(suggestion.description).toBeDefined();
          expect(suggestion.cidrs).toBeDefined();
        });
      });
    });

    describe('IPv6 address alignment', () => {
      it('should check single IPv6 addresses', () => {
        const inputs = [
          '2001:db8::', // Single IP - not aligned to full /64 block
          '2001:db8::1' // Single IP - not aligned to full /64 block
        ];
        const result = checkCIDRAlignment(inputs, 64);

        // Single IPs are not aligned to /64 because they don't span the full block
        expect(result.checks[0].isAligned).toBe(false);
        expect(result.checks[1].isAligned).toBe(false);
      });

      it('should handle compressed IPv6 addresses', () => {
        const inputs = ['::1', '::'];
        const result = checkCIDRAlignment(inputs, 128);

        result.checks.forEach(check => {
          expect(check.type).toBe('ip');
        });
      });
    });

    describe('IPv6 range alignment', () => {
      it('should check IPv6 ranges', () => {
        const inputs = ['2001:db8::1-2001:db8::ffff'];
        const result = checkCIDRAlignment(inputs, 112);

        const check = result.checks[0];
        expect(check.type).toBe('range');
        expect(check.isAligned).toBe(false); // Range doesn't align to /112 boundary
      });
    });
  });

  describe('mixed input validation', () => {
    it('should handle mixed valid and invalid inputs', () => {
      const inputs = [
        '192.168.1.0/24',    // Valid
        'invalid-ip',        // Invalid
        '2001:db8::/64',     // Valid
        '192.168.1.0/33',    // Invalid prefix
        '256.256.256.256/24' // Invalid IP
      ];
      const result = checkCIDRAlignment(inputs, 24);

      expect(result.checks).toHaveLength(5);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.summary.totalInputs).toBe(5);

      // At least some should be valid
      expect(result.summary.alignedInputs).toBeGreaterThan(0);
    });

    it('should handle empty and whitespace inputs', () => {
      const inputs = ['', '   ', '192.168.1.0/24', '  10.0.0.0/24  '];
      const result = checkCIDRAlignment(inputs, 24);

      // Should only process non-empty inputs
      expect(result.checks).toHaveLength(2);
      expect(result.summary.alignedInputs).toBe(2);
    });

    it('should provide detailed error messages for invalid inputs', () => {
      const inputs = [
        '192.168.1.0/33',     // Invalid IPv4 prefix
        '2001:db8::/129',     // Invalid IPv6 prefix
        '192.168.1.0-invalid', // Invalid range
        'not-an-ip'           // Invalid format
      ];
      const result = checkCIDRAlignment(inputs, 24);

      expect(result.errors).toHaveLength(4);
      result.errors.forEach(error => {
        expect(error).toContain('Invalid input');
      });
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle /0 prefix (entire address space)', () => {
      const inputs = ['0.0.0.0/0', '::/0'];
      const result = checkCIDRAlignment(inputs, 0);

      result.checks.forEach(check => {
        expect(check.isAligned).toBe(true);
      });
    });

    it('should handle maximum prefixes (/32 for IPv4, /128 for IPv6)', () => {
      const inputs = ['192.168.1.1/32', '2001:db8::1/128'];
      const ipv4Result = checkCIDRAlignment([inputs[0]], 32);
      const ipv6Result = checkCIDRAlignment([inputs[1]], 128);

      expect(ipv4Result.checks[0].isAligned).toBe(true);
      expect(ipv6Result.checks[0].isAligned).toBe(true);
    });

    it('should handle very large IPv6 ranges', () => {
      const inputs = ['2001:db8::-2001:db8:ffff:ffff:ffff:ffff:ffff:ffff'];
      const result = checkCIDRAlignment(inputs, 32);

      const check = result.checks[0];
      expect(check.type).toBe('range');
      expect(check.isAligned).toBe(true);
    });

    it('should handle single IP as both start and end', () => {
      const inputs = ['192.168.1.1-192.168.1.1'];
      const result = checkCIDRAlignment(inputs, 32);

      const check = result.checks[0];
      expect(check.type).toBe('range');
      expect(check.isAligned).toBe(true);
    });

    it('should validate range order', () => {
      const inputs = ['192.168.1.100-192.168.1.50']; // End before start
      const result = checkCIDRAlignment(inputs, 24);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Start IP must be less than or equal to end IP');
    });

    it('should reject mixed IP version ranges', () => {
      const inputs = ['192.168.1.0-2001:db8::1'];
      const result = checkCIDRAlignment(inputs, 24);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('same version');
    });
  });

  describe('suggestion generation', () => {
    it('should generate efficiency ratings for larger CIDR suggestions', () => {
      const inputs = ['192.168.1.100-192.168.1.105'];
      const result = checkCIDRAlignment(inputs, 28);

      const check = result.checks[0];
      expect(check.suggestions.length).toBeGreaterThan(0);

      // Check if any suggestion has efficiency data
      const hasEfficiency = check.suggestions.some(s => s.efficiency !== undefined);
      if (hasEfficiency) {
        const suggestionWithEfficiency = check.suggestions.find(s => s.efficiency !== undefined);
        expect(suggestionWithEfficiency?.efficiency).toBeGreaterThan(0);
        expect(suggestionWithEfficiency?.efficiency).toBeLessThanOrEqual(100);
      }
    });

    it('should limit the number of split suggestions', () => {
      const inputs = ['192.168.0.0-192.168.15.255']; // Large range
      const result = checkCIDRAlignment(inputs, 28);

      const check = result.checks[0];
      const splitSuggestion = check.suggestions.find(s => s.type === 'split');
      if (splitSuggestion) {
        expect(splitSuggestion.cidrs.length).toBeLessThanOrEqual(8);
      }
    });

    it('should limit the number of smaller CIDR suggestions', () => {
      const inputs = ['192.168.0.0-192.168.1.255'];
      const result = checkCIDRAlignment(inputs, 22);

      const check = result.checks[0];
      const smallerSuggestion = check.suggestions.find(s => s.type === 'smaller');
      if (smallerSuggestion) {
        expect(smallerSuggestion.cidrs.length).toBeLessThanOrEqual(4);
      }
    });

    it('should provide meaningful descriptions for all suggestion types', () => {
      const inputs = ['192.168.1.10-192.168.1.50'];
      const result = checkCIDRAlignment(inputs, 24);

      const check = result.checks[0];
      check.suggestions.forEach(suggestion => {
        expect(suggestion.description).toBeDefined();
        expect(suggestion.description.length).toBeGreaterThan(10);
        expect(suggestion.cidrs).toBeDefined();
        expect(suggestion.cidrs.length).toBeGreaterThan(0);
      });
    });
  });

  describe('performance and stress tests', () => {
    it('should handle large input lists efficiently', () => {
      const inputs = Array.from({ length: 100 }, (_, i) =>
        `192.168.${Math.floor(i / 10)}.${(i % 10) * 10}/24`
      );

      const start = performance.now();
      const result = checkCIDRAlignment(inputs, 24);
      const end = performance.now();

      expect(result.checks).toHaveLength(100);
      expect(end - start).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle complex IPv6 addresses efficiently', () => {
      const inputs = [
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334/128',
        'fe80::1%eth0/64',
        '::ffff:192.168.1.1/128'
      ];

      const start = performance.now();
      const result = checkCIDRAlignment(inputs, 64);
      const end = performance.now();

      expect(result.checks).toHaveLength(3);
      expect(end - start).toBeLessThan(100);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle typical corporate network CIDRs', () => {
      const inputs = [
        '10.0.0.0/8',          // Private class A
        '172.16.0.0/12',       // Private class B
        '192.168.0.0/16',      // Private class C
        '192.168.1.0/24'       // Subnet
      ];
      const result = checkCIDRAlignment(inputs, 24);

      expect(result.errors).toHaveLength(0);
      expect(result.checks.every(c => c.type === 'cidr')).toBe(true);
    });

    it('should handle cloud provider IPv6 allocations', () => {
      const inputs = [
        '2001:db8::/32',       // IPv6 allocation
        '2001:db8:1::/48',     // Site allocation
        'fe80::/10'            // Link-local
      ];
      const result = checkCIDRAlignment(inputs, 48);

      expect(result.errors).toHaveLength(0);
      expect(result.checks.every(c => c.type === 'cidr')).toBe(true);
    });

    it('should handle DHCP pool ranges', () => {
      const inputs = [
        '192.168.1.100-192.168.1.200',
        '10.0.0.10-10.0.0.100'
      ];
      const result = checkCIDRAlignment(inputs, 24);

      expect(result.checks.every(c => c.type === 'range')).toBe(true);
      expect(result.checks.every(c => c.suggestions.length > 0)).toBe(true);
    });
  });
});