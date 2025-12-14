// Self-contained reverse DNS utilities

export interface PTRRecord {
  ip: string;
  ptrName: string;
  type: 'IPv4' | 'IPv6';
  zone: string;
}

export interface ReverseZoneInfo {
  zone: string;
  type: 'IPv4' | 'IPv6';
  delegation: string;
  nibbleDepth?: number;
}

export interface ZoneFileOptions {
  nameServers?: string[];
  contactEmail?: string;
  domainSuffix?: string;
  ttl?: number;
}

/* Validate IPv4 address */
function isValidIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });
}

/* Validate IPv6 address */
function isValidIPv6(ip: string): boolean {
  // Check for triple colons (invalid)
  if (ip.includes(':::')) return false;

  // Handle zone identifiers (e.g., fe80::1%eth0)
  let cleanIP = ip;
  if (ip.includes('%')) {
    const parts = ip.split('%');
    if (parts.length !== 2) return false;
    cleanIP = parts[0];
    // Zone identifier part should not be empty
    if (!parts[1]) return false;
  }

  // Basic IPv6 validation - handles compressed notation
  if (cleanIP.includes('::')) {
    const parts = cleanIP.split('::');
    if (parts.length > 2) return false;

    const leftParts = parts[0] ? parts[0].split(':').filter((p) => p) : [];
    const rightParts = parts[1] ? parts[1].split(':').filter((p) => p) : [];

    if (leftParts.length + rightParts.length >= 8) return false;

    return [...leftParts, ...rightParts].every((part) => part.length <= 4 && /^[0-9a-fA-F]*$/.test(part));
  } else {
    const parts = cleanIP.split(':');
    return parts.length === 8 && parts.every((part) => part.length <= 4 && /^[0-9a-fA-F]+$/.test(part));
  }
}

/* Expand IPv6 address to full form */
function expandIPv6(ip: string): string {
  if (!ip.includes('::')) {
    return ip
      .split(':')
      .map((part) => part.padStart(4, '0'))
      .join(':');
  }

  const parts = ip.split('::');
  const leftParts = parts[0] ? parts[0].split(':').filter((p) => p) : [];
  const rightParts = parts[1] ? parts[1].split(':').filter((p) => p) : [];

  const missingParts = 8 - leftParts.length - rightParts.length;
  const middleParts = Array(missingParts).fill('0000');

  const allParts = [...leftParts, ...middleParts, ...rightParts];
  return allParts.map((part) => part.padStart(4, '0')).join(':');
}

/* Generate PTR record name from IP address */
export function generatePTRName(ip: string): PTRRecord | null {
  // Try IPv4 first
  if (isValidIPv4(ip)) {
    const octets = ip.split('.').map(Number);
    const reversed = [...octets].reverse().join('.');
    const ptrName = `${reversed}.in-addr.arpa`;
    const zone = `${octets[2]}.${octets[1]}.${octets[0]}.in-addr.arpa`;

    return {
      ip,
      ptrName,
      type: 'IPv4',
      zone,
    };
  }

  // Try IPv6
  if (isValidIPv6(ip)) {
    const expanded = expandIPv6(ip);
    const hex = expanded.replace(/:/g, '');
    const reversed = hex.split('').reverse().join('.');
    const ptrName = `${reversed}.ip6.arpa`;

    // For zone, typically use /64 boundary (first 16 hex chars)
    const zoneHex = hex.substring(0, 16).split('').reverse().join('.');
    const zone = `${zoneHex}.ip6.arpa`;

    return {
      ip,
      ptrName,
      type: 'IPv6',
      zone,
    };
  }

  return null;
}

/* Parse IPv4 CIDR and generate IP addresses */
function parseIPv4CIDR(cidr: string): string[] {
  const [network, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr);

  if (!isValidIPv4(network) || prefix < 0 || prefix > 32) {
    throw new Error('Invalid IPv4 CIDR notation');
  }

  const networkParts = network.split('.').map((p) => parseInt(p));
  const hostBits = 32 - prefix;

  // Limit to reasonable sizes
  if (hostBits > 16) {
    throw new Error('CIDR block too large (more than 65536 addresses). Please use a smaller block.');
  }

  const totalHosts = Math.pow(2, hostBits);
  const ips: string[] = [];

  // Calculate network base
  let baseIP = (networkParts[0] << 24) + (networkParts[1] << 16) + (networkParts[2] << 8) + networkParts[3];
  const mask = 0xffffffff << hostBits;
  baseIP = baseIP & mask;

  for (let i = 0; i < totalHosts; i++) {
    const currentIP = baseIP + i;
    const ip = [(currentIP >>> 24) & 0xff, (currentIP >>> 16) & 0xff, (currentIP >>> 8) & 0xff, currentIP & 0xff].join(
      '.',
    );

    ips.push(ip);
  }

  return ips;
}

/* Parse IPv6 CIDR and generate representative addresses */
function parseIPv6CIDR(cidr: string): string[] {
  const [network, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr);

  if (!isValidIPv6(network) || prefix < 0 || prefix > 128) {
    throw new Error('Invalid IPv6 CIDR notation');
  }

  // Special case for /128 - single address
  if (prefix === 128) {
    return [network];
  }

  // For IPv6, we'll generate a representative set rather than all addresses
  if (prefix > 64) {
    throw new Error('IPv6 CIDR blocks smaller than /64 are not supported for enumeration');
  }

  // For demonstration, return just the network address and a few examples
  const expanded = expandIPv6(network);
  const networkIP = expanded.replace(/:/g, '');

  // Generate some representative addresses
  const ips: string[] = [];

  // Add the network address
  ips.push(network);

  // Add ::1, ::2, ::10, etc for demonstration
  const baseHex = networkIP.substring(0, Math.floor(prefix / 4));
  const examples = ['0001', '0002', '0010', '00ff', 'ffff'];

  examples.forEach((suffix) => {
    const fullHex = baseHex + suffix.padEnd(32 - baseHex.length, '0');
    const formatted = fullHex.match(/.{4}/g)?.join(':') || fullHex;
    ips.push(formatted);
  });

  return ips.slice(0, 10); // Limit to 10 examples
}

/* Generate PTR records for CIDR block */
export function generateCIDRPTRs(cidr: string, maxEntries = 1000): PTRRecord[] {
  const records: PTRRecord[] = [];

  try {
    const trimmed = cidr.trim();
    if (!trimmed.includes('/')) {
      throw new Error('CIDR notation requires a prefix length (e.g., 192.168.1.0/24)');
    }

    const [network] = trimmed.split('/');

    let ips: string[];
    if (isValidIPv4(network)) {
      ips = parseIPv4CIDR(trimmed);
    } else if (isValidIPv6(network)) {
      ips = parseIPv6CIDR(trimmed);
    } else {
      throw new Error('Invalid network address in CIDR notation');
    }

    // Limit the number of records generated
    const limitedIps = ips.slice(0, maxEntries);

    limitedIps.forEach((ip) => {
      const record = generatePTRName(ip);
      if (record) {
        records.push(record);
      }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Invalid CIDR notation');
  }

  return records;
}

/* Calculate minimal reverse zones needed for delegation */
export function calculateReverseZones(cidr: string): ReverseZoneInfo[] {
  const zones: ReverseZoneInfo[] = [];

  try {
    const trimmed = cidr.trim();
    if (!trimmed.includes('/')) {
      throw new Error('CIDR notation requires a prefix length');
    }

    const [network, prefixStr] = trimmed.split('/');
    const prefixLength = parseInt(prefixStr);

    if (isValidIPv6(network)) {
      // IPv6 - use nibble boundaries
      const expanded = expandIPv6(network);
      const hex = expanded.replace(/:/g, '');

      // IPv6 zones are delegated on nibble boundaries (every 4 bits)
      const nibbles = Math.ceil(prefixLength / 4);

      // Generate zone for nibble boundary that contains this prefix
      const zoneHex = hex.substring(0, nibbles).split('').reverse().join('.');
      zones.push({
        zone: `${zoneHex}.ip6.arpa`,
        type: 'IPv6',
        delegation: `/${nibbles * 4}`,
        nibbleDepth: nibbles,
      });
    } else if (isValidIPv4(network)) {
      // IPv4 - use octet boundaries
      const octets = network.split('.').map(Number);

      // Determine zone delegation based on prefix length
      if (prefixLength >= 24) {
        // /24 or smaller - individual class C zone
        zones.push({
          zone: `${octets[2]}.${octets[1]}.${octets[0]}.in-addr.arpa`,
          type: 'IPv4',
          delegation: '/24',
        });
      } else if (prefixLength >= 16) {
        // /16 to /23 - class B range, multiple class C zones needed
        const numSubnets = Math.pow(2, 24 - prefixLength);
        for (let i = 0; i < Math.min(numSubnets, 10); i++) {
          // Limit output
          const subnetOctet = octets[2] + i;
          if (subnetOctet <= 255) {
            zones.push({
              zone: `${subnetOctet}.${octets[1]}.${octets[0]}.in-addr.arpa`,
              type: 'IPv4',
              delegation: '/24',
            });
          }
        }
      } else if (prefixLength >= 8) {
        // /8 to /15 - class A range
        zones.push({
          zone: `${octets[1]}.${octets[0]}.in-addr.arpa`,
          type: 'IPv4',
          delegation: `/${prefixLength >= 16 ? 16 : prefixLength}`,
        });
      } else {
        // Larger than /8
        zones.push({
          zone: `${octets[0]}.in-addr.arpa`,
          type: 'IPv4',
          delegation: `/${prefixLength >= 8 ? 8 : prefixLength}`,
        });
      }
    } else {
      throw new Error('Invalid network address');
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Invalid CIDR notation');
  }

  return zones;
}

/* Generate hostname from IP for PTR record */
function generateHostname(ip: string, domainSuffix: string): string {
  const cleanIP = ip.replace(/[:.]/g, '-');
  return `host-${cleanIP}.${domainSuffix}`;
}

/* Generate full reverse zone file */
export function generateReverseZoneFile(
  zone: string,
  records: PTRRecord[],
  template?: string,
  options: ZoneFileOptions = {},
): string {
  const {
    nameServers = ['ns1.example.com.', 'ns2.example.com.'],
    contactEmail = 'hostmaster.example.com.',
    domainSuffix = 'example.com.',
    ttl = 86400,
  } = options;

  const timestamp = new Date().toISOString().split('T')[0];
  const serial = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 10) + '01';

  let content = `; Reverse zone file for ${zone}
; Generated on ${timestamp}
$TTL ${ttl}

@       IN      SOA     ${nameServers[0]} ${contactEmail} (
                ${serial}  ; Serial (YYYYMMDDNN)
                3600        ; Refresh (1 hour)
                1800        ; Retry (30 minutes)  
                1209600     ; Expire (2 weeks)
                ${ttl}      ; Minimum TTL
)

; Name servers
`;

  nameServers.forEach((ns) => {
    content += `@       IN      NS      ${ns}\n`;
  });

  content += '\n; PTR Records\n';

  // Sort records by IP for better organization
  const sortedRecords = [...records].sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);

    if (a.type === 'IPv4') {
      const aOctets = a.ip.split('.').map(Number);
      const bOctets = b.ip.split('.').map(Number);
      for (let i = 0; i < 4; i++) {
        if (aOctets[i] !== bOctets[i]) return aOctets[i] - bOctets[i];
      }
    }

    return a.ip.localeCompare(b.ip);
  });

  sortedRecords.forEach((record) => {
    if (record.zone === zone) {
      const recordName = record.ptrName.replace(`.${zone}`, '').replace(/\.$/, '');
      let hostname: string;

      if (template) {
        // Use template to generate hostname
        hostname = template
          .replace(/{ip}/g, record.ip)
          .replace(/{ip-dashes}/g, record.ip.replace(/[:.]/g, '-'))
          .replace(/{domain}/g, domainSuffix);
      } else {
        hostname = generateHostname(record.ip, domainSuffix);
      }

      content += `${recordName.padEnd(20)} IN      PTR     ${hostname}\n`;
    }
  });

  return content;
}

/* Plan PTR coverage for a block */
export interface PTRCoverageAnalysis {
  cidr: string;
  totalAddresses: number;
  expectedPTRs: PTRRecord[];
  missingPTRs: string[];
  extraPTRs: string[];
  patternMatches: number;
  coverage: number; // percentage
}

export function analyzePTRCoverage(cidr: string, existingPTRs: string[], namingPattern?: string): PTRCoverageAnalysis {
  const expectedPTRs = generateCIDRPTRs(cidr, 1000);
  const expectedPTRNames = new Set(expectedPTRs.map((r) => r.ptrName));
  const existingPTRSet = new Set(existingPTRs);

  const missingPTRs = expectedPTRs.filter((r) => !existingPTRSet.has(r.ptrName)).map((r) => r.ptrName);

  const extraPTRs = existingPTRs.filter((ptr) => !expectedPTRNames.has(ptr));

  let patternMatches = 0;
  if (namingPattern) {
    try {
      const regex = new RegExp(namingPattern, 'i');
      patternMatches = existingPTRs.filter((ptr) => regex.test(ptr)).length;
    } catch {
      // Invalid regex pattern
      patternMatches = 0;
    }
  }

  const coverage =
    expectedPTRs.length > 0 ? ((expectedPTRs.length - missingPTRs.length) / expectedPTRs.length) * 100 : 0;

  return {
    cidr,
    totalAddresses: expectedPTRs.length,
    expectedPTRs,
    missingPTRs,
    extraPTRs,
    patternMatches,
    coverage,
  };
}

/* Validate IP address */
export function isValidIP(ip: string): { valid: boolean; type?: 'IPv4' | 'IPv6' } {
  if (isValidIPv4(ip)) {
    return { valid: true, type: 'IPv4' };
  } else if (isValidIPv6(ip)) {
    return { valid: true, type: 'IPv6' };
  } else {
    return { valid: false };
  }
}

/* Validate CIDR notation */
export function isValidCIDR(cidr: string): { valid: boolean; type?: 'IPv4' | 'IPv6' } {
  try {
    if (!cidr.includes('/')) {
      return { valid: false };
    }

    const [network, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr);

    if (isNaN(prefix)) {
      return { valid: false };
    }

    if (isValidIPv4(network) && prefix >= 0 && prefix <= 32) {
      return { valid: true, type: 'IPv4' };
    } else if (isValidIPv6(network) && prefix >= 0 && prefix <= 128) {
      return { valid: true, type: 'IPv6' };
    } else {
      return { valid: false };
    }
  } catch {
    return { valid: false };
  }
}
