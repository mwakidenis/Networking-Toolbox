import { describe, it, expect } from 'vitest';
import { makeApiRequest, validateSuccessResponse } from './utils/api-test-helpers';

describe('IP Address Convertor API Endpoints', () => {
  describe('POST /api/ip-address-convertor/validator', () => {
    it('should validate valid IPv4 address', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/validator', 'POST', {
        ip: '192.168.1.1',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'validator');
      expect(data.result.valid).toBe(true);
      expect(data.result.ipv4).toBe(true);
      expect(data.result.ipv6).toBe(false);
    });

    it('should validate valid IPv6 address', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/validator', 'POST', {
        ip: '2001:db8::1',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'validator');
      expect(data.result.valid).toBe(true);
      expect(data.result.ipv4).toBe(false);
      expect(data.result.ipv6).toBe(true);
    });

    it('should validate IPv6 with zone ID', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/validator', 'POST', {
        ip: 'fe80::1%eth0',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'validator');
      // Zone IDs might affect validation depending on implementation
      expect(data.result).toHaveProperty('valid');
      expect(data.result).toHaveProperty('ipv4');
      expect(data.result).toHaveProperty('ipv6');
    });

    it('should handle invalid IP address', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/validator', 'POST', {
        ip: '300.300.300.300',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'validator');
      expect(data.result.valid).toBe(false);
      expect(data.result.ipv4).toBe(false);
      expect(data.result.ipv6).toBe(false);
    });

    it('should validate IPv4 loopback address', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/validator', 'POST', {
        ip: '127.0.0.1',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'validator');
      expect(data.result.valid).toBe(true);
      expect(data.result.ipv4).toBe(true);
      expect(data.result.ipv6).toBe(false);
    });

    it('should validate IPv6 loopback address', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/validator', 'POST', {
        ip: '::1',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'validator');
      expect(data.result.valid).toBe(true);
      expect(data.result.ipv4).toBe(false);
      expect(data.result.ipv6).toBe(true);
    });

    it('should handle incomplete IPv4 address', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/validator', 'POST', {
        ip: '192.168.1',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'validator');
      expect(data.result.valid).toBe(false);
      expect(data.result.ipv4).toBe(false);
      expect(data.result.ipv6).toBe(false);
    });

    it('should handle IPv4 with out-of-range octets', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/validator', 'POST', {
        ip: '192.168.1.256',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'validator');
      expect(data.result.valid).toBe(false);
      expect(data.result.ipv4).toBe(false);
      expect(data.result.ipv6).toBe(false);
    });

    it('should handle text input', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/validator', 'POST', {
        ip: 'not.an.ip.address',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'validator');
      expect(data.result.valid).toBe(false);
      expect(data.result.ipv4).toBe(false);
      expect(data.result.ipv6).toBe(false);
    });

    it('should handle empty string', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/validator', 'POST', {
        ip: '',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'validator');
      expect(data.result.valid).toBe(false);
      expect(data.result.ipv4).toBe(false);
      expect(data.result.ipv6).toBe(false);
    });

    it('should handle missing ip parameter', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/validator', 'POST', {});

      expect(status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });

  describe('POST /api/ip-address-convertor/normalize', () => {
    it('should normalize IPv6 with leading zeros', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/normalize', 'POST', {
        ip: '2001:0db8::0001',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'normalize');
      expect(data.result.normalized).toBe('2001:db8::1');
      expect(data.result.isValid).toBe(true);
    });

    it('should compress consecutive zeros', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/normalize', 'POST', {
        ip: '2001:0db8:0000:0000:0000:0000:0000:0001',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'normalize');
      expect(data.result.normalized).toBe('2001:db8::1');
      expect(data.result.isValid).toBe(true);
    });

    it('should normalize mixed case to lowercase', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/normalize', 'POST', {
        ip: '2001:DB8::ABCD:EF01',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'normalize');
      expect(data.result.normalized).toMatch(/^2001:db8::[a-f0-9:]+$/);
      expect(data.result.isValid).toBe(true);
    });

    it('should handle already normalized address', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/normalize', 'POST', {
        ip: '2001:db8::1',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'normalize');
      expect(data.result.normalized).toBe('2001:db8::1');
      expect(data.result.isValid).toBe(true);
    });

    it('should normalize loopback address', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/normalize', 'POST', {
        ip: '0000:0000:0000:0000:0000:0000:0000:0001',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'normalize');
      expect(data.result.normalized).toBe('::1');
      expect(data.result.isValid).toBe(true);
    });

    it('should normalize unspecified address', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/normalize', 'POST', {
        ip: '0000:0000:0000:0000:0000:0000:0000:0000',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'normalize');
      expect(data.result.normalized).toBe('::');
      expect(data.result.isValid).toBe(true);
    });

    it('should handle invalid IPv6 address', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/normalize', 'POST', {
        ip: 'invalid:ipv6:address',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'normalize');
      expect(data.result.normalized).toBe('');
      expect(data.result.isValid).toBe(false);
    });

    it('should handle IPv4 address (not IPv6)', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/normalize', 'POST', {
        ip: '192.168.1.1',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'normalize');
      expect(data.result.normalized).toBe('');
      expect(data.result.isValid).toBe(false);
    });

    it('should handle IPv6 with too many groups', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/normalize', 'POST', {
        ip: '2001:db8:0:0:0:0:0:0:1',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'normalize');
      expect(data.result.normalized).toBe('');
      expect(data.result.isValid).toBe(false);
    });

    it('should follow RFC 5952 compression rules', async () => {
      // Should compress the longest run of zeros
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/normalize', 'POST', {
        ip: '2001:0:0:1:0:0:0:1',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'normalize');
      expect(data.result.isValid).toBe(true);
      // The longest run of 3 zeros should be compressed
      expect(data.result.normalized).toMatch(/2001:0:0:1::1|2001::1:0:0:0:1/);
    });

    it('should not compress single zero group', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/normalize', 'POST', {
        ip: '2001:db8:0:1:2:3:4:5',
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'normalize');
      expect(data.result.isValid).toBe(true);
      // Single zero should not be compressed
      expect(data.result.normalized).toMatch(/2001:db8:0:1:2:3:4:5/);
    });

    it('should handle missing ip parameter', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/normalize', 'POST', {});

      expect(status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });
});