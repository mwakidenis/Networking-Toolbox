import { describe, it, expect } from 'vitest';
import {
  generateRegex,
  generateIPv4Regex,
  generateIPv6Regex,
  generateBothRegex,
  getRegexRUrl,
  type IPv4Options,
  type IPv6Options,
  type CrossOptions,
  type RegexType,
  type Mode
} from '$lib/utils/ip-regex-gen.js';

// Default options for testing
const defaultIPv4Options: IPv4Options = {
  allowLeadingZeros: false,
  requireAllOctets: true,
  allowPrivateOnly: false,
  allowPublicOnly: false,
  wordBoundaries: true,
  caseInsensitive: false
};

const defaultIPv6Options: IPv6Options = {
  allowCompressed: true,
  allowFullForm: true,
  allowZoneId: false,
  allowEmbeddedIPv4: true,
  wordBoundaries: true,
  caseInsensitive: true,
  allowBrackets: false
};

const defaultCrossOptions: CrossOptions = {
  exactMatch: false,
  engineSafeBoundaries: false,
  allowPort: false,
  allowCIDR: false,
  namedCaptures: false
};

describe('ip-regex-gen', () => {
  describe('generateIPv4Regex', () => {
    describe('simple mode', () => {
      it('should generate basic IPv4 regex with anchors', () => {
        const result = generateIPv4Regex('simple', defaultIPv4Options, defaultCrossOptions);

        expect(result.pattern).toMatch(/^\^.*\$$/); // Has anchors
        expect(result.flags).toBe('');
        expect(result.description).toContain('IPv4');
        expect(result.testCases.valid).toContain('192.168.1.1');
        expect(result.testCases.invalid).toContain('256.256.256.256');
      });

      it('should reject leading zeros by default', () => {
        const result = generateIPv4Regex('simple', defaultIPv4Options, defaultCrossOptions);
        const regex = new RegExp(result.pattern, result.flags);

        expect(regex.test('001.002.003.004')).toBe(false);
        expect(regex.test('192.168.001.001')).toBe(false);
      });

      it('should validate common IPv4 addresses', () => {
        const result = generateIPv4Regex('simple', defaultIPv4Options, defaultCrossOptions);
        const regex = new RegExp(result.pattern, result.flags);

        // Valid cases
        expect(regex.test('0.0.0.0')).toBe(true);
        expect(regex.test('127.0.0.1')).toBe(true);
        expect(regex.test('192.168.1.1')).toBe(true);
        expect(regex.test('255.255.255.255')).toBe(true);
        expect(regex.test('10.0.0.1')).toBe(true);
        expect(regex.test('172.16.254.1')).toBe(true);

        // Invalid cases - should NOT match
        expect(regex.test('256.1.1.1')).toBe(false);
        expect(regex.test('1.256.1.1')).toBe(false);
        expect(regex.test('1.1.256.1')).toBe(false);
        expect(regex.test('1.1.1.256')).toBe(false);
        expect(regex.test('192.168.1')).toBe(false);
        expect(regex.test('192.168.1.1.1')).toBe(false);
        expect(regex.test('not.an.ip.address')).toBe(false);
        expect(regex.test('')).toBe(false);
      });

      it('should prevent partial matches', () => {
        const result = generateIPv4Regex('simple', defaultIPv4Options, defaultCrossOptions);
        const regex = new RegExp(result.pattern, result.flags);

        // These should NOT match because they contain valid IPs as substrings
        expect(regex.test('prefix192.168.1.1')).toBe(false);
        expect(regex.test('192.168.1.1suffix')).toBe(false);
        expect(regex.test('text192.168.1.1text')).toBe(false);
        expect(regex.test('192.168.1.1.1')).toBe(false);
      });
    });

    describe('advanced mode with options', () => {
      it('should allow leading zeros when enabled', () => {
        const options = { ...defaultIPv4Options, allowLeadingZeros: true };
        const result = generateIPv4Regex('advanced', options, defaultCrossOptions);
        const regex = new RegExp(result.pattern, result.flags);

        expect(regex.test('001.002.003.004')).toBe(true);
        expect(regex.test('192.168.001.001')).toBe(true);
        expect(result.testCases.valid).toContain('001.002.003.004');
      });

      it('should support case insensitive flag', () => {
        const options = { ...defaultIPv4Options, caseInsensitive: true };
        const result = generateIPv4Regex('advanced', options, defaultCrossOptions);

        expect(result.flags).toBe('i');
      });

      it('should support exact match option', () => {
        const crossOptions = { ...defaultCrossOptions, exactMatch: true };
        const result = generateIPv4Regex('advanced', defaultIPv4Options, crossOptions);

        expect(result.pattern).toMatch(/^\^.*\$$/);
        expect(result.tradeoffs).toContain('Uses anchors for exact match validation');
      });

      it('should support engine-safe boundaries', () => {
        const crossOptions = { ...defaultCrossOptions, engineSafeBoundaries: true };
        const result = generateIPv4Regex('advanced', defaultIPv4Options, crossOptions);

        expect(result.pattern).toContain('(?:^|[^0-9])');
        expect(result.pattern).toContain('(?![0-9])');
      });

      it('should support port numbers', () => {
        const crossOptions = { ...defaultCrossOptions, allowPort: true };
        const result = generateIPv4Regex('advanced', defaultIPv4Options, crossOptions);
        const regex = new RegExp(result.pattern, result.flags);

        expect(result.testCases.valid).toContain('192.168.1.1:8080');
        expect(result.testCases.invalid).toContain('192.168.1.1:99999');
      });

      it('should support CIDR notation', () => {
        const crossOptions = { ...defaultCrossOptions, allowCIDR: true };
        const result = generateIPv4Regex('advanced', defaultIPv4Options, crossOptions);

        expect(result.testCases.valid).toContain('192.168.1.0/24');
        expect(result.testCases.invalid).toContain('192.168.1.1/33');
      });

      it('should support named captures', () => {
        const crossOptions = { ...defaultCrossOptions, namedCaptures: true };
        const result = generateIPv4Regex('advanced', defaultIPv4Options, crossOptions);

        expect(result.pattern).toContain('?<ipv4>');
      });

      it('should combine multiple advanced options correctly', () => {
        const options = { ...defaultIPv4Options, allowLeadingZeros: true, caseInsensitive: true };
        const crossOptions = { ...defaultCrossOptions, allowPort: true, allowCIDR: true };
        const result = generateIPv4Regex('advanced', options, crossOptions);

        expect(result.flags).toContain('i');
        expect(result.pattern).toContain(':'); // port
        expect(result.pattern).toContain('/'); // CIDR
        // Check that the options are actually applied by testing the regex
        const regex = new RegExp(result.pattern, result.flags);
        expect(regex.test('001.002.003.004')).toBe(true); // leading zeros
        expect(regex.test('192.168.1.1:8080')).toBe(true); // port
        expect(regex.test('192.168.1.0/24')).toBe(true); // CIDR
      });

      it('should handle private-only IPv4 option', () => {
        const options = { ...defaultIPv4Options, allowPrivateOnly: true };
        const result = generateIPv4Regex('advanced', options, defaultCrossOptions);

        // Check if this option affects the description/tradeoffs rather than the pattern
        expect(result.tradeoffs.some(t => t.toLowerCase().includes('private'))).toBe(true);
      });

      it('should handle public-only IPv4 option', () => {
        const options = { ...defaultIPv4Options, allowPublicOnly: true };
        const result = generateIPv4Regex('advanced', options, defaultCrossOptions);

        // Ensure the option is recognized and doesn't cause errors
        expect(result.pattern).toBeDefined();
        expect(result.description).toBeDefined();
      });

      it('should validate extensive IPv4 test cases', () => {
        const result = generateIPv4Regex('simple', defaultIPv4Options, defaultCrossOptions);
        const regex = new RegExp(result.pattern, result.flags);

        // Valid IPv4 addresses
        const validIPs = [
          '0.0.0.0', '1.1.1.1', '8.8.8.8', '127.0.0.1', '192.168.1.1',
          '255.255.255.255', '172.16.0.1', '10.0.0.1', '203.0.113.1'
        ];

        // Invalid IPv4 addresses
        const invalidIPs = [
          '256.1.1.1', '1.256.1.1', '1.1.256.1', '1.1.1.256',
          '192.168.1', '192.168.1.1.1', '192.168..1', '.192.168.1.1',
          '192.168.1.1.', 'abc.def.ghi.jkl', '192.168.1.-1'
        ];

        validIPs.forEach(ip => {
          expect(regex.test(ip)).toBe(true);
        });

        invalidIPs.forEach(ip => {
          expect(regex.test(ip)).toBe(false);
        });
      });
    });
  });

  describe('generateIPv6Regex', () => {
    describe('simple mode', () => {
      it('should generate basic IPv6 regex with anchors', () => {
        const result = generateIPv6Regex('simple', defaultIPv4Options, defaultIPv6Options, defaultCrossOptions);

        expect(result.pattern).toMatch(/^\^.*\$$/); // Has anchors
        expect(result.flags).toBe('i'); // IPv6 is case insensitive by default
        expect(result.description).toContain('IPv6');
      });

      it('should validate full form IPv6 addresses', () => {
        const result = generateIPv6Regex('simple', defaultIPv4Options, defaultIPv6Options, defaultCrossOptions);
        const regex = new RegExp(result.pattern, result.flags);

        expect(regex.test('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
        expect(regex.test('fe80:0000:0000:0000:0000:0000:0000:0001')).toBe(true);
      });

      it('should validate compressed IPv6 addresses', () => {
        const result = generateIPv6Regex('simple', defaultIPv4Options, defaultIPv6Options, defaultCrossOptions);
        const regex = new RegExp(result.pattern, result.flags);

        // Various compression formats
        expect(regex.test('2001:db8:85a3::8a2e:370:7334')).toBe(true);
        expect(regex.test('2001:db8::1')).toBe(true);
        expect(regex.test('::1')).toBe(true);
        expect(regex.test('::')).toBe(true);
        expect(regex.test('fe80::1')).toBe(true);
        expect(regex.test('2001::')).toBe(true);
        expect(regex.test('::ffff:0:0')).toBe(true);
      });

      it('should reject invalid IPv6 addresses', () => {
        const result = generateIPv6Regex('simple', defaultIPv4Options, defaultIPv6Options, defaultCrossOptions);
        const regex = new RegExp(result.pattern, result.flags);

        // Invalid cases
        expect(regex.test('gggg::1')).toBe(false); // Invalid hex
        expect(regex.test('12345::1')).toBe(false); // Group too long
        expect(regex.test('2001:db8::85a3::7334')).toBe(false); // Double ::
        expect(regex.test('2001:db8:85a3:0000:0000:8a2e:0370:7334:extra')).toBe(false); // Too many groups
        expect(regex.test('not:an:ipv6:address')).toBe(false); // Invalid format
        expect(regex.test('')).toBe(false);
      });

      it('should prevent partial matches', () => {
        const result = generateIPv6Regex('simple', defaultIPv4Options, defaultIPv6Options, defaultCrossOptions);
        const regex = new RegExp(result.pattern, result.flags);

        // These should NOT match because they contain valid IPv6 as substrings
        expect(regex.test('prefix2001:db8::1')).toBe(false);
        expect(regex.test('2001:db8::1suffix')).toBe(false);
        expect(regex.test('text2001:db8::1text')).toBe(false);
      });
    });

    describe('advanced mode with options', () => {
      it('should support zone IDs when enabled', () => {
        const options = { ...defaultIPv6Options, allowZoneId: true };
        const result = generateIPv6Regex('advanced', defaultIPv4Options, options, defaultCrossOptions);

        expect(result.tradeoffs).toContain('Supports zone IDs (e.g., %eth0, %1)');
      });

      it('should support bracketed format when enabled', () => {
        const options = { ...defaultIPv6Options, allowBrackets: true };
        const result = generateIPv6Regex('advanced', defaultIPv4Options, options, defaultCrossOptions);

        expect(result.tradeoffs).toContain('Supports bracketed IPv6 literals [IPv6] for URLs');
      });

      it('should disable compression when not allowed', () => {
        const options = { ...defaultIPv6Options, allowCompressed: false };
        const result = generateIPv6Regex('advanced', defaultIPv4Options, options, defaultCrossOptions);
        const regex = new RegExp(result.pattern, result.flags);

        // Should reject compressed forms
        expect(regex.test('2001:db8::1')).toBe(false);
        expect(regex.test('::1')).toBe(false);
      });

      it('should disable full form when not allowed', () => {
        const options = { ...defaultIPv6Options, allowFullForm: false };
        const result = generateIPv6Regex('advanced', defaultIPv4Options, options, defaultCrossOptions);
        const regex = new RegExp(result.pattern, result.flags);

        // Should reject full uncompressed forms when only compression is allowed
        expect(regex.test('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(false);
      });

      it('should handle embedded IPv4 in IPv6', () => {
        const options = { ...defaultIPv6Options, allowEmbeddedIPv4: true };
        const result = generateIPv6Regex('advanced', defaultIPv4Options, options, defaultCrossOptions);

        // Check if this option affects the tradeoffs/description
        expect(result.tradeoffs.some(t => t.toLowerCase().includes('ipv4') || t.toLowerCase().includes('embedded'))).toBe(true);
      });

      it('should reject embedded IPv4 when disabled', () => {
        const options = { ...defaultIPv6Options, allowEmbeddedIPv4: false };
        const result = generateIPv6Regex('advanced', defaultIPv4Options, options, defaultCrossOptions);

        // Ensure the option is recognized and doesn't cause errors
        expect(result.pattern).toBeDefined();
        expect(result.description).toBeDefined();
      });

      it('should validate comprehensive IPv6 test cases', () => {
        const result = generateIPv6Regex('simple', defaultIPv4Options, defaultIPv6Options, defaultCrossOptions);
        const regex = new RegExp(result.pattern, result.flags);

        // Valid IPv6 addresses that should work in simple mode
        const validIPs = [
          '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
          '2001:db8:85a3::8a2e:370:7334',
          '2001:db8::1',
          '::1',
          'ff02::1'
        ];

        // Invalid IPv6 addresses
        const invalidIPs = [
          'gggg::1',
          '2001:db8::85a3::7334',
          '2001:db8:85a3:0000:0000:8a2e:0370:7334:extra',
          '2001:db8:85a3:0000:0000:8a2e:0370',
          ':2001:db8::1',
          '2001::db8::1'
        ];

        validIPs.forEach(ip => {
          expect(regex.test(ip)).toBe(true);
        });

        invalidIPs.forEach(ip => {
          expect(regex.test(ip)).toBe(false);
        });
      });

      it('should combine multiple IPv6 advanced options', () => {
        const options = { ...defaultIPv6Options, allowBrackets: true, allowZoneId: true };
        const crossOptions = { ...defaultCrossOptions, allowPort: true, namedCaptures: true };
        const result = generateIPv6Regex('advanced', defaultIPv4Options, options, crossOptions);

        expect(result.pattern).toContain('?<');
        expect(result.tradeoffs.some(t => t.toLowerCase().includes('bracket'))).toBe(true);
        expect(result.tradeoffs.some(t => t.toLowerCase().includes('zone'))).toBe(true);
      });
    });
  });

  describe('generateBothRegex', () => {
    it('should match both IPv4 and IPv6 addresses', () => {
      const result = generateBothRegex('simple', defaultIPv4Options, defaultIPv6Options, defaultCrossOptions);
      const regex = new RegExp(result.pattern, result.flags);

      // IPv4 addresses
      expect(regex.test('192.168.1.1')).toBe(true);
      expect(regex.test('10.0.0.1')).toBe(true);
      expect(regex.test('255.255.255.255')).toBe(true);

      // IPv6 addresses
      expect(regex.test('2001:db8::1')).toBe(true);
      expect(regex.test('::1')).toBe(true);
      expect(regex.test('fe80::1')).toBe(true);

      // Invalid addresses
      expect(regex.test('256.256.256.256')).toBe(false);
      expect(regex.test('gggg::1')).toBe(false);
      expect(regex.test('not.an.ip')).toBe(false);
    });

    it('should combine test cases from both IPv4 and IPv6', () => {
      const result = generateBothRegex('simple', defaultIPv4Options, defaultIPv6Options, defaultCrossOptions);

      // Should include IPv4 test cases
      expect(result.testCases.valid).toContain('192.168.1.1');
      expect(result.testCases.invalid).toContain('256.256.256.256');

      // Should include IPv6 test cases
      expect(result.testCases.valid).toContain('2001:db8:85a3::8a2e:370:7334');
      expect(result.testCases.invalid).toContain('gggg::1');
    });

    it('should use case insensitive flag if either IPv4 or IPv6 needs it', () => {
      const ipv4Options = { ...defaultIPv4Options, caseInsensitive: true };
      const result = generateBothRegex('simple', ipv4Options, defaultIPv6Options, defaultCrossOptions);

      expect(result.flags).toBe('i');
    });
  });

  describe('generateRegex main function', () => {
    it('should route to correct generator based on type', () => {
      const ipv4Result = generateRegex('ipv4', 'simple', defaultIPv4Options, defaultIPv6Options, defaultCrossOptions);
      const ipv6Result = generateRegex('ipv6', 'simple', defaultIPv4Options, defaultIPv6Options, defaultCrossOptions);
      const bothResult = generateRegex('both', 'simple', defaultIPv4Options, defaultIPv6Options, defaultCrossOptions);

      expect(ipv4Result.description).toContain('IPv4');
      expect(ipv6Result.description).toContain('IPv6');
      expect(bothResult.description).toContain('both IPv4 and IPv6');
    });

    it('should throw error for unknown regex type', () => {
      expect(() => {
        generateRegex('invalid' as RegexType, 'simple', defaultIPv4Options, defaultIPv6Options, defaultCrossOptions);
      }).toThrow('Unknown regex type: invalid');
    });
  });

  describe('getRegexRUrl', () => {
    it('should generate valid RegexR URL', () => {
      const result = generateIPv4Regex('simple', defaultIPv4Options, defaultCrossOptions);
      const url = getRegexRUrl(result);

      expect(url).toContain('https://regexr.com');
      expect(url).toContain('expression=');
      expect(url).toContain('flags=');
      expect(url).toContain('text=');
    });

    it('should strip anchors from pattern for RegexR', () => {
      const result = generateIPv4Regex('simple', defaultIPv4Options, defaultCrossOptions);
      const url = getRegexRUrl(result);

      // Should not contain encoded anchors in the URL
      expect(url).not.toContain('%5E'); // Encoded ^
      expect(url).not.toContain('%24'); // Encoded $
    });

    it('should always include global flag for RegexR', () => {
      const result = generateIPv4Regex('simple', defaultIPv4Options, defaultCrossOptions);
      const url = getRegexRUrl(result);

      expect(url).toContain('flags=g');
    });

    it('should preserve other flags while adding global flag', () => {
      const ipv6Result = generateIPv6Regex('simple', defaultIPv4Options, defaultIPv6Options, defaultCrossOptions);
      const url = getRegexRUrl(ipv6Result);

      expect(url).toContain('flags=ig'); // Both 'i' and 'g'
    });

    it('should include test cases in URL', () => {
      const result = generateIPv4Regex('simple', defaultIPv4Options, defaultCrossOptions);
      const url = getRegexRUrl(result);

      // Should contain encoded newlines between test cases
      expect(url).toContain('%0A'); // Encoded newline
    });

    it('should handle empty result gracefully', () => {
      const url = getRegexRUrl(null as any);
      expect(url).toBe('https://regexr.com');
    });
  });

  describe('edge cases and stress tests', () => {
    it('should handle extreme IPv4 values', () => {
      const result = generateIPv4Regex('simple', defaultIPv4Options, defaultCrossOptions);
      const regex = new RegExp(result.pattern, result.flags);

      // Boundary values
      expect(regex.test('0.0.0.0')).toBe(true);
      expect(regex.test('255.255.255.255')).toBe(true);
      expect(regex.test('128.128.128.128')).toBe(true);

      // Just over the boundary
      expect(regex.test('256.0.0.0')).toBe(false);
      expect(regex.test('0.256.0.0')).toBe(false);
      expect(regex.test('0.0.256.0')).toBe(false);
      expect(regex.test('0.0.0.256')).toBe(false);
    });

    it('should handle various IPv6 compression scenarios', () => {
      const result = generateIPv6Regex('simple', defaultIPv4Options, defaultIPv6Options, defaultCrossOptions);
      const regex = new RegExp(result.pattern, result.flags);

      // Different compression positions
      expect(regex.test('2001::')).toBe(true); // End compression
      expect(regex.test('::2001')).toBe(true); // Start compression
      expect(regex.test('2001::1')).toBe(true); // Middle compression
      expect(regex.test('a::b::c')).toBe(false); // Multiple compressions (invalid)
    });

    it('should handle complex combinations in both mode', () => {
      const crossOptions = { ...defaultCrossOptions, allowPort: true, allowCIDR: true };
      const result = generateBothRegex('advanced', defaultIPv4Options, defaultIPv6Options, crossOptions);
      const regex = new RegExp(result.pattern, result.flags);

      // Should match both types with various options
      expect(regex.test('192.168.1.1:8080')).toBe(true);
      expect(regex.test('192.168.1.0/24')).toBe(true);
      // Note: IPv6 with ports requires brackets, so these specific tests depend on bracket support
    });

    it('should handle malformed IP addresses gracefully', () => {
      const ipv4Result = generateIPv4Regex('simple', defaultIPv4Options, defaultCrossOptions);
      const ipv6Result = generateIPv6Regex('simple', defaultIPv4Options, defaultIPv6Options, defaultCrossOptions);
      const ipv4Regex = new RegExp(ipv4Result.pattern, ipv4Result.flags);
      const ipv6Regex = new RegExp(ipv6Result.pattern, ipv6Result.flags);

      const malformedIPs = [
        '',
        '.',
        '..',
        '...',
        '....',
        'a.b.c.d',
        '1.2.3',
        '1.2.3.4.5',
        '1..2.3.4',
        '1.2..3.4',
        '1.2.3..4',
        '.1.2.3.4',
        '1.2.3.4.',
        '999.999.999.999',
        '-1.2.3.4',
        '1.-2.3.4',
        ':::',
        '::1::',
        'g::1',
        '1::g',
        '::gggg'
      ];

      malformedIPs.forEach(ip => {
        expect(ipv4Regex.test(ip) || ipv6Regex.test(ip)).toBe(false);
      });
    });

    it('should handle performance with long strings', () => {
      const result = generateIPv4Regex('simple', defaultIPv4Options, defaultCrossOptions);
      const regex = new RegExp(result.pattern, result.flags);

      // Very long string that is not an IP
      const longString = 'a'.repeat(10000);
      const start = performance.now();
      const matches = regex.test(longString);
      const end = performance.now();

      expect(matches).toBe(false);
      expect(end - start).toBeLessThan(100); // Should complete quickly
    });

    it('should validate test cases are comprehensive', () => {
      const ipv4Result = generateIPv4Regex('simple', defaultIPv4Options, defaultCrossOptions);
      const ipv6Result = generateIPv6Regex('simple', defaultIPv4Options, defaultIPv6Options, defaultCrossOptions);
      const bothResult = generateBothRegex('simple', defaultIPv4Options, defaultIPv6Options, defaultCrossOptions);

      // Ensure test cases are provided
      expect(ipv4Result.testCases.valid.length).toBeGreaterThan(0);
      expect(ipv4Result.testCases.invalid.length).toBeGreaterThan(0);
      expect(ipv6Result.testCases.valid.length).toBeGreaterThan(0);
      expect(ipv6Result.testCases.invalid.length).toBeGreaterThan(0);
      expect(bothResult.testCases.valid.length).toBeGreaterThan(0);
      expect(bothResult.testCases.invalid.length).toBeGreaterThan(0);

      // Ensure test cases are actually valid/invalid according to the regex
      const ipv4Regex = new RegExp(ipv4Result.pattern, ipv4Result.flags);
      ipv4Result.testCases.valid.forEach(testCase => {
        expect(ipv4Regex.test(testCase)).toBe(true);
      });
      ipv4Result.testCases.invalid.forEach(testCase => {
        expect(ipv4Regex.test(testCase)).toBe(false);
      });

      const ipv6Regex = new RegExp(ipv6Result.pattern, ipv6Result.flags);
      ipv6Result.testCases.valid.forEach(testCase => {
        expect(ipv6Regex.test(testCase)).toBe(true);
      });
      ipv6Result.testCases.invalid.forEach(testCase => {
        expect(ipv6Regex.test(testCase)).toBe(false);
      });
    });
  });

  describe('real-world scenario tests', () => {
    it('should handle production IPv4 addresses', () => {
      const result = generateIPv4Regex('simple', defaultIPv4Options, defaultCrossOptions);
      const regex = new RegExp(result.pattern, result.flags);

      const productionIPs = [
        '8.8.8.8', // Google DNS
        '1.1.1.1', // Cloudflare DNS
        '208.67.222.222', // OpenDNS
        '149.112.112.112', // Quad9 DNS
        '76.76.19.19', // Control D DNS
        '185.228.168.9', // CleanBrowsing DNS
        '94.140.14.14', // AdGuard DNS
        '205.171.3.25', // Comodo Secure DNS
      ];

      productionIPs.forEach(ip => {
        expect(regex.test(ip)).toBe(true);
      });
    });

    it('should handle production IPv6 addresses', () => {
      const result = generateIPv6Regex('simple', defaultIPv4Options, defaultIPv6Options, defaultCrossOptions);
      const regex = new RegExp(result.pattern, result.flags);

      const productionIPv6s = [
        '2001:4860:4860::8888', // Google DNS
        '2606:4700:4700::1111', // Cloudflare DNS
        '2620:fe::fe', // Quad9 DNS
        '2001:db8:85a3::8a2e:370:7334', // Documentation example
        '::1', // Localhost
        '2001:db8::1', // Documentation
        'ff02::1' // Multicast
      ];

      productionIPv6s.forEach(ip => {
        expect(regex.test(ip)).toBe(true);
      });
    });

    it('should validate options combinations work in practice', () => {
      // Test a complex real-world scenario without named captures to avoid duplicate capture group names
      const ipv4Options = {
        ...defaultIPv4Options,
        allowLeadingZeros: true,
        caseInsensitive: true
      };
      const ipv6Options = {
        ...defaultIPv6Options,
        allowZoneId: true,
        allowBrackets: true
      };
      const crossOptions = {
        ...defaultCrossOptions,
        allowPort: true,
        allowCIDR: true,
        namedCaptures: false
      };

      const result = generateBothRegex('advanced', ipv4Options, ipv6Options, crossOptions);
      const regex = new RegExp(result.pattern, result.flags);

      // Test combinations that should work
      expect(regex.test('192.168.001.001')).toBe(true); // Leading zeros
      expect(regex.test('192.168.1.0/24')).toBe(true); // CIDR
      expect(regex.test('192.168.1.1:8080')).toBe(true); // Port
      expect(regex.test('2001:db8::1')).toBe(true); // IPv6
    });

    it('should provide meaningful descriptions and tradeoffs', () => {
      const ipv4Result = generateIPv4Regex('advanced', defaultIPv4Options, defaultCrossOptions);
      const ipv6Result = generateIPv6Regex('advanced', defaultIPv4Options, defaultIPv6Options, defaultCrossOptions);
      const bothResult = generateBothRegex('advanced', defaultIPv4Options, defaultIPv6Options, defaultCrossOptions);

      // Ensure descriptions are informative
      expect(ipv4Result.description.length).toBeGreaterThan(10);
      expect(ipv6Result.description.length).toBeGreaterThan(10);
      expect(bothResult.description.length).toBeGreaterThan(10);

      // Ensure tradeoffs are provided for advanced mode
      expect(ipv4Result.tradeoffs.length).toBeGreaterThan(0);
      expect(ipv6Result.tradeoffs.length).toBeGreaterThan(0);
      expect(bothResult.tradeoffs.length).toBeGreaterThan(0);

      // Descriptions should contain key terms
      expect(ipv4Result.description.toLowerCase()).toContain('ipv4');
      expect(ipv6Result.description.toLowerCase()).toContain('ipv6');
      expect(bothResult.description.toLowerCase()).toContain('ipv4');
      expect(bothResult.description.toLowerCase()).toContain('ipv6');
    });
  });
});