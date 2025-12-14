import { describe, it, expect } from 'vitest';
import { convertEUI64Addresses } from '../../../src/lib/utils/eui64.js';

describe('EUI-64 Conversion Utilities', () => {
  describe('MAC to EUI-64 conversion', () => {
    it('should convert basic MAC address to EUI-64', () => {
      const result = convertEUI64Addresses(['00:11:22:33:44:55']);

      expect(result.conversions).toHaveLength(1);
      const conversion = result.conversions[0];

      expect(conversion.isValid).toBe(true);
      expect(conversion.inputType).toBe('mac');
      expect(conversion.macAddress).toBe('00:11:22:33:44:55');
      expect(conversion.eui64Address).toBe('02:11:22:FF:FE:33:44:55');
      expect(conversion.ipv6LinkLocal).toMatch(/^fe80::/);
      expect(conversion.ipv6Global).toMatch(/^2001:db8:/);
    });

    it('should handle MAC addresses with different separators', () => {
      const inputs = [
        '00:11:22:33:44:55',
        '00-11-22-33-44-55',
        '001122334455'
      ];

      const result = convertEUI64Addresses(inputs);

      expect(result.conversions).toHaveLength(3);
      result.conversions.forEach(conversion => {
        expect(conversion.isValid).toBe(true);
        expect(conversion.inputType).toBe('mac');
        expect(conversion.macAddress).toBe('00:11:22:33:44:55');
        expect(conversion.eui64Address).toBe('02:11:22:FF:FE:33:44:55');
      });
    });

    it('should handle MAC addresses with lowercase', () => {
      const result = convertEUI64Addresses(['aa:bb:cc:dd:ee:ff']);

      expect(result.conversions).toHaveLength(1);
      const conversion = result.conversions[0];

      expect(conversion.isValid).toBe(true);
      expect(conversion.macAddress).toBe('AA:BB:CC:DD:EE:FF');
      expect(conversion.eui64Address).toBe('A8:BB:CC:FF:FE:DD:EE:FF');
    });

    it('should analyze MAC address properties', () => {
      const result = convertEUI64Addresses(['00:11:22:33:44:55']);
      const conversion = result.conversions[0];

      expect(conversion.details.ouiPart).toBe('001122');
      expect(conversion.details.devicePart).toBe('334455');
      expect(conversion.details.modifiedOUI).toBe('021122');
      expect(conversion.details.universalLocal).toBe('universal');
      expect(conversion.details.unicastMulticast).toBe('unicast');
    });

    it('should detect local administered addresses', () => {
      // Set the U/L bit (0x02) to indicate locally administered
      const result = convertEUI64Addresses(['02:11:22:33:44:55']);
      const conversion = result.conversions[0];

      expect(conversion.details.universalLocal).toBe('local');
      expect(conversion.details.unicastMulticast).toBe('unicast');
    });

    it('should detect multicast addresses', () => {
      // Set the I/G bit (0x01) to indicate multicast
      const result = convertEUI64Addresses(['01:11:22:33:44:55']);
      const conversion = result.conversions[0];

      expect(conversion.details.universalLocal).toBe('universal');
      expect(conversion.details.unicastMulticast).toBe('multicast');
    });

    it('should detect both local and multicast bits', () => {
      // Set both U/L (0x02) and I/G (0x01) bits
      const result = convertEUI64Addresses(['03:11:22:33:44:55']);
      const conversion = result.conversions[0];

      expect(conversion.details.universalLocal).toBe('local');
      expect(conversion.details.unicastMulticast).toBe('multicast');
    });
  });

  describe('EUI-64 to MAC conversion', () => {
    it('should convert EUI-64 back to MAC address', () => {
      const result = convertEUI64Addresses(['02:11:22:FF:FE:33:44:55']);

      expect(result.conversions).toHaveLength(1);
      const conversion = result.conversions[0];

      expect(conversion.isValid).toBe(true);
      expect(conversion.inputType).toBe('eui64');
      expect(conversion.eui64Address).toBe('02:11:22:FF:FE:33:44:55');
      expect(conversion.macAddress).toBe('00:11:22:33:44:55');
      expect(conversion.ipv6LinkLocal).toMatch(/^fe80::/);
    });

    it('should handle EUI-64 with different separators', () => {
      const inputs = [
        '02:11:22:FF:FE:33:44:55',
        '02-11-22-FF-FE-33-44-55',
        '021122FFFE334455'
      ];

      const result = convertEUI64Addresses(inputs);

      expect(result.conversions).toHaveLength(3);
      result.conversions.forEach(conversion => {
        expect(conversion.isValid).toBe(true);
        expect(conversion.inputType).toBe('eui64');
        expect(conversion.eui64Address).toBe('02:11:22:FF:FE:33:44:55');
        expect(conversion.macAddress).toBe('00:11:22:33:44:55');
      });
    });

    it('should reject EUI-64 not derived from MAC (missing FFFE)', () => {
      const result = convertEUI64Addresses(['02:11:22:33:44:55:66:77']);

      expect(result.conversions).toHaveLength(1);
      const conversion = result.conversions[0];

      expect(conversion.isValid).toBe(false);
      expect(conversion.error).toContain('FFFE');
    });

    it('should handle lowercase EUI-64', () => {
      const result = convertEUI64Addresses(['a8:bb:cc:ff:fe:dd:ee:ff']);

      expect(result.conversions).toHaveLength(1);
      const conversion = result.conversions[0];

      expect(conversion.isValid).toBe(true);
      expect(conversion.eui64Address).toBe('A8:BB:CC:FF:FE:DD:EE:FF');
      expect(conversion.macAddress).toBe('AA:BB:CC:DD:EE:FF');
    });
  });

  describe('IPv6 address generation', () => {
    it('should generate link-local IPv6 address', () => {
      const result = convertEUI64Addresses(['00:11:22:33:44:55']);
      const conversion = result.conversions[0];

      expect(conversion.ipv6LinkLocal).toBe('fe80::0211:22ff:fe33:4455');
    });

    it('should generate global IPv6 address with default prefix', () => {
      const result = convertEUI64Addresses(['00:11:22:33:44:55']);
      const conversion = result.conversions[0];

      expect(conversion.ipv6Global).toBe('2001:db8:0211:22ff:fe33:4455');
    });

    it('should generate global IPv6 address with custom prefix', () => {
      const result = convertEUI64Addresses(['00:11:22:33:44:55'], '2001:470:1f04::/64');
      const conversion = result.conversions[0];

      expect(conversion.ipv6Global).toBe('2001:470:1f04:0211:22ff:fe33:4455');
    });

    it('should handle IPv6 generation from EUI-64 input', () => {
      const result = convertEUI64Addresses(['02:11:22:FF:FE:33:44:55']);
      const conversion = result.conversions[0];

      expect(conversion.ipv6LinkLocal).toBe('fe80::0211:22ff:fe33:4455');
      expect(conversion.ipv6Global).toBe('2001:db8:0211:22ff:fe33:4455');
    });
  });

  describe('Input validation', () => {
    it('should reject invalid MAC address length', () => {
      const result = convertEUI64Addresses(['00:11:22:33:44']);

      expect(result.conversions).toHaveLength(1);
      const conversion = result.conversions[0];

      expect(conversion.isValid).toBe(false);
      expect(conversion.error).toContain('Invalid MAC address or EUI-64 format');
    });

    it('should reject invalid characters in MAC address', () => {
      const result = convertEUI64Addresses(['GG:11:22:33:44:55']);

      expect(result.conversions).toHaveLength(1);
      const conversion = result.conversions[0];

      expect(conversion.isValid).toBe(false);
      expect(conversion.error).toContain('Invalid MAC address or EUI-64 format');
    });

    it('should reject invalid EUI-64 length', () => {
      const result = convertEUI64Addresses(['02:11:22:FF:FE:33:44']);

      expect(result.conversions).toHaveLength(1);
      const conversion = result.conversions[0];

      expect(conversion.isValid).toBe(false);
      expect(conversion.error).toContain('Invalid MAC address or EUI-64 format');
    });

    it('should reject invalid characters in EUI-64', () => {
      const result = convertEUI64Addresses(['GG:11:22:FF:FE:33:44:55']);

      expect(result.conversions).toHaveLength(1);
      const conversion = result.conversions[0];

      expect(conversion.isValid).toBe(false);
      expect(conversion.error).toContain('Invalid MAC address or EUI-64 format');
    });

    it('should handle empty input', () => {
      const result = convertEUI64Addresses(['']);

      expect(result.conversions).toHaveLength(0);
      expect(result.summary.totalInputs).toBe(0);
    });

    it('should handle whitespace-only input', () => {
      const result = convertEUI64Addresses(['   ', '\t']);

      expect(result.conversions).toHaveLength(0);
      expect(result.summary.totalInputs).toBe(0);
    });
  });

  describe('Batch processing', () => {
    it('should process multiple valid addresses', () => {
      const inputs = [
        '00:11:22:33:44:55',
        'AA:BB:CC:DD:EE:FF',
        '02:11:22:FF:FE:33:44:55'
      ];

      const result = convertEUI64Addresses(inputs);

      expect(result.conversions).toHaveLength(3);
      expect(result.summary.totalInputs).toBe(3);
      expect(result.summary.validInputs).toBe(3);
      expect(result.summary.invalidInputs).toBe(0);
      expect(result.summary.macToEUI64).toBe(2);
      expect(result.summary.eui64ToMAC).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle mixed valid and invalid addresses', () => {
      const inputs = [
        '00:11:22:33:44:55',
        'invalid-mac',
        '02:11:22:FF:FE:33:44:55',
        'GG:11:22:33:44:55'
      ];

      const result = convertEUI64Addresses(inputs);

      expect(result.conversions).toHaveLength(4);
      expect(result.summary.totalInputs).toBe(4);
      expect(result.summary.validInputs).toBe(2);
      expect(result.summary.invalidInputs).toBe(2);
      expect(result.summary.macToEUI64).toBe(1);
      expect(result.summary.eui64ToMAC).toBe(1);
      expect(result.errors).toHaveLength(2);
    });

    it('should collect error messages', () => {
      const inputs = ['invalid-mac', 'GG:11:22:33:44:55'];

      const result = convertEUI64Addresses(inputs);

      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('"invalid-mac"');
      expect(result.errors[1]).toContain('"GG:11:22:33:44:55"');
    });

    it('should handle empty inputs array', () => {
      const result = convertEUI64Addresses([]);

      expect(result.conversions).toHaveLength(0);
      expect(result.summary.totalInputs).toBe(0);
      expect(result.summary.validInputs).toBe(0);
      expect(result.summary.invalidInputs).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle all zeros MAC address', () => {
      const result = convertEUI64Addresses(['00:00:00:00:00:00']);

      expect(result.conversions).toHaveLength(1);
      const conversion = result.conversions[0];

      expect(conversion.isValid).toBe(true);
      expect(conversion.macAddress).toBe('00:00:00:00:00:00');
      expect(conversion.eui64Address).toBe('02:00:00:FF:FE:00:00:00');
      expect(conversion.details.universalLocal).toBe('universal');
      expect(conversion.details.unicastMulticast).toBe('unicast');
    });

    it('should handle all ones MAC address', () => {
      const result = convertEUI64Addresses(['FF:FF:FF:FF:FF:FF']);

      expect(result.conversions).toHaveLength(1);
      const conversion = result.conversions[0];

      expect(conversion.isValid).toBe(true);
      expect(conversion.macAddress).toBe('FF:FF:FF:FF:FF:FF');
      expect(conversion.eui64Address).toBe('FD:FF:FF:FF:FE:FF:FF:FF');
      expect(conversion.details.universalLocal).toBe('local');
      expect(conversion.details.unicastMulticast).toBe('multicast');
    });

    it('should handle round-trip conversion consistency', () => {
      const originalMAC = '12:34:56:78:9A:BC';

      // Convert MAC to EUI-64
      const result1 = convertEUI64Addresses([originalMAC]);
      const eui64 = result1.conversions[0].eui64Address;

      // Convert EUI-64 back to MAC
      const result2 = convertEUI64Addresses([eui64]);
      const recoveredMAC = result2.conversions[0].macAddress;

      expect(recoveredMAC).toBe(originalMAC);
    });

    it('should handle custom global prefix with /64', () => {
      const result = convertEUI64Addresses(['00:11:22:33:44:55'], '2001:470:1f04:beef::/64');
      const conversion = result.conversions[0];

      expect(conversion.ipv6Global).toBe('2001:470:1f04:beef:0211:22ff:fe33:4455');
    });

    it('should handle custom global prefix without /64', () => {
      const result = convertEUI64Addresses(['00:11:22:33:44:55'], '2001:470:1f04:beef::');
      const conversion = result.conversions[0];

      expect(conversion.ipv6Global).toBe('2001:470:1f04:beef:0211:22ff:fe33:4455');
    });
  });
});