import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../../../../../src/routes/api/internal/mac-lookup/+server.js';

describe('MAC Lookup API Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  describe('Parameter validation', () => {
    it('should return 400 if OUI parameter is missing', async () => {
      const url = new URL('http://localhost/api/internal/mac-lookup');
      const response = await GET({ url } as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('OUI parameter is required');
    });

    it('should accept OUI parameter', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const url = new URL('http://localhost/api/internal/mac-lookup?oui=3C:22:FB');
      const response = await GET({ url } as any);

      expect(response.status).toBe(200);
    });
  });

  describe('External API interaction', () => {
    it('should call maclookup.app API with cleaned OUI', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      const mockFetch = vi.fn().mockResolvedValueOnce(mockResponse);
      globalThis.fetch = mockFetch;

      const url = new URL('http://localhost/api/internal/mac-lookup?oui=3C:22:FB');
      await GET({ url } as any);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('3C22FB'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'IP-Calc/1.0',
          }),
        })
      );
    });

    it('should handle colons in OUI input', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      const mockFetch = vi.fn().mockResolvedValueOnce(mockResponse);
      globalThis.fetch = mockFetch;

      const url = new URL('http://localhost/api/internal/mac-lookup?oui=3C:22:FB');
      await GET({ url } as any);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('3C22FB'),
        expect.any(Object)
      );
    });

    it('should handle hyphens in OUI input', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      const mockFetch = vi.fn().mockResolvedValueOnce(mockResponse);
      globalThis.fetch = mockFetch;

      const url = new URL('http://localhost/api/internal/mac-lookup?oui=3C-22-FB');
      await GET({ url } as any);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('3C22FB'),
        expect.any(Object)
      );
    });
  });

  describe('Successful OUI lookup', () => {
    it('should return OUI information when found', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          found: true,
          company: 'Apple, Inc.',
          country: 'US',
          address: '1 Apple Park Way, Cupertino CA 95014',
          blockType: 'MA-L',
          blockStart: '3C:22:FB:00:00:00',
          blockEnd: '3C:22:FB:FF:FF:FF',
          blockSize: 16777216,
          isPrivate: false,
          isRand: false,
          updated: '2023-01-15',
        }),
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const url = new URL('http://localhost/api/internal/mac-lookup?oui=3C:22:FB');
      const response = await GET({ url } as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.found).toBe(true);
      expect(data.manufacturer).toBe('Apple, Inc.');
      expect(data.country).toBe('US');
      expect(data.blockType).toBe('MA-L');
      expect(data.blockSize).toBe(16777216);
    });

    it('should include all relevant fields', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          found: true,
          company: 'Test Company',
          country: 'CA',
          address: '123 Test St',
          blockType: 'MA-M',
          blockStart: '00:11:22:00:00:00',
          blockEnd: '00:11:22:0F:FF:FF',
          blockSize: 1048576,
          isPrivate: true,
          isRand: false,
          updated: '2024-01-01',
        }),
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const url = new URL('http://localhost/api/internal/mac-lookup?oui=00:11:22');
      const response = await GET({ url } as any);

      const data = await response.json();
      expect(data).toMatchObject({
        found: true,
        manufacturer: 'Test Company',
        country: 'CA',
        address: '123 Test St',
        blockType: 'MA-M',
        blockStart: '00:11:22:00:00:00',
        blockEnd: '00:11:22:0F:FF:FF',
        blockSize: 1048576,
        isPrivate: true,
        isRand: false,
        updated: '2024-01-01',
      });
    });
  });

  describe('OUI not found scenarios', () => {
    it('should return not found when API returns 404', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const url = new URL('http://localhost/api/internal/mac-lookup?oui=00:00:00');
      const response = await GET({ url } as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.found).toBe(false);
      expect(data.manufacturer).toBe(null);
    });

    it('should return not found when API returns success=false', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: false,
          found: false,
        }),
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const url = new URL('http://localhost/api/internal/mac-lookup?oui=00:00:00');
      const response = await GET({ url } as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.found).toBe(false);
      expect(data.manufacturer).toBe(null);
    });

    it('should return not found when API returns found=false', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          found: false,
        }),
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const url = new URL('http://localhost/api/internal/mac-lookup?oui=00:00:00');
      const response = await GET({ url } as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.found).toBe(false);
      expect(data.manufacturer).toBe(null);
    });
  });

  describe('Error handling', () => {
    it('should handle external API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const url = new URL('http://localhost/api/internal/mac-lookup?oui=3C:22:FB');
      const response = await GET({ url } as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should handle network errors', async () => {
      globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const url = new URL('http://localhost/api/internal/mac-lookup?oui=3C:22:FB');
      const response = await GET({ url } as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('Failed to fetch OUI data');
      expect(data.found).toBe(false);
    });

    it('should handle JSON parsing errors', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockRejectedValue(new Error('JSON parse error')),
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const url = new URL('http://localhost/api/internal/mac-lookup?oui=3C:22:FB');
      const response = await GET({ url } as any);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty OUI parameter', async () => {
      const url = new URL('http://localhost/api/internal/mac-lookup?oui=');
      const response = await GET({ url } as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('OUI parameter is required');
    });

    it('should handle full MAC address as OUI', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      const mockFetch = vi.fn().mockResolvedValueOnce(mockResponse);
      globalThis.fetch = mockFetch;

      const url = new URL('http://localhost/api/internal/mac-lookup?oui=3C:22:FB:A1:B2:C3');
      const response = await GET({ url } as any);

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('3C22FBA1B2C3'),
        expect.any(Object)
      );
    });

    it('should handle lowercase OUI', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      const mockFetch = vi.fn().mockResolvedValueOnce(mockResponse);
      globalThis.fetch = mockFetch;

      const url = new URL('http://localhost/api/internal/mac-lookup?oui=aa:bb:cc');
      const response = await GET({ url } as any);

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle OUI with spaces', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      const mockFetch = vi.fn().mockResolvedValueOnce(mockResponse);
      globalThis.fetch = mockFetch;

      const url = new URL('http://localhost/api/internal/mac-lookup?oui=AA BB CC');
      const response = await GET({ url } as any);

      expect(response.status).toBe(200);
      // Spaces should be removed or handled
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('API response consistency', () => {
    it('should always return found field', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const url = new URL('http://localhost/api/internal/mac-lookup?oui=00:00:00');
      const response = await GET({ url } as any);

      const data = await response.json();
      expect(data).toHaveProperty('found');
      expect(typeof data.found).toBe('boolean');
    });

    it('should always return manufacturer field when found is true', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          found: true,
          company: 'Test Vendor',
        }),
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const url = new URL('http://localhost/api/internal/mac-lookup?oui=00:11:22');
      const response = await GET({ url } as any);

      const data = await response.json();
      expect(data).toHaveProperty('manufacturer');
      expect(data.manufacturer).toBe('Test Vendor');
    });

    it('should return null manufacturer when not found', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const url = new URL('http://localhost/api/internal/mac-lookup?oui=00:00:00');
      const response = await GET({ url } as any);

      const data = await response.json();
      expect(data).toHaveProperty('manufacturer');
      expect(data.manufacturer).toBe(null);
    });
  });
});
