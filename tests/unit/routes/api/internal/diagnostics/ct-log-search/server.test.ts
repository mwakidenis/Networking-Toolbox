import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../../../../../../../src/routes/api/internal/diagnostics/ct-log-search/+server';

describe('CT Log Search API', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should return error for missing domain', async () => {
		const request = new Request('http://localhost', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({}),
		});

		await expect(POST({ request } as any)).rejects.toThrow();
	});

	it('should return error for invalid domain format', async () => {
		const request = new Request('http://localhost', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ domain: 'invalid..domain' }),
		});

		await expect(POST({ request } as any)).rejects.toThrow();
	});

	it('should accept valid domain', async () => {
		const mockResponse = {
			ok: true,
			json: vi.fn().mockResolvedValue([
				{
					id: 123456,
					issuer_ca_id: 1,
					issuer_name: "Let's Encrypt",
					common_name: 'example.com',
					name_value: 'example.com\nwww.example.com',
					entry_timestamp: '2024-01-01T00:00:00Z',
					not_before: '2024-01-01T00:00:00Z',
					not_after: '2024-04-01T00:00:00Z',
					serial_number: 'abc123',
				},
			]),
		};

		globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

		const request = new Request('http://localhost', {
			method: 'POST',
			body: JSON.stringify({ domain: 'example.com' }),
		});

		const response = await POST({ request } as any);
		const data = await response.json();

		expect(data.domain).toBe('example.com');
		expect(data.totalCertificates).toBe(1);
		expect(data.certificates).toHaveLength(1);
		expect(data.discoveredHostnames).toContain('example.com');
		expect(data.discoveredHostnames).toContain('www.example.com');
	});

	it('should handle empty results from crt.sh', async () => {
		const mockResponse = {
			ok: true,
			json: vi.fn().mockResolvedValue([]),
		};

		globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

		const request = new Request('http://localhost', {
			method: 'POST',
			body: JSON.stringify({ domain: 'nonexistent.example' }),
		});

		const response = await POST({ request } as any);
		const data = await response.json();

		expect(data.domain).toBe('nonexistent.example');
		expect(data.totalCertificates).toBe(0);
		expect(data.certificates).toHaveLength(0);
		expect(data.discoveredHostnames).toHaveLength(0);
	});
});
