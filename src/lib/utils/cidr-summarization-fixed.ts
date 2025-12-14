/* CIDR Summarization Utilities - Fixed Version */

export interface IPRange {
  start: bigint;
  end: bigint;
  version: 4 | 6;
}

export interface ParsedInput {
  ip: string;
  type: 'single' | 'cidr' | 'range';
  version: 4 | 6;
  range: IPRange;
}

export interface SummarizationResult {
  ipv4: string[];
  ipv6: string[];
  stats: {
    originalIpv4Count: number;
    originalIpv6Count: number;
    summarizedIpv4Count: number;
    summarizedIpv6Count: number;
    totalAddressesCovered: string;
  };
  errors: string[];
}

/* Convert IPv4 address to bigint */
function ipv4ToBigInt(ip: string): bigint {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    throw new Error('Invalid IPv4 address');
  }
  return BigInt(parts[0] * 16777216 + parts[1] * 65536 + parts[2] * 256 + parts[3]);
}

/* Convert bigint to IPv4 address */
function bigIntToIPv4(num: bigint): string {
  const n = Number(num);
  return [Math.floor(n / 16777216) % 256, Math.floor(n / 65536) % 256, Math.floor(n / 256) % 256, n % 256].join('.');
}

/* Simple IPv6 to bigint conversion */
function ipv6ToBigInt(ip: string): bigint {
  // Simplified IPv6 parsing - expand to full form first
  const expanded = expandIPv6Simple(ip);
  const groups = expanded.split(':');

  let result = 0n;
  for (let i = 0; i < 8; i++) {
    const group = parseInt(groups[i] || '0', 16);
    result = (result << 16n) + BigInt(group);
  }
  return result;
}

/* Simple IPv6 expansion */
function expandIPv6Simple(ip: string): string {
  if (!ip.includes('::')) {
    // Already expanded or no compression
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

/* Convert bigint to IPv6 address */
function bigIntToIPv6(num: bigint): string {
  const groups = [];
  let remaining = num;

  for (let i = 0; i < 8; i++) {
    groups.unshift((remaining & 0xffffn).toString(16));
    remaining >>= 16n;
  }

  return groups.join(':');
}

/* Detect IP version */
function detectIPVersion(ip: string): 4 | 6 {
  if (ip.includes('.') && /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    return 4;
  }
  if (ip.includes(':')) {
    return 6;
  }
  throw new Error(`Cannot determine IP version: ${ip}`);
}

/* Parse single input */
export function parseInput(input: string): ParsedInput {
  const trimmed = input.trim();

  // Range format
  if (trimmed.includes('-')) {
    const [start, end] = trimmed.split('-').map((s) => s.trim());
    const startVersion = detectIPVersion(start);
    const endVersion = detectIPVersion(end);

    if (startVersion !== endVersion) {
      throw new Error('Range must use same IP version');
    }

    const startBig = startVersion === 4 ? ipv4ToBigInt(start) : ipv6ToBigInt(start);
    const endBig = startVersion === 4 ? ipv4ToBigInt(end) : ipv6ToBigInt(end);

    return {
      ip: trimmed,
      type: 'range',
      version: startVersion,
      range: { start: startBig, end: endBig, version: startVersion },
    };
  }

  // CIDR format
  if (trimmed.includes('/')) {
    const [ip, prefixStr] = trimmed.split('/');
    const version = detectIPVersion(ip);
    const prefix = parseInt(prefixStr);
    const maxPrefix = version === 4 ? 32 : 128;

    if (prefix < 0 || prefix > maxPrefix) {
      throw new Error(`Invalid prefix: ${prefix}`);
    }

    const ipBig = version === 4 ? ipv4ToBigInt(ip) : ipv6ToBigInt(ip);
    const hostBits = BigInt(maxPrefix - prefix);
    const networkBig = (ipBig >> hostBits) << hostBits; // Simplified network calculation
    const broadcastBig = networkBig + (1n << hostBits) - 1n;

    return {
      ip: trimmed,
      type: 'cidr',
      version,
      range: { start: networkBig, end: broadcastBig, version },
    };
  }

  // Single IP
  const version = detectIPVersion(trimmed);
  const ipBig = version === 4 ? ipv4ToBigInt(trimmed) : ipv6ToBigInt(trimmed);

  return {
    ip: trimmed,
    type: 'single',
    version,
    range: { start: ipBig, end: ipBig, version },
  };
}

/* Merge overlapping ranges */
function mergeRanges(ranges: IPRange[]): IPRange[] {
  if (ranges.length === 0) return [];

  const sorted = [...ranges].sort((a, b) => (a.start < b.start ? -1 : 1));
  const merged: IPRange[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end + 1n) {
      last.end = current.end > last.end ? current.end : last.end;
    } else {
      merged.push(current);
    }
  }

  return merged;
}

/* Convert range to CIDR blocks - simplified to avoid infinite loops */
function rangeToCIDRs(range: IPRange): string[] {
  const cidrs: string[] = [];
  let start = range.start;
  const end = range.end;
  const maxPrefix = range.version === 4 ? 32 : 128;

  // Safety counter to prevent infinite loops
  let iterations = 0;
  const maxIterations = 1000;

  while (start <= end && iterations < maxIterations) {
    iterations++;

    // Find the largest power of 2 that fits
    let prefixLength = maxPrefix;
    let blockSize = 1n;

    for (let p = 0; p < maxPrefix; p++) {
      const testBlockSize = 1n << BigInt(p);
      const alignedStart = start & ~(testBlockSize - 1n);

      if (alignedStart === start && start + testBlockSize - 1n <= end) {
        blockSize = testBlockSize;
        prefixLength = maxPrefix - p;
      } else {
        break;
      }
    }

    const ip = range.version === 4 ? bigIntToIPv4(start) : bigIntToIPv6(start);
    cidrs.push(`${ip}/${prefixLength}`);

    start += blockSize;
  }

  if (iterations >= maxIterations) {
    // Fallback for complex ranges
    const ip = range.version === 4 ? bigIntToIPv4(range.start) : bigIntToIPv6(range.start);
    return [`${ip}/${maxPrefix}`];
  }

  return cidrs;
}

/* Convert ranges to CIDR blocks with minimal cover mode */
function rangeToCIDRsMinimal(range: IPRange): string[] {
  const cidrs: string[] = [];
  let start = range.start;
  const end = range.end;
  const maxPrefix = range.version === 4 ? 32 : 128;

  // Safety counter to prevent infinite loops
  let iterations = 0;
  const maxIterations = 100; // Lower limit for minimal cover

  while (start <= end && iterations < maxIterations) {
    iterations++;

    // For minimal cover, try to find larger blocks first
    let prefixLength = 0; // Start with largest possible block
    let blockSize = 1n << BigInt(maxPrefix);

    // Find the largest block that starts at or before start and covers as much as possible
    for (let p = 0; p <= maxPrefix; p++) {
      const testBlockSize = 1n << BigInt(maxPrefix - p);
      const alignedStart = start & ~(testBlockSize - 1n);

      // Accept block if it's aligned and doesn't go too far past our end
      if (alignedStart <= start && start + testBlockSize - 1n <= end + testBlockSize / 4n) {
        blockSize = testBlockSize;
        prefixLength = p;
        start = alignedStart; // Align to block boundary
      } else {
        break;
      }
    }

    const ip = range.version === 4 ? bigIntToIPv4(start) : bigIntToIPv6(start);
    cidrs.push(`${ip}/${prefixLength}`);

    start += blockSize;
  }

  if (iterations >= maxIterations) {
    // Fallback for complex ranges
    const ip = range.version === 4 ? bigIntToIPv4(range.start) : bigIntToIPv6(range.start);
    return [`${ip}/${maxPrefix}`];
  }

  return cidrs;
}

/* Main summarization function */
export function summarizeCIDRs(
  inputText: string,
  mode: 'exact-merge' | 'minimal-cover' = 'exact-merge',
): SummarizationResult {
  const lines = inputText
    .trim()
    .split('\n')
    .filter((line) => line.trim());
  const inputs: ParsedInput[] = [];
  const errors: string[] = [];

  // Parse inputs with error handling
  lines.forEach((line, index) => {
    try {
      const parsed = parseInput(line);
      inputs.push(parsed);
    } catch (error) {
      errors.push(`Line ${index + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
    }
  });

  if (inputs.length === 0) {
    return {
      ipv4: [],
      ipv6: [],
      stats: {
        originalIpv4Count: 0,
        originalIpv6Count: 0,
        summarizedIpv4Count: 0,
        summarizedIpv6Count: 0,
        totalAddressesCovered: '0',
      },
      errors,
    };
  }

  // Separate by version
  const ipv4Ranges: IPRange[] = [];
  const ipv6Ranges: IPRange[] = [];

  inputs.forEach((input) => {
    if (input.version === 4) {
      ipv4Ranges.push(input.range);
    } else {
      ipv6Ranges.push(input.range);
    }
  });

  // Merge ranges first
  const mergedIpv4 = mergeRanges(ipv4Ranges);
  const mergedIpv6 = mergeRanges(ipv6Ranges);

  // Apply different algorithms based on mode
  const ipv4CIDRs =
    mode === 'minimal-cover' ? mergedIpv4.flatMap(rangeToCIDRsMinimal) : mergedIpv4.flatMap(rangeToCIDRs);
  const ipv6CIDRs =
    mode === 'minimal-cover' ? mergedIpv6.flatMap(rangeToCIDRsMinimal) : mergedIpv6.flatMap(rangeToCIDRs);

  // Calculate statistics
  const totalV4 = mergedIpv4.reduce((sum, r) => {
    const size = r.end - r.start + 1n;
    return sum + (size > 1000000n ? 1000000n : size); // Cap for display
  }, 0n);

  const totalV6 = mergedIpv6.reduce((sum, r) => {
    const size = r.end - r.start + 1n;
    return sum + (size > 1000000n ? 1000000n : size); // Cap for display
  }, 0n);

  return {
    ipv4: ipv4CIDRs,
    ipv6: ipv6CIDRs,
    stats: {
      originalIpv4Count: ipv4Ranges.length,
      originalIpv6Count: ipv6Ranges.length,
      summarizedIpv4Count: ipv4CIDRs.length,
      summarizedIpv6Count: ipv6CIDRs.length,
      totalAddressesCovered: (totalV4 + totalV6).toLocaleString(),
    },
    errors,
  };
}
