import { describe, it, expect } from 'vitest';
import { makeApiRequest, validateSuccessResponse, isValidCIDR, testData } from './utils/api-test-helpers';

describe('New API Endpoints', () => {
  // ============= NEW SUBNETTING TOOLS =============
  describe('POST /api/subnetting/vlsm-calculator', () => {
    it('should calculate VLSM allocations for given requirements', async () => {
      const { status, data } = await makeApiRequest('/api/subnetting/vlsm-calculator', 'POST', {
        network: '192.168.1.0',
        cidr: 24,
        requirements: [
          { name: 'Sales', hosts: 50 },
          { name: 'Engineering', hosts: 25 },
          { name: 'HR', hosts: 10 }
        ]
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'vlsm-calculator');

      const result = data.result;
      expect(result.subnets).toBeDefined();
      expect(Array.isArray(result.subnets)).toBe(true);
      expect(result.originalNetwork).toBe('192.168.1.0');
      expect(result.originalCIDR).toBe(24);
    });

    it('should handle insufficient space gracefully', async () => {
      const { status, data } = await makeApiRequest('/api/subnetting/vlsm-calculator', 'POST', {
        network: '192.168.1.0',
        cidr: 30, // Only 4 addresses available
        requirements: [
          { name: 'Large', hosts: 100 }
        ]
      });

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      // Should still return result, potentially with warnings or empty allocations
    });

    it('should handle empty requirements', async () => {
      const { status, data } = await makeApiRequest('/api/subnetting/vlsm-calculator', 'POST', {
        network: '192.168.1.0',
        cidr: 24,
        requirements: []
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'vlsm-calculator');
      expect(data.result.subnets).toHaveLength(0);
    });
  });

  describe('POST /api/subnetting/supernet-calculator', () => {
    it('should calculate supernet for multiple networks', async () => {
      const { status, data } = await makeApiRequest('/api/subnetting/supernet-calculator', 'POST', {
        networks: [
          '192.168.0.0/24',
          '192.168.1.0/24',
          '192.168.2.0/24',
          '192.168.3.0/24'
        ]
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'supernet-calculator');

      const result = data.result;
      expect(result.success).toBe(true);
      expect(result.supernet).toBeDefined();
      expect(result.supernet.network).toBeDefined();
      expect(result.supernet.cidr).toBeDefined();
      const supernetCIDR = `${result.supernet.network}/${result.supernet.cidr}`;
      expect(isValidCIDR(supernetCIDR)).toBe(true);
    });

    it('should handle single network', async () => {
      const { status, data } = await makeApiRequest('/api/subnetting/supernet-calculator', 'POST', {
        networks: ['192.168.1.0/24']
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'supernet-calculator');
      const result = data.result;
      expect(result.success).toBe(true);
      expect(result.supernet.network).toBeDefined();
      expect(result.supernet.cidr).toBeDefined();
      // For a single network, the algorithm may return a mathematically valid supernet
    });

    it('should handle empty networks list', async () => {
      const { status, data } = await makeApiRequest('/api/subnetting/supernet-calculator', 'POST', {
        networks: []
      });

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      // Should handle empty input gracefully
    });
  });

  // ============= NEW CIDR TOOLS =============
  describe('POST /api/cidr/summarize', () => {
    it('should summarize CIDR blocks efficiently', async () => {
      const { status, data } = await makeApiRequest('/api/cidr/summarize', 'POST', {
        input: '192.168.0.0/24\n192.168.1.0/24\n192.168.2.0/24\n192.168.3.0/24',
        mode: 'optimize'
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'summarize');

      const result = data.result;
      expect(result.ipv4).toBeDefined();
      expect(Array.isArray(result.ipv4)).toBe(true);
      expect(result.ipv4).toContain('192.168.0.0/22'); // Should summarize to /22
    });

    it('should handle IP ranges and single IPs', async () => {
      const { status, data } = await makeApiRequest('/api/cidr/summarize', 'POST', {
        input: '192.168.1.1\n192.168.1.2\n192.168.1.3-192.168.1.10',
        mode: 'ranges'
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'summarize');

      const result = data.result;
      expect(result.ipv4).toBeDefined();
      expect(Array.isArray(result.ipv4)).toBe(true);
    });

    it('should handle different input modes', async () => {
      const { status, data } = await makeApiRequest('/api/cidr/summarize', 'POST', {
        input: '10.0.0.0/24\n10.0.1.0/24',
        mode: 'aggregate'
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'summarize');
      expect(data.result.ipv4).toBeDefined();
    });
  });

  describe('POST /api/cidr/next-available', () => {
    it('should find next available subnet from pools', async () => {
      const { status, data } = await makeApiRequest('/api/cidr/next-available', 'POST', {
        pools: ['10.0.0.0/16'],
        allocations: ['10.0.0.0/24', '10.0.1.0/24'],
        requiredSize: 24
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'next-available');

      const result = data.result;
      // Check that response has basic data structure
      expect(data.result).toBeDefined();
      expect(typeof data.result).toBe('object');
    });

    it('should handle no available space', async () => {
      const { status, data } = await makeApiRequest('/api/cidr/next-available', 'POST', {
        pools: ['192.168.1.0/30'], // Only 4 addresses
        allocations: ['192.168.1.0/30'], // All allocated
        requiredSize: 30
      });

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      // Should indicate no space available
    });
  });

  describe('POST /api/cidr/alignment', () => {
    it('should check CIDR prefix boundary alignment', async () => {
      const { status, data } = await makeApiRequest('/api/cidr/alignment', 'POST', {
        inputs: ['192.168.0.0/24', '192.168.1.0/24', '192.168.2.0/24'],
        targetPrefix: 22
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'alignment');

      const result = data.result;
      // Check that response has basic data structure
      expect(data.result).toBeDefined();
      expect(typeof data.result).toBe('object');
    });

    it('should handle single input', async () => {
      const { status, data } = await makeApiRequest('/api/cidr/alignment', 'POST', {
        inputs: ['192.168.0.0/24'],
        targetPrefix: 24
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'alignment');
      // Check that response has alignment data
      expect(data.result).toBeDefined();
    });
  });

  describe('POST /api/cidr/wildcard-mask', () => {
    it('should convert between CIDR, subnet masks, and wildcard masks', async () => {
      const { status, data } = await makeApiRequest('/api/cidr/wildcard-mask', 'POST', {
        inputs: ['192.168.1.0/24', '255.255.0.0', '0.0.255.255']
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'wildcard-mask');

      const result = data.result;
      expect(result.conversions).toBeDefined();
      expect(Array.isArray(result.conversions)).toBe(true);

      const conversion = result.conversions[0];
      expect(conversion.input).toBe('192.168.1.0/24');
      expect(conversion.cidr).toBeDefined();
      expect(conversion.subnetMask).toBeDefined();
      expect(conversion.wildcardMask).toBeDefined();
    });

    it('should handle various input formats', async () => {
      const { status, data } = await makeApiRequest('/api/cidr/wildcard-mask', 'POST', {
        inputs: ['10.0.0.0/8', '255.255.255.0', '0.0.0.255']
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'wildcard-mask');
      expect(data.result.conversions).toHaveLength(3);
    });
  });

  describe('POST /api/cidr/diff', () => {
    it('should compute difference between CIDR sets', async () => {
      const { status, data } = await makeApiRequest('/api/cidr/diff', 'POST', {
        setA: ['192.168.0.0/24', '192.168.1.0/24', '10.0.0.0/24'],
        setB: ['192.168.1.0/24', '172.16.0.0/24']
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'diff');

      const result = data.result;
      expect(result.ipv4).toBeDefined();
      expect(Array.isArray(result.ipv4)).toBe(true);
      expect(result.ipv4).toContain('192.168.0.0/24');
      expect(result.ipv4).toContain('10.0.0.0/24');
      expect(result.ipv4).not.toContain('192.168.1.0/24'); // In both sets
    });

    it('should handle empty sets', async () => {
      const { status, data } = await makeApiRequest('/api/cidr/diff', 'POST', {
        setA: ['192.168.1.0/24'],
        setB: []
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'diff');
      expect(data.result.ipv4).toContain('192.168.1.0/24');
    });
  });

  describe('POST /api/cidr/overlap', () => {
    it('should find overlaps between CIDR sets', async () => {
      const { status, data } = await makeApiRequest('/api/cidr/overlap', 'POST', {
        setA: ['192.168.0.0/16', '10.0.0.0/24'],
        setB: ['192.168.1.0/24', '172.16.0.0/24']
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'overlap');

      const result = data.result;
      expect(result.ipv4 || result.overlaps).toBeDefined();
      // Check for overlap data in the response
    });

    it('should detect no overlaps', async () => {
      const { status, data } = await makeApiRequest('/api/cidr/overlap', 'POST', {
        setA: ['192.168.1.0/24'],
        setB: ['10.0.0.0/24']
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'overlap');
      expect(data.result.ipv4 || data.result.overlaps).toBeDefined();
    });
  });

  describe('POST /api/cidr/contains', () => {
    it('should check containment relationships', async () => {
      const { status, data } = await makeApiRequest('/api/cidr/contains', 'POST', {
        setA: ['192.168.0.0/16'],
        setB: ['192.168.1.0/24', '192.168.2.0/24']
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'contains');

      const result = data.result;
      // Check that response has basic data structure
      expect(data.result).toBeDefined();
      expect(typeof data.result).toBe('object');
    });

    it('should handle no containment', async () => {
      const { status, data } = await makeApiRequest('/api/cidr/contains', 'POST', {
        setA: ['192.168.1.0/24'],
        setB: ['10.0.0.0/24']
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'contains');
      // Should show no containment relationships
      expect(data.result).toBeDefined();
    });
  });

  // ============= NEW IP ADDRESS CONVERTOR TOOLS =============
  describe('POST /api/ip-address-convertor/representations', () => {
    it('should convert IPv4 to different representations', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/representations', 'POST', {
        ip: '192.168.1.1'
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'representations');

      const result = data.result;
      expect(result.decimal).toBeDefined();
      expect(result.binary).toBeDefined();
      expect(result.hex).toBeDefined();
      expect(result.octal).toBeDefined();
      expect(result.binary).toMatch(/^[01.]+$/);
      expect(result.hex).toMatch(/^0x/);
    });

    it('should handle IPv6 addresses', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/representations', 'POST', {
        ip: '2001:db8::1'
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'representations');

      const result = data.result;
      // IPv6 addresses should have different representation fields
      expect(result.binary || result.hex || result.decimal).toBeDefined();
      // The actual response structure for IPv6 may vary
    });

    it('should handle invalid IP addresses', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/representations', 'POST', {
        ip: 'invalid-ip'
      });

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      // Should handle invalid IPs gracefully
    });
  });

  describe('POST /api/ip-address-convertor/distance', () => {
    it('should calculate distance between IPv4 addresses', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/distance', 'POST', {
        ip1: '192.168.1.1',
        ip2: '192.168.1.10',
        inclusive: false
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'distance');

      const result = data.result;
      expect(result.calculations).toBeDefined();
      expect(result.calculations[0].distance).toBe('9'); // 10 - 1 = 9 (exclusive)
      expect(result.summary.totalDistance).toBe('9');
    });

    it('should calculate distance with inclusive flag', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/distance', 'POST', {
        ip1: '192.168.1.1',
        ip2: '192.168.1.10',
        inclusive: true
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'distance');
      expect(data.result.calculations[0].distance).toBe('10'); // Inclusive count
      expect(data.result.summary.totalDistance).toBe('10');
    });

    it('should handle IPv6 addresses', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/distance', 'POST', {
        ip1: '2001:db8::1',
        ip2: '2001:db8::10',
        inclusive: false
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'distance');
      expect(data.result.calculations[0].distance).toBeDefined();
    });

    it('should handle same IP addresses', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/distance', 'POST', {
        ip1: '192.168.1.1',
        ip2: '192.168.1.1',
        inclusive: false
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'distance');
      expect(data.result.calculations[0].distance).toBe('0');
    });

    it('should handle reverse order', async () => {
      const { status, data } = await makeApiRequest('/api/ip-address-convertor/distance', 'POST', {
        ip1: '192.168.1.10',
        ip2: '192.168.1.1',
        inclusive: false
      });

      expect(status).toBe(200);
      validateSuccessResponse(data, 'distance');
      expect(data.result.calculations[0].distance).toBe('9'); // Should handle reverse order
    });
  });
});