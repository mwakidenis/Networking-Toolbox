import { describe, it, expect } from 'vitest';
import { calculateVLSM } from '../../../src/lib/utils/vlsm-calculations';
import type { SubnetRequirement } from '../../../src/lib/utils/vlsm-calculations';

describe('VLSM calculations', () => {
  describe('basic VLSM allocation', () => {
    it('allocates subnets in descending order of size', () => {
      const requirements: SubnetRequirement[] = [
        { id: '1', name: 'Sales', hostsNeeded: 100 },
        { id: '2', name: 'IT', hostsNeeded: 25 },
        { id: '3', name: 'Management', hostsNeeded: 10 }
      ];

      const result = calculateVLSM('192.168.1.0', 24, requirements);
      
      expect(result.success).toBe(true);
      expect(result.subnets).toHaveLength(3);
      
      // Should be ordered by size (largest first)
      expect(result.subnets[0].hostsNeeded).toBe(100);
      expect(result.subnets[1].hostsNeeded).toBe(25);
      expect(result.subnets[2].hostsNeeded).toBe(10);
    });

    it('calculates correct subnet sizes and addresses', () => {
      const requirements: SubnetRequirement[] = [
        { id: '1', name: 'LAN', hostsNeeded: 100 }
      ];

      const result = calculateVLSM('192.168.1.0', 24, requirements);
      
      expect(result.success).toBe(true);
      const subnet = result.subnets[0];
      
      // Need 100 hosts + 2 (network/broadcast) = 102, so need /25 (126 hosts)
      expect(subnet.cidr).toBe(25);
      expect(subnet.hostsProvided).toBe(126);
      expect(subnet.networkAddress).toBe('192.168.1.0');
      expect(subnet.broadcastAddress).toBe('192.168.1.127');
      expect(subnet.firstUsableHost).toBe('192.168.1.1');
      expect(subnet.lastUsableHost).toBe('192.168.1.126');
    });

    it('handles point-to-point links (2 hosts)', () => {
      const requirements: SubnetRequirement[] = [
        { id: '1', name: 'P2P Link', hostsNeeded: 2 }
      ];

      const result = calculateVLSM('192.168.1.0', 24, requirements);
      
      expect(result.success).toBe(true);
      const subnet = result.subnets[0];
      
      expect(subnet.cidr).toBe(30); // /30 provides exactly 2 hosts
      expect(subnet.hostsProvided).toBe(2);
      expect(subnet.wastedHosts).toBe(0);
    });
  });

  describe('optimal subnet sizing', () => {
    it('chooses optimal CIDR for different host counts', () => {
      const testCases = [
        { hosts: 1, expectedCIDR: 32, expectedProvided: 1 },
        { hosts: 2, expectedCIDR: 30, expectedProvided: 2 },
        { hosts: 5, expectedCIDR: 29, expectedProvided: 6 },
        { hosts: 10, expectedCIDR: 28, expectedProvided: 14 },
        { hosts: 25, expectedCIDR: 27, expectedProvided: 30 },
        { hosts: 50, expectedCIDR: 26, expectedProvided: 62 },
        { hosts: 100, expectedCIDR: 25, expectedProvided: 126 },
        { hosts: 500, expectedCIDR: 23, expectedProvided: 510 }
      ];

      testCases.forEach(({ hosts, expectedCIDR, expectedProvided }) => {
        const requirements: SubnetRequirement[] = [
          { id: '1', name: 'Test', hostsNeeded: hosts }
        ];

        const result = calculateVLSM('10.0.0.0', 16, requirements);
        
        expect(result.success).toBe(true);
        expect(result.subnets[0].cidr).toBe(expectedCIDR);
        expect(result.subnets[0].hostsProvided).toBe(expectedProvided);
      });
    });

    it('minimizes wasted addresses across multiple subnets', () => {
      const requirements: SubnetRequirement[] = [
        { id: '1', name: 'Subnet A', hostsNeeded: 50 },
        { id: '2', name: 'Subnet B', hostsNeeded: 25 },
        { id: '3', name: 'Subnet C', hostsNeeded: 10 },
        { id: '4', name: 'Subnet D', hostsNeeded: 5 }
      ];

      const result = calculateVLSM('192.168.0.0', 24, requirements);
      
      expect(result.success).toBe(true);
      expect(result.totalWastedHosts).toBeLessThan(50); // Should be efficient
      
      // Verify no overlapping subnets
      const networkAddresses = result.subnets.map(s => s.networkAddress);
      expect(new Set(networkAddresses).size).toBe(networkAddresses.length);
    });
  });

  describe('address space validation', () => {
    it('detects insufficient address space', () => {
      const requirements: SubnetRequirement[] = [
        { id: '1', name: 'Too Big', hostsNeeded: 300 } // Won't fit in /24
      ];

      const result = calculateVLSM('192.168.1.0', 24, requirements);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('insufficient');
    });

    it('handles edge case of exactly fitting address space', () => {
      const requirements: SubnetRequirement[] = [
        { id: '1', name: 'Exact Fit', hostsNeeded: 254 } // Exactly fills /24
      ];

      const result = calculateVLSM('192.168.1.0', 24, requirements);
      
      expect(result.success).toBe(true);
      expect(result.remainingAddresses).toBe(0);
    });

    it('allocates multiple subnets that exactly fit', () => {
      const requirements: SubnetRequirement[] = [
        { id: '1', name: 'Half 1', hostsNeeded: 126 },
        { id: '2', name: 'Half 2', hostsNeeded: 126 }
      ];

      const result = calculateVLSM('192.168.1.0', 24, requirements);
      
      expect(result.success).toBe(true);
      expect(result.subnets).toHaveLength(2);
      expect(result.remainingAddresses).toBe(0);
    });
  });

  describe('subnet address calculation accuracy', () => {
    it('calculates non-overlapping consecutive subnets', () => {
      const requirements: SubnetRequirement[] = [
        { id: '1', name: 'First', hostsNeeded: 60 },
        { id: '2', name: 'Second', hostsNeeded: 30 },
        { id: '3', name: 'Third', hostsNeeded: 10 }
      ];

      const result = calculateVLSM('10.1.0.0', 22, requirements);
      
      expect(result.success).toBe(true);
      
      // Verify no overlaps by checking each subnet's address range
      const ranges = result.subnets.map(subnet => {
        const networkInt = ipToInt(subnet.networkAddress);
        const broadcastInt = ipToInt(subnet.broadcastAddress);
        return { start: networkInt, end: broadcastInt, name: subnet.name };
      });

      // Check no ranges overlap
      for (let i = 0; i < ranges.length; i++) {
        for (let j = i + 1; j < ranges.length; j++) {
          const overlap = !(ranges[i].end < ranges[j].start || ranges[j].end < ranges[i].start);
          expect(overlap).toBe(false);
        }
      }
    });

    it('maintains proper network boundaries', () => {
      const requirements: SubnetRequirement[] = [
        { id: '1', name: 'Test', hostsNeeded: 14 } // Should get /28
      ];

      const result = calculateVLSM('192.168.1.0', 24, requirements);
      
      expect(result.success).toBe(true);
      const subnet = result.subnets[0];
      
      // /28 network should be aligned on 16-address boundary
      const networkInt = ipToInt(subnet.networkAddress);
      expect(Math.abs(networkInt % 16)).toBe(0);
      
      // Broadcast should be network + 15
      const broadcastInt = ipToInt(subnet.broadcastAddress);
      expect(broadcastInt - networkInt).toBe(15);
    });
  });

  describe('edge cases and error handling', () => {
    it('handles empty requirements', () => {
      const result = calculateVLSM('192.168.1.0', 24, []);
      
      expect(result.success).toBe(true);
      expect(result.subnets).toHaveLength(0);
      expect(result.remainingAddresses).toBe(256);
    });

    it('handles single host requirements', () => {
      const requirements: SubnetRequirement[] = [
        { id: '1', name: 'Single Host', hostsNeeded: 1 }
      ];

      const result = calculateVLSM('192.168.1.0', 24, requirements);
      
      expect(result.success).toBe(true);
      expect(result.subnets[0].cidr).toBe(32);
      expect(result.subnets[0].hostsProvided).toBe(1);
    });

    it('validates input parameters', () => {
      const requirements: SubnetRequirement[] = [
        { id: '1', name: 'Invalid', hostsNeeded: 0 }
      ];

      const result = calculateVLSM('192.168.1.0', 24, requirements);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('hosts needed must be greater than 0');
    });

    it('handles maximum possible subnets in a /24', () => {
      // 64 subnets of 2 hosts each = 64 * /30 subnets
      const requirements: SubnetRequirement[] = Array.from({ length: 64 }, (_, i) => ({
        id: i.toString(),
        name: `P2P-${i}`,
        hostsNeeded: 2
      }));

      const result = calculateVLSM('192.168.1.0', 24, requirements);
      
      expect(result.success).toBe(true);
      expect(result.subnets).toHaveLength(64);
      expect(result.remainingAddresses).toBe(0);
    });
  });

  describe('complex real-world scenarios', () => {
    it('handles typical enterprise network design', () => {
      const requirements: SubnetRequirement[] = [
        { id: '1', name: 'Sales Department', hostsNeeded: 120 },
        { id: '2', name: 'Engineering', hostsNeeded: 80 },
        { id: '3', name: 'HR Department', hostsNeeded: 25 },
        { id: '4', name: 'Finance', hostsNeeded: 15 },
        { id: '5', name: 'Guest WiFi', hostsNeeded: 50 },
        { id: '6', name: 'Servers', hostsNeeded: 30 },
        { id: '7', name: 'Printers', hostsNeeded: 10 },
        { id: '8', name: 'Management', hostsNeeded: 5 }
      ];

      const result = calculateVLSM('10.1.0.0', 20, requirements); // /20 gives us 4096 addresses
      
      expect(result.success).toBe(true);
      expect(result.subnets).toHaveLength(8);
      expect(result.totalHostsProvided).toBeGreaterThanOrEqual(result.totalHostsRequested);
      
      // Verify largest subnets come first
      for (let i = 0; i < result.subnets.length - 1; i++) {
        expect(result.subnets[i].hostsNeeded).toBeGreaterThanOrEqual(result.subnets[i + 1].hostsNeeded);
      }
    });
  });
});

// Helper function used in tests
function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}