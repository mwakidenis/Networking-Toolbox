import { describe, it, expect } from 'vitest';
import { convertWildcardMasks } from '../../../src/lib/utils/wildcard-mask';

describe('wildcard-mask', () => {
  describe('convertWildcardMasks', () => {
    describe('CIDR notation input', () => {
      it('should convert /24 CIDR to wildcard mask', () => {
        const inputs = ['192.168.1.0/24'];
        const result = convertWildcardMasks(inputs);

        expect(result.conversions).toHaveLength(1);
        const conversion = result.conversions[0];
        expect(conversion.isValid).toBe(true);
        expect(conversion.inputType).toBe('cidr');
        expect(conversion.cidr).toBe('192.168.1.0/24');
        expect(conversion.subnetMask).toBe('255.255.255.0');
        expect(conversion.wildcardMask).toBe('0.0.0.255');
        expect(conversion.prefixLength).toBe(24);
        expect(conversion.hostBits).toBe(8);
        expect(conversion.networkAddress).toBe('192.168.1.0');
        expect(conversion.broadcastAddress).toBe('192.168.1.255');
        expect(conversion.totalHosts).toBe(256);
        expect(conversion.usableHosts).toBe(254);
      });

      it('should convert /30 CIDR to wildcard mask', () => {
        const inputs = ['192.168.1.0/30'];
        const result = convertWildcardMasks(inputs);

        const conversion = result.conversions[0];
        expect(conversion.isValid).toBe(true);
        expect(conversion.subnetMask).toBe('255.255.255.252');
        expect(conversion.wildcardMask).toBe('0.0.0.3');
        expect(conversion.prefixLength).toBe(30);
        expect(conversion.hostBits).toBe(2);
        expect(conversion.totalHosts).toBe(4);
        expect(conversion.usableHosts).toBe(2);
        expect(conversion.broadcastAddress).toBe('192.168.1.3');
      });

      it('should convert /32 CIDR (host route)', () => {
        const inputs = ['192.168.1.10/32'];
        const result = convertWildcardMasks(inputs);

        const conversion = result.conversions[0];
        expect(conversion.isValid).toBe(true);
        expect(conversion.subnetMask).toBe('255.255.255.255');
        expect(conversion.wildcardMask).toBe('0.0.0.0');
        expect(conversion.prefixLength).toBe(32);
        expect(conversion.hostBits).toBe(0);
        expect(conversion.totalHosts).toBe(1);
        expect(conversion.usableHosts).toBe(1);
        expect(conversion.networkAddress).toBe('192.168.1.10');
        expect(conversion.broadcastAddress).toBe('192.168.1.10');
      });

      it('should convert /31 CIDR (point-to-point)', () => {
        const inputs = ['192.168.1.0/31'];
        const result = convertWildcardMasks(inputs);

        const conversion = result.conversions[0];
        expect(conversion.isValid).toBe(true);
        expect(conversion.subnetMask).toBe('255.255.255.254');
        expect(conversion.wildcardMask).toBe('0.0.0.1');
        expect(conversion.prefixLength).toBe(31);
        expect(conversion.hostBits).toBe(1);
        expect(conversion.totalHosts).toBe(2);
        expect(conversion.usableHosts).toBe(2);
      });

      it('should convert /8 CIDR (Class A)', () => {
        const inputs = ['10.0.0.0/8'];
        const result = convertWildcardMasks(inputs);

        const conversion = result.conversions[0];
        expect(conversion.isValid).toBe(true);
        expect(conversion.subnetMask).toBe('255.0.0.0');
        expect(conversion.wildcardMask).toBe('0.255.255.255');
        expect(conversion.prefixLength).toBe(8);
        expect(conversion.hostBits).toBe(24);
        expect(conversion.totalHosts).toBe(16777216);
        expect(conversion.usableHosts).toBe(16777214);
      });

      it('should handle network address correction', () => {
        const inputs = ['192.168.1.15/24']; // Host address in CIDR
        const result = convertWildcardMasks(inputs);

        const conversion = result.conversions[0];
        expect(conversion.isValid).toBe(true);
        expect(conversion.networkAddress).toBe('192.168.1.0'); // Corrected to network
        expect(conversion.cidr).toBe('192.168.1.0/24');
      });
    });

    describe('Subnet mask input', () => {
      it('should convert subnet mask notation', () => {
        const inputs = ['192.168.1.0 255.255.255.0'];
        const result = convertWildcardMasks(inputs);

        const conversion = result.conversions[0];
        expect(conversion.isValid).toBe(true);
        expect(conversion.inputType).toBe('subnet-mask');
        expect(conversion.cidr).toBe('192.168.1.0/24');
        expect(conversion.subnetMask).toBe('255.255.255.0');
        expect(conversion.wildcardMask).toBe('0.0.0.255');
        expect(conversion.prefixLength).toBe(24);
      });

      it('should handle various subnet mask lengths', () => {
        const testCases = [
          { input: '10.0.0.0 255.0.0.0', prefix: 8, wildcard: '0.255.255.255' },
          { input: '172.16.0.0 255.255.0.0', prefix: 16, wildcard: '0.0.255.255' },
          { input: '192.168.1.0 255.255.255.192', prefix: 26, wildcard: '0.0.0.63' },
          { input: '192.168.1.0 255.255.255.248', prefix: 29, wildcard: '0.0.0.7' },
        ];

        testCases.forEach(({ input, prefix, wildcard }) => {
          const result = convertWildcardMasks([input]);
          const conversion = result.conversions[0];
          expect(conversion.isValid).toBe(true);
          expect(conversion.prefixLength).toBe(prefix);
          expect(conversion.wildcardMask).toBe(wildcard);
        });
      });

      it('should handle host route subnet mask', () => {
        const inputs = ['192.168.1.1 255.255.255.255'];
        const result = convertWildcardMasks(inputs);

        const conversion = result.conversions[0];
        expect(conversion.isValid).toBe(true);
        expect(conversion.prefixLength).toBe(32);
        expect(conversion.wildcardMask).toBe('0.0.0.0');
        expect(conversion.usableHosts).toBe(1);
      });
    });

    describe('Wildcard mask input', () => {
      it('should convert wildcard mask notation', () => {
        const inputs = ['192.168.1.0 0.0.0.255'];
        const result = convertWildcardMasks(inputs);

        const conversion = result.conversions[0];
        expect(conversion.isValid).toBe(true);
        expect(conversion.inputType).toBe('wildcard-mask');
        expect(conversion.cidr).toBe('192.168.1.0/24');
        expect(conversion.subnetMask).toBe('255.255.255.0');
        expect(conversion.wildcardMask).toBe('0.0.0.255');
        expect(conversion.prefixLength).toBe(24);
      });

      it('should handle various wildcard mask lengths', () => {
        const testCases = [
          { input: '10.0.0.0 0.255.255.255', prefix: 8, subnet: '255.0.0.0' },
          { input: '172.16.0.0 0.0.255.255', prefix: 16, subnet: '255.255.0.0' },
          { input: '192.168.1.0 0.0.0.63', prefix: 26, subnet: '255.255.255.192' },
          { input: '192.168.1.0 0.0.0.7', prefix: 29, subnet: '255.255.255.248' },
        ];

        testCases.forEach(({ input, prefix, subnet }) => {
          const result = convertWildcardMasks([input]);
          const conversion = result.conversions[0];
          expect(conversion.isValid).toBe(true);
          expect(conversion.prefixLength).toBe(prefix);
          expect(conversion.subnetMask).toBe(subnet);
        });
      });

      it('should handle "any" wildcard mask', () => {
        const inputs = ['0.0.0.0 255.255.255.255'];
        const result = convertWildcardMasks(inputs);

        const conversion = result.conversions[0];
        expect(conversion.isValid).toBe(true);
        expect(conversion.prefixLength).toBe(0);
        expect(conversion.subnetMask).toBe('0.0.0.0');
        expect(conversion.cidr).toBe('0.0.0.0/0');
      });

      it('should handle host wildcard mask', () => {
        const inputs = ['192.168.1.1 0.0.0.0'];
        const result = convertWildcardMasks(inputs);

        const conversion = result.conversions[0];
        expect(conversion.isValid).toBe(true);
        expect(conversion.prefixLength).toBe(32);
        expect(conversion.subnetMask).toBe('255.255.255.255');
        expect(conversion.usableHosts).toBe(1);
      });
    });

    describe('Multiple inputs', () => {
      it('should handle multiple valid inputs', () => {
        const inputs = [
          '192.168.1.0/24',
          '10.0.0.0 255.0.0.0',
          '172.16.1.0 0.0.0.255'
        ];
        const result = convertWildcardMasks(inputs);

        expect(result.conversions).toHaveLength(3);
        expect(result.summary.totalInputs).toBe(3);
        expect(result.summary.validInputs).toBe(3);
        expect(result.summary.invalidInputs).toBe(0);
        expect(result.errors).toHaveLength(0);

        expect(result.conversions[0].inputType).toBe('cidr');
        expect(result.conversions[1].inputType).toBe('subnet-mask');
        expect(result.conversions[2].inputType).toBe('wildcard-mask');
      });

      it('should handle mixed valid and invalid inputs', () => {
        const inputs = [
          '192.168.1.0/24',       // valid CIDR
          'invalid input',         // invalid
          '10.0.0.0 255.0.0.0',   // valid subnet mask
          '192.168.1.0/33',       // invalid prefix
        ];
        const result = convertWildcardMasks(inputs);

        expect(result.conversions).toHaveLength(4);
        expect(result.summary.totalInputs).toBe(4);
        expect(result.summary.validInputs).toBe(2);
        expect(result.summary.invalidInputs).toBe(2);
        expect(result.errors).toHaveLength(2);
      });
    });

    describe('Error handling', () => {
      it('should handle invalid CIDR prefixes', () => {
        const invalidInputs = [
          '192.168.1.0/33',
          '192.168.1.0/-1',
          '192.168.1.0/abc',
        ];

        invalidInputs.forEach(input => {
          const result = convertWildcardMasks([input]);
          expect(result.conversions[0].isValid).toBe(false);
          expect(result.conversions[0].error).toBeDefined();
          expect(result.errors).toHaveLength(1);
        });
      });

      it('should handle invalid IPv4 addresses', () => {
        const invalidInputs = [
          '256.1.1.1/24',
          '192.168.1/24',
          '192.168.1.1.1/24',
        ];

        invalidInputs.forEach(input => {
          const result = convertWildcardMasks([input]);
          expect(result.conversions[0].isValid).toBe(false);
          expect(result.conversions[0].error).toContain('Invalid');
        });
      });

      it('should handle invalid subnet masks', () => {
        const invalidInputs = [
          '192.168.1.0 255.255.255.1',   // Non-contiguous mask
          '192.168.1.0 256.0.0.0',       // Invalid IP
        ];

        invalidInputs.forEach(input => {
          const result = convertWildcardMasks([input]);
          expect(result.conversions[0].isValid).toBe(false);
          expect(result.conversions[0].error).toBeDefined();
        });
      });

      it('should handle invalid wildcard masks', () => {
        const invalidInputs = [
          '192.168.1.0 0.0.1.255',       // Non-contiguous wildcard
          '192.168.1.0 0.128.0.255',     // Non-contiguous wildcard
        ];

        invalidInputs.forEach(input => {
          const result = convertWildcardMasks([input]);
          expect(result.conversions[0].isValid).toBe(false);
          expect(result.conversions[0].error).toBeDefined();
        });
      });

      it('should handle invalid input formats', () => {
        const invalidInputs = [
          'not-an-ip',
          '192.168.1.0',                 // Missing mask/prefix
          '192.168.1.0 255.255.255.0 extra', // Too many parts
        ];

        invalidInputs.forEach(input => {
          const result = convertWildcardMasks([input]);
          expect(result.conversions[0].isValid).toBe(false);
          expect(result.conversions[0].error).toBeDefined();
        });
      });

      it('should handle empty inputs gracefully', () => {
        const inputs = ['', '  ', '\t', '192.168.1.0/24'];
        const result = convertWildcardMasks(inputs);

        expect(result.conversions).toHaveLength(1);
        expect(result.conversions[0].isValid).toBe(true);
      });
    });

    describe('ACL generation', () => {
      it('should generate Cisco ACL rules', () => {
        const inputs = ['192.168.1.0/24', '10.0.0.0/8'];
        const result = convertWildcardMasks(inputs, {
          type: 'permit',
          protocol: 'ip',
          destination: 'any',
          generateACL: true,
        });

        expect(result.aclRules.cisco).toHaveLength(2);
        expect(result.aclRules.cisco[0]).toContain('access-list 100 permit ip 192.168.1.0 0.0.0.255 any');
        expect(result.aclRules.cisco[1]).toContain('access-list 100 permit ip 10.0.0.0 0.255.255.255 any');
      });

      it('should generate Juniper ACL rules', () => {
        const inputs = ['192.168.1.0/24'];
        const result = convertWildcardMasks(inputs, {
          type: 'permit',
          protocol: 'tcp',
          destination: 'any',
          generateACL: true,
        });

        expect(result.aclRules.juniper).toHaveLength(2);
        expect(result.aclRules.juniper[0]).toContain('set firewall family inet filter my-filter term term10 from source-address 192.168.1.0/24');
        expect(result.aclRules.juniper[1]).toContain('set firewall family inet filter my-filter term term10 then accept');
      });

      it('should generate generic ACL rules', () => {
        const inputs = ['192.168.1.0/24'];
        const result = convertWildcardMasks(inputs, {
          type: 'deny',
          protocol: 'tcp',
          destination: '0.0.0.0/0',
          generateACL: true,
        });

        expect(result.aclRules.generic).toHaveLength(1);
        expect(result.aclRules.generic[0]).toBe('DENY TCP FROM 192.168.1.0/24 TO 0.0.0.0/0');
      });

      it('should handle host routes in ACL generation', () => {
        const inputs = ['192.168.1.1/32'];
        const result = convertWildcardMasks(inputs, {
          type: 'permit',
          protocol: 'ip',
          destination: 'any',
          generateACL: true,
        });

        expect(result.aclRules.cisco[0]).toContain('192.168.1.1 0.0.0.0');
        expect(result.aclRules.juniper[0]).toContain('host');
      });

      it('should not generate ACL rules when disabled', () => {
        const inputs = ['192.168.1.0/24'];
        const result = convertWildcardMasks(inputs, {
          type: 'permit',
          protocol: 'ip',
          destination: 'any',
          generateACL: false,
        });

        expect(result.aclRules.cisco).toHaveLength(0);
        expect(result.aclRules.juniper).toHaveLength(0);
        expect(result.aclRules.generic).toHaveLength(0);
      });

      it('should handle different ACL options', () => {
        const inputs = ['192.168.1.0/24'];
        const result = convertWildcardMasks(inputs, {
          type: 'deny',
          protocol: 'tcp',
          destination: '10.0.0.0/8',
          generateACL: true,
        });

        expect(result.aclRules.cisco[0]).toContain('deny tcp');
        expect(result.aclRules.cisco[0]).toContain('10.0.0.0/8');
        expect(result.aclRules.juniper[1]).toContain('reject');
        expect(result.aclRules.generic[0]).toContain('DENY TCP');
      });

      it('should only generate ACL rules for valid conversions', () => {
        const inputs = ['192.168.1.0/24', 'invalid', '10.0.0.0/8'];
        const result = convertWildcardMasks(inputs, {
          type: 'permit',
          protocol: 'ip',
          destination: 'any',
          generateACL: true,
        });

        expect(result.aclRules.cisco).toHaveLength(2); // Only valid conversions
        expect(result.conversions).toHaveLength(3);     // All inputs processed
      });
    });

    describe('Edge cases', () => {
      it('should handle /0 network (default route)', () => {
        const inputs = ['0.0.0.0/0'];
        const result = convertWildcardMasks(inputs);

        const conversion = result.conversions[0];
        expect(conversion.isValid).toBe(true);
        expect(conversion.prefixLength).toBe(0);
        expect(conversion.subnetMask).toBe('0.0.0.0');
        expect(conversion.wildcardMask).toBe('255.255.255.255');
        expect(conversion.hostBits).toBe(32);
        expect(conversion.totalHosts).toBe(4294967296);
      });

      it('should handle whitespace in input', () => {
        const inputs = [' 192.168.1.0/24 ', '  10.0.0.0   255.0.0.0  '];
        const result = convertWildcardMasks(inputs);

        expect(result.conversions).toHaveLength(2);
        result.conversions.forEach(conversion => {
          expect(conversion.isValid).toBe(true);
        });
      });

      it('should calculate usable hosts correctly for edge cases', () => {
        const testCases = [
          { input: '192.168.1.0/32', usable: 1 },   // Host route
          { input: '192.168.1.0/31', usable: 2 },   // Point-to-point
          { input: '192.168.1.0/30', usable: 2 },   // 4 total, 2 usable
          { input: '192.168.1.0/29', usable: 6 },   // 8 total, 6 usable
        ];

        testCases.forEach(({ input, usable }) => {
          const result = convertWildcardMasks([input]);
          expect(result.conversions[0].usableHosts).toBe(usable);
        });
      });
    });

    describe('Summary statistics', () => {
      it('should calculate summary statistics correctly', () => {
        const inputs = [
          '192.168.1.0/24',    // valid
          'invalid',           // invalid
          '10.0.0.0 255.0.0.0', // valid
          '192.168.1.0/33',    // invalid
        ];
        const result = convertWildcardMasks(inputs);

        expect(result.summary.totalInputs).toBe(4);
        expect(result.summary.validInputs).toBe(2);
        expect(result.summary.invalidInputs).toBe(2);
        expect(result.errors).toHaveLength(2);
      });
    });
  });
});