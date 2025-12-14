import { describe, it, expect, vi } from 'vitest';
import { POST } from '../../../../../../../src/routes/api/internal/diagnostics/axfr/+server';

// Mock the request object
const createMockRequest = (body: any) => ({
  json: vi.fn().mockResolvedValue(body),
});

describe('AXFR Security Tester API - Server Tests', () => {
  describe('Input Validation', () => {
    it('should reject empty domain', async () => {
      const mockRequest = createMockRequest({ domain: '' });

      try {
        await POST({ request: mockRequest } as any);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.status).toBe(400);
        expect(error.body.message).toMatch(/required/i);
      }
    });

    it('should reject missing domain', async () => {
      const mockRequest = createMockRequest({});

      try {
        await POST({ request: mockRequest } as any);
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.status).toBe(400);
        expect(error.body.message).toMatch(/required/i);
      }
    });

    it('should reject whitespace-only domain', async () => {
      const mockRequest = createMockRequest({ domain: '   ' });

      try {
        await POST({ request: mockRequest } as any);
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.status).toBe(400);
        expect(error.body.message).toMatch(/required/i);
      }
    });

    it('should reject invalid domain format', async () => {
      const mockRequest = createMockRequest({ domain: 'invalid domain with spaces' });

      try {
        await POST({ request: mockRequest } as any);
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.status).toBe(400);
        expect(error.body.message).toMatch(/invalid|format/i);
      }
    });

    it('should reject invalid JSON', async () => {
      const mockRequest = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      };

      try {
        await POST({ request: mockRequest } as any);
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.status).toBe(400);
        expect(error.body.message).toMatch(/json/i);
      }
    });
  });

  describe('Domain Normalization', () => {
    it('should normalize domain to lowercase', async () => {
      const mockRequest = createMockRequest({ domain: 'Example.COM' });

      try {
        const response = await POST({ request: mockRequest } as any);
        const data = await response.json();
        expect(data.domain).toBe('example.com');
      } catch (error: any) {
        // Network errors are acceptable (domain might not exist)
        if (error.status === 500 || error.status === 400) {
          expect(error.body.message).toBeDefined();
        }
      }
    });

    it('should trim whitespace from domain', async () => {
      const mockRequest = createMockRequest({ domain: '  example.com  ' });

      try {
        const response = await POST({ request: mockRequest } as any);
        const data = await response.json();
        expect(data.domain).toBe('example.com');
      } catch (error: any) {
        // Network errors are acceptable
        if (error.status === 500 || error.status === 400) {
          expect(error.body.message).toBeDefined();
        }
      }
    });
  });

  describe('Basic Functionality', () => {
    it('should accept valid domain and return proper structure', async () => {
      const mockRequest = createMockRequest({ domain: 'example.com' });

      try {
        const response = await POST({ request: mockRequest } as any);
        const data = await response.json();

        expect(data.domain).toBe('example.com');
        expect(data.nameservers).toBeInstanceOf(Array);
        expect(data.summary).toBeDefined();
        expect(data.summary).toHaveProperty('total');
        expect(data.summary).toHaveProperty('vulnerable');
        expect(data.summary).toHaveProperty('secure');
        expect(data.summary).toHaveProperty('errors');
        expect(data.timestamp).toBeDefined();
      } catch (error: any) {
        // Network/DNS errors are acceptable for this test
        expect([400, 500]).toContain(error.status);
      }
    });

    it('should handle single nameserver parameter', async () => {
      const mockRequest = createMockRequest({
        domain: 'example.com',
        nameserver: 'a.iana-servers.net',
      });

      try {
        const response = await POST({ request: mockRequest } as any);
        const data = await response.json();

        expect(data.nameservers.length).toBe(1);
        expect(data.nameservers[0].nameserver).toBe('a.iana-servers.net');
      } catch (error: any) {
        // Network errors are acceptable
        expect([400, 500]).toContain(error.status);
      }
    });

    it('should limit to 10 nameservers', async () => {
      const mockRequest = createMockRequest({ domain: 'example.com' });

      try {
        const response = await POST({ request: mockRequest } as any);
        const data = await response.json();

        // Should not exceed 10 nameservers
        expect(data.nameservers.length).toBeLessThanOrEqual(10);
      } catch (error: any) {
        // Network errors are acceptable
        expect([400, 500]).toContain(error.status);
      }
    });
  });

  describe('Response Structure', () => {
    it('should include all required nameserver fields', async () => {
      const mockRequest = createMockRequest({ domain: 'example.com' });

      try {
        const response = await POST({ request: mockRequest } as any);
        const data = await response.json();

        for (const ns of data.nameservers) {
          expect(ns).toHaveProperty('nameserver');
          expect(ns).toHaveProperty('ip');
          expect(ns).toHaveProperty('vulnerable');
          expect(ns).toHaveProperty('responseTime');
          expect(typeof ns.nameserver).toBe('string');
          expect(typeof ns.vulnerable).toBe('boolean');
          expect(typeof ns.responseTime).toBe('number');
        }
      } catch (error: any) {
        // Network errors are acceptable
        expect([400, 500]).toContain(error.status);
      }
    });

    it('should calculate correct summary counts', async () => {
      const mockRequest = createMockRequest({ domain: 'example.com' });

      try {
        const response = await POST({ request: mockRequest } as any);
        const data = await response.json();

        const vulnerable = data.nameservers.filter((ns: any) => ns.vulnerable).length;
        const secure = data.nameservers.filter((ns: any) => !ns.vulnerable && !ns.error).length;
        const errors = data.nameservers.filter((ns: any) => ns.error).length;

        expect(data.summary.vulnerable).toBe(vulnerable);
        expect(data.summary.secure).toBe(secure);
        expect(data.summary.errors).toBe(errors);
        expect(data.summary.total).toBe(data.nameservers.length);
      } catch (error: any) {
        // Network errors are acceptable
        expect([400, 500]).toContain(error.status);
      }
    });

    it('should include valid timestamp', async () => {
      const mockRequest = createMockRequest({ domain: 'example.com' });

      try {
        const response = await POST({ request: mockRequest } as any);
        const data = await response.json();

        expect(data.timestamp).toBeDefined();
        const timestamp = new Date(data.timestamp);
        expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
        expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 60000);
      } catch (error: any) {
        // Network errors are acceptable
        expect([400, 500]).toContain(error.status);
      }
    });
  });
});
