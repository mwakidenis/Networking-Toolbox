import { describe, it, expect } from 'vitest';
import { calculateNthIPs } from '../../../src/lib/utils/nth-ip';

describe('nth-ip', () => {
  describe('calculateNthIPs', () => {
    describe('IPv4 CIDR notation', () => {
      it('should calculate nth IP in IPv4 CIDR', () => {
        const inputs = ['192.168.1.0/24 @ 5'];
        const result = calculateNthIPs(inputs);

        expect(result.calculations).toHaveLength(1);
        const calc = result.calculations[0];
        expect(calc.isValid).toBe(true);
        expect(calc.isInBounds).toBe(true);
        expect(calc.resultIP).toBe('192.168.1.5');
        expect(calc.version).toBe(4);
        expect(calc.index).toBe(5);
        expect(calc.offset).toBe(0);
        expect(calc.inputType).toBe('cidr');
        expect(calc.totalAddresses).toBe('256');
        expect(calc.details?.networkStart).toBe('192.168.1.0');
        expect(calc.details?.networkEnd).toBe('192.168.1.255');
      });

      it('should handle first IP in network', () => {
        const inputs = ['192.168.1.0/24 @ 0'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(true);
        expect(calc.isInBounds).toBe(true);
        expect(calc.resultIP).toBe('192.168.1.0');
      });

      it('should handle last IP in network', () => {
        const inputs = ['192.168.1.0/24 @ 255'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(true);
        expect(calc.isInBounds).toBe(true);
        expect(calc.resultIP).toBe('192.168.1.255');
      });

      it('should handle out of bounds index - above range', () => {
        const inputs = ['192.168.1.0/24 @ 256'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(true);
        expect(calc.isInBounds).toBe(false);
        expect(calc.resultIP).toBe('192.168.1.255');
        expect(calc.error).toContain('out of bounds');
        expect(result.errors).toHaveLength(1);
      });

      it('should handle negative index', () => {
        const inputs = ['192.168.1.0/24 @ -1'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(true);
        expect(calc.isInBounds).toBe(false);
        expect(calc.resultIP).toBe('192.168.1.0');
        expect(calc.error).toContain('out of bounds');
      });
    });

    describe('IPv6 CIDR notation', () => {
      it('should calculate nth IP in IPv6 CIDR', () => {
        const inputs = ['2001:db8::/126 @ 2'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(true);
        expect(calc.isInBounds).toBe(true);
        expect(calc.version).toBe(6);
        expect(calc.index).toBe(2);
        expect(calc.totalAddresses).toBe('4');
        expect(calc.details?.networkStart).toBe('2001:db8::');
        expect(calc.details?.networkEnd).toBe('2001:db8::3');
      });

      it('should handle large IPv6 networks', () => {
        const inputs = ['2001:db8::/64 @ 1000'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(true);
        expect(calc.isInBounds).toBe(true);
        expect(calc.version).toBe(6);
        expect(calc.resultIP).toContain('2001:db8:');
      });

      it('should handle compressed IPv6 addresses', () => {
        const inputs = ['2001:db8::1/128 @ 0'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(true);
        expect(calc.isInBounds).toBe(true);
        expect(calc.totalAddresses).toBe('1');
      });
    });

    describe('IP range notation', () => {
      it('should calculate nth IP in IPv4 range', () => {
        const inputs = ['192.168.1.10-192.168.1.20 @ 5'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(true);
        expect(calc.isInBounds).toBe(true);
        expect(calc.resultIP).toBe('192.168.1.15');
        expect(calc.inputType).toBe('range');
        expect(calc.totalAddresses).toBe('11');
        expect(calc.details?.networkStart).toBe('192.168.1.10');
        expect(calc.details?.networkEnd).toBe('192.168.1.20');
      });

      it('should calculate nth IP in IPv6 range', () => {
        const inputs = ['2001:db8::1-2001:db8::5 @ 2'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(true);
        expect(calc.isInBounds).toBe(true);
        expect(calc.version).toBe(6);
        expect(calc.inputType).toBe('range');
        expect(calc.totalAddresses).toBe('5');
      });

      it('should handle single IP range', () => {
        const inputs = ['192.168.1.10-192.168.1.10 @ 0'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(true);
        expect(calc.isInBounds).toBe(true);
        expect(calc.resultIP).toBe('192.168.1.10');
        expect(calc.totalAddresses).toBe('1');
      });
    });

    describe('Input format variations', () => {
      it('should parse @ notation', () => {
        const inputs = ['192.168.1.0/24 @ 10'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.index).toBe(10);
        expect(calc.offset).toBe(0);
      });

      it('should parse bracket notation', () => {
        const inputs = ['192.168.1.0/24 [15]'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.index).toBe(15);
        expect(calc.offset).toBe(0);
      });

      it('should parse space notation', () => {
        const inputs = ['192.168.1.0/24 20'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.index).toBe(20);
        expect(calc.offset).toBe(0);
      });

      it('should parse hash notation', () => {
        const inputs = ['192.168.1.0/24#25'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.index).toBe(25);
        expect(calc.offset).toBe(0);
      });

      it('should parse offset with @ notation', () => {
        const inputs = ['192.168.1.0/24 @ 10 + 5'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.index).toBe(10);
        expect(calc.offset).toBe(5);
        expect(calc.details?.actualIndex).toBe(15);
      });

      it('should parse offset with bracket notation', () => {
        const inputs = ['192.168.1.0/24 [10] + 3'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.index).toBe(10);
        expect(calc.offset).toBe(3);
        expect(calc.details?.actualIndex).toBe(13);
      });

      it('should parse offset with hash notation', () => {
        const inputs = ['192.168.1.0/24#10+7'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.index).toBe(10);
        expect(calc.offset).toBe(7);
        expect(calc.details?.actualIndex).toBe(17);
      });
    });

    describe('Global offset', () => {
      it('should apply global offset to calculations', () => {
        const inputs = ['192.168.1.0/24 @ 10'];
        const result = calculateNthIPs(inputs, 5);

        const calc = result.calculations[0];
        expect(calc.index).toBe(10);
        expect(calc.offset).toBe(5);
        expect(calc.details?.actualIndex).toBe(15);
        expect(calc.resultIP).toBe('192.168.1.15');
      });

      it('should combine global offset with local offset', () => {
        const inputs = ['192.168.1.0/24 @ 10 + 3'];
        const result = calculateNthIPs(inputs, 5);

        const calc = result.calculations[0];
        expect(calc.index).toBe(10);
        expect(calc.offset).toBe(8); // 3 + 5
        expect(calc.details?.actualIndex).toBe(18);
      });
    });

    describe('Multiple inputs', () => {
      it('should handle multiple valid inputs', () => {
        const inputs = [
          '192.168.1.0/24 @ 5',
          '10.0.0.0/24 [10]',
          '2001:db8::/126 2'
        ];
        const result = calculateNthIPs(inputs);

        expect(result.calculations).toHaveLength(3);
        expect(result.summary.totalCalculations).toBe(3);
        expect(result.summary.validCalculations).toBe(3);
        expect(result.summary.invalidCalculations).toBe(0);
        expect(result.errors).toHaveLength(0);

        expect(result.calculations[0].version).toBe(4);
        expect(result.calculations[1].version).toBe(4);
        expect(result.calculations[2].version).toBe(6);
      });

      it('should handle mixed valid and invalid inputs', () => {
        const inputs = [
          '192.168.1.0/24 @ 5',
          'invalid-input',
          '10.0.0.0/24 @ 300' // out of bounds
        ];
        const result = calculateNthIPs(inputs);

        expect(result.calculations).toHaveLength(3);
        expect(result.summary.totalCalculations).toBe(3);
        expect(result.summary.validCalculations).toBe(2);
        expect(result.summary.invalidCalculations).toBe(1);
        expect(result.summary.outOfBoundsCalculations).toBe(1);
        expect(result.errors).toHaveLength(2);
      });
    });

    describe('Error handling', () => {
      it('should handle invalid IPv4 addresses', () => {
        const inputs = ['256.1.1.1/24 @ 5'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(false);
        expect(calc.error).toContain('Invalid IPv4 address');
        expect(result.errors).toHaveLength(1);
      });

      it('should handle invalid CIDR prefixes', () => {
        const inputs = ['192.168.1.0/33 @ 5'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(false);
        expect(calc.error).toContain('Invalid prefix');
        expect(result.errors).toHaveLength(1);
      });

      it('should handle invalid IPv6 prefixes', () => {
        const inputs = ['2001:db8::/129 @ 5'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(false);
        expect(calc.error).toContain('Invalid prefix');
      });

      it('should handle mixed version ranges', () => {
        const inputs = ['192.168.1.1-2001:db8::1 @ 5'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(false);
        expect(calc.error).toContain('same version');
      });

      it('should handle invalid range order', () => {
        const inputs = ['192.168.1.10-192.168.1.5 @ 1'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(false);
        expect(calc.error).toContain('less than or equal');
      });

      it('should handle invalid input format', () => {
        const inputs = ['192.168.1.0/24'];
        const result = calculateNthIPs(inputs);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain('Invalid format');
      });

      it('should handle unrecognized IP format', () => {
        const inputs = ['not-an-ip @ 5'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(false);
        expect(calc.error).toContain('Cannot determine IP version');
      });

      it('should handle invalid index format', () => {
        const inputs = ['192.168.1.0/24 @ abc'];
        const result = calculateNthIPs(inputs);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain('Invalid format');
      });
    });

    describe('Edge cases', () => {
      it('should handle /32 IPv4 networks', () => {
        const inputs = ['192.168.1.1/32 @ 0'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(true);
        expect(calc.isInBounds).toBe(true);
        expect(calc.resultIP).toBe('192.168.1.1');
        expect(calc.totalAddresses).toBe('1');
      });

      it('should handle /128 IPv6 networks', () => {
        const inputs = ['2001:db8::1/128 @ 0'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(true);
        expect(calc.isInBounds).toBe(true);
        expect(calc.totalAddresses).toBe('1');
      });

      it('should handle /0 IPv4 networks', () => {
        const inputs = ['0.0.0.0/0 @ 1000'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(true);
        expect(calc.isInBounds).toBe(true);
        expect(calc.version).toBe(4);
      });

      it('should handle large IPv6 networks', () => {
        const inputs = ['2001:db8::/64 @ 18446744073709551615']; // Max uint64
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(true);
        // Should be in bounds for /64 network
      });

      it('should handle empty and whitespace inputs', () => {
        const inputs = ['', '  ', '\t', '192.168.1.0/24 @ 5', '   '];
        const result = calculateNthIPs(inputs);

        expect(result.calculations).toHaveLength(1);
        expect(result.summary.totalCalculations).toBe(1);
        expect(result.summary.validCalculations).toBe(1);
      });

      it('should handle whitespace around input components', () => {
        const inputs = [' 192.168.1.0/24  @  5  +  3 '];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(true);
        expect(calc.index).toBe(5);
        expect(calc.offset).toBe(3);
      });

      it('should handle very large offsets', () => {
        const inputs = ['192.168.1.0/24 @ 5 + 1000000'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(true);
        expect(calc.isInBounds).toBe(false);
        expect(calc.error).toContain('out of bounds');
      });
    });

    describe('Summary statistics', () => {
      it('should calculate summary statistics correctly', () => {
        const inputs = [
          '192.168.1.0/24 @ 5',        // valid, in bounds
          '192.168.1.0/24 @ 500',      // valid, out of bounds
          'invalid @ 5',               // invalid
          '10.0.0.0/24 @ 10'          // valid, in bounds
        ];
        const result = calculateNthIPs(inputs);

        expect(result.summary.totalCalculations).toBe(4);
        expect(result.summary.validCalculations).toBe(3);
        expect(result.summary.invalidCalculations).toBe(1);
        expect(result.summary.outOfBoundsCalculations).toBe(1);
        expect(result.errors).toHaveLength(2); // invalid input + out of bounds
      });
    });

    describe('IPv4/IPv6 conversion edge cases', () => {
      it('should handle IPv4 addresses at boundaries', () => {
        const inputs = ['0.0.0.0/32 @ 0', '255.255.255.255/32 @ 0'];
        const result = calculateNthIPs(inputs);

        expect(result.calculations[0].resultIP).toBe('0.0.0.0');
        expect(result.calculations[1].resultIP).toBe('255.255.255.255');
      });

      it('should handle IPv6 with mixed case', () => {
        const inputs = ['2001:DB8::1/128 @ 0'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(true);
        expect(calc.version).toBe(6);
      });

      it('should handle IPv6 with leading zeros', () => {
        const inputs = ['2001:0db8:0000:0000:0000:0000:0000:0001/128 @ 0'];
        const result = calculateNthIPs(inputs);

        const calc = result.calculations[0];
        expect(calc.isValid).toBe(true);
        expect(calc.version).toBe(6);
      });
    });
  });
});