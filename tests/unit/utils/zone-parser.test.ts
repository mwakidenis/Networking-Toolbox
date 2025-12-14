import { describe, it, expect } from 'vitest';
import {
  parseZoneFile,
  normalizeZone,
  generateZoneStats,
  compareZones,
  checkNameLengths,
  formatZoneFile,
} from '../../../src/lib/utils/zone-parser';

describe('zone-parser', () => {
  describe('parseZoneFile', () => {
    describe('Basic parsing', () => {
      it('should parse a simple zone file', () => {
        const content = `
$TTL 3600
$ORIGIN example.com.
@       IN  SOA ns1.example.com. admin.example.com. (
                2023010101  ; Serial
                3600        ; Refresh
                1800        ; Retry
                1209600     ; Expire
                3600        ; Minimum TTL
)
        IN  NS  ns1.example.com.
        IN  NS  ns2.example.com.
www     IN  A   192.168.1.1
mail    IN  A   192.168.1.2
        `;

        const result = parseZoneFile(content);

        expect(result.errors).toHaveLength(0);
        expect(result.records).toHaveLength(5);
        expect(result.defaultTTL).toBe(3600);
        expect(result.origin).toBe('example.com.');
        expect(result.soa).toBeDefined();
        expect(result.soa?.type).toBe('SOA');
      });

      it('should parse records with different TTL values', () => {
        const content = `
$TTL 3600
example.com.    7200    IN  A   192.168.1.1
www             IN      A   192.168.1.2
mail    300     IN      A   192.168.1.3
        `;

        const result = parseZoneFile(content);

        expect(result.errors).toHaveLength(0);
        expect(result.records).toHaveLength(3);
        expect(result.records[0].ttl).toBe(7200);
        expect(result.records[1].ttl).toBe(3600); // Default TTL
        expect(result.records[2].ttl).toBe(300);
      });

      it('should handle comments and empty lines', () => {
        const content = `
; This is a comment
$TTL 3600

; Another comment
example.com.    IN  A   192.168.1.1  ; Inline comment

; Empty line above
www             IN  A   192.168.1.2
        `;

        const result = parseZoneFile(content);

        expect(result.errors).toHaveLength(0);
        expect(result.records).toHaveLength(2);
        expect(result.records[0].owner).toBe('example.com.');
        expect(result.records[1].owner).toBe('www.example.com.');
      });
    });

    describe('Record types', () => {
      it('should parse A records', () => {
        const content = `
$TTL 3600
example.com.    IN  A   192.168.1.1
www             IN  A   10.0.0.1
        `;

        const result = parseZoneFile(content);

        expect(result.errors).toHaveLength(0);
        expect(result.records).toHaveLength(2);
        expect(result.records[0].type).toBe('A');
        expect(result.records[0].rdata).toBe('192.168.1.1');
        expect(result.records[1].type).toBe('A');
        expect(result.records[1].rdata).toBe('10.0.0.1');
      });

      it('should parse AAAA records', () => {
        const content = `
$TTL 3600
example.com.    IN  AAAA    2001:db8::1
www             IN  AAAA    2001:db8::2
        `;

        const result = parseZoneFile(content);

        expect(result.errors).toHaveLength(0);
        expect(result.records).toHaveLength(2);
        expect(result.records[0].type).toBe('AAAA');
        expect(result.records[0].rdata).toBe('2001:db8::1');
      });

      it('should parse MX records', () => {
        const content = `
$TTL 3600
example.com.    IN  MX  10  mail.example.com.
                IN  MX  20  mail2.example.com.
        `;

        const result = parseZoneFile(content);

        expect(result.errors).toHaveLength(0);
        expect(result.records).toHaveLength(2);
        expect(result.records[0].type).toBe('MX');
        expect(result.records[0].rdata).toBe('10 mail.example.com.');
        expect(result.records[1].rdata).toBe('20 mail2.example.com.');
      });

      it('should parse SRV records', () => {
        const content = `
$TTL 3600
_sip._tcp.example.com.  IN  SRV 10 60 5060 sip.example.com.
        `;

        const result = parseZoneFile(content);

        expect(result.errors).toHaveLength(0);
        expect(result.records).toHaveLength(1);
        expect(result.records[0].type).toBe('SRV');
        expect(result.records[0].rdata).toBe('10 60 5060 sip.example.com.');
      });

      it('should parse TXT records', () => {
        const content = `
$TTL 3600
example.com.    IN  TXT "v=spf1 include:_spf.google.com ~all"
_dmarc          IN  TXT "v=DMARC1; p=quarantine; rua=mailto:admin@example.com"
        `;

        const result = parseZoneFile(content);

        expect(result.errors).toHaveLength(0);
        expect(result.records).toHaveLength(2);
        expect(result.records[0].type).toBe('TXT');
        expect(result.records[0].rdata).toContain('v=spf1');
      });

      it('should parse CNAME records', () => {
        const content = `
$TTL 3600
www.example.com.    IN  CNAME   example.com.
ftp                 IN  CNAME   example.com.
        `;

        const result = parseZoneFile(content);

        expect(result.errors).toHaveLength(0);
        expect(result.records).toHaveLength(2);
        expect(result.records[0].type).toBe('CNAME');
        expect(result.records[0].rdata).toBe('example.com.');
      });

      it('should parse CAA records', () => {
        const content = `
$TTL 3600
example.com.    IN  CAA 0 issue "letsencrypt.org"
                IN  CAA 0 iodef "mailto:admin@example.com"
        `;

        const result = parseZoneFile(content);

        expect(result.errors).toHaveLength(0);
        expect(result.records).toHaveLength(2);
        expect(result.records[0].type).toBe('CAA');
        expect(result.records[0].rdata).toBe('0 issue "letsencrypt.org"');
      });
    });

    describe('Directives', () => {
      it('should handle $ORIGIN directive', () => {
        const content = `
$ORIGIN example.com.
@       IN  A   192.168.1.1
www     IN  A   192.168.1.2
$ORIGIN sub.example.com.
test    IN  A   192.168.1.3
        `;

        const result = parseZoneFile(content);

        expect(result.errors).toHaveLength(0);
        expect(result.origin).toBe('sub.example.com.');
        expect(result.records[0].owner).toBe('example.com.');
        expect(result.records[1].owner).toBe('www.example.com.');
        expect(result.records[2].owner).toBe('test.sub.example.com.');
      });

      it('should handle $TTL directive', () => {
        const content = `
$TTL 7200
example.com.    IN  A   192.168.1.1
$TTL 3600
www             IN  A   192.168.1.2
        `;

        const result = parseZoneFile(content);

        expect(result.errors).toHaveLength(0);
        expect(result.defaultTTL).toBe(3600); // Last $TTL value
        expect(result.records[0].ttl).toBe(7200);
        expect(result.records[1].ttl).toBe(3600);
      });
    });

    describe('Error handling', () => {
      it('should detect invalid IPv4 addresses', () => {
        const content = `
$TTL 3600
example.com.    IN  A   256.1.1.1
        `;

        const result = parseZoneFile(content);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toContain('Invalid IPv4 address');
        expect(result.errors[0].severity).toBe('error');
      });

      it('should detect invalid IPv6 addresses', () => {
        const content = `
$TTL 3600
example.com.    IN  AAAA    2001:db8:::1
        `;

        const result = parseZoneFile(content);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toContain('Invalid IPv6 address');
      });

      it('should detect invalid MX records', () => {
        const content = `
$TTL 3600
example.com.    IN  MX  invalid
        `;

        const result = parseZoneFile(content);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toContain('MX record must have format');
      });

      it('should detect invalid SRV records', () => {
        const content = `
$TTL 3600
_sip._tcp.example.com.  IN  SRV 10 60 invalid target.com.
        `;

        const result = parseZoneFile(content);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toContain('Invalid SRV port');
      });

      it('should detect unknown record types', () => {
        const content = `
$TTL 3600
example.com.    IN  UNKNOWN 192.168.1.1
        `;

        const result = parseZoneFile(content);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toContain('Unknown or unsupported record type');
      });

      it('should detect invalid domain names', () => {
        const content = `
$TTL 3600
invalid..example.com.   IN  A   192.168.1.1
        `;

        const result = parseZoneFile(content);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toContain('Invalid owner name');
      });

      it('should detect invalid TTL values', () => {
        const content = `
$TTL 3600
example.com.    -1  IN  A   192.168.1.1
        `;

        const result = parseZoneFile(content);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toContain('Invalid TTL value');
      });

      it('should detect insufficient fields', () => {
        const content = `
$TTL 3600
example.com.    IN
        `;

        const result = parseZoneFile(content);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toContain('insufficient fields');
      });

      it('should detect unknown directives', () => {
        const content = `
$UNKNOWN directive
$TTL 3600
example.com.    IN  A   192.168.1.1
        `;

        const result = parseZoneFile(content);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toContain('Unknown directive');
      });
    });

    describe('Warnings', () => {
      it('should warn about missing SOA record', () => {
        const content = `
$TTL 3600
example.com.    IN  A   192.168.1.1
        `;

        const result = parseZoneFile(content);

        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].message).toContain('No SOA record found');
        expect(result.warnings[0].severity).toBe('warning');
      });
    });
  });

  describe('normalizeZone', () => {
    it('should sort and deduplicate records', () => {
      const zone = {
        records: [
          { owner: 'www.example.com.', type: 'A', rdata: '192.168.1.1', ttl: 3600, class: 'IN' },
          { owner: 'example.com.', type: 'A', rdata: '192.168.1.2', ttl: 3600, class: 'IN' },
          { owner: 'www.example.com.', type: 'A', rdata: '192.168.1.1', ttl: 3600, class: 'IN' }, // Duplicate
          { owner: 'example.com.', type: 'NS', rdata: 'ns1.example.com.', ttl: 3600, class: 'IN' },
        ],
        errors: [],
        warnings: [],
      };

      const normalized = normalizeZone(zone);

      expect(normalized.records).toHaveLength(3); // Duplicate removed
      expect(normalized.records[0].owner).toBe('example.com.'); // Sorted by owner
      expect(normalized.records[0].type).toBe('A'); // A before NS
      expect(normalized.records[1].type).toBe('NS'); // NS after A
    });
  });

  describe('generateZoneStats', () => {
    it('should generate comprehensive statistics', () => {
      const zone = {
        records: [
          { owner: 'example.com.', type: 'SOA', rdata: 'ns1.example.com. admin.example.com. 2023010101 3600 1800 1209600 3600', ttl: 3600, class: 'IN', raw: 'example.com. IN SOA ns1.example.com. admin.example.com. 2023010101 3600 1800 1209600 3600' },
          { owner: 'example.com.', type: 'NS', rdata: 'ns1.example.com.', ttl: 3600, class: 'IN', raw: 'example.com. IN NS ns1.example.com.' },
          { owner: 'www.example.com.', type: 'A', rdata: '192.168.1.1', ttl: 7200, class: 'IN', raw: 'www.example.com. 7200 IN A 192.168.1.1' },
          { owner: 'mail.example.com.', type: 'A', rdata: '192.168.1.2', ttl: 3600, class: 'IN', raw: 'mail.example.com. IN A 192.168.1.2' },
        ],
        errors: [],
        warnings: [],
      };

      const stats = generateZoneStats(zone);

      expect(stats.totalRecords).toBe(4);
      expect(stats.recordsByType['A']).toBe(2);
      expect(stats.recordsByType['NS']).toBe(1);
      expect(stats.recordsByType['SOA']).toBe(1);
      expect(stats.ttlDistribution[3600]).toBe(3);
      expect(stats.ttlDistribution[7200]).toBe(1);
      expect(stats.nameDepths.min).toBeGreaterThan(0);
      expect(stats.nameDepths.max).toBeGreaterThan(stats.nameDepths.min);
      expect(stats.sanityChecks.hasSoa).toBe(true);
      expect(stats.sanityChecks.hasNs).toBe(true);
      expect(stats.longestName.name).toBeDefined();
      expect(stats.largestRecord.record).toBeDefined();
    });

    it('should detect duplicates', () => {
      const zone = {
        records: [
          { owner: 'example.com.', type: 'A', rdata: '192.168.1.1', ttl: 3600, class: 'IN' },
          { owner: 'example.com.', type: 'A', rdata: '192.168.1.1', ttl: 3600, class: 'IN' }, // Duplicate
        ],
        errors: [],
        warnings: [],
      };

      const stats = generateZoneStats(zone);

      expect(stats.sanityChecks.duplicates).toHaveLength(1);
    });

    it('should detect missing SOA and NS records', () => {
      const zone = {
        records: [
          { owner: 'example.com.', type: 'A', rdata: '192.168.1.1', ttl: 3600, class: 'IN' },
        ],
        errors: [],
        warnings: [],
      };

      const stats = generateZoneStats(zone);

      expect(stats.sanityChecks.hasSoa).toBe(false);
      expect(stats.sanityChecks.hasNs).toBe(false);
    });
  });

  describe('compareZones', () => {
    it('should detect added, removed, and changed records', () => {
      const oldZone = {
        records: [
          { owner: 'example.com.', type: 'A', rdata: '192.168.1.1', ttl: 3600, class: 'IN' },
          { owner: 'www.example.com.', type: 'A', rdata: '192.168.1.2', ttl: 3600, class: 'IN' },
          { owner: 'old.example.com.', type: 'A', rdata: '192.168.1.3', ttl: 3600, class: 'IN' },
        ],
        errors: [],
        warnings: [],
      };

      const newZone = {
        records: [
          { owner: 'example.com.', type: 'A', rdata: '10.0.0.1', ttl: 3600, class: 'IN' }, // Changed IP
          { owner: 'www.example.com.', type: 'A', rdata: '192.168.1.2', ttl: 7200, class: 'IN' }, // Changed TTL
          { owner: 'new.example.com.', type: 'A', rdata: '192.168.1.4', ttl: 3600, class: 'IN' }, // Added
        ],
        errors: [],
        warnings: [],
      };

      const diff = compareZones(oldZone, newZone);

      expect(diff.added).toHaveLength(1);
      expect(diff.added[0].owner).toBe('new.example.com.');

      expect(diff.removed).toHaveLength(1);
      expect(diff.removed[0].owner).toBe('old.example.com.');

      expect(diff.changed).toHaveLength(2);
      expect(diff.changed[0].before.rdata).toBe('192.168.1.1');
      expect(diff.changed[0].after.rdata).toBe('10.0.0.1');
      expect(diff.changed[1].before.ttl).toBe(3600);
      expect(diff.changed[1].after.ttl).toBe(7200);

      expect(diff.unchanged).toHaveLength(0);
    });

    it('should detect unchanged records', () => {
      const zone = {
        records: [
          { owner: 'example.com.', type: 'A', rdata: '192.168.1.1', ttl: 3600, class: 'IN' },
        ],
        errors: [],
        warnings: [],
      };

      const diff = compareZones(zone, zone);

      expect(diff.added).toHaveLength(0);
      expect(diff.removed).toHaveLength(0);
      expect(diff.changed).toHaveLength(0);
      expect(diff.unchanged).toHaveLength(1);
    });
  });

  describe('checkNameLengths', () => {
    it('should detect FQDN length violations', () => {
      // Create a long FQDN that doesn't violate individual label limits (each part <= 63 chars)
      const longName = 'a'.repeat(60) + '.' + 'b'.repeat(60) + '.' + 'c'.repeat(60) + '.' + 'd'.repeat(60) + '.' + 'e'.repeat(15) + '.example.com.';
      const zone = {
        records: [
          { owner: longName, type: 'A', rdata: '192.168.1.1', ttl: 3600, class: 'IN' },
        ],
        errors: [],
        warnings: [],
      };

      const violations = checkNameLengths(zone);

      expect(violations).toHaveLength(1);
      expect(violations[0].type).toBe('fqdn');
      expect(violations[0].length).toBeGreaterThan(255);
      expect(violations[0].limit).toBe(255);
    });

    it('should detect label length violations', () => {
      const longLabel = 'a'.repeat(70);
      const zone = {
        records: [
          { owner: `${longLabel}.example.com.`, type: 'A', rdata: '192.168.1.1', ttl: 3600, class: 'IN' },
        ],
        errors: [],
        warnings: [],
      };

      const violations = checkNameLengths(zone);

      expect(violations).toHaveLength(1);
      expect(violations[0].type).toBe('label');
      expect(violations[0].length).toBe(70);
      expect(violations[0].limit).toBe(63);
      expect(violations[0].labels).toBeDefined();
    });

    it('should not report violations for valid names', () => {
      const zone = {
        records: [
          { owner: 'example.com.', type: 'A', rdata: '192.168.1.1', ttl: 3600, class: 'IN' },
          { owner: 'www.example.com.', type: 'A', rdata: '192.168.1.2', ttl: 3600, class: 'IN' },
        ],
        errors: [],
        warnings: [],
      };

      const violations = checkNameLengths(zone);

      expect(violations).toHaveLength(0);
    });
  });

  describe('formatZoneFile', () => {
    it('should format a zone file correctly', () => {
      const zone = {
        records: [
          { owner: 'example.com.', type: 'SOA', rdata: 'ns1.example.com. admin.example.com. 2023010101 3600 1800 1209600 3600', ttl: 3600, class: 'IN' },
          { owner: 'example.com.', type: 'NS', rdata: 'ns1.example.com.', ttl: 3600, class: 'IN' },
          { owner: 'www.example.com.', type: 'A', rdata: '192.168.1.1', ttl: 7200, class: 'IN' },
        ],
        errors: [],
        warnings: [],
        origin: 'example.com.',
        defaultTTL: 3600,
      };

      const formatted = formatZoneFile(zone);

      expect(formatted).toContain('$ORIGIN example.com.');
      expect(formatted).toContain('$TTL 3600');
      expect(formatted).toContain('example.com.\t\tIN\tSOA');
      expect(formatted).toContain('\t\tIN\tNS'); // Blank owner (continuation)
      expect(formatted).toContain('www.example.com.\t7200\tIN\tA'); // Different TTL
    });

    it('should handle zone without origin and default TTL', () => {
      const zone = {
        records: [
          { owner: 'example.com.', type: 'A', rdata: '192.168.1.1', ttl: 3600, class: 'IN' },
        ],
        errors: [],
        warnings: [],
      };

      const formatted = formatZoneFile(zone);

      expect(formatted).not.toContain('$ORIGIN');
      expect(formatted).not.toContain('$TTL');
      expect(formatted).toContain('example.com.\t\tIN\tA\t192.168.1.1');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complex zone file with all features', () => {
      const content = `
; Zone file for example.com
$TTL 3600
$ORIGIN example.com.

; SOA Record
@       IN  SOA ns1.example.com. admin.example.com. (
                2023010101  ; Serial
                3600        ; Refresh
                1800        ; Retry
                1209600     ; Expire
                3600        ; Minimum TTL
)

; Name Servers
        IN  NS  ns1.example.com.
        IN  NS  ns2.example.com.

; Mail Servers
        IN  MX  10  mail.example.com.
        IN  MX  20  mail2.example.com.

; A Records
@       IN  A   192.168.1.1
www     IN  A   192.168.1.2
mail    IN  A   192.168.1.3
mail2   IN  A   192.168.1.4

; AAAA Records
@       IN  AAAA    2001:db8::1
www     IN  AAAA    2001:db8::2

; CNAME Records
ftp     IN  CNAME   @
blog    IN  CNAME   www

; TXT Records
@       IN  TXT "v=spf1 include:_spf.google.com ~all"
_dmarc  IN  TXT "v=DMARC1; p=quarantine;"

; CAA Records
@       IN  CAA 0 issue "letsencrypt.org"
        `;

      const result = parseZoneFile(content);

      expect(result.errors).toHaveLength(0);
      expect(result.records.length).toBeGreaterThan(10);
      expect(result.soa).toBeDefined();
      expect(result.origin).toBe('example.com.');

      const stats = generateZoneStats(result);
      expect(stats.sanityChecks.hasSoa).toBe(true);
      expect(stats.sanityChecks.hasNs).toBe(true);
      expect(stats.recordsByType['A']).toBeGreaterThan(0);
      expect(stats.recordsByType['AAAA']).toBeGreaterThan(0);
      expect(stats.recordsByType['MX']).toBeGreaterThan(0);

      const normalized = normalizeZone(result);
      expect(normalized.records.length).toBeLessThanOrEqual(result.records.length);

      const violations = checkNameLengths(result);
      expect(violations).toHaveLength(0);

      const formatted = formatZoneFile(result);
      expect(formatted).toContain('$ORIGIN');
      expect(formatted).toContain('$TTL');
    });
  });
});