/* CIDR Contains Utilities */

import { parseInput, type IPRange, type ParsedInput } from './cidr-diff.js';

export type ContainmentStatus = 'inside' | 'equal' | 'partial' | 'outside';

export interface ContainmentCheck {
  input: string;
  status: ContainmentStatus;
  gaps: string[]; // B - A (uncovered parts) if partial
  coverage: number; // percentage of B covered by A
  matchingContainers: string[]; // which A items contain this B
}

export interface ContainsResult {
  checks: ContainmentCheck[];
  stats: {
    setA: { count: number; addresses: string };
    totalChecked: number;
    inside: number;
    equal: number;
    partial: number;
    outside: number;
  };
  visualization: Array<{
    candidate: string;
    candidateRange: { start: bigint; end: bigint };
    containers: Array<{ start: bigint; end: bigint; label: string }>;
    gaps: Array<{ start: bigint; end: bigint; cidr: string }>;
    totalRange: { start: bigint; end: bigint };
    version: 4 | 6;
  }>;
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

/* Check containment status for a single candidate against containers */
function checkContainment(
  candidate: IPRange,
  containers: IPRange[],
  originalInputs: ParsedInput[],
  strictEquality: boolean = false,
): ContainmentCheck {
  const candidateSize = candidate.end - candidate.start + 1n;
  const coveredRanges: IPRange[] = [];
  const matchingContainers: string[] = [];

  // Find all containers that overlap with candidate
  for (let i = 0; i < containers.length; i++) {
    const container = containers[i];

    // Check if container overlaps with candidate
    const overlapStart = candidate.start > container.start ? candidate.start : container.start;
    const overlapEnd = candidate.end < container.end ? candidate.end : container.end;

    if (overlapStart <= overlapEnd) {
      // There's an overlap
      coveredRanges.push({
        start: overlapStart,
        end: overlapEnd,
        version: candidate.version,
      });

      // Check if this container fully contains the candidate
      if (container.start <= candidate.start && container.end >= candidate.end) {
        matchingContainers.push(originalInputs[i]?.ip || `${bigIntToIP(container.start, container.version)}`);
      }
    }
  }

  // Merge covered ranges to avoid double-counting
  const mergedCovered = mergeRanges(coveredRanges);
  const coveredSize = calculateTotalAddresses(mergedCovered);
  const coverage = candidateSize > 0 ? Number((coveredSize * 100n) / candidateSize) : 0;

  // Calculate gaps (uncovered parts)
  const gaps = subtractRanges([candidate], mergedCovered);
  const gapCIDRs = gaps.flatMap(rangeToCIDRs);

  // Determine status
  let status: ContainmentStatus;

  if (coverage === 0) {
    status = 'outside';
  } else if (coverage === 100) {
    // Check for exact equality
    if (
      strictEquality &&
      mergedCovered.length === 1 &&
      mergedCovered[0].start === candidate.start &&
      mergedCovered[0].end === candidate.end
    ) {
      status = 'equal';
    } else {
      status = 'inside';
    }
  } else {
    status = 'partial';
  }

  return {
    input: '', // Will be filled by caller
    status,
    gaps: gapCIDRs,
    coverage: Math.round(coverage),
    matchingContainers,
  };
}

/* Main CIDR contains function */
export function computeCIDRContains(
  inputA: string, // containers
  inputB: string, // candidates
  mergeContainers: boolean = true,
  strictEquality: boolean = false,
): ContainsResult {
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
  const ipv4ParsedA = parsedA.filter((p) => p.version === 4);
  const ipv6ParsedA = parsedA.filter((p) => p.version === 6);

  // Merge containers if requested
  const containersA4 = mergeContainers ? mergeRanges(ipv4RangesA) : ipv4RangesA;
  const containersA6 = mergeContainers ? mergeRanges(ipv6RangesA) : ipv6RangesA;

  // Process each candidate
  const checks: ContainmentCheck[] = [];
  const visualization: ContainsResult['visualization'] = [];

  // Counters
  let inside = 0,
    equal = 0,
    partial = 0,
    outside = 0;

  for (const candidateInput of parsedB) {
    const containers = candidateInput.version === 4 ? containersA4 : containersA6;
    const originalContainers = candidateInput.version === 4 ? ipv4ParsedA : ipv6ParsedA;

    const check = checkContainment(candidateInput.range, containers, originalContainers, strictEquality);
    check.input = candidateInput.ip;
    checks.push(check);

    // Update counters
    switch (check.status) {
      case 'inside':
        inside++;
        break;
      case 'equal':
        equal++;
        break;
      case 'partial':
        partial++;
        break;
      case 'outside':
        outside++;
        break;
    }

    // Create visualization data
    const candidateRange = candidateInput.range;
    const vizContainers = containers.map((c, i) => ({
      start: c.start,
      end: c.end,
      label: originalContainers[i]?.ip || `Container ${i + 1}`,
    }));

    // Calculate gaps for visualization
    const coveredRanges: IPRange[] = [];
    for (const container of containers) {
      const overlapStart = candidateRange.start > container.start ? candidateRange.start : container.start;
      const overlapEnd = candidateRange.end < container.end ? candidateRange.end : container.end;

      if (overlapStart <= overlapEnd) {
        coveredRanges.push({
          start: overlapStart,
          end: overlapEnd,
          version: candidateRange.version,
        });
      }
    }

    const gaps = subtractRanges([candidateRange], mergeRanges(coveredRanges));

    // Find total range for visualization
    const allRanges = [candidateRange, ...containers, ...gaps];
    const totalStart = allRanges.reduce((min, r) => (r.start < min ? r.start : min), allRanges[0].start);
    const totalEnd = allRanges.reduce((max, r) => (r.end > max ? r.end : max), allRanges[0].end);

    visualization.push({
      candidate: candidateInput.ip,
      candidateRange: { start: candidateRange.start, end: candidateRange.end },
      containers: vizContainers,
      gaps: gaps.map((g) => ({
        start: g.start,
        end: g.end,
        cidr: rangeToCIDRs(g)[0] || `${bigIntToIP(g.start, g.version)}/${g.version === 4 ? 32 : 128}`,
      })),
      totalRange: { start: totalStart, end: totalEnd },
      version: candidateRange.version,
    });
  }

  // Calculate stats
  const totalA4 = calculateTotalAddresses(containersA4);
  const totalA6 = calculateTotalAddresses(containersA6);
  const totalSetA = totalA4 + totalA6;

  return {
    checks,
    stats: {
      setA: {
        count: ipv4RangesA.length + ipv6RangesA.length,
        addresses: totalSetA.toLocaleString(),
      },
      totalChecked: checks.length,
      inside,
      equal,
      partial,
      outside,
    },
    visualization,
    errors,
  };
}
