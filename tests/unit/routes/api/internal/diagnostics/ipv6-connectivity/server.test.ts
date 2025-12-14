import { describe, it, expect } from 'vitest';
import { POST } from '../../../../../../../src/routes/api/internal/diagnostics/ipv6-connectivity/+server';

describe('IPv6 Connectivity API', () => {
	it('should return connectivity results', async () => {
		const mockRequest = new Request('http://localhost/api/internal/diagnostics/ipv6-connectivity', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		});

		const response = await POST({ request: mockRequest } as any);
		expect(response.status).toBe(200);

		const data = await response.json();
		expect(data).toBeDefined();
		expect(data.ipv4).toBeDefined();
		expect(data.ipv6).toBeDefined();
		expect(data.ipv4.protocol).toBe('IPv4');
		expect(data.ipv6.protocol).toBe('IPv6');
		expect(typeof data.dualStack).toBe('boolean');
		expect(data.timestamp).toBeTruthy();
	});

	it('should include latency when connection succeeds', async () => {
		const mockRequest = new Request('http://localhost/api/internal/diagnostics/ipv6-connectivity', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		});

		const response = await POST({ request: mockRequest } as any);
		const data = await response.json();

		if (data.ipv4.success) {
			expect(typeof data.ipv4.latency).toBe('number');
			expect(data.ipv4.latency).toBeGreaterThan(0);
		}

		if (data.ipv6.success) {
			expect(typeof data.ipv6.latency).toBe('number');
			expect(data.ipv6.latency).toBeGreaterThan(0);
		}
	});

	it('should set dual-stack to true only when both protocols succeed', async () => {
		const mockRequest = new Request('http://localhost/api/internal/diagnostics/ipv6-connectivity', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		});

		const response = await POST({ request: mockRequest } as any);
		const data = await response.json();

		if (data.dualStack) {
			expect(data.ipv4.success).toBe(true);
			expect(data.ipv6.success).toBe(true);
		}
	});

	it('should include preferred protocol when dual-stack is available', async () => {
		const mockRequest = new Request('http://localhost/api/internal/diagnostics/ipv6-connectivity', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		});

		const response = await POST({ request: mockRequest } as any);
		const data = await response.json();

		if (data.dualStack && data.preferredProtocol) {
			expect(['IPv4', 'IPv6']).toContain(data.preferredProtocol);
		}
	});
});
