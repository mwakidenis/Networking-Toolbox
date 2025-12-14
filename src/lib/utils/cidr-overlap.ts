/* CIDR Overlap Utilities */

import { parseInput, type IPRange, type ParsedInput } from './cidr-diff.js';

export interface OverlapResult {
  hasOverlap: boolean;
  ipv4: string[];
  ipv6: string[];
  stats: {
    setA: { count: number; addresses: string };
    setB: { count: number; addresses: string };
    intersection: { count: number; addresses: string };
    overlapPercent: number;
  };
  visualization: {
    setA: Array<{ start: bigint; end: bigint }>;
    setB: Array<{ start: bigint; end: bigint }>;
    intersection: Array<{ start: bigint; end: bigint; cidr: string }>;
    version: 4 | 6;
    totalRange: { start: bigint; end: bigint };
  };
  errors: string[];
}

/* Convert bigint to IP address */
function bigIntToIP(num: bigint, version: 4 | 6): string {
  if (version === 4) {
    const n = Number(num);
    return [Math.floor(n / 16777216) % 256, Math.floor(n / 65536) % 256, Math.floor(n / 256) % 256, n % 256].join('.');
  } else {
    const groups = [];
    let remaining = num;

    for (let i = 0; i < 8; i++) {
      groups.unshift((remaining & 0xffffn).toString(16));
      remaining >>= 16n;
    }

    return groups.join(':');
  }
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

/* Find intersection of two range sets */
function findIntersection(setA: IPRange[], setB: IPRange[]): IPRange[] {
  const intersections: IPRange[] = [];

  for (const a of setA) {
    for (const b of setB) {
      // Check if ranges overlap
      const start = a.start > b.start ? a.start : b.start;
      const end = a.end < b.end ? a.end : b.end;

      if (start <= end) {
        intersections.push({
          start,
          end,
          version: a.version,
        });
      }
    }
  }

  return mergeRanges(intersections);
}

/* Convert range to CIDR blocks */
function rangeToCIDRs(range: IPRange): string[] {
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

    const ip = bigIntToIP(start, range.version);
    cidrs.push(`${ip}/${prefixLength}`);

    start += blockSize;
  }

  if (iterations >= maxIterations) {
    const ip = bigIntToIP(range.start, range.version);
    return [`${ip}/${maxPrefix}`];
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
  intersection: IPRange[],
  version: 4 | 6,
): OverlapResult['visualization'] {
  const allRanges = [...setA, ...setB, ...intersection];
  if (allRanges.length === 0) {
    return {
      setA: [],
      setB: [],
      intersection: [],
      version,
      totalRange: { start: 0n, end: 0n },
    };
  }

  const totalStart = allRanges.reduce((min, r) => (r.start < min ? r.start : min), allRanges[0].start);
  const totalEnd = allRanges.reduce((max, r) => (r.end > max ? r.end : max), allRanges[0].end);

  return {
    setA: setA.map((r) => ({ start: r.start, end: r.end })),
    setB: setB.map((r) => ({ start: r.start, end: r.end })),
    intersection: intersection.map((r) => ({
      start: r.start,
      end: r.end,
      cidr: rangeToCIDRs(r)[0] || `${bigIntToIP(r.start, version)}/${version === 4 ? 32 : 128}`,
    })),
    version,
    totalRange: { start: totalStart, end: totalEnd },
  };
}

/* Main CIDR overlap function */
export function computeCIDROverlap(inputA: string, inputB: string, mergeInputs: boolean = true): OverlapResult {
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

  // Optionally merge overlapping ranges within each set
  const setA4 = mergeInputs ? mergeRanges(ipv4RangesA) : ipv4RangesA;
  const setA6 = mergeInputs ? mergeRanges(ipv6RangesA) : ipv6RangesA;
  const setB4 = mergeInputs ? mergeRanges(ipv4RangesB) : ipv4RangesB;
  const setB6 = mergeInputs ? mergeRanges(ipv6RangesB) : ipv6RangesB;

  // Find intersections
  const intersection4 = findIntersection(setA4, setB4);
  const intersection6 = findIntersection(setA6, setB6);

  // Convert to CIDRs
  const ipv4CIDRs = intersection4.flatMap(rangeToCIDRs).sort();
  const ipv6CIDRs = intersection6.flatMap(rangeToCIDRs).sort();

  // Check if there's any overlap
  const hasOverlap = intersection4.length > 0 || intersection6.length > 0;

  // Calculate statistics
  const totalA4 = calculateTotalAddresses(setA4);
  const totalA6 = calculateTotalAddresses(setA6);
  const totalB4 = calculateTotalAddresses(setB4);
  const totalB6 = calculateTotalAddresses(setB6);
  const totalInt4 = calculateTotalAddresses(intersection4);
  const totalInt6 = calculateTotalAddresses(intersection6);

  const totalSetA = totalA4 + totalA6;
  const totalSetB = totalB4 + totalB6;
  const totalIntersection = totalInt4 + totalInt6;

  // Calculate overlap percentage (intersection / smaller set)
  const smallerSet = totalSetA < totalSetB ? totalSetA : totalSetB;
  const overlapPercent = smallerSet > 0 ? Number((totalIntersection * 100n) / smallerSet) : 0;

  // Create visualization (prefer IPv4 if available)
  const vizVersion = setA4.length > 0 || setB4.length > 0 ? 4 : 6;
  const vizA = vizVersion === 4 ? setA4 : setA6;
  const vizB = vizVersion === 4 ? setB4 : setB6;
  const vizIntersection = vizVersion === 4 ? intersection4 : intersection6;

  return {
    hasOverlap,
    ipv4: ipv4CIDRs,
    ipv6: ipv6CIDRs,
    stats: {
      setA: {
        count: ipv4RangesA.length + ipv6RangesA.length,
        addresses: totalSetA.toLocaleString(),
      },
      setB: {
        count: ipv4RangesB.length + ipv6RangesB.length,
        addresses: totalSetB.toLocaleString(),
      },
      intersection: {
        count: ipv4CIDRs.length + ipv6CIDRs.length,
        addresses: totalIntersection.toLocaleString(),
      },
      overlapPercent: Math.round(overlapPercent),
    },
    visualization: createVisualization(vizA, vizB, vizIntersection, vizVersion),
    errors,
  };
}
