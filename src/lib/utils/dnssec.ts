export interface DNSKEYRecord {
  flags: number;
  protocol: number;
  algorithm: number;
  publicKey: string;
  keyTag?: number;
  keyType?: 'KSK' | 'ZSK';
}

export interface DSRecord {
  keyTag: number;
  algorithm: number;
  digestType: number;
  digest: string;
}

// DNSSEC algorithm numbers (RFC 8624)
export const DNSSEC_ALGORITHMS = {
  1: 'RSAMD5 (deprecated)',
  3: 'DSA/SHA1',
  5: 'RSASHA1',
  6: 'DSA-NSEC3-SHA1',
  7: 'RSASHA1-NSEC3-SHA1',
  8: 'RSASHA256',
  10: 'RSASHA512',
  13: 'ECDSA Curve P-256 with SHA-256',
  14: 'ECDSA Curve P-384 with SHA-384',
  15: 'Ed25519',
  16: 'Ed448',
} as const;

// DS digest types
export const DS_DIGEST_TYPES = {
  1: 'SHA-1',
  2: 'SHA-256',
  4: 'SHA-384',
} as const;

// NSEC3 hash algorithms
export const NSEC3_HASH_ALGORITHMS = {
  1: 'SHA-1',
} as const;

export function parseDNSKEYRecord(dnskeyRR: string): DNSKEYRecord | null {
  const cleanRR = dnskeyRR.trim();

  // Handle both full RR format and just the RDATA
  let rdata: string;
  if (cleanRR.includes(' IN DNSKEY ')) {
    const parts = cleanRR.split(' IN DNSKEY ');
    if (parts.length !== 2) return null;
    rdata = parts[1];
  } else {
    rdata = cleanRR;
  }

  const parts = rdata.trim().split(/\s+/);
  if (parts.length < 4) return null;

  const flags = parseInt(parts[0]);
  const protocol = parseInt(parts[1]);
  const algorithm = parseInt(parts[2]);
  const publicKey = parts.slice(3).join('').replace(/\s/g, '');

  if (isNaN(flags) || isNaN(protocol) || isNaN(algorithm)) return null;

  // Determine key type from flags
  const keyType = flags & 0x0001 ? 'KSK' : 'ZSK';

  return {
    flags,
    protocol,
    algorithm,
    publicKey,
    keyType,
  };
}

export function calculateKeyTag(dnskey: DNSKEYRecord): number {
  // RFC 4034 Appendix B key tag calculation
  const flags = dnskey.flags;
  const protocol = dnskey.protocol;
  const algorithm = dnskey.algorithm;

  // Convert public key from base64 to bytes
  let publicKeyBytes: number[];
  try {
    const binaryString = atob(dnskey.publicKey);
    publicKeyBytes = Array.from(binaryString, (char) => char.charCodeAt(0));
  } catch {
    return 0;
  }

  // Construct RDATA
  const rdata = [(flags >> 8) & 0xff, flags & 0xff, protocol, algorithm, ...publicKeyBytes];

  // Calculate key tag using RFC 4034 algorithm
  let ac = 0;
  for (let i = 0; i < rdata.length; i++) {
    ac += i & 1 ? rdata[i] : rdata[i] << 8;
  }
  ac += (ac >> 16) & 0xffff;
  return ac & 0xffff;
}

export async function generateDSRecord(
  dnskey: DNSKEYRecord,
  ownerName: string,
  digestType: number,
): Promise<DSRecord | null> {
  const keyTag = calculateKeyTag(dnskey);

  // Normalize owner name (convert to wire format)
  const normalizedName = ownerName.toLowerCase();
  const nameWire = domainNameToWire(normalizedName);

  // Convert DNSKEY RDATA to bytes
  let publicKeyBytes: number[];
  try {
    const binaryString = atob(dnskey.publicKey);
    publicKeyBytes = Array.from(binaryString, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }

  const rdataBytes = [
    (dnskey.flags >> 8) & 0xff,
    dnskey.flags & 0xff,
    dnskey.protocol,
    dnskey.algorithm,
    ...publicKeyBytes,
  ];

  // Combine name wire format + DNSKEY RDATA
  const dataToHash = [...nameWire, ...rdataBytes];

  let digest: string;
  try {
    if (digestType === 1) {
      // SHA-1
      digest = await sha1Hash(new Uint8Array(dataToHash));
    } else if (digestType === 2) {
      // SHA-256
      digest = await sha256Hash(new Uint8Array(dataToHash));
    } else if (digestType === 4) {
      // SHA-384
      digest = await sha384Hash(new Uint8Array(dataToHash));
    } else {
      return null;
    }
  } catch {
    return null;
  }

  return {
    keyTag,
    algorithm: dnskey.algorithm,
    digestType,
    digest: digest.toLowerCase(),
  };
}

export async function calculateNSEC3Hash(
  name: string,
  salt: string,
  iterations: number,
  algorithm: number = 1,
): Promise<string | null> {
  if (algorithm !== 1) return null; // Only SHA-1 supported

  // Convert name to wire format
  const nameWire = domainNameToWire(name.toLowerCase());

  // Convert salt from hex
  let saltBytes: number[];
  try {
    if (salt === '') {
      saltBytes = [];
    } else {
      saltBytes = [];
      for (let i = 0; i < salt.length; i += 2) {
        saltBytes.push(parseInt(salt.substr(i, 2), 16));
      }
    }
  } catch {
    return null;
  }

  // Initial hash: SHA1(name || salt)
  let hashInput = [...nameWire, ...saltBytes];
  let currentHash = await sha1HashBytes(new Uint8Array(hashInput));

  // Iterate
  for (let i = 0; i < iterations; i++) {
    hashInput = [...Array.from(currentHash), ...saltBytes];
    currentHash = await sha1HashBytes(new Uint8Array(hashInput));
  }

  // Convert to base32 (no padding)
  return base32Encode(currentHash).toLowerCase().replace(/=/g, '');
}

function domainNameToWire(name: string): number[] {
  if (name === '.') return [0]; // Root

  const labels = name.replace(/\.$/, '').split('.');
  const wire: number[] = [];

  for (const label of labels) {
    if (label.length === 0 || label.length > 63) return [];
    wire.push(label.length);
    for (let i = 0; i < label.length; i++) {
      wire.push(label.charCodeAt(i));
    }
  }
  wire.push(0); // Root label

  return wire;
}

async function sha1Hash(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-1', data as unknown as ArrayBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha1HashBytes(data: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest('SHA-1', data as unknown as ArrayBuffer);
  return new Uint8Array(hashBuffer);
}

async function sha256Hash(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as unknown as ArrayBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha384Hash(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-384', data as unknown as ArrayBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function base32Encode(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let buffer = 0;
  let bitsLeft = 0;

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitsLeft += 8;

    while (bitsLeft >= 5) {
      result += alphabet[(buffer >> (bitsLeft - 5)) & 31];
      bitsLeft -= 5;
    }
  }

  if (bitsLeft > 0) {
    result += alphabet[(buffer << (5 - bitsLeft)) & 31];
  }

  return result;
}

export function formatDSRecord(ds: DSRecord, ownerName: string = ''): string {
  const name = ownerName || '@';
  return `${name} IN DS ${ds.keyTag} ${ds.algorithm} ${ds.digestType} ${ds.digest}`;
}

export function formatCDSRecord(ds: DSRecord, ownerName: string = ''): string {
  const name = ownerName || '@';
  return `${name} IN CDS ${ds.keyTag} ${ds.algorithm} ${ds.digestType} ${ds.digest}`;
}

export function formatCDNSKEYRecord(dnskey: DNSKEYRecord, ownerName: string = ''): string {
  const name = ownerName || '@';
  return `${name} IN CDNSKEY ${dnskey.flags} ${dnskey.protocol} ${dnskey.algorithm} ${dnskey.publicKey}`;
}

export async function generateCDSRecords(dnskey: DNSKEYRecord, ownerName: string): Promise<DSRecord[]> {
  const results: DSRecord[] = [];

  // Generate CDS records for all supported digest types
  for (const digestType of [1, 2, 4]) {
    const ds = await generateDSRecord(dnskey, ownerName, digestType);
    if (ds) {
      results.push(ds);
    }
  }

  return results;
}

export function generateCDNSKEYRecord(dnskey: DNSKEYRecord): DNSKEYRecord {
  // CDNSKEY has the same format as DNSKEY, just different record type
  return {
    flags: dnskey.flags,
    protocol: dnskey.protocol,
    algorithm: dnskey.algorithm,
    publicKey: dnskey.publicKey,
    keyTag: dnskey.keyTag,
    keyType: dnskey.keyType,
  };
}

export function validateCDSCDNSKEYUsage(dnskey: DNSKEYRecord): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Check if this is a KSK (required for CDS/CDNSKEY)
  if (dnskey.keyType !== 'KSK') {
    warnings.push('CDS/CDNSKEY records should typically be generated from KSK (Key Signing Key) records');
  }

  // Check algorithm support
  if (!(dnskey.algorithm in DNSSEC_ALGORITHMS)) {
    return { valid: false, warnings: [`Unknown algorithm: ${dnskey.algorithm}`] };
  }

  // Warn about deprecated algorithms
  if (dnskey.algorithm === 1) {
    warnings.push('RSAMD5 algorithm is deprecated and should not be used');
  }

  return { valid: true, warnings };
}

export interface RRSIGWindow {
  inception: Date;
  expiration: Date;
  validity: number; // hours
  renewalTime: Date;
  leadTime: number; // hours
}

export interface RRSIGPlanningOptions {
  ttl: number; // seconds
  desiredOverlap: number; // hours (default: 24)
  renewalLeadTime: number; // hours (default: 24)
  clockSkew: number; // hours (default: 1)
  signatureValidityDays: number; // days (default: 30)
}

export function suggestRRSIGWindows(options: RRSIGPlanningOptions): RRSIGWindow[] {
  const now = new Date();
  const windows: RRSIGWindow[] = [];

  // Convert TTL to hours for easier calculation
  const _ttlHours = options.ttl / 3600;

  // Calculate signature validity in hours
  const validityHours = options.signatureValidityDays * 24;

  // Calculate inception time (account for clock skew)
  const inceptionTime = new Date(now.getTime() - options.clockSkew * 60 * 60 * 1000);

  // Calculate expiration time
  const expirationTime = new Date(inceptionTime.getTime() + validityHours * 60 * 60 * 1000);

  // Calculate renewal time (expiration - lead time - overlap)
  const renewalTime = new Date(
    expirationTime.getTime() - (options.renewalLeadTime + options.desiredOverlap) * 60 * 60 * 1000,
  );

  // Primary window
  windows.push({
    inception: inceptionTime,
    expiration: expirationTime,
    validity: validityHours,
    renewalTime,
    leadTime: options.renewalLeadTime,
  });

  // Next window (for overlap planning)
  const nextInception = new Date(renewalTime);
  const nextExpiration = new Date(nextInception.getTime() + validityHours * 60 * 60 * 1000);
  const nextRenewal = new Date(
    nextExpiration.getTime() - (options.renewalLeadTime + options.desiredOverlap) * 60 * 60 * 1000,
  );

  windows.push({
    inception: nextInception,
    expiration: nextExpiration,
    validity: validityHours,
    renewalTime: nextRenewal,
    leadTime: options.renewalLeadTime,
  });

  return windows;
}

export function formatRRSIGDates(window: RRSIGWindow): {
  inceptionFormatted: string;
  expirationFormatted: string;
  renewalFormatted: string;
  inceptionTimestamp: string;
  expirationTimestamp: string;
} {
  // RRSIG uses YYYYMMDDHHMMSS format
  const formatRRSIGDate = (date: Date): string => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  };

  const formatReadableDate = (date: Date): string => {
    return date.toISOString().replace('T', ' ').replace('Z', ' UTC');
  };

  return {
    inceptionFormatted: formatRRSIGDate(window.inception),
    expirationFormatted: formatRRSIGDate(window.expiration),
    renewalFormatted: formatReadableDate(window.renewalTime),
    inceptionTimestamp: formatReadableDate(window.inception),
    expirationTimestamp: formatReadableDate(window.expiration),
  };
}

export function validateRRSIGTiming(window: RRSIGWindow, ttl: number): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const now = new Date();

  // Check if inception is in the past (recommended)
  if (window.inception > now) {
    warnings.push('Inception time is in the future - signatures will not be valid until then');
  }

  // Check if expiration is too close
  const hoursUntilExpiration = (window.expiration.getTime() - now.getTime()) / (1000 * 60 * 60);
  const ttlHours = ttl / 3600;

  if (hoursUntilExpiration < ttlHours * 2) {
    warnings.push(`Expiration is very close - less than 2x TTL (${Math.round(hoursUntilExpiration)}h remaining)`);
  }

  // Check renewal timing
  if (window.renewalTime < now) {
    warnings.push('Renewal time has passed - new signatures should be generated immediately');
  }

  // Check validity period
  const validityHours = (window.expiration.getTime() - window.inception.getTime()) / (1000 * 60 * 60);
  if (validityHours < 24) {
    warnings.push('Signature validity period is less than 24 hours - very short for production use');
  } else if (validityHours > 30 * 24) {
    warnings.push('Signature validity period is more than 30 days - may be too long for key rotation');
  }

  return { valid: warnings.length === 0, warnings };
}

export function validateDNSKEY(dnskeyRR: string): { valid: boolean; error?: string } {
  const dnskey = parseDNSKEYRecord(dnskeyRR);

  if (!dnskey) {
    return { valid: false, error: 'Invalid DNSKEY record format' };
  }

  if (dnskey.protocol !== 3) {
    return { valid: false, error: 'Protocol must be 3 for DNSSEC' };
  }

  if (!(dnskey.algorithm in DNSSEC_ALGORITHMS)) {
    return { valid: false, error: `Unknown algorithm: ${dnskey.algorithm}` };
  }

  // Basic base64 validation
  try {
    atob(dnskey.publicKey);
  } catch {
    return { valid: false, error: 'Invalid base64 public key' };
  }

  return { valid: true };
}
