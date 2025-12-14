/* CIDR Summarization Utilities */

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
  if (parts.length !== 4 || parts.some((p) => p < 0 || p > 255)) {
    throw new Error('Invalid IPv4 address');
  }
  return BigInt(parts[0] * 256 * 256 * 256 + parts[1] * 256 * 256 + parts[2] * 256 + parts[3]);
}

/* Convert bigint to IPv4 address */
function bigIntToIPv4(num: bigint): string {
  const n = Number(num);
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

/* Convert IPv6 address to bigint */
function ipv6ToBigInt(ip: string): bigint {
  // Expand IPv6 address first
  let expanded = ip;
  if (ip.includes('::')) {
    const parts = ip.split('::');
    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];
    const missing = 8 - left.length - right.length;
    const middle = Array(missing).fill('0000');
    expanded = [...left, ...middle, ...right].join(':');
  }

  const groups = expanded.split(':').map((g) => g.padStart(4, '0'));
  if (groups.length !== 8) {
    throw new Error('Invalid IPv6 address');
  }

  let result = 0n;
  for (let i = 0; i < 8; i++) {
    result = (result << 16n) + BigInt(parseInt(groups[i], 16));
  }
  return result;
}

/* Convert bigint to IPv6 address */
function bigIntToIPv6(num: bigint): string {
  const groups = [];
  let remaining = num;

  for (let i = 0; i < 8; i++) {
    groups.unshift(remaining & 0xffffn);
    remaining >>= 16n;
  }

  const hex = groups.map((g) => g.toString(16));

  // Compress consecutive zeros
  const joined = hex.join(':');
  return joined
    .replace(/(:0)+:/, '::')
    .replace(/^0+/, '')
    .replace(/:0+/g, ':');
}

/* Detect IP version and validate */
function detectIPVersion(ip: string): 4 | 6 {
  if (ip.includes('.') && /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.every((p) => p >= 0 && p <= 255)) return 4;
  }
  if (ip.includes(':') || ip === '::') return 6;
  throw new Error(`Invalid IP address: ${ip}`);
}

/* Parse single IP, CIDR, or range input */
export function parseInput(input: string): ParsedInput {
  const trimmed = input.trim();

  // Range format: IP1-IP2
  if (trimmed.includes('-')) {
    const [start, end] = trimmed.split('-').map((s) => s.trim());
    const startVersion = detectIPVersion(start);
    const endVersion = detectIPVersion(end);

    if (startVersion !== endVersion) {
      throw new Error('Range must use same IP version');
    }

    const startBig = startVersion === 4 ? ipv4ToBigInt(start) : ipv6ToBigInt(start);
    const endBig = startVersion === 4 ? ipv4ToBigInt(end) : ipv6ToBigInt(end);

    if (startBig > endBig) {
      throw new Error('Invalid range: start must be <= end');
    }

    return {
      ip: trimmed,
      type: 'range',
      version: startVersion,
      range: { start: startBig, end: endBig, version: startVersion },
    };
  }

  // CIDR format: IP/prefix
  if (trimmed.includes('/')) {
    const [ip, prefixStr] = trimmed.split('/');
    const version = detectIPVersion(ip);
    const prefix = parseInt(prefixStr);
    const maxPrefix = version === 4 ? 32 : 128;

    if (prefix < 0 || prefix > maxPrefix) {
      throw new Error(`Invalid prefix length: ${prefix}`);
    }

    const ipBig = version === 4 ? ipv4ToBigInt(ip) : ipv6ToBigInt(ip);
    const hostBits = BigInt(maxPrefix - prefix);
    const mask = ~((1n << hostBits) - 1n);
    const networkBig = ipBig & mask;
    const broadcastBig = networkBig | ((1n << hostBits) - 1n);

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

  // Sort by start address
  const sorted = [...ranges].sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  const merged: IPRange[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    // Check if ranges overlap or are adjacent
    if (current.start <= last.end + 1n) {
      // Merge ranges
      last.end = current.end > last.end ? current.end : last.end;
    } else {
      merged.push(current);
    }
  }

  return merged;
}

/* Convert range to minimal CIDR blocks */
function rangeToCIDRs(range: IPRange): string[] {
  const cidrs: string[] = [];
  let start = range.start;
  const end = range.end;
  const maxPrefix = range.version === 4 ? 32 : 128;

  while (start <= end) {
    // Find the largest block that starts at 'start' and fits in the range
    let prefixLength = maxPrefix;

    // Start with the largest possible block (prefix 0) and work down
    for (let len = 0; len <= maxPrefix; len++) {
      const blockSize = 1n << BigInt(maxPrefix - len);
      const blockStart = start & ~(blockSize - 1n);

      // Check if this block starts at our current position and fits in range
      if (blockStart === start && start + blockSize - 1n <= end) {
        prefixLength = len;
        break;
      }
    }

    const blockSize = 1n << BigInt(maxPrefix - prefixLength);
    const ip = range.version === 4 ? bigIntToIPv4(start) : bigIntToIPv6(start);
    cidrs.push(`${ip}/${prefixLength}`);

    start += blockSize;
  }

  return cidrs;
}

/* Summarize mixed IP inputs with exact merge mode */
function exactMerge(inputs: ParsedInput[]): SummarizationResult {
  const ipv4Ranges: IPRange[] = [];
  const ipv6Ranges: IPRange[] = [];
  const errors: string[] = [];

  // Separate by version
  inputs.forEach((input) => {
    if (input.version === 4) {
      ipv4Ranges.push(input.range);
    } else {
      ipv6Ranges.push(input.range);
    }
  });

  // Merge overlapping ranges
  const mergedIpv4 = mergeRanges(ipv4Ranges);
  const mergedIpv6 = mergeRanges(ipv6Ranges);

  // Convert to CIDRs
  const ipv4CIDRs = mergedIpv4.flatMap(rangeToCIDRs);
  const ipv6CIDRs = mergedIpv6.flatMap(rangeToCIDRs);

  // Calculate total addresses
  const totalV4 = mergedIpv4.reduce((sum, r) => sum + (r.end - r.start + 1n), 0n);
  const totalV6 = mergedIpv6.reduce((sum, r) => sum + (r.end - r.start + 1n), 0n);
  const total = totalV4 + totalV6;

  return {
    ipv4: ipv4CIDRs,
    ipv6: ipv6CIDRs,
    stats: {
      originalIpv4Count: ipv4Ranges.length,
      originalIpv6Count: ipv6Ranges.length,
      summarizedIpv4Count: ipv4CIDRs.length,
      summarizedIpv6Count: ipv6CIDRs.length,
      totalAddressesCovered: total.toLocaleString(),
    },
    errors,
  };
}

/* Summarize with minimal cover mode (more aggressive optimization) */
function minimalCover(inputs: ParsedInput[]): SummarizationResult {
  // For minimal cover, we use the same merge logic but could add more aggressive optimizations
  // For now, exact merge provides good optimization
  return exactMerge(inputs);
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

  const result = mode === 'exact-merge' ? exactMerge(inputs) : minimalCover(inputs);
  result.errors.push(...errors);

  return result;
}
