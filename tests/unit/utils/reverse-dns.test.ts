import { describe, it, expect } from 'vitest';
import {
  generatePTRName,
  generateCIDRPTRs,
  calculateReverseZones,
  generateReverseZoneFile,
  analyzePTRCoverage,
  isValidIP,
  isValidCIDR,
} from '../../../src/lib/utils/reverse-dns';

describe('reverse-dns', () => {
  describe('generatePTRName', () => {
    describe('IPv4 addresses', () => {
      it('should generate PTR name for valid IPv4 address', () => {
        const result = generatePTRName('192.168.1.10');

        expect(result).toBeDefined();
        expect(result?.type).toBe('IPv4');
        expect(result?.ip).toBe('192.168.1.10');
        expect(result?.ptrName).toBe('10.1.168.192.in-addr.arpa');
        expect(result?.zone).toBe('1.168.192.in-addr.arpa');
      });

      it('should handle IPv4 edge cases', () => {
        const testCases = [
          { ip: '0.0.0.0', ptrName: '0.0.0.0.in-addr.arpa' },
          { ip: '255.255.255.255', ptrName: '255.255.255.255.in-addr.arpa' },
          { ip: '127.0.0.1', ptrName: '1.0.0.127.in-addr.arpa' },
        ];

        testCases.forEach(({ ip, ptrName }) => {
          const result = generatePTRName(ip);
          expect(result?.ptrName).toBe(ptrName);
          expect(result?.type).toBe('IPv4');
        });
      });
    });

    describe('IPv6 addresses', () => {
      it('should generate PTR name for valid IPv6 address', () => {
        const result = generatePTRName('2001:db8::1');

        expect(result).toBeDefined();
        expect(result?.type).toBe('IPv6');
        expect(result?.ip).toBe('2001:db8::1');
        expect(result?.ptrName).toBe('1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa');
      });

      it('should handle compressed IPv6 addresses', () => {
        const result = generatePTRName('::1');

        expect(result).toBeDefined();
        expect(result?.type).toBe('IPv6');
        expect(result?.ptrName).toBe('1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa');
      });

      it('should handle full-form IPv6 addresses', () => {
        const result = generatePTRName('2001:0db8:0000:0000:0000:0000:0000:0001');

        expect(result).toBeDefined();
        expect(result?.type).toBe('IPv6');
        expect(result?.ptrName).toBe('1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa');
      });

      it('should generate appropriate zone for IPv6', () => {
        const result = generatePTRName('2001:db8:1234:5678::1');

        expect(result?.zone).toBe('8.7.6.5.4.3.2.1.8.b.d.0.1.0.0.2.ip6.arpa');
      });
    });

    describe('Invalid addresses', () => {
      it('should return null for invalid IPv4 addresses', () => {
        const invalidIPs = [
          '256.1.1.1',
          '192.168.1',
          '192.168.1.1.1',
          'not-an-ip',
          '192.168.01.1', // Leading zero
        ];

        invalidIPs.forEach(ip => {
          expect(generatePTRName(ip)).toBeNull();
        });
      });

      it('should return null for invalid IPv6 addresses', () => {
        const invalidIPs = [
          '2001:db8:::1',
          '2001:db8::g1', // Invalid hex
          '2001:db8:1:2:3:4:5:6:7:8', // Too many groups
          ':::', // Invalid compression
        ];

        invalidIPs.forEach(ip => {
          expect(generatePTRName(ip)).toBeNull();
        });
      });

      it('should return null for empty string', () => {
        expect(generatePTRName('')).toBeNull();
      });
    });
  });

  describe('generateCIDRPTRs', () => {
    describe('IPv4 CIDR blocks', () => {
      it('should generate PTR records for small IPv4 CIDR', () => {
        const result = generateCIDRPTRs('192.168.1.0/30');

        expect(result).toHaveLength(4);
        expect(result[0].ip).toBe('192.168.1.0');
        expect(result[1].ip).toBe('192.168.1.1');
        expect(result[2].ip).toBe('192.168.1.2');
        expect(result[3].ip).toBe('192.168.1.3');

        result.forEach(record => {
          expect(record.type).toBe('IPv4');
          expect(record.ptrName).toContain('.in-addr.arpa');
          expect(record.zone).toBe('1.168.192.in-addr.arpa');
        });
      });

      it('should generate PTR records for /24 network', () => {
        const result = generateCIDRPTRs('192.168.1.0/24');

        expect(result).toHaveLength(256);
        expect(result[0].ip).toBe('192.168.1.0');
        expect(result[255].ip).toBe('192.168.1.255');
      });

      it('should respect maxEntries limit', () => {
        const result = generateCIDRPTRs('192.168.1.0/24', 10);

        expect(result).toHaveLength(10);
        expect(result[0].ip).toBe('192.168.1.0');
        expect(result[9].ip).toBe('192.168.1.9');
      });

      it('should handle /32 networks', () => {
        const result = generateCIDRPTRs('192.168.1.1/32');

        expect(result).toHaveLength(1);
        expect(result[0].ip).toBe('192.168.1.1');
        expect(result[0].type).toBe('IPv4');
      });
    });

    describe('IPv6 CIDR blocks', () => {
      it('should generate representative PTR records for IPv6 CIDR', () => {
        const result = generateCIDRPTRs('2001:db8::/64');

        expect(result.length).toBeGreaterThan(0);
        expect(result.length).toBeLessThanOrEqual(10); // Limited to examples
        expect(result[0].type).toBe('IPv6');
        result.forEach(record => {
          expect(record.ptrName).toContain('.ip6.arpa');
        });
      });

      it('should handle /128 IPv6 networks', () => {
        const result = generateCIDRPTRs('2001:db8::1/128');

        expect(result).toHaveLength(1);
        expect(result[0].ip).toBe('2001:db8::1');
        expect(result[0].type).toBe('IPv6');
      });
    });

    describe('Error handling', () => {
      it('should throw error for missing prefix', () => {
        expect(() => generateCIDRPTRs('192.168.1.0')).toThrow('CIDR notation requires a prefix length');
      });

      it('should throw error for invalid IPv4 CIDR', () => {
        expect(() => generateCIDRPTRs('256.1.1.1/24')).toThrow('Invalid network address');
      });

      it('should throw error for invalid prefix', () => {
        expect(() => generateCIDRPTRs('192.168.1.0/33')).toThrow('Invalid IPv4 CIDR notation');
      });

      it('should throw error for very large CIDR blocks', () => {
        expect(() => generateCIDRPTRs('10.0.0.0/8')).toThrow('CIDR block too large');
      });

      it('should throw error for IPv6 blocks smaller than /64', () => {
        expect(() => generateCIDRPTRs('2001:db8::/80')).toThrow('IPv6 CIDR blocks smaller than /64');
      });
    });
  });

  describe('calculateReverseZones', () => {
    describe('IPv4 reverse zones', () => {
      it('should calculate zone for /24 network', () => {
        const result = calculateReverseZones('192.168.1.0/24');

        expect(result).toHaveLength(1);
        expect(result[0].zone).toBe('1.168.192.in-addr.arpa');
        expect(result[0].type).toBe('IPv4');
        expect(result[0].delegation).toBe('/24');
      });

      it('should calculate zones for /16 network', () => {
        const result = calculateReverseZones('192.168.0.0/16');

        expect(result.length).toBeGreaterThan(1);
        expect(result[0].zone).toContain('168.192.in-addr.arpa');
        expect(result[0].type).toBe('IPv4');
      });

      it('should calculate zone for /8 network', () => {
        const result = calculateReverseZones('10.0.0.0/8');

        expect(result).toHaveLength(1);
        expect(result[0].zone).toBe('0.10.in-addr.arpa');
        expect(result[0].type).toBe('IPv4');
      });

      it('should handle /30 networks', () => {
        const result = calculateReverseZones('192.168.1.0/30');

        expect(result).toHaveLength(1);
        expect(result[0].zone).toBe('1.168.192.in-addr.arpa');
        expect(result[0].delegation).toBe('/24');
      });
    });

    describe('IPv6 reverse zones', () => {
      it('should calculate zone for IPv6 /64 network', () => {
        const result = calculateReverseZones('2001:db8::/64');

        expect(result).toHaveLength(1);
        expect(result[0].zone).toContain('.ip6.arpa');
        expect(result[0].type).toBe('IPv6');
        expect(result[0].nibbleDepth).toBe(16); // 64 bits / 4 bits per nibble
      });

      it('should calculate zone for IPv6 /48 network', () => {
        const result = calculateReverseZones('2001:db8:1234::/48');

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe('IPv6');
        expect(result[0].nibbleDepth).toBe(12); // 48 bits / 4 bits per nibble
      });

      it('should handle /128 IPv6 networks', () => {
        const result = calculateReverseZones('2001:db8::1/128');

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe('IPv6');
        expect(result[0].nibbleDepth).toBe(32); // 128 bits / 4 bits per nibble
      });
    });

    describe('Error handling', () => {
      it('should throw error for missing prefix', () => {
        expect(() => calculateReverseZones('192.168.1.0')).toThrow('CIDR notation requires a prefix length');
      });

      it('should throw error for invalid network', () => {
        expect(() => calculateReverseZones('invalid/24')).toThrow('Invalid network address');
      });
    });
  });

  describe('generateReverseZoneFile', () => {
    it('should generate basic IPv4 reverse zone file', () => {
      const records = [
        { ip: '192.168.1.1', ptrName: '1.1.168.192.in-addr.arpa', type: 'IPv4' as const, zone: '1.168.192.in-addr.arpa' },
        { ip: '192.168.1.2', ptrName: '2.1.168.192.in-addr.arpa', type: 'IPv4' as const, zone: '1.168.192.in-addr.arpa' },
      ];

      const result = generateReverseZoneFile('1.168.192.in-addr.arpa', records);

      expect(result).toContain('SOA');
      expect(result).toContain('NS');
      expect(result).toContain('PTR');
      expect(result).toContain('1                    IN      PTR');
      expect(result).toContain('2                    IN      PTR');
      expect(result).toContain('host-192-168-1-1.example.com.');
    });

    it('should generate zone file with custom options', () => {
      const records = [
        { ip: '192.168.1.1', ptrName: '1.1.168.192.in-addr.arpa', type: 'IPv4' as const, zone: '1.168.192.in-addr.arpa' },
      ];

      const options = {
        nameServers: ['ns1.custom.com.', 'ns2.custom.com.'],
        contactEmail: 'admin.custom.com.',
        domainSuffix: 'custom.com.',
        ttl: 3600,
      };

      const result = generateReverseZoneFile('1.168.192.in-addr.arpa', records, undefined, options);

      expect(result).toContain('ns1.custom.com.');
      expect(result).toContain('ns2.custom.com.');
      expect(result).toContain('admin.custom.com.');
      expect(result).toContain('$TTL 3600');
      expect(result).toContain('custom.com.');
    });

    it('should generate zone file with custom template', () => {
      const records = [
        { ip: '192.168.1.1', ptrName: '1.1.168.192.in-addr.arpa', type: 'IPv4' as const, zone: '1.168.192.in-addr.arpa' },
      ];

      const template = 'server-{ip-dashes}.{domain}';
      const result = generateReverseZoneFile('1.168.192.in-addr.arpa', records, template);

      expect(result).toContain('server-192-168-1-1.example.com.');
    });

    it('should handle IPv6 records', () => {
      const records = [
        {
          ip: '2001:db8::1',
          ptrName: '1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa',
          type: 'IPv6' as const,
          zone: '8.b.d.0.1.0.0.2.ip6.arpa'
        },
      ];

      const result = generateReverseZoneFile('8.b.d.0.1.0.0.2.ip6.arpa', records);

      expect(result).toContain('PTR');
      expect(result).toContain('host-2001-db8--1.example.com.');
    });

    it('should sort records properly', () => {
      const records = [
        { ip: '192.168.1.3', ptrName: '3.1.168.192.in-addr.arpa', type: 'IPv4' as const, zone: '1.168.192.in-addr.arpa' },
        { ip: '192.168.1.1', ptrName: '1.1.168.192.in-addr.arpa', type: 'IPv4' as const, zone: '1.168.192.in-addr.arpa' },
        { ip: '192.168.1.2', ptrName: '2.1.168.192.in-addr.arpa', type: 'IPv4' as const, zone: '1.168.192.in-addr.arpa' },
      ];

      const result = generateReverseZoneFile('1.168.192.in-addr.arpa', records);
      const lines = result.split('\n');
      const ptrLines = lines.filter(line => line.includes('PTR') && !line.trim().startsWith(';'));

      // Should be sorted by IP
      expect(ptrLines[0]).toContain('1                    IN      PTR');
      expect(ptrLines[1]).toContain('2                    IN      PTR');
      expect(ptrLines[2]).toContain('3                    IN      PTR');
    });

    it('should generate valid serial number', () => {
      const records = [
        { ip: '192.168.1.1', ptrName: '1.1.168.192.in-addr.arpa', type: 'IPv4' as const, zone: '1.168.192.in-addr.arpa' },
      ];

      const result = generateReverseZoneFile('1.168.192.in-addr.arpa', records);

      // Should contain a valid serial number (YYYYMMDDNN format)
      expect(result).toMatch(/\d{10}/);
    });
  });

  describe('analyzePTRCoverage', () => {
    it('should analyze PTR coverage for complete coverage', () => {
      const existingPTRs = [
        '0.1.168.192.in-addr.arpa',
        '1.1.168.192.in-addr.arpa',
        '2.1.168.192.in-addr.arpa',
        '3.1.168.192.in-addr.arpa',
      ];

      const result = analyzePTRCoverage('192.168.1.0/30', existingPTRs);

      expect(result.cidr).toBe('192.168.1.0/30');
      expect(result.totalAddresses).toBe(4);
      expect(result.expectedPTRs).toHaveLength(4);
      expect(result.missingPTRs).toHaveLength(0);
      expect(result.extraPTRs).toHaveLength(0);
      expect(result.coverage).toBe(100);
    });

    it('should analyze PTR coverage for partial coverage', () => {
      const existingPTRs = [
        '0.1.168.192.in-addr.arpa',
        '1.1.168.192.in-addr.arpa',
      ];

      const result = analyzePTRCoverage('192.168.1.0/30', existingPTRs);

      expect(result.totalAddresses).toBe(4);
      expect(result.missingPTRs).toHaveLength(2);
      expect(result.missingPTRs).toContain('2.1.168.192.in-addr.arpa');
      expect(result.missingPTRs).toContain('3.1.168.192.in-addr.arpa');
      expect(result.coverage).toBe(50);
    });

    it('should identify extra PTR records', () => {
      const existingPTRs = [
        '0.1.168.192.in-addr.arpa',
        '1.1.168.192.in-addr.arpa',
        '2.1.168.192.in-addr.arpa',
        '3.1.168.192.in-addr.arpa',
        '4.1.168.192.in-addr.arpa', // Extra record
        '5.1.168.192.in-addr.arpa', // Extra record
      ];

      const result = analyzePTRCoverage('192.168.1.0/30', existingPTRs);

      expect(result.extraPTRs).toHaveLength(2);
      expect(result.extraPTRs).toContain('4.1.168.192.in-addr.arpa');
      expect(result.extraPTRs).toContain('5.1.168.192.in-addr.arpa');
      expect(result.coverage).toBe(100);
    });

    it('should analyze naming pattern matches', () => {
      const existingPTRs = [
        'server-01.example.com',
        'server-02.example.com',
        'host-03.example.com',
        'random-name.example.com',
      ];

      const result = analyzePTRCoverage('192.168.1.0/30', existingPTRs, '^server-\\d+\\.example\\.com$');

      expect(result.patternMatches).toBe(2);
    });

    it('should handle invalid regex pattern gracefully', () => {
      const existingPTRs = ['test.example.com'];

      const result = analyzePTRCoverage('192.168.1.0/30', existingPTRs, '[invalid-regex');

      expect(result.patternMatches).toBe(0);
    });

    it('should handle empty existing PTRs', () => {
      const result = analyzePTRCoverage('192.168.1.0/30', []);

      expect(result.missingPTRs).toHaveLength(4);
      expect(result.extraPTRs).toHaveLength(0);
      expect(result.coverage).toBe(0);
    });
  });

  describe('isValidIP', () => {
    it('should validate IPv4 addresses', () => {
      const validIPv4s = ['192.168.1.1', '0.0.0.0', '255.255.255.255', '127.0.0.1'];

      validIPv4s.forEach(ip => {
        const result = isValidIP(ip);
        expect(result.valid).toBe(true);
        expect(result.type).toBe('IPv4');
      });
    });

    it('should validate IPv6 addresses', () => {
      const validIPv6s = ['2001:db8::1', '::1', 'fe80::1%eth0', '2001:db8:1234:5678:9abc:def0:1234:5678'];

      validIPv6s.forEach(ip => {
        const result = isValidIP(ip);
        expect(result.valid).toBe(true);
        expect(result.type).toBe('IPv6');
      });
    });

    it('should reject invalid IP addresses', () => {
      const invalidIPs = ['256.1.1.1', '192.168.1', 'not-an-ip', '2001:db8:::1', ''];

      invalidIPs.forEach(ip => {
        const result = isValidIP(ip);
        expect(result.valid).toBe(false);
        expect(result.type).toBeUndefined();
      });
    });
  });

  describe('isValidCIDR', () => {
    it('should validate IPv4 CIDR notation', () => {
      const validCIDRs = ['192.168.1.0/24', '10.0.0.0/8', '172.16.0.0/16', '192.168.1.1/32'];

      validCIDRs.forEach(cidr => {
        const result = isValidCIDR(cidr);
        expect(result.valid).toBe(true);
        expect(result.type).toBe('IPv4');
      });
    });

    it('should validate IPv6 CIDR notation', () => {
      const validCIDRs = ['2001:db8::/64', 'fe80::/10', '::1/128', '2001:db8:1234::/48'];

      validCIDRs.forEach(cidr => {
        const result = isValidCIDR(cidr);
        expect(result.valid).toBe(true);
        expect(result.type).toBe('IPv6');
      });
    });

    it('should reject invalid CIDR notation', () => {
      const invalidCIDRs = [
        '192.168.1.0/33', // Invalid prefix
        '256.1.1.1/24',   // Invalid IP
        '192.168.1.0',    // Missing prefix
        '2001:db8::/129', // Invalid IPv6 prefix
        'not-cidr/24',    // Invalid format
        '192.168.1.0/abc', // Non-numeric prefix
      ];

      invalidCIDRs.forEach(cidr => {
        const result = isValidCIDR(cidr);
        expect(result.valid).toBe(false);
        expect(result.type).toBeUndefined();
      });
    });

    it('should handle edge cases', () => {
      expect(isValidCIDR('0.0.0.0/0').valid).toBe(true);
      expect(isValidCIDR('::/0').valid).toBe(true);
      expect(isValidCIDR('').valid).toBe(false);
    });
  });
});