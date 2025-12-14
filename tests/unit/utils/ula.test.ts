import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateULAAddresses, parseULA } from '../../../src/lib/utils/ula';

describe('ula', () => {
  describe('generateULAAddresses', () => {
    beforeEach(() => {
      let callCount = 0;

      // Mock crypto.getRandomValues for consistent but varied testing
      const mockCrypto = {
        getRandomValues: vi.fn((array: Uint8Array) => {
          // Fill with predictable but different values for each call
          for (let i = 0; i < array.length; i++) {
            array[i] = (i + 1 + callCount) % 256;
          }
          callCount++;
          return array;
        }),
      };

      Object.defineProperty(globalThis, 'crypto', {
        value: mockCrypto,
        writable: true,
      });

      // Mock Date.now for consistent timestamps
      vi.spyOn(Date, 'now').mockReturnValue(1640995200000); // Fixed timestamp
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('Basic ULA generation', () => {
      it('should generate a single ULA address', () => {
        const result = generateULAAddresses(1);

        expect(result.generations).toHaveLength(1);
        const generation = result.generations[0];
        expect(generation.isValid).toBe(true);
        expect(generation.prefix).toBe('fd');
        expect(generation.globalID).toMatch(/^[0-9a-f]{4}:[0-9a-f]{4}$/);
        expect(generation.subnetID).toMatch(/^[0-9a-f]{4}$/);
        expect(generation.fullPrefix).toMatch(/^fd[0-9a-f]{8}:[0-9a-f]{4}$/);
        expect(generation.network).toMatch(/^fd[0-9a-f]{8}:[0-9a-f]{4}::\/64$/);
      });

      it('should generate multiple ULA addresses', () => {
        const result = generateULAAddresses(3);

        expect(result.generations).toHaveLength(3);
        expect(result.summary.totalRequests).toBe(3);
        expect(result.summary.successfulGenerations).toBe(3);
        expect(result.summary.failedGenerations).toBe(0);

        // All should be valid
        result.generations.forEach(generation => {
          expect(generation.isValid).toBe(true);
          expect(generation.prefix).toBe('fd');
          expect(generation.network).toContain('::/64');
        });

        // Global IDs should be different for each generation
        const globalIDs = result.generations.map(g => g.globalID);
        const uniqueGlobalIDs = new Set(globalIDs);
        expect(uniqueGlobalIDs.size).toBe(3);
      });

      it('should include proper details', () => {
        const result = generateULAAddresses(1);

        const generation = result.generations[0];
        expect(generation.details.algorithm).toBe('RFC 4193 - Pseudo-random Global ID');
        expect(generation.details.timestamp).toBe(1640995200000);
        expect(generation.details.entropy).toMatch(/^[0-9a-f]{16}$/);
        expect(generation.details.prefixBinary).toBe('11111101'); // 'fd' in binary
        expect(generation.details.globalIDBinary).toMatch(/^[01]{40}$/);
        expect(generation.details.subnetIDBinary).toMatch(/^[01]{16}$/);
      });
    });

    describe('Custom subnet IDs', () => {
      it('should use provided subnet IDs', () => {
        const subnetIds = ['0001', '0002', 'abcd'];
        const result = generateULAAddresses(3, subnetIds);

        expect(result.generations).toHaveLength(3);
        expect(result.generations[0].subnetID).toBe('0001');
        expect(result.generations[1].subnetID).toBe('0002');
        expect(result.generations[2].subnetID).toBe('abcd');

        result.generations.forEach(generation => {
          expect(generation.isValid).toBe(true);
        });
      });

      it('should pad short subnet IDs', () => {
        const subnetIds = ['1', '22', '333'];
        const result = generateULAAddresses(3, subnetIds);

        expect(result.generations[0].subnetID).toBe('0001');
        expect(result.generations[1].subnetID).toBe('0022');
        expect(result.generations[2].subnetID).toBe('0333');
      });

      it('should handle mixed valid and invalid subnet IDs', () => {
        const subnetIds = ['0001', 'invalid!', '0003'];
        const result = generateULAAddresses(3, subnetIds);

        expect(result.generations).toHaveLength(3);
        expect(result.generations[0].isValid).toBe(true);
        expect(result.generations[1].isValid).toBe(false);
        expect(result.generations[2].isValid).toBe(true);

        expect(result.summary.successfulGenerations).toBe(2);
        expect(result.summary.failedGenerations).toBe(1);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain('Invalid subnet ID format');
      });

      it('should handle empty subnet IDs', () => {
        const subnetIds = ['0001', '', '0003'];
        const result = generateULAAddresses(3, subnetIds);

        expect(result.generations).toHaveLength(3);
        result.generations.forEach(generation => {
          expect(generation.isValid).toBe(true);
        });

        expect(result.generations[0].subnetID).toBe('0001');
        expect(result.generations[1].subnetID).toMatch(/^[0-9a-f]{4}$/); // Auto-generated
        expect(result.generations[2].subnetID).toBe('0003');
      });

      it('should handle subnet IDs with colons', () => {
        const subnetIds = ['00:01', 'ab:cd'];
        const result = generateULAAddresses(2, subnetIds);

        expect(result.generations[0].isValid).toBe(true);
        expect(result.generations[1].isValid).toBe(true);
        expect(result.generations[0].subnetID).toBe('0001');
        expect(result.generations[1].subnetID).toBe('abcd');
      });
    });

    describe('Validation', () => {
      it('should reject invalid subnet ID formats', () => {
        const invalidSubnetIds = [
          'gggg',      // Invalid hex characters
          '12345',     // Too long
          'xyz!',      // Invalid characters
          '12-34',     // Invalid separator
        ];

        invalidSubnetIds.forEach(subnetId => {
          const result = generateULAAddresses(1, [subnetId]);
          expect(result.generations[0].isValid).toBe(false);
          expect(result.generations[0].error).toContain('Invalid subnet ID format');
          expect(result.errors).toHaveLength(1);
        });
      });

      it('should handle zero count', () => {
        const result = generateULAAddresses(0);

        expect(result.generations).toHaveLength(0);
        expect(result.summary.totalRequests).toBe(0);
        expect(result.summary.successfulGenerations).toBe(0);
        expect(result.summary.failedGenerations).toBe(0);
      });

      it('should handle large counts', () => {
        const result = generateULAAddresses(100);

        expect(result.generations).toHaveLength(100);
        expect(result.summary.totalRequests).toBe(100);
        expect(result.summary.successfulGenerations).toBe(100);

        // Verify all have unique global IDs
        const globalIDs = result.generations.map(g => g.globalID);
        const uniqueGlobalIDs = new Set(globalIDs);
        expect(uniqueGlobalIDs.size).toBe(100);
      });
    });

    describe('Network format', () => {
      it('should generate proper network notation', () => {
        const result = generateULAAddresses(1);

        const generation = result.generations[0];
        expect(generation.network).toMatch(/^fd[0-9a-f]{8}:[0-9a-f]{4}::\/64$/);
        expect(generation.fullPrefix).toMatch(/^fd[0-9a-f]{8}:[0-9a-f]{4}$/);
      });

      it('should have consistent formatting', () => {
        const result = generateULAAddresses(5);

        result.generations.forEach(generation => {
          expect(generation.prefix).toBe('fd');
          expect(generation.globalID.length).toBe(9); // XXXX:XXXX format
          expect(generation.subnetID.length).toBe(4);
          expect(generation.fullPrefix.includes(':')).toBe(true);
          expect(generation.network.endsWith('::/64')).toBe(true);
        });
      });
    });

    describe('Randomness and uniqueness', () => {
      it('should generate different addresses each time', () => {
        // Remove the mock to test actual randomness
        vi.restoreAllMocks();

        const result1 = generateULAAddresses(3);
        const result2 = generateULAAddresses(3);

        const globalIDs1 = result1.generations.map(g => g.globalID);
        const globalIDs2 = result2.generations.map(g => g.globalID);

        // Should be different sets
        expect(globalIDs1).not.toEqual(globalIDs2);
      });
    });

    describe('Error handling', () => {
      it('should handle crypto API unavailability gracefully', () => {
        // Remove crypto mock to test fallback
        delete (globalThis as any).crypto;

        const result = generateULAAddresses(1);

        expect(result.generations[0].isValid).toBe(true);
        expect(result.generations[0].network).toMatch(/^fd[0-9a-f]{8}:[0-9a-f]{4}::\/64$/);
      });
    });
  });

  describe('parseULA', () => {
    describe('Valid ULA addresses', () => {
      it('should parse complete ULA address', () => {
        const ula = 'fd12:3456:789a:bcde:0123:4567:89ab:cdef';
        const result = parseULA(ula);


        expect(result.isValid).toBe(true);
        expect(result.prefix).toBe('fd');
        expect(result.globalID).toBe('1234:5678');
        expect(result.subnetID).toBe('9abc');
        expect(result.interfaceID).toBe('de01:2345:6789:abcd:ef');
      });

      it('should parse ULA with compressed notation', () => {
        const ula = 'fd12:3456:789a::1';
        const result = parseULA(ula);

        expect(result.isValid).toBe(true);
        expect(result.prefix).toBe('fd');
        expect(result.globalID).toBe('1234:5678');
        expect(result.subnetID).toBe('9a00');
        expect(result.interfaceID).toBe('::1');
      });

      it('should parse network prefix only', () => {
        const ula = 'fd12:3456:789a:bcde::';
        const result = parseULA(ula);

        expect(result.isValid).toBe(true);
        expect(result.prefix).toBe('fd');
        expect(result.globalID).toBe('1234:5678');
        expect(result.subnetID).toBe('9abc');
        expect(result.interfaceID).toBe('de::');
      });

      it('should handle uppercase input', () => {
        const ula = 'FD12:3456:789A:BCDE::1';
        const result = parseULA(ula);

        expect(result.isValid).toBe(true);
        expect(result.prefix).toBe('fd');
        expect(result.globalID).toBe('1234:5678');
        expect(result.subnetID).toBe('9abc');
      });

      it('should handle whitespace', () => {
        const ula = '  fd12:3456:789a:bcde::1  ';
        const result = parseULA(ula);

        expect(result.isValid).toBe(true);
        expect(result.prefix).toBe('fd');
      });
    });

    describe('Invalid ULA addresses', () => {
      it('should reject non-ULA addresses', () => {
        const nonULAs = [
          '2001:db8::1',           // Global unicast
          'fe80::1',               // Link-local
          'fc00::1',               // FC prefix (should be FD for locally assigned)
          '192.168.1.1',           // IPv4
        ];

        nonULAs.forEach(addr => {
          const result = parseULA(addr);
          expect(result.isValid).toBe(false);
          expect(result.error).toContain('Not a valid ULA address');
        });
      });

      it('should reject malformed addresses', () => {
        const malformed = [
          'fd12',                  // Too short
          'fd12:34',               // Incomplete
          'fd12:3456:789g::1',     // Invalid hex character
          '',                      // Empty
          'not-an-address',        // Invalid format
        ];

        malformed.forEach(addr => {
          const result = parseULA(addr);
          expect(result.isValid).toBe(false);
          expect(result.error).toBeDefined();
        });
      });

      it('should handle invalid format gracefully', () => {
        const result = parseULA('fd12:34:56');

        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Invalid ULA format');
      });
    });

    describe('Edge cases', () => {
      it('should handle minimal valid ULA', () => {
        const ula = 'fd00:0000:0000:0000::';
        const result = parseULA(ula);

        expect(result.isValid).toBe(true);
        expect(result.globalID).toBe('0000:0000');
        expect(result.subnetID).toBe('0000');
      });

      it('should handle maximum valid ULA', () => {
        const ula = 'fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff';
        const result = parseULA(ula);

        expect(result.isValid).toBe(true);
        expect(result.globalID).toBe('ffff:ffff');
        expect(result.subnetID).toBe('ffff');
      });

      it('should handle various compression patterns', () => {
        const addresses = [
          'fd12:3456::',
          'fd12::3456',
          'fd::1234:5678:9abc:def0',
          'fd12:3456:789a:bcde::'
        ];

        addresses.forEach(addr => {
          const result = parseULA(addr);
          expect(result.isValid).toBe(true);
          expect(result.prefix).toBe('fd');
        });
      });
    });

    describe('Component extraction', () => {
      it('should correctly extract all components', () => {
        const ula = 'fd12:3456:789a:bcde:0011:2233:4455:6677';
        const result = parseULA(ula);

        expect(result.isValid).toBe(true);
        expect(result.prefix).toBe('fd');
        expect(result.globalID).toBe('1234:5678'); // First 40 bits after fd
        expect(result.subnetID).toBe('9abc');      // Next 16 bits
        expect(result.interfaceID).toBe('de00:1122:3344:5566:77'); // Remaining bits
      });

      it('should handle zero-padded components', () => {
        const ula = 'fd00:0001:0002:0003::1';
        const result = parseULA(ula);

        expect(result.isValid).toBe(true);
        expect(result.globalID).toBe('0000:0100');
        expect(result.subnetID).toBe('0200');
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should generate and parse ULA addresses consistently', () => {
      const result = generateULAAddresses(5);

      result.generations.forEach(generation => {
        if (generation.isValid) {
          // Create a full address from the generation
          const fullAddress = `${generation.fullPrefix}::1`;
          const parsed = parseULA(fullAddress);

          expect(parsed.isValid).toBe(true);
          expect(parsed.prefix).toBe(generation.prefix);
          expect(parsed.subnetID).toBe(generation.subnetID);
        }
      });
    });

    it('should handle network notation parsing', () => {
      const result = generateULAAddresses(1);
      const generation = result.generations[0];

      if (generation.isValid) {
        // Parse the network without the /64
        const networkAddress = generation.network.replace('::/64', '::');
        const parsed = parseULA(networkAddress);

        expect(parsed.isValid).toBe(true);
        expect(parsed.prefix).toBe(generation.prefix);
        expect(parsed.subnetID).toBe(generation.subnetID);
      }
    });
  });
});
