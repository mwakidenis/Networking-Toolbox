import { describe, it, expect } from 'vitest';
import { API_BASE_URL } from '../utils/api-test-helpers';

describe('DNS Performance API', () => {
	async function makeRequest(body: any) {
		const response = await fetch(`${API_BASE_URL}/api/internal/diagnostics/dns-performance`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		const data = await response.json();
		return { status: response.status, data };
	}

	describe('Basic Functionality', () => {
		it('should test default resolvers for A records', async () => {
			const { status, data } = await makeRequest({
				domain: 'google.com',
				recordType: 'A'
			});

			expect(status).toBe(200);
			expect(data.domain).toBe('google.com');
			expect(data.recordType).toBe('A');
			expect(data.results).toBeInstanceOf(Array);
			expect(data.results.length).toBe(8); // Default resolvers
			expect(data.timestamp).toBeDefined();
		});

		it('should include all required fields in response', async () => {
			const { status, data } = await makeRequest({
				domain: 'example.com',
				recordType: 'A'
			});

			expect(status).toBe(200);
			expect(data).toHaveProperty('domain');
			expect(data).toHaveProperty('recordType');
			expect(data).toHaveProperty('results');
			expect(data).toHaveProperty('statistics');
			expect(data).toHaveProperty('timestamp');
		});

		it('should include required fields in each result', async () => {
			const { status, data } = await makeRequest({
				domain: 'cloudflare.com',
				recordType: 'A'
			});

			expect(status).toBe(200);
			expect(data.results.length).toBeGreaterThan(0);

			for (const result of data.results) {
				expect(result).toHaveProperty('resolver');
				expect(result).toHaveProperty('resolverName');
				expect(result).toHaveProperty('success');
				expect(result).toHaveProperty('responseTime');
				expect(typeof result.resolver).toBe('string');
				expect(typeof result.resolverName).toBe('string');
				expect(typeof result.success).toBe('boolean');
				expect(typeof result.responseTime).toBe('number');

				if (result.success) {
					expect(result.records).toBeInstanceOf(Array);
				} else {
					expect(result.error).toBeDefined();
				}
			}
		});
	});

	describe('Record Types', () => {
		it('should query A records', async () => {
			const { status, data } = await makeRequest({
				domain: 'google.com',
				recordType: 'A'
			});

			expect(status).toBe(200);
			expect(data.recordType).toBe('A');

			const successfulResult = data.results.find((r: any) => r.success);
			if (successfulResult) {
				expect(successfulResult.records.length).toBeGreaterThan(0);
				// A records should be IPv4 addresses
				expect(successfulResult.records[0]).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
			}
		});

		it('should query AAAA records', async () => {
			const { status, data } = await makeRequest({
				domain: 'google.com',
				recordType: 'AAAA'
			});

			expect(status).toBe(200);
			expect(data.recordType).toBe('AAAA');

			const successfulResult = data.results.find((r: any) => r.success);
			if (successfulResult) {
				expect(successfulResult.records.length).toBeGreaterThan(0);
				// AAAA records should be IPv6 addresses
				expect(successfulResult.records[0]).toMatch(/:/);
			}
		});

		it('should query MX records', async () => {
			const { status, data } = await makeRequest({
				domain: 'google.com',
				recordType: 'MX'
			});

			expect(status).toBe(200);
			expect(data.recordType).toBe('MX');

			const successfulResult = data.results.find((r: any) => r.success);
			if (successfulResult) {
				expect(successfulResult.records.length).toBeGreaterThan(0);
				// MX records should have priority number
				expect(successfulResult.records[0]).toMatch(/^\d+\s+/);
			}
		});

		it('should query TXT records', async () => {
			const { status, data } = await makeRequest({
				domain: 'google.com',
				recordType: 'TXT'
			});

			expect(status).toBe(200);
			expect(data.recordType).toBe('TXT');

			const successfulResult = data.results.find((r: any) => r.success);
			if (successfulResult) {
				expect(successfulResult.records).toBeInstanceOf(Array);
			}
		});

		it('should query NS records', async () => {
			const { status, data } = await makeRequest({
				domain: 'google.com',
				recordType: 'NS'
			});

			expect(status).toBe(200);
			expect(data.recordType).toBe('NS');

			const successfulResult = data.results.find((r: any) => r.success);
			if (successfulResult) {
				expect(successfulResult.records.length).toBeGreaterThan(0);
			}
		});

		it('should query SOA records', async () => {
			const { status, data } = await makeRequest({
				domain: 'google.com',
				recordType: 'SOA'
			});

			expect(status).toBe(200);
			expect(data.recordType).toBe('SOA');

			const successfulResult = data.results.find((r: any) => r.success);
			if (successfulResult) {
				expect(successfulResult.records.length).toBe(1);
				// SOA record should contain multiple fields
				expect(successfulResult.records[0]).toMatch(/\s+/);
			}
		});
	});

	describe('Statistics', () => {
		it('should calculate correct statistics', async () => {
			const { status, data } = await makeRequest({
				domain: 'cloudflare.com',
				recordType: 'A'
			});

			expect(status).toBe(200);
			expect(data.statistics).toBeDefined();
			expect(data.statistics.fastest).toBeDefined();
			expect(data.statistics.slowest).toBeDefined();
			expect(data.statistics.average).toBeDefined();
			expect(data.statistics.median).toBeDefined();
			expect(data.statistics.successRate).toBeDefined();

			const successCount = data.results.filter((r: any) => r.success).length;
			const expectedSuccessRate = Math.round((successCount / data.results.length) * 100);
			expect(data.statistics.successRate).toBe(expectedSuccessRate);
		});

		it('should identify fastest resolver', async () => {
			const { status, data } = await makeRequest({
				domain: 'example.com',
				recordType: 'A'
			});

			expect(status).toBe(200);

			const successfulResults = data.results.filter((r: any) => r.success);
			if (successfulResults.length > 0) {
				const minTime = Math.min(...successfulResults.map((r: any) => r.responseTime));
				expect(data.statistics.fastest.time).toBe(minTime);

				// Verify the fastest resolver is one of the resolvers with minimum time
				// (handles cases where multiple resolvers have the same response time)
				const resolversWithMinTime = successfulResults.filter(
					(r: any) => r.responseTime === minTime
				);
				const fastestResolverNames = resolversWithMinTime.map((r: any) => r.resolverName);
				expect(fastestResolverNames).toContain(data.statistics.fastest.resolver);
			}
		});

		it('should handle all failures gracefully', async () => {
			const { status, data } = await makeRequest({
				domain: 'this-domain-does-not-exist-12345.invalid',
				recordType: 'A'
			});

			expect(status).toBe(200);
			expect(data.statistics.successRate).toBe(0);
			expect(data.statistics.fastest.resolver).toBe('N/A');
			expect(data.statistics.slowest.resolver).toBe('N/A');
			expect(data.statistics.average).toBe(0);
			expect(data.statistics.median).toBe(0);
		});
	});

	describe('Custom Resolvers', () => {
		it('should test custom resolver only', async () => {
			const { status, data } = await makeRequest({
				domain: 'google.com',
				recordType: 'A',
				customResolvers: ['1.0.0.1'],
				includeDefaultResolvers: false
			});

			expect(status).toBe(200);
			expect(data.results.length).toBe(1);
			expect(data.results[0].resolver).toBe('1.0.0.1');
			expect(data.results[0].resolverName).toBe('Custom (1.0.0.1)');
		});

		it('should test custom + default resolvers', async () => {
			const { status, data } = await makeRequest({
				domain: 'google.com',
				recordType: 'A',
				customResolvers: ['1.0.0.1', '208.67.220.220'],
				includeDefaultResolvers: true
			});

			expect(status).toBe(200);
			expect(data.results.length).toBe(10); // 8 default + 2 custom
		});

		it('should deduplicate custom resolvers with defaults', async () => {
			const { status, data } = await makeRequest({
				domain: 'google.com',
				recordType: 'A',
				customResolvers: ['1.1.1.1', '8.8.8.8'], // Already in defaults
				includeDefaultResolvers: true
			});

			expect(status).toBe(200);
			expect(data.results.length).toBe(8); // No duplicates
		});

		it('should deduplicate within custom resolvers', async () => {
			const { status, data } = await makeRequest({
				domain: 'google.com',
				recordType: 'A',
				customResolvers: ['1.0.0.1', '1.0.0.1', '1.0.0.1'],
				includeDefaultResolvers: false
			});

			expect(status).toBe(200);
			expect(data.results.length).toBe(1);
		});

		it('should validate IPv4 addresses', async () => {
			const { status, data } = await makeRequest({
				domain: 'google.com',
				recordType: 'A',
				customResolvers: ['1.0.0.1', 'invalid', '300.300.300.300'],
				includeDefaultResolvers: false
			});

			expect(status).toBe(200);
			expect(data.results.length).toBe(1); // Only valid IP
			expect(data.results[0].resolver).toBe('1.0.0.1');
		});

		it('should validate IPv6 addresses', async () => {
			const { status, data } = await makeRequest({
				domain: 'google.com',
				recordType: 'A',
				customResolvers: ['2001:4860:4860::8888'],
				includeDefaultResolvers: false
			});

			expect(status).toBe(200);
			expect(data.results.length).toBe(1);
			expect(data.results[0].resolver).toBe('2001:4860:4860::8888');
		});

		it('should enforce max custom resolvers limit', async () => {
			const manyResolvers = Array.from({ length: 25 }, (_, i) => `1.0.0.${i + 1}`);

			const { status, data } = await makeRequest({
				domain: 'google.com',
				recordType: 'A',
				customResolvers: manyResolvers,
				includeDefaultResolvers: false
			});

			expect(status).toBe(200);
			expect(data.results.length).toBeLessThanOrEqual(20); // Max 20 custom
		});
	});

	describe('Custom Timeout', () => {
		it('should respect custom timeout', async () => {
			const { status, data } = await makeRequest({
				domain: 'google.com',
				recordType: 'A',
				timeoutMs: 3000
			});

			expect(status).toBe(200);

			// Check timeout errors mention custom timeout
			const timeoutError = data.results.find((r: any) => r.error?.includes('timeout'));
			if (timeoutError) {
				expect(timeoutError.error).toMatch(/3000ms/);
			}
		});

		it('should clamp timeout to min value', async () => {
			const { status } = await makeRequest({
				domain: 'google.com',
				recordType: 'A',
				timeoutMs: 500 // Below minimum
			});

			expect(status).toBe(200); // Should succeed with clamped value
		});

		it('should clamp timeout to max value', async () => {
			const { status } = await makeRequest({
				domain: 'google.com',
				recordType: 'A',
				timeoutMs: 50000 // Above maximum
			});

			expect(status).toBe(200); // Should succeed with clamped value
		});
	});

	describe('Error Handling', () => {
		it('should reject missing domain', async () => {
			const { status, data } = await makeRequest({
				recordType: 'A'
			});

			expect(status).toBe(400);
			expect(data.message).toMatch(/domain.*required/i);
		});

		it('should reject empty domain', async () => {
			const { status, data } = await makeRequest({
				domain: '',
				recordType: 'A'
			});

			expect(status).toBe(400);
			expect(data.message).toMatch(/domain.*required/i);
		});

		it('should reject whitespace-only domain', async () => {
			const { status, data } = await makeRequest({
				domain: '   ',
				recordType: 'A'
			});

			expect(status).toBe(400);
			expect(data.message).toMatch(/domain.*required/i);
		});

		it('should reject invalid domain format', async () => {
			const { status, data } = await makeRequest({
				domain: 'not a valid domain!',
				recordType: 'A'
			});

			expect(status).toBe(400);
			expect(data.message).toMatch(/invalid.*domain/i);
		});

		it('should reject invalid record type', async () => {
			const { status, data } = await makeRequest({
				domain: 'google.com',
				recordType: 'INVALID'
			});

			expect(status).toBe(400);
			expect(data.message).toMatch(/invalid.*record type/i);
		});

		it('should reject invalid JSON', async () => {
			const response = await fetch(`${API_BASE_URL}/api/internal/diagnostics/dns-performance`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: 'not valid json'
			});

			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data.message).toMatch(/invalid.*json/i);
		});

		it('should reject non-array customResolvers', async () => {
			const { status, data } = await makeRequest({
				domain: 'google.com',
				recordType: 'A',
				customResolvers: 'not-an-array'
			});

			expect(status).toBe(400);
			expect(data.message).toMatch(/array/i);
		});

		it('should reject invalid timeout type', async () => {
			const { status, data } = await makeRequest({
				domain: 'google.com',
				recordType: 'A',
				timeoutMs: 'not-a-number'
			});

			expect(status).toBe(400);
			expect(data.message).toMatch(/timeout.*number/i);
		});

		it('should require at least one valid resolver', async () => {
			const { status, data } = await makeRequest({
				domain: 'google.com',
				recordType: 'A',
				customResolvers: ['invalid', 'also-invalid'],
				includeDefaultResolvers: false
			});

			expect(status).toBe(400);
			expect(data.message).toMatch(/no valid.*resolvers/i);
		});
	});

	describe('Performance', () => {
		it('should complete within reasonable time', async () => {
			const startTime = Date.now();
			const { status } = await makeRequest({
				domain: 'google.com',
				recordType: 'A'
			});
			const duration = Date.now() - startTime;

			expect(status).toBe(200);
			expect(duration).toBeLessThan(10000); // 10 seconds max
		});

		it('should have reasonable response times', async () => {
			const { status, data } = await makeRequest({
				domain: 'cloudflare.com',
				recordType: 'A'
			});

			expect(status).toBe(200);

			for (const result of data.results) {
				if (result.success) {
					expect(result.responseTime).toBeGreaterThan(0);
					expect(result.responseTime).toBeLessThan(6000); // Should be under timeout
				}
			}
		});
	});

	describe('Domain Normalization', () => {
		it('should normalize domain to lowercase', async () => {
			const { status, data } = await makeRequest({
				domain: 'GOOGLE.COM',
				recordType: 'A'
			});

			expect(status).toBe(200);
			expect(data.domain).toBe('google.com');
		});

		it('should trim whitespace', async () => {
			const { status, data } = await makeRequest({
				domain: '  google.com  ',
				recordType: 'A'
			});

			expect(status).toBe(200);
			expect(data.domain).toBe('google.com');
		});

		it('should accept domains with underscores', async () => {
			const { status, data } = await makeRequest({
				domain: '_acme-challenge.example.com',
				recordType: 'TXT'
			});

			// Should accept even if domain doesn't exist
			expect(status).toBe(200);
			expect(data.domain).toBe('_acme-challenge.example.com');
		});
	});

	describe('Concurrent Requests', () => {
		it('should handle multiple concurrent requests', async () => {
			const promises = [
				makeRequest({ domain: 'google.com', recordType: 'A' }),
				makeRequest({ domain: 'cloudflare.com', recordType: 'A' }),
				makeRequest({ domain: 'github.com', recordType: 'A' })
			];

			const results = await Promise.all(promises);

			results.forEach((result) => {
				expect(result.status).toBe(200);
			});
		});
	});
});
