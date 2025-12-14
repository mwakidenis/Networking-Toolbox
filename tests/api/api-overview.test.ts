import { describe, it, expect } from 'vitest';
import { makeApiRequest } from './utils/api-test-helpers';

describe('API Overview Endpoint', () => {
  it('should return API overview with all categories and endpoints', async () => {
    const { status, data } = await makeApiRequest('/api', 'GET');

    expect(status).toBe(200);
    expect(data.message).toBe('IP Calculator API');
    expect(data.version).toBe('1.0.0');

    // Check categories
    expect(data.categories).toContain('subnetting');
    expect(data.categories).toContain('cidr');
    expect(data.categories).toContain('ip-address-convertor');
    expect(data.categories).toContain('dns');

    // Check endpoints structure
    expect(data.endpoints).toHaveProperty('subnetting');
    expect(data.endpoints).toHaveProperty('cidr');
    expect(data.endpoints).toHaveProperty('ip-address-convertor');
    expect(data.endpoints).toHaveProperty('dns');

    // Validate subnetting endpoints
    const subnettingTools = data.endpoints.subnetting.map((e: any) => e.tool);
    expect(subnettingTools).toContain('ipv4-subnet-calculator');
    expect(subnettingTools).toContain('ipv6-subnet-calculator');

    // Validate CIDR endpoints
    const cidrTools = data.endpoints.cidr.map((e: any) => e.tool);
    expect(cidrTools).toContain('cidr-to-subnet-mask');
    expect(cidrTools).toContain('subnet-mask-to-cidr');
    expect(cidrTools).toContain('split');
    expect(cidrTools).toContain('deaggregate');
    expect(cidrTools).toContain('compare');

    // Validate IP converter endpoints
    const converterTools = data.endpoints['ip-address-convertor'].map((e: any) => e.tool);
    expect(converterTools).toContain('validator');
    expect(converterTools).toContain('normalize');

    // Validate DNS endpoints
    const dnsTools = data.endpoints.dns.map((e: any) => e.tool);
    expect(dnsTools).toContain('ptr-generator');
    expect(dnsTools).toContain('reverse-zones');

    // Check usage example
    expect(data.usage).toHaveProperty('description');
    expect(data.usage).toHaveProperty('example');
  });
});
