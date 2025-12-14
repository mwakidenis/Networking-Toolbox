import { describe, it, expect } from 'vitest';
import { POST } from '../../../../../../../src/routes/api/internal/diagnostics/tls-handshake/+server';

describe('TLS Handshake API Endpoint', () => {
	it('should reject requests without hostname', async () => {
		const request = new Request('http://localhost', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({}),
		});

		await expect(POST({ request } as any)).rejects.toThrow();
	});

	it('should reject requests with empty hostname', async () => {
		const request = new Request('http://localhost', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ hostname: '' }),
		});

		await expect(POST({ request } as any)).rejects.toThrow();
	});

	it('should accept valid hostname', async () => {
		const request = new Request('http://localhost', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ hostname: 'google.com' }),
		});

		// This will make an actual TLS connection
		const response = await POST({ request } as any);
		const data = await response.json();

		expect(data).toHaveProperty('hostname');
		expect(data).toHaveProperty('success');
		expect(data).toHaveProperty('totalTime');
		expect(data).toHaveProperty('tlsVersion');
		expect(data).toHaveProperty('cipherSuite');
		expect(data).toHaveProperty('phases');
		expect(data.hostname).toBe('google.com');
	});

	it('should accept custom port', async () => {
		const request = new Request('http://localhost', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ hostname: 'google.com', port: 443 }),
		});

		const response = await POST({ request } as any);
		const data = await response.json();

		expect(data.port).toBe(443);
	});
});
