/* CIDR Boundary Alignment Utilities */

export interface AlignmentCheck {
  input: string;
  type: 'cidr' | 'range' | 'ip';
  isAligned: boolean;
  targetPrefix: number;
  alignedCIDR?: string;
  reason?: string;
  suggestions: AlignmentSuggestion[];
}

export interface AlignmentSuggestion {
  type: 'smaller' | 'larger' | 'split';
  description: string;
  cidrs: string[];
  efficiency?: number;
}

export interface AlignmentResult {
  checks: AlignmentCheck[];
  summary: {
    totalInputs: number;
    alignedInputs: number;
    misalignedInputs: number;
    alignmentRate: number;
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

function bigIntToIPv6(num: bigint): string {
  const groups = [];
  let remaining = num;

  for (let i = 0; i < 8; i++) {
    groups.unshift((remaining & 0xffffn).toString(16));
    remaining >>= 16n;
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

/* Parse input string to extract IP information */
function parseInput(input: string): {
  type: 'cidr' | 'range' | 'ip';
  version: 4 | 6;
  start: bigint;
  end: bigint;
  prefix?: number;
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
    const broadcastBig = networkBig + (1n << hostBits) - 1n;

    return {
      type: 'cidr',
      version,
      start: networkBig,
      end: broadcastBig,
      prefix,
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

    return {
      type: 'range',
      version,
      start: startBig,
      end: endBig,
    };
  } else {
    // Single IP
    const version = detectIPVersion(input);
    const ipBig = ipToNumber(input, version);

    return {
      type: 'ip',
      version,
      start: ipBig,
      end: ipBig,
    };
  }
}

/* Check if a range is aligned to a specific prefix boundary */
function checkAlignment(
  start: bigint,
  end: bigint,
  targetPrefix: number,
  version: 4 | 6,
): { isAligned: boolean; alignedCIDR?: string; reason?: string } {
  const maxPrefix = version === 4 ? 32 : 128;
  const hostBits = BigInt(maxPrefix - targetPrefix);
  const blockSize = 1n << hostBits;

  // Calculate the expected network address for this prefix
  const expectedNetwork = (start >> hostBits) << hostBits;
  const expectedBroadcast = expectedNetwork + blockSize - 1n;

  // Check if the range exactly matches the expected CIDR block
  if (start === expectedNetwork && end === expectedBroadcast) {
    return {
      isAligned: true,
      alignedCIDR: `${numberToIP(expectedNetwork, version)}/${targetPrefix}`,
    };
  }

  // Determine why it's not aligned
  let reason = '';
  if (start !== expectedNetwork && end !== expectedBroadcast) {
    reason = `Range doesn't align to /${targetPrefix} boundary. Expected: ${numberToIP(expectedNetwork, version)}-${numberToIP(expectedBroadcast, version)}`;
  } else if (start !== expectedNetwork) {
    reason = `Start address doesn't align to /${targetPrefix} boundary. Expected start: ${numberToIP(expectedNetwork, version)}`;
  } else if (end !== expectedBroadcast) {
    reason = `End address doesn't align to /${targetPrefix} boundary. Expected end: ${numberToIP(expectedBroadcast, version)}`;
  }

  return { isAligned: false, reason };
}

/* Generate alignment suggestions */
function generateSuggestions(start: bigint, end: bigint, targetPrefix: number, version: 4 | 6): AlignmentSuggestion[] {
  const suggestions: AlignmentSuggestion[] = [];
  const maxPrefix = version === 4 ? 32 : 128;
  const rangeSize = end - start + 1n;

  // Find the smallest CIDR that contains the entire range
  const requiredBits = rangeSize === 1n ? 0 : Math.ceil(Math.log2(Number(rangeSize)));
  const containingPrefix = Math.max(0, maxPrefix - requiredBits);

  if (containingPrefix <= targetPrefix) {
    // Suggest a larger CIDR that contains the range
    const hostBits = BigInt(maxPrefix - containingPrefix);
    const alignedStart = (start >> hostBits) << hostBits;
    const _alignedEnd = alignedStart + (1n << hostBits) - 1n;
    const efficiency = Math.round(Number(rangeSize * 100n) / Number(1n << hostBits));

    suggestions.push({
      type: 'larger',
      description: `Use larger CIDR (/${containingPrefix}) that contains the entire range`,
      cidrs: [`${numberToIP(alignedStart, version)}/${containingPrefix}`],
      efficiency,
    });
  }

  // Suggest smaller CIDRs that fit within the range
  if (targetPrefix < maxPrefix) {
    const smallerPrefix = targetPrefix + 1;
    const smallerHostBits = BigInt(maxPrefix - smallerPrefix);
    const smallerBlockSize = 1n << smallerHostBits;

    const alignedStart = (start >> smallerHostBits) << smallerHostBits;
    const cidrs: string[] = [];

    for (let addr = alignedStart; addr <= end; addr += smallerBlockSize) {
      const blockEnd = addr + smallerBlockSize - 1n;
      if (blockEnd >= start) {
        cidrs.push(`${numberToIP(addr, version)}/${smallerPrefix}`);
      }
      if (cidrs.length >= 4) break; // Limit suggestions
    }

    if (cidrs.length > 0) {
      suggestions.push({
        type: 'smaller',
        description: `Use smaller CIDRs (/${smallerPrefix}) that fit within the range`,
        cidrs,
      });
    }
  }

  // Suggest splitting into multiple aligned CIDRs
  if (rangeSize > 1n && targetPrefix > 0) {
    const cidrs: string[] = [];
    let currentAddr = start;

    while (currentAddr <= end && cidrs.length < 8) {
      // Find the largest block that fits
      let bestPrefix = maxPrefix;
      for (let p = targetPrefix; p <= maxPrefix; p++) {
        const hBits = BigInt(maxPrefix - p);
        const blockSize = 1n << hBits;
        const blockStart = (currentAddr >> hBits) << hBits;
        const blockEnd = blockStart + blockSize - 1n;

        if (blockStart === currentAddr && blockEnd <= end) {
          bestPrefix = p;
          break;
        }
      }

      const hBits = BigInt(maxPrefix - bestPrefix);
      const blockSize = 1n << hBits;
      cidrs.push(`${numberToIP(currentAddr, version)}/${bestPrefix}`);
      currentAddr += blockSize;
    }

    if (cidrs.length > 1) {
      suggestions.push({
        type: 'split',
        description: `Split into ${cidrs.length} aligned CIDR blocks`,
        cidrs,
      });
    }
  }

  return suggestions;
}

/* Check CIDR boundary alignment for multiple inputs */
export function checkCIDRAlignment(inputs: string[], targetPrefix: number): AlignmentResult {
  const checks: AlignmentCheck[] = [];
  const errors: string[] = [];

  for (const input of inputs) {
    if (!input.trim()) continue;

    try {
      const parsed = parseInput(input);
      const alignment = checkAlignment(parsed.start, parsed.end, targetPrefix, parsed.version);
      const suggestions = alignment.isAligned
        ? []
        : generateSuggestions(parsed.start, parsed.end, targetPrefix, parsed.version);

      checks.push({
        input: input.trim(),
        type: parsed.type,
        isAligned: alignment.isAligned,
        targetPrefix,
        alignedCIDR: alignment.alignedCIDR,
        reason: alignment.reason,
        suggestions,
      });
    } catch (error) {
      errors.push(`Invalid input "${input}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      checks.push({
        input: input.trim(),
        type: 'ip',
        isAligned: false,
        targetPrefix,
        reason: error instanceof Error ? error.message : 'Unknown error',
        suggestions: [],
      });
    }
  }

  const alignedCount = checks.filter((c) => c.isAligned).length;
  const totalCount = checks.length;

  return {
    checks,
    summary: {
      totalInputs: totalCount,
      alignedInputs: alignedCount,
      misalignedInputs: totalCount - alignedCount,
      alignmentRate: totalCount > 0 ? Math.round((alignedCount / totalCount) * 100) : 0,
    },
    errors,
  };
}
