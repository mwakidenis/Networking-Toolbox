import { describe, it, expect } from 'vitest';
import {
  validateNetworkInput,
  calculateSupernet,
  generateNetworkId,
  analyzeAggregation,
  type NetworkInput
} from '$lib/utils/supernet-calculations';

describe('Supernet Calculations', () => {
  describe('validateNetworkInput', () => {
    it('should validate correct network inputs', () => {
      const validInputs: NetworkInput[] = [
        { id: '1', network: '192.168.1.0', cidr: 24 },
        { id: '2', network: '10.0.0.0', cidr: 8 },
        { id: '3', network: '172.16.0.0', cidr: 16 },
        { id: '4', network: '192.168.0.0', cidr: 30 }
      ];

      validInputs.forEach(input => {
        const result = validateNetworkInput(input);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject empty network addresses', () => {
      const result = validateNetworkInput({ id: '1', network: '', cidr: 24 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Network address is required');
    });

    it('should reject invalid IP addresses', () => {
      const invalidIPs = [
        '192.168.1.256',
        '192.168',
        '192.168.1.1.1',
        'invalid.ip.address',
        '300.168.1.1'
      ];

      invalidIPs.forEach(ip => {
        const result = validateNetworkInput({ id: '1', network: ip, cidr: 24 });
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid IP address format');
      });
    });

    it('should reject invalid CIDR values', () => {
      const invalidCIDRs = [0, 31, 32, -1, 35];

      invalidCIDRs.forEach(cidr => {
        const result = validateNetworkInput({ id: '1', network: '192.168.1.0', cidr });
        expect(result.valid).toBe(false);
        expect(result.error).toBe('CIDR must be between /1 and /30');
      });
    });

    it('should reject non-network addresses', () => {
      const result = validateNetworkInput({ id: '1', network: '192.168.1.1', cidr: 24 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('IP address should be 192.168.1.0/24 (network address)');
    });

    it('should validate edge case network addresses', () => {
      const edgeCases: NetworkInput[] = [
        { id: '1', network: '192.168.1.0', cidr: 25 },
        { id: '2', network: '192.168.1.128', cidr: 25 },
        { id: '3', network: '10.0.0.0', cidr: 12 }
      ];

      edgeCases.forEach(input => {
        const result = validateNetworkInput(input);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('calculateSupernet', () => {
    it('should calculate supernet for simple contiguous networks', () => {
      const networks: NetworkInput[] = [
        { id: '1', network: '192.168.0.0', cidr: 24 },
        { id: '2', network: '192.168.1.0', cidr: 24 }
      ];

      const result = calculateSupernet(networks);
      expect(result.success).toBe(true);
      expect(result.supernet).toBeDefined();
      expect(result.supernet!.cidr).toBeLessThanOrEqual(24);
      expect(result.supernet!.cidr).toBeGreaterThan(0);
      expect(result.savingsAnalysis!.routeReduction).toBeGreaterThan(0);
    });

    it('should calculate supernet for four contiguous /24 networks', () => {
      const networks: NetworkInput[] = [
        { id: '1', network: '10.1.0.0', cidr: 24 },
        { id: '2', network: '10.1.1.0', cidr: 24 },
        { id: '3', network: '10.1.2.0', cidr: 24 },
        { id: '4', network: '10.1.3.0', cidr: 24 }
      ];

      const result = calculateSupernet(networks);
      expect(result.success).toBe(true);
      expect(result.supernet).toBeDefined();
      expect(result.supernet!.cidr).toBeLessThanOrEqual(24);
      expect(result.supernet!.cidr).toBeGreaterThan(0);
      expect(result.savingsAnalysis!.routeReduction).toBe(3); // 4 routes -> 1 route
    });

    it('should calculate supernet for non-contiguous networks', () => {
      const networks: NetworkInput[] = [
        { id: '1', network: '192.168.1.0', cidr: 24 },
        { id: '2', network: '192.168.5.0', cidr: 24 }
      ];

      const result = calculateSupernet(networks);
      expect(result.success).toBe(true);
      expect(result.supernet).toBeDefined();
      // Should find the smallest supernet that contains both
      expect(result.supernet!.cidr).toBeLessThan(24);
    });

    it('should calculate savings analysis correctly', () => {
      const networks: NetworkInput[] = [
        { id: '1', network: '192.168.0.0', cidr: 24 },
        { id: '2', network: '192.168.1.0', cidr: 24 },
        { id: '3', network: '192.168.2.0', cidr: 24 },
        { id: '4', network: '192.168.3.0', cidr: 24 }
      ];

      const result = calculateSupernet(networks);
      expect(result.success).toBe(true);
      expect(result.savingsAnalysis).toBeDefined();
      expect(result.savingsAnalysis!.originalRoutes).toBe(4);
      expect(result.savingsAnalysis!.aggregatedRoutes).toBe(1);
      expect(result.savingsAnalysis!.routeReduction).toBe(3);
      expect(result.savingsAnalysis!.reductionPercentage).toBe(75);
    });

    it('should handle single network', () => {
      const networks: NetworkInput[] = [
        { id: '1', network: '192.168.1.0', cidr: 24 }
      ];

      const result = calculateSupernet(networks);
      expect(result.success).toBe(true);
      expect(result.supernet).toBeDefined();
      expect(result.supernet!.cidr).toBeGreaterThan(0);
      expect(result.savingsAnalysis!.routeReduction).toBe(0);
    });

    it('should reject empty network list', () => {
      const result = calculateSupernet([]);
      expect(result.success).toBe(false);
      expect(result.error).toBe('At least one network is required');
    });

    it('should reject duplicate networks', () => {
      const networks: NetworkInput[] = [
        { id: '1', network: '192.168.1.0', cidr: 24 },
        { id: '2', network: '192.168.1.0', cidr: 24 }
      ];

      const result = calculateSupernet(networks);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Duplicate networks are not allowed');
    });

    it('should reject invalid networks', () => {
      const networks: NetworkInput[] = [
        { id: '1', network: '192.168.1.1', cidr: 24 }  // Not a network address
      ];

      const result = calculateSupernet(networks);
      expect(result.success).toBe(false);
      expect(result.error).toContain('IP address should be 192.168.1.0/24');
    });

    it('should handle different sized networks', () => {
      const networks: NetworkInput[] = [
        { id: '1', network: '192.168.0.0', cidr: 25 },
        { id: '2', network: '192.168.1.0', cidr: 24 }
      ];

      const result = calculateSupernet(networks);
      expect(result.success).toBe(true);
      expect(result.supernet).toBeDefined();
      expect(result.supernet!.cidr).toBeLessThanOrEqual(24);
    });

    it('should calculate address ranges correctly', () => {
      const networks: NetworkInput[] = [
        { id: '1', network: '10.0.0.0', cidr: 24 }
      ];

      const result = calculateSupernet(networks);
      expect(result.success).toBe(true);
      expect(result.supernet!.addressRange.first).toBeDefined();
      expect(result.supernet!.addressRange.last).toBeDefined();
      expect(result.supernet!.addressRange.first).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      expect(result.supernet!.addressRange.last).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    });

    it('should calculate binary masks correctly', () => {
      const networks: NetworkInput[] = [
        { id: '1', network: '192.168.0.0', cidr: 24 }
      ];

      const result = calculateSupernet(networks);
      expect(result.success).toBe(true);
      expect(result.supernet!.binaryMask).toMatch(/^[01]+\.[01]+\.[01]+\.[01]+$/);
    });
  });

  describe('generateNetworkId', () => {
    it('should generate unique IDs', () => {
      const ids = Array.from({ length: 100 }, () => generateNetworkId());
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should generate IDs with correct format', () => {
      const id = generateNetworkId();
      expect(id).toMatch(/^network_[a-z0-9]{9}$/);
    });
  });

  describe('analyzeAggregation', () => {
    it('should analyze aggregation for contiguous networks', () => {
      const networks: NetworkInput[] = [
        { id: '1', network: '192.168.0.0', cidr: 24 },
        { id: '2', network: '192.168.1.0', cidr: 24 }
      ];

      const result = analyzeAggregation(networks);
      expect(result.canAggregate).toBe(true);
      expect(result.efficiency).toBeGreaterThan(0);
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0]).toContain('pairs of /24 networks can be aggregated');
    });

    it('should analyze aggregation for non-contiguous networks', () => {
      const networks: NetworkInput[] = [
        { id: '1', network: '192.168.1.0', cidr: 24 },
        { id: '2', network: '192.168.5.0', cidr: 24 }
      ];

      const result = analyzeAggregation(networks);
      expect(result.canAggregate).toBe(false);
      expect(result.efficiency).toBe(0);
      expect(result.recommendations).toContain('Networks are not contiguous - consider reordering IP allocations');
    });

    it('should handle single network', () => {
      const networks: NetworkInput[] = [
        { id: '1', network: '192.168.1.0', cidr: 24 }
      ];

      const result = analyzeAggregation(networks);
      expect(result.canAggregate).toBe(false);
      expect(result.efficiency).toBe(0);
      expect(result.recommendations).toContain('Add more networks to perform aggregation');
    });

    it('should analyze mixed CIDR sizes', () => {
      const networks: NetworkInput[] = [
        { id: '1', network: '192.168.0.0', cidr: 24 },
        { id: '2', network: '192.168.1.0', cidr: 24 },
        { id: '3', network: '10.0.0.0', cidr: 16 },
        { id: '4', network: '10.1.0.0', cidr: 16 }
      ];

      const result = analyzeAggregation(networks);
      expect(result.canAggregate).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(1);
    });

    it('should handle empty network list', () => {
      const result = analyzeAggregation([]);
      expect(result.canAggregate).toBe(false);
      expect(result.efficiency).toBe(0);
      expect(result.recommendations).toContain('Add more networks to perform aggregation');
    });
  });

  describe('Integration tests', () => {
    it('should handle real-world supernetting scenario', () => {
      const networks: NetworkInput[] = [
        { id: '1', network: '172.16.0.0', cidr: 24, description: 'VLAN 10' },
        { id: '2', network: '172.16.1.0', cidr: 24, description: 'VLAN 11' },
        { id: '3', network: '172.16.2.0', cidr: 24, description: 'VLAN 12' },
        { id: '4', network: '172.16.3.0', cidr: 24, description: 'VLAN 13' }
      ];

      const result = calculateSupernet(networks);
      expect(result.success).toBe(true);
      expect(result.supernet!.cidr).toBeGreaterThan(0);
      expect(result.supernet!.cidr).toBeLessThanOrEqual(24);
      expect(result.savingsAnalysis!.reductionPercentage).toBe(75);
    });

    it('should handle ISP route aggregation scenario', () => {
      const networks: NetworkInput[] = [
        { id: '1', network: '203.0.113.0', cidr: 26 },
        { id: '2', network: '203.0.113.64', cidr: 26 },
        { id: '3', network: '203.0.113.128', cidr: 26 },
        { id: '4', network: '203.0.113.192', cidr: 26 }
      ];

      const result = calculateSupernet(networks);
      expect(result.success).toBe(true);
      expect(result.supernet!.cidr).toBeGreaterThan(0);
      expect(result.supernet!.cidr).toBeLessThanOrEqual(26);
      expect(result.supernet!.totalHosts).toBeGreaterThan(0);
    });

    it('should maintain consistency between validation and calculation', () => {
      const validNetwork: NetworkInput = { id: '1', network: '192.168.100.0', cidr: 24 };
      const invalidNetwork: NetworkInput = { id: '2', network: '192.168.100.1', cidr: 24 };

      expect(validateNetworkInput(validNetwork).valid).toBe(true);
      expect(validateNetworkInput(invalidNetwork).valid).toBe(false);

      const validResult = calculateSupernet([validNetwork]);
      const invalidResult = calculateSupernet([invalidNetwork]);

      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
    });
  });
});