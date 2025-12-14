import { describe, it, expect } from 'vitest';
import { POST } from '../../../../../../../src/routes/api/internal/diagnostics/asn-geo/+server';

describe('ASN Geo API Endpoint', () => {
	it('should reject requests without ip', async () => {
		const request = new Request('http://localhost', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({}),
		});

		await expect(POST({ request } as any)).rejects.toThrow();
	});

	it('should reject requests with empty ip', async () => {
		const request = new Request('http://localhost', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ip: '' }),
		});

		await expect(POST({ request } as any)).rejects.toThrow();
	});

	it('should reject invalid IP format', async () => {
		const request = new Request('http://localhost', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ip: 'invalid-ip' }),
		});

		await expect(POST({ request } as any)).rejects.toThrow();
	});

	it('should accept valid IPv4 format', async () => {
		const request = new Request('http://localhost', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ip: '1.2.3.4' }),
		});

		// Note: This will attempt to call the external API, which may be blocked in tests
		// We're just validating the request format is accepted, not the full response
		try {
			await POST({ request } as any);
		} catch (err: any) {
			// External API call may fail in test environment, that's ok
			// We just want to ensure it didn't reject the request format
			expect(err.status).not.toBe(400);
		}
	});

	it('should accept valid IPv6 format', async () => {
		const request = new Request('http://localhost', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ip: '2001:db8::1' }),
		});

		try {
			await POST({ request } as any);
		} catch (err: any) {
			// External API call may fail in test environment, that's ok
			expect(err.status).not.toBe(400);
		}
	});
});
