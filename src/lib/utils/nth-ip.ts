/* Nth IP Calculator Utilities */
import { normalizeIPv6Addresses } from './ipv6-normalize';

export interface NthIPCalculation {
  input: string;
  inputType: 'cidr' | 'range';
  network: string;
  index: number;
  offset: number;
  resultIP: string;
  version: 4 | 6;
  totalAddresses: string;
  isValid: boolean;
  isInBounds: boolean;
  error?: string;
  details?: {
    networkStart: string;
    networkEnd: string;
    actualIndex: number;
    maxIndex: number;
  };
}

export interface NthIPResult {
  calculations: NthIPCalculation[];
  summary: {
    totalCalculations: number;
    validCalculations: number;
    invalidCalculations: number;
    outOfBoundsCalculations: number;
  };
  errors: string[];
}

/* IPv4/IPv6 conversion utilities */
function ipv4ToBigInt(ip: string): bigint {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    throw new Error('Invalid IPv4 address');
  }
  return BigInt(parts[0] * 16777216 + parts[1] * 65536 + parts[2] * 256 + parts[3]);
}

function bigIntToIPv4(num: bigint): string {
  const n = Number(num);
  return [Math.floor(n / 16777216) % 256, Math.floor(n / 65536) % 256, Math.floor(n / 256) % 256, n % 256].join('.');
}

function ipv6ToBigInt(ip: string): bigint {
  const expanded = expandIPv6(ip);
  const groups = expanded.split(':');

  let result = 0n;
  for (let i = 0; i < 8; i++) {
    const group = parseInt(groups[i] || '0', 16);
    result = (result << 16n) + BigInt(group);
  }
  return result;
}

function expandIPv6(ip: string): string {
  if (!ip.includes('::')) {
    return ip
      .split(':')
      .map((g) => g.padStart(4, '0'))
      .join(':');
  }

  const parts = ip.split('::');
  const left = parts[0] ? parts[0].split(':') : [];
  const right = parts[1] ? parts[1].split(':') : [];
  const missing = 8 - left.length - right.length;
  const middle = Array(missing).fill('0000');

  return [...left, ...middle, ...right].map((g) => g.padStart(4, '0')).join(':');
}

function compressIPv6(ip: string): string {
  // Simple IPv6 compression - find longest sequence of consecutive zeros
  const groups = ip.split(':');

  // Find longest sequence of '0' groups
  let longestStart = -1;
  let longestLength = 0;
  let currentStart = -1;
  let currentLength = 0;

  for (let i = 0; i < groups.length; i++) {
    if (groups[i] === '0') {
      if (currentStart === -1) {
        currentStart = i;
        currentLength = 1;
      } else {
        currentLength++;
      }
    } else {
      if (currentLength > longestLength && currentLength > 1) {
        longestStart = currentStart;
        longestLength = currentLength;
      }
      currentStart = -1;
      currentLength = 0;
    }
  }

  // Check the final sequence
  if (currentLength > longestLength && currentLength > 1) {
    longestStart = currentStart;
    longestLength = currentLength;
  }

  // Apply compression if we found a sequence to compress
  if (longestStart !== -1 && longestLength > 1) {
    const before = groups.slice(0, longestStart);
    const after = groups.slice(longestStart + longestLength);

    if (before.length === 0 && after.length === 0) {
      return '::';
    } else if (before.length === 0) {
      return '::' + after.join(':');
    } else if (after.length === 0) {
      return before.join(':') + '::';
    } else {
      return before.join(':') + '::' + after.join(':');
    }
  }

  return ip;
}

function bigIntToIPv6(num: bigint): string {
  const groups = [];
  let remaining = num;

  for (let i = 0; i < 8; i++) {
    groups.unshift((remaining & 0xffffn).toString(16));
    remaining >>= 16n;
  }

  const uncompressed = groups.join(':');

  // Apply IPv6 compression using our normalize function
  try {
    const result = normalizeIPv6Addresses([uncompressed]);
    if (result.normalizations[0]?.isValid) {
      return result.normalizations[0].normalized;
    }
  } catch {
    // Fallback to manual compression if normalize fails
  }

  // Manual compression fallback
  return compressIPv6(uncompressed);
}

function detectIPVersion(ip: string): 4 | 6 {
  if (ip.includes(':')) return 6;
  if (ip.split('.').length === 4) return 4;
  throw new Error(`Cannot determine IP version: ${ip}`);
}

function ipToNumber(ip: string, version: 4 | 6): bigint {
  return version === 4 ? ipv4ToBigInt(ip) : ipv6ToBigInt(ip);
}

function numberToIP(num: bigint, version: 4 | 6): string {
  return version === 4 ? bigIntToIPv4(num) : bigIntToIPv6(num);
}

/* Parse network input (CIDR or range) */
function parseNetworkInput(input: string): {
  type: 'cidr' | 'range';
  version: 4 | 6;
  start: bigint;
  end: bigint;
  totalSize: bigint;
} {
  input = input.trim();

  if (input.includes('/')) {
    // CIDR notation
    const [ip, prefixStr] = input.split('/');
    const version = detectIPVersion(ip);
    const prefix = parseInt(prefixStr);
    const maxPrefix = version === 4 ? 32 : 128;

    if (prefix < 0 || prefix > maxPrefix) {
      throw new Error(`Invalid prefix /${prefix} for IPv${version}`);
    }

    const ipBig = ipToNumber(ip, version);
    const hostBits = BigInt(maxPrefix - prefix);
    const networkBig = (ipBig >> hostBits) << hostBits;
    const totalSize = 1n << hostBits;
    const broadcastBig = networkBig + totalSize - 1n;

    return {
      type: 'cidr',
      version,
      start: networkBig,
      end: broadcastBig,
      totalSize,
    };
  } else if (input.includes('-')) {
    // Range notation
    const [startIP, endIP] = input.split('-').map((s) => s.trim());
    const version = detectIPVersion(startIP);

    if (detectIPVersion(endIP) !== version) {
      throw new Error('Start and end IPs must be the same version');
    }

    const startBig = ipToNumber(startIP, version);
    const endBig = ipToNumber(endIP, version);

    if (startBig > endBig) {
      throw new Error('Start IP must be less than or equal to end IP');
    }

    const totalSize = endBig - startBig + 1n;

    return {
      type: 'range',
      version,
      start: startBig,
      end: endBig,
      totalSize,
    };
  } else {
    throw new Error('Invalid format. Use CIDR (192.168.1.0/24) or range (192.168.1.1-192.168.1.100)');
  }
}

/* Calculate nth IP in a network */
function calculateNthIP(networkInput: string, index: number, offset: number = 0): NthIPCalculation {
  try {
    const parsed = parseNetworkInput(networkInput);

    // Apply offset to index
    const actualIndex = index + offset;
    const maxIndex = Number(parsed.totalSize) - 1;

    // Check if index is within bounds
    if (actualIndex < 0 || actualIndex > maxIndex) {
      const resultIP =
        actualIndex < 0 ? numberToIP(parsed.start, parsed.version) : numberToIP(parsed.end, parsed.version);

      return {
        input: networkInput,
        inputType: parsed.type,
        network: networkInput,
        index,
        offset,
        resultIP,
        version: parsed.version,
        totalAddresses: parsed.totalSize.toLocaleString(),
        isValid: true,
        isInBounds: false,
        error: `Index ${actualIndex} is out of bounds (0-${maxIndex})`,
        details: {
          networkStart: numberToIP(parsed.start, parsed.version),
          networkEnd: numberToIP(parsed.end, parsed.version),
          actualIndex,
          maxIndex,
        },
      };
    }

    // Calculate the IP at the specified index
    const resultBig = parsed.start + BigInt(actualIndex);
    const resultIP = numberToIP(resultBig, parsed.version);

    return {
      input: networkInput,
      inputType: parsed.type,
      network: networkInput,
      index,
      offset,
      resultIP,
      version: parsed.version,
      totalAddresses: parsed.totalSize.toLocaleString(),
      isValid: true,
      isInBounds: true,
      details: {
        networkStart: numberToIP(parsed.start, parsed.version),
        networkEnd: numberToIP(parsed.end, parsed.version),
        actualIndex,
        maxIndex,
      },
    };
  } catch (error) {
    return {
      input: networkInput,
      inputType: 'cidr',
      network: networkInput,
      index,
      offset,
      resultIP: '',
      version: 4,
      totalAddresses: '0',
      isValid: false,
      isInBounds: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/* Parse input line to extract network and index */
function parseInputLine(
  line: string,
  globalOffset: number = 0,
): {
  network: string;
  index: number;
  offset: number;
} {
  const trimmed = line.trim();

  // Try to find index specification - updated to handle negative numbers
  const patterns = [
    /^(.+?)\s+@\s*(-?\d+)(?:\s*\+\s*(\d+))?$/, // network @ index + offset
    /^(.+?)\s+\[\s*(-?\d+)\s*\](?:\s*\+\s*(\d+))?$/, // network [index] + offset
    /^(.+?)\s+(-?\d+)(?:\s*\+\s*(\d+))?$/, // network index + offset
    /^(.+?)#(-?\d+)(?:\+(\d+))?$/, // network#index+offset
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        network: match[1].trim(),
        index: parseInt(match[2]),
        offset: match[3] ? parseInt(match[3]) + globalOffset : globalOffset,
      };
    }
  }

  throw new Error('Invalid format. Use: network @ index, network [index], or network index');
}

/* Calculate nth IPs for multiple inputs */
export function calculateNthIPs(inputs: string[], globalOffset: number = 0): NthIPResult {
  const calculations: NthIPCalculation[] = [];
  const errors: string[] = [];

  for (const input of inputs) {
    if (!input.trim()) continue;

    try {
      const { network, index, offset } = parseInputLine(input, globalOffset);
      const calculation = calculateNthIP(network, index, offset);
      calculations.push(calculation);

      // Add to errors if calculation is invalid OR if it's out of bounds with positive index
      if (!calculation.isValid && calculation.error) {
        errors.push(`"${input}": ${calculation.error}`);
      } else if (calculation.isValid && !calculation.isInBounds && calculation.details) {
        // Only add out-of-bounds errors for positive indices (above range)
        if (calculation.details.actualIndex > calculation.details.maxIndex) {
          errors.push(`"${input}": ${calculation.error}`);
        }
      }
    } catch (error) {
      errors.push(`"${input}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Add invalid calculation for display
      calculations.push({
        input: input.trim(),
        inputType: 'cidr',
        network: input.trim(),
        index: 0,
        offset: globalOffset,
        resultIP: '',
        version: 4,
        totalAddresses: '0',
        isValid: false,
        isInBounds: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const validCalculations = calculations.filter((c) => c.isValid);
  const outOfBoundsCount = validCalculations.filter((c) => !c.isInBounds).length;

  return {
    calculations,
    summary: {
      totalCalculations: calculations.length,
      validCalculations: validCalculations.length,
      invalidCalculations: calculations.length - validCalculations.length,
      outOfBoundsCalculations: outOfBoundsCount,
    },
    errors,
  };
}
