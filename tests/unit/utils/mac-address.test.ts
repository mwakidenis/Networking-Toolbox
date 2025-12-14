import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertMACAddress, convertMACAddresses } from '../../../src/lib/utils/mac-address.js';

describe('MAC Address Conversion Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  describe('MAC address parsing', () => {
    it('should parse colon-separated MAC address', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('00:1A:2B:3C:4D:5E');

      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('001A2B3C4D5E');
    });

    it('should parse hyphen-separated MAC address', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('00-1A-2B-3C-4D-5E');

      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('001A2B3C4D5E');
    });

    it('should parse Cisco dot-separated MAC address', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('001A.2B3C.4D5E');

      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('001A2B3C4D5E');
    });

    it('should parse bare MAC address', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('001A2B3C4D5E');

      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('001A2B3C4D5E');
    });

    it('should handle lowercase MAC address', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('aa:bb:cc:dd:ee:ff');

      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('AABBCCDDEEFF');
    });

    it('should reject invalid MAC address length', async () => {
      const result = await convertMACAddress('00:1A:2B:3C:4D');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid MAC address format');
    });

    it('should reject invalid characters', async () => {
      const result = await convertMACAddress('GG:1A:2B:3C:4D:5E');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid MAC address format');
    });

    it('should reject empty input', async () => {
      const result = await convertMACAddress('');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid MAC address format');
    });
  });

  describe('MAC address formatting', () => {
    it('should format to all common formats', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('00:1A:2B:3C:4D:5E');

      expect(result.formats.colon).toBe('00:1A:2B:3C:4D:5E');
      expect(result.formats.hyphen).toBe('00-1A-2B-3C-4D-5E');
      expect(result.formats.cisco).toBe('001A.2B3C.4D5E');
      expect(result.formats.bare).toBe('001A2B3C4D5E');
      expect(result.formats.bareUppercase).toBe('001A2B3C4D5E');
      expect(result.formats.bareLowercase).toBe('001a2b3c4d5e');
    });

    it('should format to EUI-64', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('00:1A:2B:3C:4D:5E');

      expect(result.formats.eui64).toBe('02:1A:2B:FF:FE:3C:4D:5E');
    });

    it('should format to various prefixed formats', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('00:1A:2B:3C:4D:5E');

      expect(result.formats.prefixedMac).toBe('MAC=00:1A:2B:3C:4D:5E');
      expect(result.formats.prefixedHwaddr).toBe('HWaddr 00:1A:2B:3C:4D:5E');
      expect(result.formats.slashSeparated).toBe('00/1A/2B/3C/4D/5E');
      expect(result.formats.prefixedBare).toBe('MAC001A2B3C4D5E');
      expect(result.formats.prefixedAddr).toBe('addr001A2B3C4D5E');
    });

    it('should format to decimal octets', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('00:1A:2B:3C:4D:5E');

      expect(result.formats.decimalOctets).toBe('0.26.43.60.77.94');
    });

    it('should format to reversed order', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('00:1A:2B:3C:4D:5E');

      expect(result.formats.reverse).toBe('5E:4D:3C:2B:1A:00');
    });

    it('should format to IPv6 style', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('00:1A:2B:3C:4D:5E');

      expect(result.formats.ipv6Style).toBe('001A:2B3C:4D5E');
    });

    it('should format to space-separated', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('00:1A:2B:3C:4D:5E');

      expect(result.formats.spaceSeparated).toBe('00 1A 2B 3C 4D 5E');
    });
  });

  describe('MAC address details', () => {
    it('should identify universal unicast address', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('00:1A:2B:3C:4D:5E');

      expect(result.details.isUniversal).toBe(true);
      expect(result.details.isUnicast).toBe(true);
    });

    it('should identify locally administered address', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      // Second hex digit 2 means U/L bit is set
      const result = await convertMACAddress('02:1A:2B:3C:4D:5E');

      expect(result.details.isUniversal).toBe(false);
      expect(result.details.isUnicast).toBe(true);
    });

    it('should identify multicast address', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      // First hex digit odd means I/G bit is set
      const result = await convertMACAddress('01:1A:2B:3C:4D:5E');

      expect(result.details.isUniversal).toBe(true);
      expect(result.details.isUnicast).toBe(false);
    });

    it('should identify locally administered multicast address', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      // Both bits set: 03 = 0000 0011
      const result = await convertMACAddress('03:1A:2B:3C:4D:5E');

      expect(result.details.isUniversal).toBe(false);
      expect(result.details.isUnicast).toBe(false);
    });

    it('should include binary representation', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('FF:FF:FF:FF:FF:FF');

      expect(result.details.binary).toBe(
        '111111111111111111111111111111111111111111111111'
      );
    });
  });

  describe('OUI lookup', () => {
    it('should lookup OUI information successfully', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          found: true,
          manufacturer: 'Apple, Inc.',
          country: 'US',
          address: '1 Apple Park Way, Cupertino CA 95014',
          blockType: 'MA-L',
          blockStart: '3C:22:FB:00:00:00',
          blockEnd: 'FF:FF:FF:FF:FF:FF',
          blockSize: 16777216,
          isPrivate: false,
          isRand: false,
          updated: '2023-01-15',
        }),
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('3C:22:FB:A1:B2:C3');

      expect(result.oui.found).toBe(true);
      expect(result.oui.manufacturer).toBe('Apple, Inc.');
      expect(result.oui.country).toBe('US');
      expect(result.oui.blockType).toBe('MA-L');
      expect(result.oui.blockSize).toBe(16777216);
    });

    it('should handle OUI not found', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('00:00:00:00:00:00');

      expect(result.oui.found).toBe(false);
      expect(result.oui.manufacturer).toBe(null);
    });

    it('should handle OUI lookup API error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const result = await convertMACAddress('00:1A:2B:3C:4D:5E');

      expect(result.oui.found).toBe(false);
      expect(result.oui.manufacturer).toBe(null);
    });

    it('should handle API returning not found in JSON', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          found: false,
          manufacturer: null,
        }),
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('00:1A:2B:3C:4D:5E');

      expect(result.oui.found).toBe(false);
      expect(result.oui.manufacturer).toBe(null);
    });
  });

  describe('EUI-64 conversion', () => {
    it('should flip U/L bit in EUI-64', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      // Universal address (0x00) should become local (0x02) in EUI-64
      const result = await convertMACAddress('00:1A:2B:3C:4D:5E');

      expect(result.formats.eui64).toBe('02:1A:2B:FF:FE:3C:4D:5E');
    });

    it('should flip U/L bit for local address', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      // Local address (0x02) should become universal (0x00) in EUI-64
      const result = await convertMACAddress('02:1A:2B:3C:4D:5E');

      expect(result.formats.eui64).toBe('00:1A:2B:FF:FE:3C:4D:5E');
    });

    it('should insert FFFE in the middle', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('AA:BB:CC:DD:EE:FF');

      // A8 because 0xAA XOR 0x02 = 0xA8
      expect(result.formats.eui64).toBe('A8:BB:CC:FF:FE:DD:EE:FF');
    });
  });

  describe('Batch conversion', () => {
    it('should convert multiple valid MAC addresses', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const inputs = [
        '00:1A:2B:3C:4D:5E',
        'AA:BB:CC:DD:EE:FF',
        '3C:22:FB:A1:B2:C3',
      ];

      const result = await convertMACAddresses(inputs);

      expect(result.conversions).toHaveLength(3);
      expect(result.summary.total).toBe(3);
      expect(result.summary.valid).toBe(3);
      expect(result.summary.invalid).toBe(0);
      expect(result.summary.withOUI).toBe(0);
    });

    it('should handle mixed valid and invalid addresses', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const inputs = ['00:1A:2B:3C:4D:5E', 'invalid-mac', 'GG:HH:II:JJ:KK:LL'];

      const result = await convertMACAddresses(inputs);

      expect(result.conversions).toHaveLength(3);
      expect(result.summary.total).toBe(3);
      expect(result.summary.valid).toBe(1);
      expect(result.summary.invalid).toBe(2);
    });

    it('should count addresses with OUI information', async () => {
      const mockResponse1 = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          found: true,
          company: 'Apple, Inc.',
        }),
      };
      const mockResponse2 = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const inputs = ['3C:22:FB:A1:B2:C3', '00:00:00:00:00:00'];

      const result = await convertMACAddresses(inputs);

      expect(result.summary.total).toBe(2);
      expect(result.summary.valid).toBe(2);
      expect(result.summary.withOUI).toBe(1);
    });

    it('should handle empty inputs array', async () => {
      const result = await convertMACAddresses([]);

      expect(result.conversions).toHaveLength(0);
      expect(result.summary.total).toBe(0);
      expect(result.summary.valid).toBe(0);
      expect(result.summary.invalid).toBe(0);
    });

    it('should process all inputs including empty strings', async () => {
      const inputs = ['00:1A:2B:3C:4D:5E', '', '  ', '\t'];

      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await convertMACAddresses(inputs);

      expect(result.conversions).toHaveLength(4);
      expect(result.summary.total).toBe(4);
      expect(result.summary.valid).toBe(1);
      expect(result.summary.invalid).toBe(3);
    });
  });

  describe('Special MAC addresses', () => {
    it('should handle broadcast address', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('FF:FF:FF:FF:FF:FF');

      expect(result.isValid).toBe(true);
      expect(result.details.isUnicast).toBe(false); // Multicast/Broadcast
      expect(result.details.isUniversal).toBe(false); // Local
    });

    it('should handle null address', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('00:00:00:00:00:00');

      expect(result.isValid).toBe(true);
      expect(result.details.isUnicast).toBe(true);
      expect(result.details.isUniversal).toBe(true);
    });

    it('should handle IPv4 multicast MAC', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      // IPv4 multicast MAC range starts with 01:00:5E
      const result = await convertMACAddress('01:00:5E:00:00:01');

      expect(result.isValid).toBe(true);
      expect(result.details.isUnicast).toBe(false); // Multicast
    });

    it('should handle IPv6 multicast MAC', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      // IPv6 multicast MAC range starts with 33:33
      const result = await convertMACAddress('33:33:00:00:00:01');

      expect(result.isValid).toBe(true);
      expect(result.details.isUnicast).toBe(false); // Multicast
    });
  });

  describe('Edge cases', () => {
    it('should handle MAC with mixed case', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('aA:bB:cC:dD:eE:fF');

      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('AABBCCDDEEFF');
      expect(result.formats.colon).toBe('AA:BB:CC:DD:EE:FF');
    });

    it('should handle MAC with extra whitespace', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress(' 00:1A:2B:3C:4D:5E ');

      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('001A2B3C4D5E');
    });

    it('should reject MAC with invalid separators', async () => {
      const result = await convertMACAddress('00/1A/2B/3C/4D/5E');

      // Slashes should be removed in parsing, but this would result in wrong length
      expect(result.isValid).toBe(false);
    });

    it('should handle MAC with numbers only', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('00:11:22:33:44:55');

      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('001122334455');
    });

    it('should handle MAC with letters only (hexadecimal)', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      globalThis.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

      const result = await convertMACAddress('AA:BB:CC:DD:EE:FF');

      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('AABBCCDDEEFF');
    });
  });
});
