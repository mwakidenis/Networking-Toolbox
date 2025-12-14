import { describe, it, expect } from 'vitest';
import { processIPv6ZoneIdentifiers } from '../../../src/lib/utils/ipv6-zone-id';

describe('ipv6-zone-id', () => {
  describe('processIPv6ZoneIdentifiers', () => {
    it('should process link-local address without zone ID', () => {
      const inputs = ['fe80::1'];
      const result = processIPv6ZoneIdentifiers(inputs);

      expect(result.processings).toHaveLength(1);
      const processing = result.processings[0];
      expect(processing.isValid).toBe(true);
      expect(processing.hasZoneId).toBe(false);
      expect(processing.address).toBe('fe80::1');
      expect(processing.zoneId).toBe('');
      expect(processing.addressType).toBe('link-local');
      expect(processing.requiresZoneId).toBe(true);
      expect(processing.processing.suggestedZones.length).toBeGreaterThan(0);
    });

    it('should process link-local address with zone ID', () => {
      const inputs = ['fe80::1%eth0'];
      const result = processIPv6ZoneIdentifiers(inputs);

      const processing = result.processings[0];
      expect(processing.isValid).toBe(true);
      expect(processing.hasZoneId).toBe(true);
      expect(processing.address).toBe('fe80::1');
      expect(processing.zoneId).toBe('eth0');
      expect(processing.addressType).toBe('link-local');
      expect(processing.requiresZoneId).toBe(true);
      expect(processing.processing.zoneIdValid).toBe(true);
      expect(processing.processing.withZone).toBe('fe80::1%eth0');
      expect(processing.processing.withoutZone).toBe('fe80::1');
    });

    it('should process global unicast address', () => {
      const inputs = ['2001:db8::1'];
      const result = processIPv6ZoneIdentifiers(inputs);

      const processing = result.processings[0];
      expect(processing.isValid).toBe(true);
      expect(processing.hasZoneId).toBe(false);
      expect(processing.addressType).toBe('global');
      expect(processing.requiresZoneId).toBe(false);
      expect(processing.processing.suggestedZones).toHaveLength(0);
    });

    it('should process unique local address', () => {
      const inputs = ['fc00::1', 'fd00::1'];
      const result = processIPv6ZoneIdentifiers(inputs);

      result.processings.forEach(processing => {
        expect(processing.isValid).toBe(true);
        expect(processing.addressType).toBe('unique-local');
        expect(processing.requiresZoneId).toBe(false);
      });
    });

    it('should process multicast address', () => {
      const inputs = ['ff02::1'];
      const result = processIPv6ZoneIdentifiers(inputs);

      const processing = result.processings[0];
      expect(processing.isValid).toBe(true);
      expect(processing.addressType).toBe('multicast');
      expect(processing.requiresZoneId).toBe(false);
      expect(processing.processing.suggestedZones.length).toBeGreaterThan(0);
    });

    it('should process loopback address', () => {
      const inputs = ['::1'];
      const result = processIPv6ZoneIdentifiers(inputs);

      const processing = result.processings[0];
      expect(processing.isValid).toBe(true);
      expect(processing.addressType).toBe('loopback');
      expect(processing.requiresZoneId).toBe(false);
    });

    it('should process unspecified address', () => {
      const inputs = ['::'];
      const result = processIPv6ZoneIdentifiers(inputs);

      const processing = result.processings[0];
      expect(processing.isValid).toBe(true);
      expect(processing.addressType).toBe('unspecified');
      expect(processing.requiresZoneId).toBe(false);
    });

    it('should handle valid zone identifier formats', () => {
      const inputs = [
        'fe80::1%eth0',
        'fe80::1%wlan0',
        'fe80::1%en0',
        'fe80::1%lo0',
        'fe80::1%1',
        'fe80::1%bond0',
        'fe80::1%br0',
        'fe80::1%vlan100',
      ];
      const result = processIPv6ZoneIdentifiers(inputs);

      result.processings.forEach(processing => {
        expect(processing.isValid).toBe(true);
        expect(processing.hasZoneId).toBe(true);
        expect(processing.processing.zoneIdValid).toBe(true);
      });
    });

    it('should reject invalid zone identifier formats', () => {
      const inputs = [
        'fe80::1%',
        'fe80::1%invalid@zone',
        'fe80::1%zone-with-invalid-chars!',
        'fe80::1% ', // space
      ];
      const result = processIPv6ZoneIdentifiers(inputs);

      result.processings.forEach(processing => {
        expect(processing.isValid).toBe(false);
        expect(processing.error).toContain('zone identifier');
      });
    });

    it('should reject invalid IPv6 addresses', () => {
      const inputs = [
        'invalid::address::double',
        'fe80:::1',
        'fe80::g1',
        'not-an-ipv6',
        'fe80::1::2',
      ];
      const result = processIPv6ZoneIdentifiers(inputs);

      result.processings.forEach(processing => {
        expect(processing.isValid).toBe(false);
        expect(processing.error).toBeDefined();
      });
    });

    it('should handle multiple zone identifier delimiters', () => {
      const inputs = ['fe80::1%eth0%extra'];
      const result = processIPv6ZoneIdentifiers(inputs);

      const processing = result.processings[0];
      expect(processing.isValid).toBe(false);
      expect(processing.error).toContain('Invalid zone identifier format');
    });

    it('should handle IPv4-mapped IPv6 addresses', () => {
      const inputs = ['::ffff:192.0.2.1'];
      const result = processIPv6ZoneIdentifiers(inputs);

      const processing = result.processings[0];
      expect(processing.isValid).toBe(true);
      expect(processing.addressType).toBe('global');
    });

    it('should ignore empty inputs', () => {
      const inputs = ['fe80::1', '', '  ', '2001:db8::1'];
      const result = processIPv6ZoneIdentifiers(inputs);

      expect(result.processings).toHaveLength(2);
      expect(result.summary.totalInputs).toBe(2);
    });

    it('should calculate summary statistics correctly', () => {
      const inputs = [
        'fe80::1%eth0',    // valid link-local with zone
        'fe80::2',         // valid link-local without zone (requires zone)
        '2001:db8::1',     // valid global
        'invalid',         // invalid
        'ff02::1',         // valid multicast
      ];
      const result = processIPv6ZoneIdentifiers(inputs);

      expect(result.summary.totalInputs).toBe(5);
      expect(result.summary.validInputs).toBe(4);
      expect(result.summary.invalidInputs).toBe(1);
      expect(result.summary.addressesWithZones).toBe(1);
      expect(result.summary.addressesRequiringZones).toBe(2); // fe80::1 and fe80::2
      expect(result.errors).toHaveLength(1);
    });

    it('should suggest appropriate zone identifiers for link-local addresses', () => {
      const inputs = ['fe80::1'];
      const result = processIPv6ZoneIdentifiers(inputs);

      const processing = result.processings[0];
      expect(processing.processing.suggestedZones).toContain('eth0');
      expect(processing.processing.suggestedZones).toContain('wlan0');
      expect(processing.processing.suggestedZones.length).toBe(10);
    });

    it('should suggest fewer zone identifiers for multicast addresses', () => {
      const inputs = ['ff02::1'];
      const result = processIPv6ZoneIdentifiers(inputs);

      const processing = result.processings[0];
      expect(processing.processing.suggestedZones.length).toBe(5);
    });

    it('should generate withZone format for addresses without zones', () => {
      const inputs = ['fe80::1'];
      const result = processIPv6ZoneIdentifiers(inputs);

      const processing = result.processings[0];
      expect(processing.processing.withZone).toBe('fe80::1%eth0'); // Uses first suggested zone
      expect(processing.processing.withoutZone).toBe('fe80::1');
    });

    it('should preserve existing zone for addresses with zones', () => {
      const inputs = ['fe80::1%wlan0'];
      const result = processIPv6ZoneIdentifiers(inputs);

      const processing = result.processings[0];
      expect(processing.processing.withZone).toBe('fe80::1%wlan0');
      expect(processing.processing.withoutZone).toBe('fe80::1');
    });

    it('should handle various link-local address formats', () => {
      const inputs = [
        'fe80::1',
        'fe81::1',
        'fe90::1',
        'fea0::1',
        'feb0::1',
        'febf::1',
      ];
      const result = processIPv6ZoneIdentifiers(inputs);

      result.processings.forEach(processing => {
        expect(processing.isValid).toBe(true);
        expect(processing.addressType).toBe('link-local');
        expect(processing.requiresZoneId).toBe(true);
      });
    });

    it('should handle expanded IPv6 addresses', () => {
      const inputs = ['fe80:0000:0000:0000:0000:0000:0000:0001'];
      const result = processIPv6ZoneIdentifiers(inputs);

      const processing = result.processings[0];
      expect(processing.isValid).toBe(true);
      expect(processing.addressType).toBe('link-local');
    });

    it('should validate zone ID length limits', () => {
      const veryLongZone = 'a'.repeat(65); // Too long
      const inputs = [`fe80::1%${veryLongZone}`];
      const result = processIPv6ZoneIdentifiers(inputs);

      const processing = result.processings[0];
      expect(processing.isValid).toBe(false);
      expect(processing.error).toContain('zone identifier');
    });

    it('should handle numeric zone identifiers', () => {
      const inputs = ['fe80::1%1', 'fe80::1%12', 'fe80::1%123'];
      const result = processIPv6ZoneIdentifiers(inputs);

      result.processings.forEach(processing => {
        expect(processing.isValid).toBe(true);
        expect(processing.processing.zoneIdValid).toBe(true);
      });
    });

    it('should handle mixed case addresses and preserve zone case', () => {
      const inputs = ['FE80::1%ETH0'];
      const result = processIPv6ZoneIdentifiers(inputs);

      const processing = result.processings[0];
      expect(processing.isValid).toBe(true);
      expect(processing.address).toBe('FE80::1');
      expect(processing.zoneId).toBe('ETH0');
      expect(processing.addressType).toBe('link-local');
    });

    it('should handle all address types correctly', () => {
      const inputs = [
        'fe80::1',         // link-local
        'fc00::1',         // unique-local
        'fd00::1',         // unique-local
        'ff00::1',         // multicast
        '2001:db8::1',     // global
        '::1',             // loopback
        '::',              // unspecified
      ];
      const result = processIPv6ZoneIdentifiers(inputs);

      const types = result.processings.map(p => p.addressType);
      expect(types).toContain('link-local');
      expect(types).toContain('unique-local');
      expect(types).toContain('multicast');
      expect(types).toContain('global');
      expect(types).toContain('loopback');
      expect(types).toContain('unspecified');

      // Only link-local should require zone ID
      const requiresZone = result.processings.filter(p => p.requiresZoneId);
      expect(requiresZone).toHaveLength(1);
      expect(requiresZone[0].addressType).toBe('link-local');
    });
  });
});