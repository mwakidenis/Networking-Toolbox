import { describe, it, expect } from 'vitest';
import { makeApiRequest, validateSuccessResponse } from './utils/api-test-helpers';

describe('DNS API Endpoints', () => {
  describe('POST /api/dns/ptr-generator', () => {
    describe('Single IP PTR generation', () => {
      it('should generate PTR for single IPv4 address', async () => {
        const { status, data } = await makeApiRequest('/api/dns/ptr-generator', 'POST', {
          ip: '192.168.1.1',
        });

        expect(status).toBe(200);
        validateSuccessResponse(data, 'ptr-generator');
        expect(data.result.ptr).toBe('1.1.168.192.in-addr.arpa');
        expect(data.result.ip).toBe('192.168.1.1');
      });

      it('should generate PTR for single IPv6 address', async () => {
        const { status, data } = await makeApiRequest('/api/dns/ptr-generator', 'POST', {
          ip: '2001:db8::1',
        });

        expect(status).toBe(200);
        validateSuccessResponse(data, 'ptr-generator');
        expect(data.result.ptr).toMatch(/\.ip6\.arpa$/);
        expect(data.result.ip).toBe('2001:db8::1');
        // PTR should be reversed nibbles
        expect(data.result.ptr).toContain('1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0');
      });

      it('should handle IPv4 loopback', async () => {
        const { status, data } = await makeApiRequest('/api/dns/ptr-generator', 'POST', {
          ip: '127.0.0.1',
        });

        expect(status).toBe(200);
        validateSuccessResponse(data, 'ptr-generator');
        expect(data.result.ptr).toBe('1.0.0.127.in-addr.arpa');
      });

      it('should handle IPv6 loopback', async () => {
        const { status, data } = await makeApiRequest('/api/dns/ptr-generator', 'POST', {
          ip: '::1',
        });

        expect(status).toBe(200);
        validateSuccessResponse(data, 'ptr-generator');
        expect(data.result.ptr).toMatch(/^1\.0\.0\.0.*\.ip6\.arpa$/);
      });

      it('should handle invalid IP address', async () => {
        const { status, data } = await makeApiRequest('/api/dns/ptr-generator', 'POST', {
          ip: 'invalid.ip.address',
        });

        expect(status).toBe(200);
        validateSuccessResponse(data, 'ptr-generator');
        expect(data.result.error).toBeDefined();
      });
    });

    describe('CIDR block PTR generation', () => {
      it('should generate PTR records for /29 subnet', async () => {
        const { status, data } = await makeApiRequest('/api/dns/ptr-generator', 'POST', {
          cidr: '192.168.1.0/29',
        });

        expect(status).toBe(200);
        validateSuccessResponse(data, 'ptr-generator');
        expect(data.result.records).toBeInstanceOf(Array);
        expect(data.result.records.length).toBe(8); // /29 = 8 addresses
        expect(data.result.records[0]).toMatch(/^0\.1\.168\.192\.in-addr\.arpa IN PTR/);
        expect(data.result.records[7]).toMatch(/^7\.1\.168\.192\.in-addr\.arpa IN PTR/);
        expect(data.result.totalRecords).toBe(8);
      });

      it('should generate PTR records with custom template', async () => {
        const { status, data } = await makeApiRequest('/api/dns/ptr-generator', 'POST', {
          cidr: '192.168.1.0/30',
          template: 'server-{octets}.example.com',
        });

        expect(status).toBe(200);
        validateSuccessResponse(data, 'ptr-generator');
        expect(data.result.records).toHaveLength(4); // /30 = 4 addresses
        expect(data.result.template).toBe('server-{octets}.example.com');
        expect(data.result.records[0]).toContain('server-192-168-1-0.example.com');
        expect(data.result.records[1]).toContain('server-192-168-1-1.example.com');
      });

      it('should handle template with {ip} variable', async () => {
        const { status, data } = await makeApiRequest('/api/dns/ptr-generator', 'POST', {
          cidr: '10.0.0.0/30',
          template: 'host-{ip}.internal',
        });

        expect(status).toBe(200);
        validateSuccessResponse(data, 'ptr-generator');
        expect(data.result.records[0]).toContain('host-10.0.0.0.internal');
        expect(data.result.records[1]).toContain('host-10.0.0.1.internal');
      });

      it('should handle /24 subnet (limit to 256)', async () => {
        const { status, data } = await makeApiRequest('/api/dns/ptr-generator', 'POST', {
          cidr: '10.1.1.0/24',
        });

        expect(status).toBe(200);
        validateSuccessResponse(data, 'ptr-generator');
        expect(data.result.records).toHaveLength(256);
        expect(data.result.records[0]).toMatch(/^0\.1\.1\.10\.in-addr\.arpa/);
        expect(data.result.records[255]).toMatch(/^255\.1\.1\.10\.in-addr\.arpa/);
      });

      it('should reject IPv6 CIDR < /120', async () => {
        const { status, data } = await makeApiRequest('/api/dns/ptr-generator', 'POST', {
          cidr: '2001:db8::/64',
        });

        expect(status).toBe(200);
        validateSuccessResponse(data, 'ptr-generator');
        // Should return an error or empty records
        if (data.result.error) {
          expect(data.result.error).toMatch(/120|prefix|support/i);
        } else {
          expect(data.result.records).toHaveLength(0);
        }
      });

      it('should handle IPv6 /120 subnet', async () => {
        const { status, data } = await makeApiRequest('/api/dns/ptr-generator', 'POST', {
          cidr: '2001:db8::/120',
        });

        expect(status).toBe(200);
        validateSuccessResponse(data, 'ptr-generator');
        if (!data.result.error) {
          expect(data.result.records.length).toBeLessThanOrEqual(256);
          if (data.result.records.length > 0) {
            expect(data.result.records[0]).toMatch(/\.ip6\.arpa IN PTR/);
          }
        }
      });

      it('should handle invalid CIDR format', async () => {
        const { status, data } = await makeApiRequest('/api/dns/ptr-generator', 'POST', {
          cidr: 'invalid-cidr',
        });

        expect(status).toBe(200);
        validateSuccessResponse(data, 'ptr-generator');
        expect(data.result.error).toBeDefined();
      });

      it('should require either ip or cidr parameter', async () => {
        const { status, data } = await makeApiRequest('/api/dns/ptr-generator', 'POST', {});

        expect(status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toMatch(/ip|cidr|required/i);
      });
    });
  });

  describe('POST /api/dns/reverse-zones', () => {
    it('should calculate reverse zone for /24 subnet', async () => {
      const { status, data } = await makeApiRequest('/api/dns/reverse-zones', 'POST', {
        cidr: '192.168.1.0/24',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'reverse-zones');
      expect(data.result.zones).toContain('1.168.192.in-addr.arpa');
      expect(data.result.cidr).toBe('192.168.1.0/24');
      expect(data.result.ipVersion).toBe(4);
      expect(data.result.totalZones).toBe(1);
    });

    it('should calculate multiple zones for /16 subnet', async () => {
      const { status, data } = await makeApiRequest('/api/dns/reverse-zones', 'POST', {
        cidr: '10.0.0.0/16',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'reverse-zones');
      // /16 should have multiple /24 zones
      expect(data.result.zones.length).toBe(256);
      expect(data.result.zones[0]).toMatch(/\.0\.10\.in-addr\.arpa$/);
      expect(data.result.zones[255]).toMatch(/\.0\.10\.in-addr\.arpa$/);
      expect(data.result.ipVersion).toBe(4);
    });

    it('should handle small subnet /28', async () => {
      const { status, data } = await makeApiRequest('/api/dns/reverse-zones', 'POST', {
        cidr: '192.168.1.0/28',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'reverse-zones');
      // Small subnets still need a /24 zone
      expect(data.result.zones).toContain('1.168.192.in-addr.arpa');
      expect(data.result.totalZones).toBe(1);
    });

    it('should handle /8 network', async () => {
      const { status, data } = await makeApiRequest('/api/dns/reverse-zones', 'POST', {
        cidr: '10.0.0.0/8',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'reverse-zones');
      // Very large network might show class-based zone
      expect(data.result.zones[0]).toMatch(/10\.in-addr\.arpa/);
      expect(data.result.ipVersion).toBe(4);
    });

    it('should handle IPv6 /64 subnet', async () => {
      const { status, data } = await makeApiRequest('/api/dns/reverse-zones', 'POST', {
        cidr: '2001:db8::/64',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'reverse-zones');
      expect(data.result.zones.length).toBeGreaterThan(0);
      expect(data.result.zones[0]).toMatch(/\.ip6\.arpa$/);
      expect(data.result.ipVersion).toBe(6);
      expect(data.result.cidr).toBe('2001:db8::/64');
    });

    it('should handle IPv6 /48 delegation', async () => {
      const { status, data } = await makeApiRequest('/api/dns/reverse-zones', 'POST', {
        cidr: '2001:db8::/48',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'reverse-zones');
      expect(data.result.zones.length).toBeGreaterThan(0);
      expect(data.result.zones[0]).toMatch(/\.ip6\.arpa$/);
      expect(data.result.ipVersion).toBe(6);
    });

    it('should handle IPv6 non-nibble boundary', async () => {
      const { status, data } = await makeApiRequest('/api/dns/reverse-zones', 'POST', {
        cidr: '2001:db8::/65', // Not on 4-bit boundary
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'reverse-zones');
      // Should return error about alignment
      if (data.result.error) {
        expect(data.result.error).toMatch(/4-bit|nibble|boundary|align/i);
      } else {
        // Or might return empty zones
        expect(data.result.totalZones).toBe(0);
      }
    });

    it('should handle invalid CIDR format', async () => {
      const { status, data } = await makeApiRequest('/api/dns/reverse-zones', 'POST', {
        cidr: 'not-a-cidr',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'reverse-zones');
      expect(data.result.error).toBeDefined();
      expect(data.result.zones).toHaveLength(0);
    });

    it('should handle missing CIDR parameter', async () => {
      const { status, data } = await makeApiRequest('/api/dns/reverse-zones', 'POST', {});

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      // API returns success but includes error in result when parameter is missing
      expect(data.result.error).toBeDefined();
      expect(data.result.zones).toEqual([]);
    });

    it('should handle /32 host address', async () => {
      const { status, data } = await makeApiRequest('/api/dns/reverse-zones', 'POST', {
        cidr: '192.168.1.1/32',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'reverse-zones');
      // Single host still needs the /24 zone
      expect(data.result.zones).toContain('1.168.192.in-addr.arpa');
      expect(data.result.totalZones).toBe(1);
    });

    it('should handle /128 IPv6 host', async () => {
      const { status, data } = await makeApiRequest('/api/dns/reverse-zones', 'POST', {
        cidr: '2001:db8::1/128',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'reverse-zones');
      expect(data.result.zones.length).toBeGreaterThan(0);
      expect(data.result.zones[0]).toMatch(/\.ip6\.arpa$/);
      expect(data.result.ipVersion).toBe(6);
    });
  });
});