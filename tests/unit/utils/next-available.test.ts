import { describe, it, expect } from 'vitest';
import { findNextAvailableSubnet, type NextAvailableInput } from '../../../src/lib/utils/next-available';

describe('next-available.ts', () => {
  describe('findNextAvailableSubnet', () => {
    it('finds available IPv4 subnets with basic input', () => {
      const input: NextAvailableInput = {
        pools: '192.168.0.0/16',
        allocations: '192.168.1.0/24',
        desiredPrefix: 24,
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 5
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.candidates.length).toBeGreaterThan(0);
      expect(result.candidates[0].cidr).toMatch(/192\.168\.\d+\.0\/24/);
      expect(result.stats.totalPools).toBe(1);
      expect(result.stats.totalAllocations).toBe(1);
    });

    it('finds available IPv6 subnets', () => {
      const input: NextAvailableInput = {
        pools: '2001:db8::/32',
        allocations: '2001:db8:1::/48',
        desiredPrefix: 48,
        ipv4UsableHosts: false,
        policy: 'first-fit',
        maxCandidates: 3
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.candidates.length).toBeGreaterThan(0);
      expect(result.candidates[0].cidr).toMatch(/2001:db8:[^1].*\/48/);
      expect(result.stats.totalPools).toBe(1);
    });

    it('calculates required prefix from host count', () => {
      const input: NextAvailableInput = {
        pools: '10.0.0.0/8',
        allocations: '',
        desiredHostCount: 254,
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 1
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.stats.requestedPrefix).toBe(24); // 254 hosts + 2 = 256 addresses = /24
      expect(result.candidates[0].usableHosts).toBe('254');
    });

    it('handles multiple pools', () => {
      const input: NextAvailableInput = {
        pools: '192.168.0.0/16\n10.0.0.0/8',
        allocations: '192.168.1.0/24',
        desiredPrefix: 24,
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 10
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.stats.totalPools).toBe(2);
      expect(result.candidates.length).toBeGreaterThan(0);
    });

    it('applies first-fit allocation policy', () => {
      const input: NextAvailableInput = {
        pools: '192.168.0.0/22',
        allocations: '192.168.1.0/24',
        desiredPrefix: 25,
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 5
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.candidates.length).toBeGreaterThan(1);
      
      // First-fit should return lowest available addresses first
      const firstCandidate = result.candidates[0].network;
      const secondCandidate = result.candidates[1].network;
      expect(firstCandidate.localeCompare(secondCandidate, undefined, { numeric: true })).toBeLessThan(0);
    });

    it('applies best-fit allocation policy', () => {
      const input: NextAvailableInput = {
        pools: '192.168.0.0/16',
        allocations: '192.168.1.0/24\n192.168.2.0/25',
        desiredPrefix: 26,
        ipv4UsableHosts: true,
        policy: 'best-fit',
        maxCandidates: 5
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.candidates.length).toBeGreaterThan(0);
      // Best-fit should prioritize smaller gaps
    });

    it('handles IP ranges in addition to CIDR', () => {
      const input: NextAvailableInput = {
        pools: '192.168.0.0-192.168.3.255',
        allocations: '192.168.1.10-192.168.1.20',
        desiredPrefix: 26,
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 3
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.candidates.length).toBeGreaterThan(0);
    });

    it('handles single IP addresses', () => {
      const input: NextAvailableInput = {
        pools: '192.168.1.0/24',
        allocations: '192.168.1.10\n192.168.1.20',
        desiredPrefix: 30,
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 5
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.candidates.length).toBeGreaterThan(0);
    });

    it('validates input parameters', () => {
      const input: NextAvailableInput = {
        pools: '',
        allocations: '',
        desiredPrefix: 24,
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 5
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.errors).toContain('At least one pool CIDR is required');
    });

    it('rejects invalid prefix lengths', () => {
      const input: NextAvailableInput = {
        pools: '192.168.0.0/16',
        allocations: '',
        desiredPrefix: 50, // Invalid for IPv4
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 5
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.errors.some(e => e.includes('Invalid prefix'))).toBe(true);
    });

    it('prevents specifying both prefix and host count', () => {
      const input: NextAvailableInput = {
        pools: '192.168.0.0/16',
        allocations: '',
        desiredPrefix: 24,
        desiredHostCount: 100,
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 5
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.errors).toContain('Specify either desired prefix OR host count, not both');
    });

    it('warns about allocations outside pools', () => {
      const input: NextAvailableInput = {
        pools: '192.168.0.0/16',
        allocations: '10.0.1.0/24', // Outside the pool
        desiredPrefix: 24,
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 5
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.warnings.some(w => w.includes('outside all pools'))).toBe(true);
    });

    it('calculates statistics correctly', () => {
      const input: NextAvailableInput = {
        pools: '192.168.0.0/24',
        allocations: '192.168.0.0/26', // Uses 64 addresses
        desiredPrefix: 28, // Requesting 16 addresses
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 5
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.stats.totalPools).toBe(1);
      expect(result.stats.totalAllocations).toBe(1);
      expect(result.stats.requestedPrefix).toBe(28);
      expect(parseInt(result.stats.totalFreeSpace.replace(/,/g, ''))).toBe(192); // 256 - 64 = 192
    });

    it('respects maxCandidates limit', () => {
      const input: NextAvailableInput = {
        pools: '10.0.0.0/16',
        allocations: '',
        desiredPrefix: 24,
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 3
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.candidates).toHaveLength(3);
    });

    it('handles IPv4 usable hosts calculation', () => {
      const input: NextAvailableInput = {
        pools: '192.168.1.0/24',
        allocations: '',
        desiredPrefix: 30, // 4 addresses total
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 1
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.candidates[0].size).toBe('4');
      expect(result.candidates[0].usableHosts).toBe('2'); // 4 - 2 (network + broadcast)
      expect(result.candidates[0].firstHost).not.toBe(result.candidates[0].network);
      expect(result.candidates[0].lastHost).not.toBe(result.candidates[0].broadcast);
    });

    it('handles /31 subnets correctly', () => {
      const input: NextAvailableInput = {
        pools: '192.168.1.0/24',
        allocations: '',
        desiredPrefix: 31, // Point-to-point link
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 1
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.candidates[0].size).toBe('2');
      expect(result.candidates[0].usableHosts).toBe('2'); // /31 doesn't subtract network/broadcast
    });

    it('handles /32 host routes', () => {
      const input: NextAvailableInput = {
        pools: '192.168.1.0/24',
        allocations: '192.168.1.1/32',
        desiredPrefix: 32,
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 5
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.candidates.length).toBeGreaterThan(0);
      expect(result.candidates[0].size).toBe('1');
      expect(result.candidates[0].usableHosts).toBe('1');
    });

    it('generates visualization data', () => {
      const input: NextAvailableInput = {
        pools: '192.168.0.0/24',
        allocations: '192.168.0.0/26',
        desiredPrefix: 28,
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 2
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.visualization).toBeDefined();
      expect(result.visualization?.version).toBe(4);
      expect(result.visualization?.pools).toHaveLength(1);
      expect(result.visualization?.allocations).toHaveLength(1);
      expect(result.visualization?.candidates.length).toBeGreaterThan(0);
      expect(result.visualization?.totalRange).toBeDefined();
    });

    it('handles mixed valid and invalid input lines', () => {
      const input: NextAvailableInput = {
        pools: '192.168.0.0/16\n999.999.999.999/24\n10.0.0.0/8',
        allocations: '192.168.1.0/24\n888.888.888.888/24\n192.168.2.0/24',
        desiredPrefix: 24,
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 5
      };

      const result = findNextAvailableSubnet(input);

      // Should process valid entries and skip invalid ones
      expect(result.stats.totalPools).toBe(2); // Only valid pools
      expect(result.candidates.length).toBeGreaterThan(0);
    });

    it('handles empty allocations gracefully', () => {
      const input: NextAvailableInput = {
        pools: '192.168.0.0/24',
        allocations: '', // No allocations
        desiredPrefix: 26,
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 5
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.stats.totalAllocations).toBe(0);
      expect(result.candidates.length).toBeGreaterThan(0);
      expect(result.candidates[0].network).toBe('192.168.0.0');
    });

    it('calculates required prefix for large host counts', () => {
      const input: NextAvailableInput = {
        pools: '10.0.0.0/8',
        allocations: '',
        desiredHostCount: 65534, // Should need /16
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 1
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.stats.requestedPrefix).toBe(16);
    });

    it('handles IPv6 large prefixes', () => {
      const input: NextAvailableInput = {
        pools: '2001:db8::/48',
        allocations: '',
        desiredPrefix: 56,
        ipv4UsableHosts: false,
        policy: 'first-fit',
        maxCandidates: 3
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.candidates.length).toBeGreaterThan(0);
      expect(result.candidates[0].cidr).toMatch(/^2001:db8:[0-9a-f:]+\/56$/);
    });
  });

  describe('edge cases and error handling', () => {
    it('handles network calculation edge cases', () => {
      // Test with allocation that exactly matches pool boundary
      const input: NextAvailableInput = {
        pools: '192.168.0.0/24',
        allocations: '192.168.0.0/24', // Exactly matches pool
        desiredPrefix: 25,
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 5
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.candidates).toHaveLength(0); // No space left
      expect(result.stats.totalFreeSpace).toBe('0');
    });

    it('handles overlapping allocations', () => {
      const input: NextAvailableInput = {
        pools: '192.168.0.0/22',
        allocations: '192.168.1.0/24\n192.168.1.128/25', // Overlapping
        desiredPrefix: 26,
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 5
      };

      const result = findNextAvailableSubnet(input);
      
      // Should handle overlaps gracefully
      expect(result.candidates.length).toBeGreaterThan(0);
    });

    it('handles requesting subnet larger than available space', () => {
      const input: NextAvailableInput = {
        pools: '192.168.1.240/28', // Small pool (16 addresses)
        allocations: '',
        desiredPrefix: 24, // Requesting 256 addresses
        ipv4UsableHosts: true,
        policy: 'first-fit',
        maxCandidates: 5
      };

      const result = findNextAvailableSubnet(input);
      
      expect(result.candidates).toHaveLength(0); // Can't fit
    });
  });
});