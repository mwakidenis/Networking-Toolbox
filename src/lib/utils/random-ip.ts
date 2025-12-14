/* Random IP Generator Utilities */

export interface RandomIPGeneration {
  network: string;
  networkType: 'cidr' | 'range';
  version: 4 | 6;
  requestedCount: number;
  generatedIPs: string[];
  uniqueIPs: boolean;
  seed?: string;
  isValid: boolean;
  error?: string;
  networkDetails?: {
    start: string;
    end: string;
    totalAddresses: string;
    availableCount: string;
  };
}

export interface RandomIPResult {
  generations: RandomIPGeneration[];
  summary: {
    totalNetworks: number;
    validNetworks: number;
    invalidNetworks: number;
    totalIPsGenerated: number;
    uniqueIPsGenerated: number;
  };
  errors: string[];
  allGeneratedIPs: string[];
}

/* Simple seeded random number generator (LCG) */
class SeededRandom {
  private seed: number;

  constructor(seed?: string | number) {
    if (typeof seed === 'string') {
      // Convert string to numeric seed
      this.seed = 0;
      for (let i = 0; i < seed.length; i++) {
        this.seed = ((this.seed << 5) - this.seed + seed.charCodeAt(i)) & 0xffffffff;
      }
      this.seed = Math.abs(this.seed);
    } else if (typeof seed === 'number') {
      this.seed = Math.abs(seed);
    } else {
      this.seed = Date.now();
    }

    // Ensure seed is positive and non-zero
    if (this.seed === 0) this.seed = 1;
  }

  next(): number {
    // Linear Congruential Generator (LCG)
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }

  nextBigInt(max: bigint): bigint {
    if (max <= 0n) return 0n;

    // For large numbers, we need to generate multiple random values
    if (max <= BigInt(Number.MAX_SAFE_INTEGER)) {
      return BigInt(Math.floor(this.next() * Number(max)));
    }

    // Generate random bigint for very large ranges
    const bytes = Math.ceil(max.toString(2).length / 8);
    let result = 0n;

    for (let i = 0; i < bytes; i++) {
      result = (result << 8n) | BigInt(Math.floor(this.next() * 256));
    }

    return result % max;
  }
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

function bigIntToIPv6(num: bigint): string {
  const groups = [];
  let remaining = num;

  for (let i = 0; i < 8; i++) {
    groups.unshift((remaining & 0xffffn).toString(16));
    remaining >>= 16n;
  }

  // Apply standard IPv6 compression rules
  return compressIPv6(groups.join(':'));
}

function compressIPv6(ip: string): string {
  // Split into groups and remove leading zeros
  const groups = ip.split(':').map((group) => group.replace(/^0+/, '') || '0');

  // Find the longest sequence of consecutive zero groups
  let longestZeroStart = -1;
  let longestZeroLength = 0;
  let currentZeroStart = -1;
  let currentZeroLength = 0;

  for (let i = 0; i < groups.length; i++) {
    if (groups[i] === '0') {
      if (currentZeroStart === -1) {
        currentZeroStart = i;
        currentZeroLength = 1;
      } else {
        currentZeroLength++;
      }
    } else {
      if (currentZeroLength > longestZeroLength && currentZeroLength > 1) {
        longestZeroStart = currentZeroStart;
        longestZeroLength = currentZeroLength;
      }
      currentZeroStart = -1;
      currentZeroLength = 0;
    }
  }

  // Check the final sequence
  if (currentZeroLength > longestZeroLength && currentZeroLength > 1) {
    longestZeroStart = currentZeroStart;
    longestZeroLength = currentZeroLength;
  }

  // Apply compression if we found a sequence of 2 or more zeros
  if (longestZeroLength > 1) {
    const before = groups.slice(0, longestZeroStart);
    const after = groups.slice(longestZeroStart + longestZeroLength);

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

  return groups.join(':');
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

/* Generate random IPs from a network */
function generateRandomIPs(
  networkInput: string,
  count: number,
  unique: boolean = true,
  seed?: string,
): RandomIPGeneration {
  try {
    const parsed = parseNetworkInput(networkInput);
    const rng = new SeededRandom(seed);
    const generatedIPs: string[] = [];
    const usedIPs = new Set<string>();

    // Check if we can generate the requested number of unique IPs
    if (unique && BigInt(count) > parsed.totalSize) {
      return {
        network: networkInput,
        networkType: parsed.type,
        version: parsed.version,
        requestedCount: count,
        generatedIPs: [],
        uniqueIPs: unique,
        seed,
        isValid: false,
        error: `Cannot generate ${count} unique IPs from network with only ${parsed.totalSize} addresses`,
        networkDetails: {
          start: numberToIP(parsed.start, parsed.version),
          end: numberToIP(parsed.end, parsed.version),
          totalAddresses: parsed.totalSize.toLocaleString(),
          availableCount: parsed.totalSize.toLocaleString(),
        },
      };
    }

    let attempts = 0;
    const maxAttempts = unique ? count * 10 : count;

    while (generatedIPs.length < count && attempts < maxAttempts) {
      const randomOffset = rng.nextBigInt(parsed.totalSize);
      const randomIP = numberToIP(parsed.start + randomOffset, parsed.version);

      if (!unique || !usedIPs.has(randomIP)) {
        generatedIPs.push(randomIP);
        usedIPs.add(randomIP);
      }

      attempts++;
    }

    return {
      network: networkInput,
      networkType: parsed.type,
      version: parsed.version,
      requestedCount: count,
      generatedIPs,
      uniqueIPs: unique,
      seed,
      isValid: true,
      networkDetails: {
        start: numberToIP(parsed.start, parsed.version),
        end: numberToIP(parsed.end, parsed.version),
        totalAddresses: parsed.totalSize.toLocaleString(),
        availableCount: parsed.totalSize.toLocaleString(),
      },
    };
  } catch (error) {
    return {
      network: networkInput,
      networkType: 'cidr',
      version: 4,
      requestedCount: count,
      generatedIPs: [],
      uniqueIPs: unique,
      seed,
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/* Parse input line to extract network and count */
function parseInputLine(line: string): {
  network: string;
  count: number;
} {
  const trimmed = line.trim();

  // Try different patterns to extract count
  const patterns = [
    /^(.+?)\s+x\s*(.+)$/, // network x count
    /^(.+?)\s+\*\s*(.+)$/, // network * count
    /^(.+?)\s+(.+)$/, // network count
    /^(.+?)#(.+)$/, // network#count
    /^(.+?)\[(.+)\]$/, // network[count]
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const countStr = match[2].trim();
      const count = parseInt(countStr, 10);

      // Check if the count is a valid number
      if (isNaN(count) || count < 0) {
        throw new Error(`Invalid count format: "${countStr}"`);
      }

      return {
        network: match[1].trim(),
        count: count,
      };
    }
  }

  // Return 0 if no count specified to indicate default should be used
  return {
    network: trimmed,
    count: 0,
  };
}

/* Generate random IPs for multiple networks */
export function generateRandomIPAddresses(
  inputs: string[],
  defaultCount: number = 1,
  unique: boolean = true,
  seed?: string,
): RandomIPResult {
  const generations: RandomIPGeneration[] = [];
  const errors: string[] = [];
  const allGeneratedIPs: string[] = [];

  for (const input of inputs) {
    if (!input.trim()) continue;

    try {
      const { network, count } = parseInputLine(input);
      const actualCount = count > 0 ? count : defaultCount;
      const generation = generateRandomIPs(network, actualCount, unique, seed);
      generations.push(generation);

      if (generation.isValid) {
        allGeneratedIPs.push(...generation.generatedIPs);
      } else if (generation.error) {
        errors.push(`"${input}": ${generation.error}`);
      }
    } catch (error) {
      errors.push(`"${input}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Add invalid generation for display
      generations.push({
        network: input.trim(),
        networkType: 'cidr',
        version: 4,
        requestedCount: defaultCount,
        generatedIPs: [],
        uniqueIPs: unique,
        seed,
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const validGenerations = generations.filter((g) => g.isValid);
  const totalIPs = validGenerations.reduce((sum, gen) => sum + gen.generatedIPs.length, 0);
  const uniqueIPs = unique ? new Set(allGeneratedIPs).size : totalIPs;

  return {
    generations,
    summary: {
      totalNetworks: generations.length,
      validNetworks: validGenerations.length,
      invalidNetworks: generations.length - validGenerations.length,
      totalIPsGenerated: totalIPs,
      uniqueIPsGenerated: uniqueIPs,
    },
    errors,
    allGeneratedIPs,
  };
}
