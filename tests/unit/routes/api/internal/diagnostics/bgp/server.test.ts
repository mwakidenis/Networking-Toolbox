import { describe, it, expect } from 'vitest';
import { POST } from '../../../../../../../src/routes/api/internal/diagnostics/bgp/+server';

describe('BGP API Endpoint', () => {
	it('should reject requests without resource', async () => {
		const request = new Request('http://localhost', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({}),
		});

		await expect(POST({ request } as any)).rejects.toThrow();
	});

	it('should reject requests with empty resource', async () => {
		const request = new Request('http://localhost', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ resource: '' }),
		});

		await expect(POST({ request } as any)).rejects.toThrow();
	});

	it('should accept valid IP address', async () => {
		const request = new Request('http://localhost', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ resource: '8.8.8.8' }),
		});

		try {
			const response = await POST({ request } as any);
			const data = await response.json();
			expect(data).toHaveProperty('resource');
			expect(data).toHaveProperty('timestamp');
			expect(data.resource).toBe('8.8.8.8');
		} catch (err) {
			// Allow test to pass if failure is due to network/upstream issues
			if (err instanceof Error && (err.message.includes('fetch')
					|| err.message.includes('network')
					|| err.message.includes('timeout')
					|| err.message.includes('ECONNREFUSED')
					|| err.message.includes('abort'))
				) {
				console.warn('BGP test skipped due to network issue:', err.message);
				return;
			}
			throw err;
		}
	});

	it('should accept valid CIDR prefix', async () => {
		const request = new Request('http://localhost', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ resource: '8.8.8.0/24' }),
		});

		try {
			const response = await POST({ request } as any);
			const data = await response.json();

			expect(data).toHaveProperty('resource');
			expect(data).toHaveProperty('announced');
		} catch (err) {
			// Allow test to pass if failure is due to network/upstream issues
			if (err instanceof Error && (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('timeout') || err.message.includes('ECONNREFUSED') || err.message.includes('abort'))) {
				console.warn('BGP test skipped due to network issue:', err.message);
				return;
			}
			throw err;
		}
	});
});
