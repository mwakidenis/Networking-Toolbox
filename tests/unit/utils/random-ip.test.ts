import { describe, it, expect } from 'vitest';
import { generateRandomIPAddresses } from '../../../src/lib/utils/random-ip';

describe('random-ip', () => {
  describe('generateRandomIPAddresses', () => {
    describe('IPv4 CIDR networks', () => {
      it('should generate random IPs from IPv4 CIDR', () => {
        const inputs = ['192.168.1.0/24 x 5'];
        const result = generateRandomIPAddresses(inputs);

        expect(result.generations).toHaveLength(1);
        const generation = result.generations[0];
        expect(generation.isValid).toBe(true);
        expect(generation.version).toBe(4);
        expect(generation.networkType).toBe('cidr');
        expect(generation.requestedCount).toBe(5);
        expect(generation.generatedIPs).toHaveLength(5);
        expect(generation.uniqueIPs).toBe(true);
        expect(generation.networkDetails?.totalAddresses).toBe('256');

        // All IPs should be in the network range
        generation.generatedIPs.forEach(ip => {
          expect(ip).toMatch(/^192\.168\.1\.\d+$/);
          const lastOctet = parseInt(ip.split('.')[3]);
          expect(lastOctet).toBeGreaterThanOrEqual(0);
          expect(lastOctet).toBeLessThanOrEqual(255);
        });
      });

      it('should generate unique IPs by default', () => {
        const inputs = ['192.168.1.0/30 x 4']; // Small network with 4 addresses
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.isValid).toBe(true);
        expect(generation.generatedIPs).toHaveLength(4);

        // Check that all IPs are unique
        const uniqueIPs = new Set(generation.generatedIPs);
        expect(uniqueIPs.size).toBe(4);
      });

      it('should handle small networks correctly', () => {
        const inputs = ['192.168.1.1/32 x 1']; // Single host
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.isValid).toBe(true);
        expect(generation.generatedIPs).toHaveLength(1);
        expect(generation.generatedIPs[0]).toBe('192.168.1.1');
        expect(generation.networkDetails?.totalAddresses).toBe('1');
      });

      it('should handle /0 networks', () => {
        const inputs = ['0.0.0.0/0 x 3'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.isValid).toBe(true);
        expect(generation.generatedIPs).toHaveLength(3);
        expect(generation.version).toBe(4);
      });
    });

    describe('IPv6 CIDR networks', () => {
      it('should generate random IPs from IPv6 CIDR', () => {
        const inputs = ['2001:db8::/126 x 3'];
        const result = generateRandomIPAddresses(inputs);

        expect(result.generations).toHaveLength(1);
        const generation = result.generations[0];
        expect(generation.isValid).toBe(true);
        expect(generation.version).toBe(6);
        expect(generation.networkType).toBe('cidr');
        expect(generation.generatedIPs).toHaveLength(3);
        expect(generation.networkDetails?.totalAddresses).toBe('4');

        // All IPs should be valid IPv6 addresses
        generation.generatedIPs.forEach(ip => {
          expect(ip).toMatch(/^2001:db8::/);
          expect(ip.includes(':')).toBe(true);
        });
      });

      it('should handle large IPv6 networks', () => {
        const inputs = ['2001:db8::/64 x 5'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.isValid).toBe(true);
        expect(generation.version).toBe(6);
        expect(generation.generatedIPs).toHaveLength(5);
      });

      it('should compress IPv6 addresses properly', () => {
        const inputs = ['2001:db8::/120 x 3'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.isValid).toBe(true);

        // Generated IPs should be properly compressed
        generation.generatedIPs.forEach(ip => {
          expect(ip).toMatch(/^2001:db8::/);
          // Should not have unnecessary leading zeros like :0001: or :0000:
          expect(ip).not.toMatch(/:0{2,3}[0-9a-f]:/);
          // Should not have uncompressed zero sequences
          expect(ip).not.toMatch(/:0:0:0:/);
        });
      });
    });

    describe('IP range notation', () => {
      it('should generate random IPs from IPv4 range', () => {
        const inputs = ['192.168.1.10-192.168.1.20 x 5'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.isValid).toBe(true);
        expect(generation.networkType).toBe('range');
        expect(generation.generatedIPs).toHaveLength(5);
        expect(generation.networkDetails?.totalAddresses).toBe('11');

        // All IPs should be in the range
        generation.generatedIPs.forEach(ip => {
          const lastOctet = parseInt(ip.split('.')[3]);
          expect(lastOctet).toBeGreaterThanOrEqual(10);
          expect(lastOctet).toBeLessThanOrEqual(20);
        });
      });

      it('should generate random IPs from IPv6 range', () => {
        const inputs = ['2001:db8::1-2001:db8::10 x 3'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.isValid).toBe(true);
        expect(generation.networkType).toBe('range');
        expect(generation.version).toBe(6);
        expect(generation.generatedIPs).toHaveLength(3);
      });

      it('should handle single IP range', () => {
        const inputs = ['192.168.1.100-192.168.1.100 x 1'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.isValid).toBe(true);
        expect(generation.generatedIPs).toHaveLength(1);
        expect(generation.generatedIPs[0]).toBe('192.168.1.100');
        expect(generation.networkDetails?.totalAddresses).toBe('1');
      });
    });

    describe('Input format variations', () => {
      it('should parse x notation', () => {
        const inputs = ['192.168.1.0/24 x 3'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.requestedCount).toBe(3);
        expect(generation.generatedIPs).toHaveLength(3);
      });

      it('should parse * notation', () => {
        const inputs = ['192.168.1.0/24 * 4'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.requestedCount).toBe(4);
        expect(generation.generatedIPs).toHaveLength(4);
      });

      it('should parse space notation', () => {
        const inputs = ['192.168.1.0/24 5'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.requestedCount).toBe(5);
        expect(generation.generatedIPs).toHaveLength(5);
      });

      it('should parse hash notation', () => {
        const inputs = ['192.168.1.0/24#6'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.requestedCount).toBe(6);
        expect(generation.generatedIPs).toHaveLength(6);
      });

      it('should parse bracket notation', () => {
        const inputs = ['192.168.1.0/24[7]'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.requestedCount).toBe(7);
        expect(generation.generatedIPs).toHaveLength(7);
      });

      it('should default to 1 if no count specified', () => {
        const inputs = ['192.168.1.0/24'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.requestedCount).toBe(1);
        expect(generation.generatedIPs).toHaveLength(1);
      });

      it('should use default count parameter', () => {
        const inputs = ['192.168.1.0/24'];
        const result = generateRandomIPAddresses(inputs, 8);

        const generation = result.generations[0];
        expect(generation.requestedCount).toBe(8);
        expect(generation.generatedIPs).toHaveLength(8);
      });
    });

    describe('Unique vs non-unique generation', () => {
      it('should generate unique IPs when unique=true', () => {
        const inputs = ['192.168.1.0/30 x 4']; // 4 addresses total
        const result = generateRandomIPAddresses(inputs, 5, true);

        const generation = result.generations[0];
        expect(generation.isValid).toBe(true);
        expect(generation.uniqueIPs).toBe(true);

        const uniqueIPs = new Set(generation.generatedIPs);
        expect(uniqueIPs.size).toBe(generation.generatedIPs.length);
      });

      it('should allow duplicate IPs when unique=false', () => {
        const inputs = ['192.168.1.0/30 x 10']; // Request more than available
        const result = generateRandomIPAddresses(inputs, 5, false);

        const generation = result.generations[0];
        expect(generation.isValid).toBe(true);
        expect(generation.uniqueIPs).toBe(false);
        expect(generation.generatedIPs).toHaveLength(10);
      });

      it('should fail when requesting more unique IPs than available', () => {
        const inputs = ['192.168.1.0/30 x 10']; // 4 addresses, request 10 unique
        const result = generateRandomIPAddresses(inputs, 5, true);

        const generation = result.generations[0];
        expect(generation.isValid).toBe(false);
        expect(generation.error).toContain('Cannot generate 10 unique IPs');
        expect(generation.generatedIPs).toHaveLength(0);
        expect(result.errors).toHaveLength(1);
      });
    });

    describe('Seeded random generation', () => {
      it('should generate same IPs with same seed', () => {
        const inputs = ['192.168.1.0/24 x 5'];
        const result1 = generateRandomIPAddresses(inputs, 5, true, 'test-seed');
        const result2 = generateRandomIPAddresses(inputs, 5, true, 'test-seed');

        expect(result1.generations[0].generatedIPs).toEqual(result2.generations[0].generatedIPs);
      });

      it('should generate different IPs with different seeds', () => {
        const inputs = ['192.168.1.0/24 x 5'];
        const result1 = generateRandomIPAddresses(inputs, 5, true, 'seed1');
        const result2 = generateRandomIPAddresses(inputs, 5, true, 'seed2');

        expect(result1.generations[0].generatedIPs).not.toEqual(result2.generations[0].generatedIPs);
      });

      it('should handle numeric seeds', () => {
        const inputs = ['192.168.1.0/24 x 3'];
        const result = generateRandomIPAddresses(inputs, 5, true, '12345');

        const generation = result.generations[0];
        expect(generation.isValid).toBe(true);
        expect(generation.seed).toBe('12345');
        expect(generation.generatedIPs).toHaveLength(3);
      });
    });

    describe('Multiple networks', () => {
      it('should handle multiple valid networks', () => {
        const inputs = [
          '192.168.1.0/24 x 3',
          '10.0.0.0/24 x 2',
          '2001:db8::/126 x 1'
        ];
        const result = generateRandomIPAddresses(inputs);

        expect(result.generations).toHaveLength(3);
        expect(result.summary.totalNetworks).toBe(3);
        expect(result.summary.validNetworks).toBe(3);
        expect(result.summary.invalidNetworks).toBe(0);
        expect(result.summary.totalIPsGenerated).toBe(6);
        expect(result.allGeneratedIPs).toHaveLength(6);

        expect(result.generations[0].version).toBe(4);
        expect(result.generations[1].version).toBe(4);
        expect(result.generations[2].version).toBe(6);
      });

      it('should handle mixed valid and invalid networks', () => {
        const inputs = [
          '192.168.1.0/24 x 3',
          'invalid-network x 2',
          '10.0.0.0/33 x 1' // Invalid prefix
        ];
        const result = generateRandomIPAddresses(inputs);

        expect(result.generations).toHaveLength(3);
        expect(result.summary.totalNetworks).toBe(3);
        expect(result.summary.validNetworks).toBe(1);
        expect(result.summary.invalidNetworks).toBe(2);
        expect(result.summary.totalIPsGenerated).toBe(3);
        expect(result.errors).toHaveLength(2);
      });
    });

    describe('Error handling', () => {
      it('should handle invalid IPv4 addresses', () => {
        const inputs = ['256.1.1.1/24 x 3'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.isValid).toBe(false);
        expect(generation.error).toContain('Invalid IPv4 address');
        expect(result.errors).toHaveLength(1);
      });

      it('should handle invalid CIDR prefixes', () => {
        const inputs = ['192.168.1.0/33 x 3'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.isValid).toBe(false);
        expect(generation.error).toContain('Invalid prefix');
      });

      it('should handle invalid IPv6 prefixes', () => {
        const inputs = ['2001:db8::/129 x 3'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.isValid).toBe(false);
        expect(generation.error).toContain('Invalid prefix');
      });

      it('should handle mixed version ranges', () => {
        const inputs = ['192.168.1.1-2001:db8::1 x 3'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.isValid).toBe(false);
        expect(generation.error).toContain('same version');
      });

      it('should handle invalid range order', () => {
        const inputs = ['192.168.1.10-192.168.1.5 x 3'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.isValid).toBe(false);
        expect(generation.error).toContain('less than or equal');
      });

      it('should handle unrecognized format', () => {
        const inputs = ['not-an-ip x 3'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.isValid).toBe(false);
        expect(generation.error).toContain('Cannot determine IP version');
      });

      it('should handle invalid count format', () => {
        const inputs = ['192.168.1.0/24 x abc'];
        const result = generateRandomIPAddresses(inputs);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain('Invalid');
      });

      it('should handle zero or negative counts', () => {
        const inputs = ['192.168.1.0/24 x 0'];
        const result = generateRandomIPAddresses(inputs, 3);

        const generation = result.generations[0];
        expect(generation.isValid).toBe(true);
        expect(generation.requestedCount).toBe(3); // Uses default
        expect(generation.generatedIPs).toHaveLength(3);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty inputs', () => {
        const inputs = ['', '  ', '\t'];
        const result = generateRandomIPAddresses(inputs);

        expect(result.generations).toHaveLength(0);
        expect(result.summary.totalNetworks).toBe(0);
        expect(result.allGeneratedIPs).toHaveLength(0);
      });

      it('should handle whitespace around input', () => {
        const inputs = [' 192.168.1.0/24 x 3 '];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.isValid).toBe(true);
        expect(generation.generatedIPs).toHaveLength(3);
      });

      it('should handle very large counts efficiently', () => {
        const inputs = ['192.168.1.0/24 x 1000'];
        const result = generateRandomIPAddresses(inputs, 5, false); // Non-unique

        const generation = result.generations[0];
        expect(generation.isValid).toBe(true);
        expect(generation.generatedIPs).toHaveLength(1000);
        expect(generation.uniqueIPs).toBe(false);
      });

      it('should handle compressed IPv6 input', () => {
        const inputs = ['2001:db8::1/128 x 1'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.isValid).toBe(true);
        expect(generation.version).toBe(6);
        expect(generation.generatedIPs).toHaveLength(1);
      });

      it('should handle expanded IPv6 input', () => {
        const inputs = ['2001:0db8:0000:0000:0000:0000:0000:0001/128 x 1'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.isValid).toBe(true);
        expect(generation.version).toBe(6);
        expect(generation.generatedIPs).toHaveLength(1);
      });
    });

    describe('Summary statistics', () => {
      it('should calculate summary statistics correctly', () => {
        const inputs = [
          '192.168.1.0/24 x 5',     // valid
          '10.0.0.0/24 x 3',        // valid
          'invalid x 2',            // invalid
          '2001:db8::/126 x 2'      // valid
        ];
        const result = generateRandomIPAddresses(inputs);

        expect(result.summary.totalNetworks).toBe(4);
        expect(result.summary.validNetworks).toBe(3);
        expect(result.summary.invalidNetworks).toBe(1);
        expect(result.summary.totalIPsGenerated).toBe(10); // 5 + 3 + 2
        expect(result.allGeneratedIPs).toHaveLength(10);
        expect(result.errors).toHaveLength(1);
      });

      it('should calculate unique IP count correctly', () => {
        const inputs = [
          '192.168.1.0/30 x 2', // 192.168.1.0-3
          '192.168.1.0/30 x 2'  // Same network, might have overlaps
        ];
        const result = generateRandomIPAddresses(inputs, 5, true);

        expect(result.summary.totalIPsGenerated).toBe(4);
        expect(result.summary.uniqueIPsGenerated).toBeLessThanOrEqual(4);
        expect(result.allGeneratedIPs).toHaveLength(4);
      });
    });

    describe('Network details', () => {
      it('should provide correct network details for CIDR', () => {
        const inputs = ['192.168.1.0/30 x 1'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.networkDetails).toBeDefined();
        expect(generation.networkDetails?.start).toBe('192.168.1.0');
        expect(generation.networkDetails?.end).toBe('192.168.1.3');
        expect(generation.networkDetails?.totalAddresses).toBe('4');
        expect(generation.networkDetails?.availableCount).toBe('4');
      });

      it('should provide correct network details for range', () => {
        const inputs = ['192.168.1.10-192.168.1.15 x 1'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.networkDetails).toBeDefined();
        expect(generation.networkDetails?.start).toBe('192.168.1.10');
        expect(generation.networkDetails?.end).toBe('192.168.1.15');
        expect(generation.networkDetails?.totalAddresses).toBe('6');
      });

      it('should provide correct IPv6 network details', () => {
        const inputs = ['2001:db8::/126 x 1'];
        const result = generateRandomIPAddresses(inputs);

        const generation = result.generations[0];
        expect(generation.networkDetails).toBeDefined();
        expect(generation.networkDetails?.start).toBe('2001:db8::');
        expect(generation.networkDetails?.end).toBe('2001:db8::3');
        expect(generation.networkDetails?.totalAddresses).toBe('4');
      });
    });
  });
});