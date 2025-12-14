// IP Range to CIDR conversion utilities
import { validateIPv4Detailed, validateIPv6Detailed } from './ip-validation.js';

export interface CIDRBlock {
  cidr: string;
  network: string;
  prefix: number;
  firstIP: string;
  lastIP: string;
  totalIPs: string;
}

export interface RangeConversionResult {
  startIP: string;
  endIP: string;
  isValid: boolean;
  ipVersion: 4 | 6 | null;
  cidrs: CIDRBlock[];
  totalBlocks: number;
  totalAddresses: string;
  error?: string;
}

/**
 * Convert IPv4 address to BigInt
 */
function ipv4ToBigInt(ip: string): bigint {
  const octets = ip.split('.').map(Number);
  return (BigInt(octets[0]) << 24n) | (BigInt(octets[1]) << 16n) | (BigInt(octets[2]) << 8n) | BigInt(octets[3]);
}

/**
 * Convert BigInt to IPv4 address string
 */
function bigIntToIPv4(num: bigint): string {
  return [
    Number((num >> 24n) & 0xffn),
    Number((num >> 16n) & 0xffn),
    Number((num >> 8n) & 0xffn),
    Number(num & 0xffn),
  ].join('.');
}

/**
 * Convert IPv6 address to BigInt
 */
function ipv6ToBigInt(ip: string): bigint {
  // First expand to full form
  const result = validateIPv6Detailed(ip);
  if (!result.isValid || !result.details.normalizedForm) {
    throw new Error('Invalid IPv6 address');
  }

  const fullForm = result.details.normalizedForm;
  const groups = fullForm.split(':');

  let num = 0n;
  for (const group of groups) {
    num = (num << 16n) | BigInt(parseInt(group, 16));
  }

  return num;
}

/**
 * Convert BigInt to IPv6 address string
 */
function bigIntToIPv6(num: bigint): string {
  const groups: string[] = [];
  for (let i = 0; i < 8; i++) {
    const shift = BigInt(112 - i * 16);
    const group = Number((num >> shift) & 0xffffn);
    groups.push(group.toString(16).padStart(4, '0'));
  }
  return groups.join(':');
}

/**
 * Compress IPv6 address to canonical form
 */
function compressIPv6(ip: string): string {
  const groups = ip.split(':');

  // Find longest sequence of zero groups
  let bestStart = -1;
  let bestLength = 0;
  let currentStart = -1;
  let currentLength = 0;

  for (let i = 0; i < groups.length; i++) {
    if (groups[i] === '0000' || groups[i] === '0') {
      if (currentStart === -1) {
        currentStart = i;
        currentLength = 1;
      } else {
        currentLength++;
      }
    } else {
      if (currentLength > bestLength && currentLength > 1) {
        bestStart = currentStart;
        bestLength = currentLength;
      }
      currentStart = -1;
      currentLength = 0;
    }
  }

  // Check final sequence
  if (currentLength > bestLength && currentLength > 1) {
    bestStart = currentStart;
    bestLength = currentLength;
  }

  // Remove leading zeros from groups
  let result = groups.map((g) => g.replace(/^0+/, '') || '0').join(':');

  // Apply :: compression if found
  if (bestStart !== -1) {
    const beforeZeros = groups.slice(0, bestStart).map((g) => g.replace(/^0+/, '') || '0');
    const afterZeros = groups.slice(bestStart + bestLength).map((g) => g.replace(/^0+/, '') || '0');

    if (beforeZeros.length === 0) {
      result = '::' + afterZeros.join(':');
    } else if (afterZeros.length === 0) {
      result = beforeZeros.join(':') + '::';
    } else {
      result = beforeZeros.join(':') + '::' + afterZeros.join(':');
    }
  }

  return result;
}

/**
 * Convert IP range to minimal set of CIDR blocks (IPv4)
 */
function rangeToCIDRv4(startIP: string, endIP: string): CIDRBlock[] {
  let startNum = ipv4ToBigInt(startIP);
  const endNum = ipv4ToBigInt(endIP);
  const cidrs: CIDRBlock[] = [];

  while (startNum <= endNum) {
    // Find the largest prefix that fits
    let prefix = 32;

    // Find trailing zeros in startNum (alignment)
    let trailingZeros = 0;
    for (let i = 0; i < 32; i++) {
      if ((startNum & (1n << BigInt(i))) !== 0n) {
        break;
      }
      trailingZeros++;
    }

    // Maximum prefix based on alignment
    const maxPrefixFromAlignment = 32 - trailingZeros;

    // Find maximum prefix that doesn't exceed endNum
    let maxPrefixFromRange = 32;
    for (let p = 0; p <= 32; p++) {
      const blockSize = 2n ** BigInt(32 - p);
      const blockEnd = startNum + blockSize - 1n;
      if (blockEnd <= endNum) {
        maxPrefixFromRange = p;
        break;
      }
    }

    prefix = Math.max(maxPrefixFromAlignment, maxPrefixFromRange);

    const blockSize = 2n ** BigInt(32 - prefix);
    const blockEnd = startNum + blockSize - 1n;

    const networkAddr = bigIntToIPv4(startNum);
    const lastAddr = bigIntToIPv4(blockEnd);

    cidrs.push({
      cidr: `${networkAddr}/${prefix}`,
      network: networkAddr,
      prefix,
      firstIP: networkAddr,
      lastIP: lastAddr,
      totalIPs: blockSize.toString(),
    });

    startNum = blockEnd + 1n;
  }

  return cidrs;
}

/**
 * Convert IP range to minimal set of CIDR blocks (IPv6)
 */
function rangeToCIDRv6(startIP: string, endIP: string): CIDRBlock[] {
  let startNum = ipv6ToBigInt(startIP);
  const endNum = ipv6ToBigInt(endIP);
  const cidrs: CIDRBlock[] = [];

  while (startNum <= endNum) {
    // Find the largest prefix that fits
    let prefix = 128;

    // Find trailing zeros in startNum (alignment)
    let trailingZeros = 0;
    for (let i = 0; i < 128; i++) {
      if ((startNum & (1n << BigInt(i))) !== 0n) {
        break;
      }
      trailingZeros++;
    }

    // Maximum prefix based on alignment
    const maxPrefixFromAlignment = 128 - trailingZeros;

    // Find maximum prefix that doesn't exceed endNum
    let maxPrefixFromRange = 128;
    for (let p = 0; p <= 128; p++) {
      const blockSize = 2n ** BigInt(128 - p);
      const blockEnd = startNum + blockSize - 1n;
      if (blockEnd <= endNum) {
        maxPrefixFromRange = p;
        break;
      }
    }

    prefix = Math.max(maxPrefixFromAlignment, maxPrefixFromRange);

    const blockSize = 2n ** BigInt(128 - prefix);
    const blockEnd = startNum + blockSize - 1n;

    const networkAddr = bigIntToIPv6(startNum);
    const lastAddr = bigIntToIPv6(blockEnd);

    const compressedNetwork = compressIPv6(networkAddr);
    const compressedLast = compressIPv6(lastAddr);

    cidrs.push({
      cidr: `${compressedNetwork}/${prefix}`,
      network: compressedNetwork,
      prefix,
      firstIP: compressedNetwork,
      lastIP: compressedLast,
      totalIPs: blockSize.toString(),
    });

    startNum = blockEnd + 1n;
  }

  return cidrs;
}

/**
 * Convert an IP range (start IP - end IP) to minimal CIDR blocks
 */
export function convertRangeToCIDR(startIP: string, endIP: string): RangeConversionResult {
  // Validate start IP
  const startResult = validateIPv4Detailed(startIP.trim());
  const startResult6 = validateIPv6Detailed(startIP.trim());

  let startVersion: 4 | 6 | null = null;
  let normalizedStart = '';

  if (startResult.isValid) {
    startVersion = 4;
    normalizedStart = startResult.details.normalizedForm || startIP;
  } else if (startResult6.isValid) {
    startVersion = 6;
    normalizedStart = startResult6.details.normalizedForm || startIP;
  } else {
    return {
      startIP,
      endIP,
      isValid: false,
      ipVersion: null,
      cidrs: [],
      totalBlocks: 0,
      totalAddresses: '0',
      error: `Invalid start IP address: ${startIP}`,
    };
  }

  // Validate end IP
  const endResult = validateIPv4Detailed(endIP.trim());
  const endResult6 = validateIPv6Detailed(endIP.trim());

  let endVersion: 4 | 6 | null = null;
  let normalizedEnd = '';

  if (endResult.isValid) {
    endVersion = 4;
    normalizedEnd = endResult.details.normalizedForm || endIP;
  } else if (endResult6.isValid) {
    endVersion = 6;
    normalizedEnd = endResult6.details.normalizedForm || endIP;
  } else {
    return {
      startIP,
      endIP,
      isValid: false,
      ipVersion: null,
      cidrs: [],
      totalBlocks: 0,
      totalAddresses: '0',
      error: `Invalid end IP address: ${endIP}`,
    };
  }

  // Check version match
  if (startVersion !== endVersion) {
    return {
      startIP,
      endIP,
      isValid: false,
      ipVersion: null,
      cidrs: [],
      totalBlocks: 0,
      totalAddresses: '0',
      error: 'Start and end IP addresses must be the same version (both IPv4 or both IPv6)',
    };
  }

  // Check order
  const startNum = startVersion === 4 ? ipv4ToBigInt(normalizedStart) : ipv6ToBigInt(normalizedStart);
  const endNum = endVersion === 4 ? ipv4ToBigInt(normalizedEnd) : ipv6ToBigInt(normalizedEnd);

  if (startNum > endNum) {
    return {
      startIP,
      endIP,
      isValid: false,
      ipVersion: startVersion,
      cidrs: [],
      totalBlocks: 0,
      totalAddresses: '0',
      error: 'Start IP must be less than or equal to end IP',
    };
  }

  // Convert to CIDR blocks
  const cidrs =
    startVersion === 4 ? rangeToCIDRv4(normalizedStart, normalizedEnd) : rangeToCIDRv6(normalizedStart, normalizedEnd);

  const totalAddresses = (endNum - startNum + 1n).toString();

  return {
    startIP: startVersion === 4 ? normalizedStart : compressIPv6(normalizedStart),
    endIP: endVersion === 4 ? normalizedEnd : compressIPv6(normalizedEnd),
    isValid: true,
    ipVersion: startVersion,
    cidrs,
    totalBlocks: cidrs.length,
    totalAddresses,
  };
}
