import { describe, it, expect } from 'vitest';
import { API_BASE_URL } from '../utils/api-test-helpers';

describe('SMTP TLS Checker API', () => {
	async function makeRequest(domain: string, port?: number) {
		const body: any = { domain };
		if (port) body.port = port;

		const response = await fetch(`${API_BASE_URL}/api/internal/diagnostics/mail-tls`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		const data = await response.json();
		return { status: response.status, data };
	}

	describe('Valid Domain Checks', () => {
		it('should check Gmail SMTP on port 587', async () => {
			const { status, data } = await makeRequest('smtp.gmail.com', 587);

			expect(status).toBe(200);
			expect(data.domain).toBe('smtp.gmail.com');
			expect(data.port).toBe(587);
			expect(typeof data.supportsSTARTTLS).toBe('boolean');
			expect(typeof data.supportsDirectTLS).toBe('boolean');
			expect(data.timestamp).toBeDefined();
		}, 15000);

		it('should include certificate information when available', async () => {
			const { status, data } = await makeRequest('smtp.gmail.com', 587);

			expect(status).toBe(200);

			if (data.supportsSTARTTLS || data.supportsDirectTLS) {
				// If TLS is supported, certificate info should be present
				if (data.certificate) {
					expect(data.certificate).toHaveProperty('commonName');
					expect(data.certificate).toHaveProperty('issuer');
					expect(data.certificate).toHaveProperty('validFrom');
					expect(data.certificate).toHaveProperty('validTo');
					expect(data.certificate).toHaveProperty('daysUntilExpiry');
					expect(data.certificate).toHaveProperty('serialNumber');
					expect(data.certificate).toHaveProperty('fingerprint');
					expect(data.certificate).toHaveProperty('altNames');
				}
			}
		}, 15000);
	});

	describe('Error Handling', () => {
		it('should reject empty domain', async () => {
			const { status, data } = await makeRequest('');

			expect(status).toBe(400);
			expect(data.message).toMatch(/domain.*required/i);
		});

		it('should reject missing domain', async () => {
			const response = await fetch(`${API_BASE_URL}/api/internal/diagnostics/mail-tls`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});

			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data.message).toMatch(/domain.*required/i);
		});

		it('should reject invalid domain format', async () => {
			const { status, data } = await makeRequest('invalid..domain');

			expect(status).toBe(400);
			expect(data.message).toMatch(/invalid.*format/i);
		});

		it('should reject invalid port number', async () => {
			const { status, data } = await makeRequest('example.com', 999999);

			expect(status).toBe(400);
			expect(data.message).toMatch(/invalid.*port/i);
		});
	});

	describe('Port Variations', () => {
		it('should handle port 25 (SMTP)', async () => {
			const { status, data } = await makeRequest('smtp.gmail.com', 25);

			expect(status).toBe(200);
			expect(data.port).toBe(25);
		}, 15000);

		it('should handle port 465 (SMTPS)', async () => {
			const { status, data } = await makeRequest('smtp.gmail.com', 465);

			expect(status).toBe(200);
			expect(data.port).toBe(465);
			// Port 465 uses direct TLS, not STARTTLS
			expect(data.supportsSTARTTLS).toBe(false);
		}, 15000);
	});
});
