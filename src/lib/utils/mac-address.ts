// MAC Address formatting and OUI lookup utilities

export interface MACFormat {
  colon: string; // 00:1A:2B:3C:4D:5E
  hyphen: string; // 00-1A-2B-3C-4D-5E
  cisco: string; // 001A.2B3C.4D5E
  bare: string; // 001A2B3C4D5E
  bareUppercase: string; // 001A2B3C4D5E
  bareLowercase: string; // 001a2b3c4d5e
  eui64: string; // 00:1A:2B:FF:FE:3C:4D:5E
  ipv6Style: string; // 001A:2B3C:4D5E
  spaceSeparated: string; // 00 1A 2B 3C 4D 5E
  decimalOctets: string; // 0.26.43.60.77.94
  reverse: string; // 5E:4D:3C:2B:1A:00
  prefixedMac: string; // MAC=00:1A:2B:3C:4D:5E
  prefixedHwaddr: string; // HWaddr 00:1A:2B:3C:4D:5E
  slashSeparated: string; // 00/1A/2B/3C/4D/5E
  prefixedBare: string; // MAC001A2B3C4D5E
  prefixedAddr: string; // addr001A2B3C4D5E
}

export interface OUIInfo {
  oui: string;
  manufacturer: string | null;
  found: boolean;
  country?: string;
  address?: string;
  blockType?: string; // MA-L, MA-M, MA-S, CID
  blockStart?: string;
  blockEnd?: string;
  blockSize?: number;
  isPrivate?: boolean;
  isRand?: boolean;
  updated?: string;
}

export interface MACConversionResult {
  input: string;
  isValid: boolean;
  normalized: string; // Uppercase, no separators
  formats: MACFormat;
  oui: OUIInfo;
  details: {
    isUniversal: boolean; // U/L bit
    isUnicast: boolean; // I/G bit
    binary: string;
  };
  error?: string;
}

/**
 * Parse MAC address from various formats
 */
function parseMACAddress(input: string): string | null {
  // Remove all separators and whitespace
  const cleaned = input.replace(/[:\-.\s]/g, '').toUpperCase();

  // Must be exactly 12 hex characters
  if (!/^[0-9A-F]{12}$/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Format MAC address in different styles
 */
function formatMAC(normalized: string): MACFormat {
  const upper = normalized.toUpperCase();
  const lower = normalized.toLowerCase();
  const octets = upper.match(/.{1,2}/g)!;

  // EUI-64: Insert FFFE in the middle and flip U/L bit (bit 1 of first octet)
  const firstOctet = parseInt(octets[0], 16);
  const flippedFirstOctet = (firstOctet ^ 0x02).toString(16).padStart(2, '0').toUpperCase();
  const eui64 = `${flippedFirstOctet}:${octets[1]}:${octets[2]}:FF:FE:${octets[3]}:${octets[4]}:${octets[5]}`;

  return {
    colon: octets.join(':'),
    hyphen: octets.join('-'),
    cisco: `${upper.slice(0, 4)}.${upper.slice(4, 8)}.${upper.slice(8, 12)}`,
    bare: upper,
    bareUppercase: upper,
    bareLowercase: lower,
    eui64,
    ipv6Style: `${upper.slice(0, 4)}:${upper.slice(4, 8)}:${upper.slice(8, 12)}`,
    spaceSeparated: octets.join(' '),
    decimalOctets: octets.map((o) => parseInt(o, 16)).join('.'),
    reverse: [...octets].reverse().join(':'),
    prefixedMac: `MAC=${octets.join(':')}`,
    prefixedHwaddr: `HWaddr ${octets.join(':')}`,
    slashSeparated: octets.join('/'),
    prefixedBare: `MAC${upper}`,
    prefixedAddr: `addr${upper}`,
  };
}

/**
 * Extract OUI (first 3 octets) and look up manufacturer
 */
async function lookupOUI(normalized: string): Promise<OUIInfo> {
  const oui = normalized.slice(0, 6).toUpperCase();
  const ouiFormatted = oui.match(/.{1,2}/g)!.join(':');

  try {
    const response = await fetch(`/api/internal/mac-lookup?oui=${encodeURIComponent(ouiFormatted)}`);

    if (!response.ok) {
      return {
        oui: ouiFormatted,
        manufacturer: null,
        found: false,
      };
    }

    const data = await response.json();

    if (!data.found) {
      return {
        oui: ouiFormatted,
        manufacturer: null,
        found: false,
      };
    }

    return {
      oui: ouiFormatted,
      manufacturer: data.manufacturer,
      found: true,
      country: data.country,
      address: data.address,
      blockType: data.blockType,
      blockStart: data.blockStart,
      blockEnd: data.blockEnd,
      blockSize: data.blockSize,
      isPrivate: data.isPrivate,
      isRand: data.isRand,
      updated: data.updated,
    };
  } catch {
    return {
      oui: ouiFormatted,
      manufacturer: null,
      found: false,
    };
  }
}

/**
 * Get MAC address details (U/L bit, I/G bit)
 */
function getMACDetails(normalized: string): {
  isUniversal: boolean;
  isUnicast: boolean;
  binary: string;
} {
  const bytes = normalized.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16));
  const binary = bytes.map((b) => b.toString(2).padStart(8, '0')).join('');

  // U/L bit: bit 1 of first octet (0 = universal, 1 = local)
  const ulBit = (bytes[0] & 0x02) !== 0;
  const isUniversal = !ulBit;

  // I/G bit: bit 0 of first octet (0 = unicast, 1 = multicast)
  const igBit = (bytes[0] & 0x01) !== 0;
  const isUnicast = !igBit;

  return {
    isUniversal,
    isUnicast,
    binary,
  };
}

/**
 * Convert a MAC address to all formats with OUI lookup
 */
export async function convertMACAddress(input: string): Promise<MACConversionResult> {
  const normalized = parseMACAddress(input);

  if (!normalized) {
    return {
      input,
      isValid: false,
      normalized: '',
      formats: {
        colon: '',
        hyphen: '',
        cisco: '',
        bare: '',
        bareUppercase: '',
        bareLowercase: '',
        eui64: '',
        ipv6Style: '',
        spaceSeparated: '',
        decimalOctets: '',
        reverse: '',
        prefixedMac: '',
        prefixedHwaddr: '',
        slashSeparated: '',
        prefixedBare: '',
        prefixedAddr: '',
      },
      oui: { oui: '', manufacturer: null, found: false },
      details: {
        isUniversal: false,
        isUnicast: false,
        binary: '',
      },
      error: 'Invalid MAC address format. Expected 12 hexadecimal characters (e.g., 00:1A:2B:3C:4D:5E)',
    };
  }

  const oui = await lookupOUI(normalized);

  return {
    input,
    isValid: true,
    normalized,
    formats: formatMAC(normalized),
    oui,
    details: getMACDetails(normalized),
  };
}

/**
 * Convert multiple MAC addresses
 */
export async function convertMACAddresses(inputs: string[]): Promise<{
  conversions: MACConversionResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    withOUI: number;
  };
}> {
  const conversions = await Promise.all(inputs.map(convertMACAddress));

  return {
    conversions,
    summary: {
      total: conversions.length,
      valid: conversions.filter((c) => c.isValid).length,
      invalid: conversions.filter((c) => !c.isValid).length,
      withOUI: conversions.filter((c) => c.isValid && c.oui.found).length,
    },
  };
}
