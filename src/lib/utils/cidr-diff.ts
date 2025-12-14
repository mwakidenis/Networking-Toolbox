/* CIDR Difference Utilities - Set Operations */

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

export interface DiffResult {
  ipv4: string[];
  ipv6: string[];
  stats: {
    inputA: { count: number; addresses: string };
    inputB: { count: number; addresses: string };
    output: { count: number; addresses: string };
    removed: { count: number; addresses: string };
    efficiency: number; // percentage kept
  };
  visualization: {
    setA: Array<{ start: bigint; end: bigint; cidr?: string }>;
    setB: Array<{ start: bigint; end: bigint; cidr?: string }>;
    result: Array<{ start: bigint; end: bigint; cidr: string }>;
    version: 4 | 6;
    totalRange: { start: bigint; end: bigint };
  };
  errors: string[];
}

export type AlignmentMode = 'minimal' | 'constrained';

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
  const expanded = expandIPv6Simple(ip);
  const groups = expanded.split(':');

  let result = 0n;
  for (let i = 0; i < 8; i++) {
    const group = parseInt(groups[i] || '0', 16);
    result = (result << 16n) + BigInt(group);
  }
  return result;
}

function expandIPv6Simple(ip: string): string {
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
  if (ip.includes('.') && /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    return 4;
  }
  if (ip.includes(':')) {
    return 6;
  }
  throw new Error(`Cannot determine IP version: ${ip}`);
}

/* Parse input (IP, CIDR, or range) */
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
      throw new Error(`Invalid prefix: ${prefix}`);
    }

    const ipBig = version === 4 ? ipv4ToBigInt(ip) : ipv6ToBigInt(ip);
    const hostBits = BigInt(maxPrefix - prefix);
    const networkBig = (ipBig >> hostBits) << hostBits;
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

/* Subtract ranges B from ranges A */
function subtractRanges(setA: IPRange[], setB: IPRange[]): IPRange[] {
  if (setA.length === 0) return [];
  if (setB.length === 0) return setA;

  let result: IPRange[] = [...setA];

  for (const b of setB) {
    const newResult: IPRange[] = [];

    for (const a of result) {
      // No overlap
      if (a.end < b.start || a.start > b.end) {
        newResult.push(a);
        continue;
      }

      // B completely contains A
      if (b.start <= a.start && b.end >= a.end) {
        // A is completely removed
        continue;
      }

      // A completely contains B
      if (a.start < b.start && a.end > b.end) {
        // Split A into two ranges
        newResult.push({ start: a.start, end: b.start - 1n, version: a.version });
        newResult.push({ start: b.end + 1n, end: a.end, version: a.version });
        continue;
      }

      // Partial overlap - left side of A remains
      if (a.start < b.start && a.end >= b.start) {
        newResult.push({ start: a.start, end: b.start - 1n, version: a.version });
      }

      // Partial overlap - right side of A remains
      if (a.start <= b.end && a.end > b.end) {
        newResult.push({ start: b.end + 1n, end: a.end, version: a.version });
      }
    }

    result = newResult;
  }

  return result;
}

/* Convert range to CIDR blocks */
function rangeToCIDRs(range: IPRange, alignment: AlignmentMode = 'minimal', constrainedPrefix?: number): string[] {
  const cidrs: string[] = [];
  let start = range.start;
  const end = range.end;
  const maxPrefix = range.version === 4 ? 32 : 128;

  // Safety counter
  let iterations = 0;
  const maxIterations = 1000;

  while (start <= end && iterations < maxIterations) {
    iterations++;

    let prefixLength = maxPrefix;
    let blockSize = 1n;

    if (alignment === 'constrained' && constrainedPrefix !== undefined) {
      // Force alignment to specific prefix
      prefixLength = constrainedPrefix;
      blockSize = 1n << BigInt(maxPrefix - prefixLength);
      const alignedStart = start & ~(blockSize - 1n);

      if (alignedStart === start && start + blockSize - 1n <= end) {
        // Perfect alignment
      } else {
        // Fall back to /32 or /128
        prefixLength = maxPrefix;
        blockSize = 1n;
      }
    } else {
      // Find largest aligned block that fits
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
    }

    const ip = range.version === 4 ? bigIntToIPv4(start) : bigIntToIPv6(start);
    cidrs.push(`${ip}/${prefixLength}`);

    start += blockSize;
  }

  return cidrs;
}

/* Calculate total addresses in ranges */
function calculateTotalAddresses(ranges: IPRange[]): bigint {
  return ranges.reduce((total, range) => {
    return total + (range.end - range.start + 1n);
  }, 0n);
}

/* Create visualization data */
function createVisualization(
  setA: IPRange[],
  setB: IPRange[],
  result: IPRange[],
  version: 4 | 6,
): DiffResult['visualization'] {
  // Find overall range for visualization
  const allRanges = [...setA, ...setB, ...result];
  if (allRanges.length === 0) {
    return {
      setA: [],
      setB: [],
      result: [],
      version,
      totalRange: { start: 0n, end: 0n },
    };
  }

  const totalStart = allRanges.reduce((min, r) => (r.start < min ? r.start : min), allRanges[0].start);
  const totalEnd = allRanges.reduce((max, r) => (r.end > max ? r.end : max), allRanges[0].end);

  return {
    setA: setA.map((r) => ({ start: r.start, end: r.end })),
    setB: setB.map((r) => ({ start: r.start, end: r.end })),
    result: result.map((r) => ({
      start: r.start,
      end: r.end,
      cidr:
        rangeToCIDRs(r)[0] ||
        `${version === 4 ? bigIntToIPv4(r.start) : bigIntToIPv6(r.start)}/${version === 4 ? 32 : 128}`,
    })),
    version,
    totalRange: { start: totalStart, end: totalEnd },
  };
}

/* Main CIDR difference function */
export function computeCIDRDifference(
  inputA: string,
  inputB: string,
  alignment: AlignmentMode = 'minimal',
  constrainedPrefix?: number,
): DiffResult {
  const linesA = inputA
    .trim()
    .split('\n')
    .filter((line) => line.trim());
  const linesB = inputB
    .trim()
    .split('\n')
    .filter((line) => line.trim());

  const parsedA: ParsedInput[] = [];
  const parsedB: ParsedInput[] = [];
  const errors: string[] = [];

  // Parse inputs
  linesA.forEach((line, index) => {
    try {
      parsedA.push(parseInput(line));
    } catch (error) {
      errors.push(`Set A line ${index + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
    }
  });

  linesB.forEach((line, index) => {
    try {
      parsedB.push(parseInput(line));
    } catch (error) {
      errors.push(`Set B line ${index + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
    }
  });

  // Separate by version
  const ipv4RangesA = parsedA.filter((p) => p.version === 4).map((p) => p.range);
  const ipv6RangesA = parsedA.filter((p) => p.version === 6).map((p) => p.range);
  const ipv4RangesB = parsedB.filter((p) => p.version === 4).map((p) => p.range);
  const ipv6RangesB = parsedB.filter((p) => p.version === 6).map((p) => p.range);

  // Merge overlaps
  const mergedA4 = mergeRanges(ipv4RangesA);
  const mergedA6 = mergeRanges(ipv6RangesA);
  const mergedB4 = mergeRanges(ipv4RangesB);
  const mergedB6 = mergeRanges(ipv6RangesB);

  // Compute differences
  const result4 = subtractRanges(mergedA4, mergedB4);
  const result6 = subtractRanges(mergedA6, mergedB6);

  // Convert to CIDRs
  const ipv4CIDRs = result4.flatMap((r) => rangeToCIDRs(r, alignment, constrainedPrefix)).sort();
  const ipv6CIDRs = result6.flatMap((r) => rangeToCIDRs(r, alignment, constrainedPrefix)).sort();

  // Calculate statistics
  const totalA4 = calculateTotalAddresses(mergedA4);
  const totalA6 = calculateTotalAddresses(mergedA6);
  const totalB4 = calculateTotalAddresses(mergedB4);
  const totalB6 = calculateTotalAddresses(mergedB6);
  const totalResult4 = calculateTotalAddresses(result4);
  const totalResult6 = calculateTotalAddresses(result6);

  const totalInputA = totalA4 + totalA6;
  const totalInputB = totalB4 + totalB6;
  const totalOutput = totalResult4 + totalResult6;
  const totalRemoved = totalInputA - totalOutput;
  const efficiency = totalInputA > 0 ? Number((totalOutput * 100n) / totalInputA) : 0;

  // Create visualization (use IPv4 if available, otherwise IPv6)
  const vizVersion = mergedA4.length > 0 || mergedB4.length > 0 ? 4 : 6;
  const vizA = vizVersion === 4 ? mergedA4 : mergedA6;
  const vizB = vizVersion === 4 ? mergedB4 : mergedB6;
  const vizResult = vizVersion === 4 ? result4 : result6;

  return {
    ipv4: ipv4CIDRs,
    ipv6: ipv6CIDRs,
    stats: {
      inputA: {
        count: ipv4RangesA.length + ipv6RangesA.length,
        addresses: totalInputA.toLocaleString(),
      },
      inputB: {
        count: ipv4RangesB.length + ipv6RangesB.length,
        addresses: totalInputB.toLocaleString(),
      },
      output: {
        count: ipv4CIDRs.length + ipv6CIDRs.length,
        addresses: totalOutput.toLocaleString(),
      },
      removed: {
        count: 0, // Not tracking individual removed ranges
        addresses: totalRemoved.toLocaleString(),
      },
      efficiency: Math.round(efficiency),
    },
    visualization: createVisualization(vizA, vizB, vizResult, vizVersion),
    errors,
  };
}
