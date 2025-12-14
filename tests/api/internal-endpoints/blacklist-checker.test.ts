import { describe, it, expect } from 'vitest';
import { API_BASE_URL } from '../utils/api-test-helpers';

describe('DNSBL Blacklist Checker API', () => {
	async function makeRequest(target: string) {
		const response = await fetch(`${API_BASE_URL}/api/internal/diagnostics/dnsbl`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ target })
		});
		const data = await response.json();
		return { status: response.status, data };
	}

	describe('IPv4 Blacklist Checking', () => {
		it('should check IPv4 address and return valid structure', async () => {
			const { status, data } = await makeRequest('1.1.1.1');

			expect(status).toBe(200);
			expect(data.target).toBe('1.1.1.1');
			expect(data.targetType).toBe('ipv4');
			expect(data.results).toBeInstanceOf(Array);
			expect(data.summary.totalChecked).toBeGreaterThan(0);
			expect(data.summary.cleanCount + data.summary.listedCount + data.summary.errorCount).toBeGreaterThan(0);

			// Verify all required fields
			expect(data.results.length).toBeGreaterThan(0);
			for (const result of data.results) {
				expect(result).toHaveProperty('rbl');
				expect(result).toHaveProperty('listed');
				expect(result).toHaveProperty('responseTime');
				expect(typeof result.rbl).toBe('string');
				expect(typeof result.listed).toBe('boolean');
				expect(typeof result.responseTime).toBe('number');
				expect(result.responseTime).toBeLessThan(2000);
			}

			// Verify summary calculations
			const listed = data.results.filter((r: any) => r.listed).length;
			const clean = data.results.filter((r: any) => !r.listed && !r.error).length;
			const errors = data.results.filter((r: any) => r.error).length;
			expect(data.summary.listedCount).toBe(listed);
			expect(data.summary.cleanCount).toBe(clean);
			expect(data.summary.errorCount).toBe(errors);

			// Verify timestamp
			expect(data.timestamp).toBeDefined();
			const timestamp = new Date(data.timestamp);
			expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
			expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 60000);

			// Verify errors not counted as listings
			const errorResults = data.results.filter((r: any) => r.error);
			for (const result of errorResults) {
				expect(result.listed).toBe(false);
			}
		}, 15000);

		it('should handle private IP addresses', async () => {
			const { status, data } = await makeRequest('192.168.1.1');

			expect(status).toBe(200);
			expect(data.targetType).toBe('ipv4');
			expect(data.results).toBeInstanceOf(Array);
		}, 15000);
	});

	describe('IPv6 Blacklist Checking', () => {
		it('should check IPv6 address', async () => {
			const { status, data } = await makeRequest('2001:4860:4860::8888');

			expect(status).toBe(200);
			expect(data.targetType).toBe('ipv6');
			expect(data.target).toBe('2001:4860:4860::8888');
			expect(data.results).toBeInstanceOf(Array);
			expect(data.summary.totalChecked).toBeGreaterThan(0);
		}, 15000);

		it('should handle compressed IPv6 (::1)', async () => {
			const { status, data } = await makeRequest('::1');

			expect(status).toBe(200);
			expect(data.targetType).toBe('ipv6');
			expect(data.results).toBeInstanceOf(Array);
		}, 15000);
	});

	describe('Domain Blacklist Checking', () => {
		it('should check domain with IP resolution', async () => {
			const { status, data } = await makeRequest('example.com');

			expect(status).toBe(200);
			expect(data.targetType).toBe('domain');
			expect(data.target).toBe('example.com');
			expect(data.results).toBeInstanceOf(Array);
			expect(data.resolvedIPs).toBeInstanceOf(Array);
			expect(data.resolvedIPs.length).toBeGreaterThan(0);

			// Should have both domain and IP checks
			const domainChecks = data.results.filter((r: any) => !r.rbl.includes('('));
			const ipChecks = data.results.filter((r: any) => r.rbl.includes('('));

			expect(domainChecks.length).toBeGreaterThan(0);
			expect(ipChecks.length).toBeGreaterThan(0);

			// Verify domain RBL filtering
			const domainRblNames = domainChecks.map((r: any) => r.rbl.toLowerCase());
			const hasDomainRbl = domainRblNames.some((name: string) =>
				name.includes('dbl') || name.includes('surbl') || name.includes('domain')
			);
			expect(hasDomainRbl).toBe(true);
		}, 15000);

		it('should normalize domain input', async () => {
			const { status, data } = await makeRequest('Example.COM.');

			expect(status).toBe(200);
			expect(data.target).toBe('example.com');
		}, 15000);

		it('should error on non-existent domain', async () => {
			const { status, data } = await makeRequest('this-domain-definitely-does-not-exist-123456.com');

			expect(status).toBe(500);
			expect(data.message).toMatch(/resolve|not exist|not found/i);
		});
	});

	describe('Error Handling', () => {
		it('should reject empty or missing target', async () => {
			const { status: status1, data: data1 } = await makeRequest('');
			expect(status1).toBe(400);
			expect(data1.message).toMatch(/required/i);

			const response = await fetch(`${API_BASE_URL}/api/internal/diagnostics/dnsbl`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});
			expect(response.status).toBe(400);
			const data2 = await response.json();
			expect(data2.message).toMatch(/required/i);

			const { status: status3, data: data3 } = await makeRequest('   ');
			expect(status3).toBe(400);
			expect(data3.message).toMatch(/required/i);
		});

		it('should handle malformed input', async () => {
			const { status: status1, data: data1 } = await makeRequest('999.999.999.999');
			expect(status1).toBe(200); // Simple regex allows this
			expect(data1.targetType).toBe('ipv4');

			const { status: status2 } = await makeRequest('gggg::1');
			expect(status2).toBe(500); // Invalid hex in IPv6
		});
	});

	describe('RBL Type Filtering', () => {
		it('should not query domain RBLs for IP addresses', async () => {
			const { status, data } = await makeRequest('8.8.8.8');

			expect(status).toBe(200);
			const hasDomainRbl = data.results.some(
				(r: any) => r.rbl.toLowerCase().includes('dbl') && !r.rbl.includes('(')
			);
			expect(hasDomainRbl).toBe(false);
		}, 15000);
	});

	describe('Performance', () => {
		it('should complete within reasonable time', async () => {
			const startTime = Date.now();
			const { status } = await makeRequest('9.9.9.9');
			const duration = Date.now() - startTime;

			expect(status).toBe(200);
			expect(duration).toBeLessThan(10000);
		}, 15000);
	});
});
