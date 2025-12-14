import { describe, it, expect } from 'vitest';
import { calculateIPDistances } from '../../../src/lib/utils/ip-distance.js';

describe('IP Distance Calculation Utilities', () => {
  describe('IPv4 distance calculations', () => {
    it('should calculate distance between adjacent IPv4 addresses', () => {
      const result = calculateIPDistances(['192.168.1.1 -> 192.168.1.2']);

      expect(result.calculations).toHaveLength(1);
      const calc = result.calculations[0];

      expect(calc.isValid).toBe(true);
      expect(calc.startIP).toBe('192.168.1.1');
      expect(calc.endIP).toBe('192.168.1.2');
      expect(calc.distance).toBe('2'); // inclusive by default
      expect(calc.distanceNumber).toBe(2n);
      expect(calc.version).toBe(4);
      expect(calc.direction).toBe('forward');
      expect(calc.inclusive).toBe(true);
    });

    it('should calculate distance for same IPv4 address', () => {
      const result = calculateIPDistances(['192.168.1.1 -> 192.168.1.1']);

      expect(result.calculations).toHaveLength(1);
      const calc = result.calculations[0];

      expect(calc.isValid).toBe(true);
      expect(calc.distance).toBe('1'); // inclusive
      expect(calc.distanceNumber).toBe(1n);
      expect(calc.direction).toBe('forward');
    });

    it('should calculate distance for same IPv4 address (exclusive)', () => {
      const result = calculateIPDistances(['192.168.1.1 -> 192.168.1.1'], false);

      expect(result.calculations).toHaveLength(1);
      const calc = result.calculations[0];

      expect(calc.isValid).toBe(true);
      expect(calc.distance).toBe('0'); // exclusive
      expect(calc.distanceNumber).toBe(0n);
      expect(calc.inclusive).toBe(false);
    });

    it('should calculate backward direction', () => {
      const result = calculateIPDistances(['192.168.1.10 -> 192.168.1.5']);

      expect(result.calculations).toHaveLength(1);
      const calc = result.calculations[0];

      expect(calc.isValid).toBe(true);
      expect(calc.distance).toBe('6'); // inclusive
      expect(calc.direction).toBe('backward');
    });

    it('should calculate large IPv4 distance', () => {
      const result = calculateIPDistances(['192.168.1.1 -> 192.168.2.1']);

      expect(result.calculations).toHaveLength(1);
      const calc = result.calculations[0];

      expect(calc.isValid).toBe(true);
      expect(calc.distance).toBe('257'); // 256 + 1 for inclusive
      expect(calc.version).toBe(4);
    });

    it('should generate intermediate addresses for small ranges', () => {
      const result = calculateIPDistances(['192.168.1.1 -> 192.168.1.5'], true, true);

      expect(result.calculations).toHaveLength(1);
      const calc = result.calculations[0];

      expect(calc.isValid).toBe(true);
      expect(calc.intermediateAddresses).toHaveLength(3);
      expect(calc.intermediateAddresses).toEqual([
        '192.168.1.2',
        '192.168.1.3',
        '192.168.1.4'
      ]);
    });
  });

  describe('IPv6 distance calculations', () => {
    it('should calculate distance between adjacent IPv6 addresses', () => {
      const result = calculateIPDistances(['2001:db8::1 -> 2001:db8::2']);

      expect(result.calculations).toHaveLength(1);
      const calc = result.calculations[0];

      expect(calc.isValid).toBe(true);
      expect(calc.startIP).toBe('2001:db8::1');
      expect(calc.endIP).toBe('2001:db8::2');
      expect(calc.distance).toBe('2'); // inclusive
      expect(calc.version).toBe(6);
      expect(calc.direction).toBe('forward');
    });

    it('should calculate distance for compressed IPv6', () => {
      const result = calculateIPDistances(['::1 -> ::2']);

      expect(result.calculations).toHaveLength(1);
      const calc = result.calculations[0];

      expect(calc.isValid).toBe(true);
      expect(calc.distance).toBe('2');
      expect(calc.version).toBe(6);
    });

    it('should calculate distance for expanded IPv6', () => {
      const result = calculateIPDistances(['2001:0db8:0000:0000:0000:0000:0000:0001 -> 2001:0db8:0000:0000:0000:0000:0000:0002']);

      expect(result.calculations).toHaveLength(1);
      const calc = result.calculations[0];

      expect(calc.isValid).toBe(true);
      expect(calc.distance).toBe('2');
      expect(calc.version).toBe(6);
    });

    it('should handle large IPv6 distances', () => {
      const result = calculateIPDistances(['2001:db8:: -> 2001:db8:0:1::']);

      expect(result.calculations).toHaveLength(1);
      const calc = result.calculations[0];

      expect(calc.isValid).toBe(true);
      expect(calc.version).toBe(6);
      expect(BigInt(calc.distance.replace(/,/g, ''))).toBeGreaterThan(0n);
    });

    it('should generate intermediate IPv6 addresses for small ranges', () => {
      const result = calculateIPDistances(['2001:db8::1 -> 2001:db8::5'], true, true);

      expect(result.calculations).toHaveLength(1);
      const calc = result.calculations[0];

      expect(calc.isValid).toBe(true);
      expect(calc.intermediateAddresses).toHaveLength(3);
      expect(calc.intermediateAddresses).toEqual([
        '2001:db8::2',
        '2001:db8::3',
        '2001:db8::4'
      ]);
    });
  });

  describe('Input parsing', () => {
    it('should parse different separators', () => {
      const inputs = [
        '192.168.1.1 -> 192.168.1.2',
        '192.168.1.1<->192.168.1.2',
        '192.168.1.1→192.168.1.2',
        '192.168.1.1↔192.168.1.2',
        '192.168.1.1-192.168.1.2',
        '192.168.1.1|192.168.1.2',
        '192.168.1.1,192.168.1.2',
        '192.168.1.1 192.168.1.2'
      ];

      const result = calculateIPDistances(inputs);

      expect(result.calculations).toHaveLength(8);
      result.calculations.forEach(calc => {
        expect(calc.isValid).toBe(true);
        expect(calc.startIP).toBe('192.168.1.1');
        expect(calc.endIP).toBe('192.168.1.2');
        expect(calc.distance).toBe('2');
      });
    });

    it('should handle whitespace around separators', () => {
      const result = calculateIPDistances(['  192.168.1.1   ->   192.168.1.2  ']);

      expect(result.calculations).toHaveLength(1);
      const calc = result.calculations[0];

      expect(calc.isValid).toBe(true);
      expect(calc.startIP).toBe('192.168.1.1');
      expect(calc.endIP).toBe('192.168.1.2');
    });

    it('should reject invalid input format', () => {
      const result = calculateIPDistances(['192.168.1.1']);

      expect(result.calculations).toHaveLength(1);
      const calc = result.calculations[0];

      expect(calc.isValid).toBe(false);
      expect(calc.error).toContain('Invalid format');
      expect(result.errors).toHaveLength(1);
    });

    it('should reject empty inputs', () => {
      const result = calculateIPDistances(['', '   ']);

      expect(result.calculations).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Error handling', () => {
    it('should reject mixed IP versions', () => {
      const result = calculateIPDistances(['192.168.1.1 -> 2001:db8::1']);

      expect(result.calculations).toHaveLength(1);
      const calc = result.calculations[0];

      expect(calc.isValid).toBe(false);
      expect(calc.error).toContain('same version');
      expect(result.errors).toHaveLength(1);
    });

    it('should reject invalid IPv4 addresses', () => {
      const result = calculateIPDistances(['256.256.256.256 -> 192.168.1.1']);

      expect(result.calculations).toHaveLength(1);
      const calc = result.calculations[0];

      expect(calc.isValid).toBe(false);
      expect(calc.error).toContain('Invalid IPv4');
      expect(result.errors).toHaveLength(1);
    });

    it('should reject invalid IPv6 addresses', () => {
      const result = calculateIPDistances(['gggg::1 -> 2001:db8::1']);

      expect(result.calculations).toHaveLength(1);
      const calc = result.calculations[0];

      expect(calc.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should handle malformed input gracefully', () => {
      const result = calculateIPDistances(['not-an-ip -> also-not-an-ip']);

      expect(result.calculations).toHaveLength(1);
      const calc = result.calculations[0];

      expect(calc.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('Batch processing', () => {
    it('should process multiple valid calculations', () => {
      const inputs = [
        '192.168.1.1 -> 192.168.1.10',
        '10.0.0.1 -> 10.0.0.5',
        '2001:db8::1 -> 2001:db8::3'
      ];

      const result = calculateIPDistances(inputs);

      expect(result.calculations).toHaveLength(3);
      expect(result.summary.totalCalculations).toBe(3);
      expect(result.summary.validCalculations).toBe(3);
      expect(result.summary.invalidCalculations).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle mixed valid and invalid calculations', () => {
      const inputs = [
        '192.168.1.1 -> 192.168.1.10',
        'invalid input',
        '2001:db8::1 -> 2001:db8::3'
      ];

      const result = calculateIPDistances(inputs);

      expect(result.calculations).toHaveLength(3);
      expect(result.summary.totalCalculations).toBe(3);
      expect(result.summary.validCalculations).toBe(2);
      expect(result.summary.invalidCalculations).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it('should calculate summary statistics', () => {
      const inputs = [
        '192.168.1.1 -> 192.168.1.5', // distance 5
        '192.168.1.1 -> 192.168.1.3'  // distance 3
      ];

      const result = calculateIPDistances(inputs);

      expect(result.summary.totalDistance).toBe('8');
      expect(result.summary.averageDistance).toBe('4');
    });

    it('should handle empty inputs array', () => {
      const result = calculateIPDistances([]);

      expect(result.calculations).toHaveLength(0);
      expect(result.summary.totalCalculations).toBe(0);
      expect(result.summary.validCalculations).toBe(0);
      expect(result.summary.invalidCalculations).toBe(0);
      expect(result.summary.totalDistance).toBe('0');
      expect(result.summary.averageDistance).toBe('0');
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Inclusive vs Exclusive calculations', () => {
    it('should calculate inclusive distances correctly', () => {
      const result = calculateIPDistances([
        '192.168.1.1 -> 192.168.1.5',
        '192.168.1.1 -> 192.168.1.1'
      ], true);

      expect(result.calculations[0].distance).toBe('5');
      expect(result.calculations[1].distance).toBe('1'); // same address inclusive
    });

    it('should calculate exclusive distances correctly', () => {
      const result = calculateIPDistances([
        '192.168.1.1 -> 192.168.1.5',
        '192.168.1.1 -> 192.168.1.1'
      ], false);

      expect(result.calculations[0].distance).toBe('4');
      expect(result.calculations[1].distance).toBe('0'); // same address exclusive
    });
  });

  describe('Intermediate address generation', () => {
    it('should not generate intermediates when disabled', () => {
      const result = calculateIPDistances(['192.168.1.1 -> 192.168.1.10'], true, false);

      expect(result.calculations[0].intermediateAddresses).toHaveLength(0);
    });

    it('should generate sample intermediates for large ranges', () => {
      const result = calculateIPDistances(['192.168.1.1 -> 192.168.2.1'], true, true);

      expect(result.calculations[0].intermediateAddresses).toHaveLength(10); // default max
    });

    it('should generate all intermediates for small ranges', () => {
      const result = calculateIPDistances(['192.168.1.1 -> 192.168.1.3'], true, true);

      expect(result.calculations[0].intermediateAddresses).toEqual(['192.168.1.2']);
    });

    it('should handle IPv6 intermediate generation', () => {
      const result = calculateIPDistances(['::1 -> ::4'], true, true);

      expect(result.calculations[0].intermediateAddresses).toEqual(['::2', '::3']);
    });
  });

  describe('Edge cases', () => {
    it('should handle maximum IPv4 addresses', () => {
      const result = calculateIPDistances(['0.0.0.0 -> 255.255.255.255']);

      expect(result.calculations).toHaveLength(1);
      const calc = result.calculations[0];

      expect(calc.isValid).toBe(true);
      expect(calc.version).toBe(4);
      expect(calc.distance).toBe('4,294,967,296'); // 2^32
    });

    it('should handle IPv6 loopback addresses', () => {
      const result = calculateIPDistances(['::1 -> ::1']);

      expect(result.calculations).toHaveLength(1);
      const calc = result.calculations[0];

      expect(calc.isValid).toBe(true);
      expect(calc.distance).toBe('1'); // inclusive
      expect(calc.version).toBe(6);
    });

    it('should handle private IP ranges', () => {
      const result = calculateIPDistances(['10.0.0.1 -> 10.0.0.254']);

      expect(result.calculations).toHaveLength(1);
      const calc = result.calculations[0];

      expect(calc.isValid).toBe(true);
      expect(calc.distance).toBe('254');
      expect(calc.version).toBe(4);
    });

    it('should handle link-local addresses', () => {
      const result = calculateIPDistances(['169.254.1.1 -> 169.254.1.10']);

      expect(result.calculations).toHaveLength(1);
      const calc = result.calculations[0];

      expect(calc.isValid).toBe(true);
      expect(calc.distance).toBe('10');
      expect(calc.version).toBe(4);
    });
  });
});