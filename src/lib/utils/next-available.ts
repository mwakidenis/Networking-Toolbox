import { computeCIDRDifference, type IPRange, type ParsedInput as _ParsedInput } from './cidr-diff.js';

export type AllocationPolicy = 'first-fit' | 'best-fit';

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
  if (ip.includes(':')) {
    return 6;
  }
  if (ip.split('.').length === 4) {
    return 4;
  }
  throw new Error(`Cannot determine IP version: ${ip}`);
}

function _isValidIPv4(ip: string): boolean {
  try {
    ipv4ToBigInt(ip);
    return true;
  } catch {
    return false;
  }
}

function _isValidIPv6(ip: string): boolean {
  try {
    ipv6ToBigInt(ip);
    return true;
  } catch {
    return false;
  }
}

function ipToNumber(ip: string, version: 4 | 6): bigint {
  return version === 4 ? ipv4ToBigInt(ip) : ipv6ToBigInt(ip);
}

function numberToIP(num: bigint, version: 4 | 6): string {
  return version === 4 ? bigIntToIPv4(num) : bigIntToIPv6(num);
}

/* Parse input (IP, CIDR, or range) - simplified version */
function parseIPInput(input: string): Array<{
  start_ip: string;
  end_ip: string;
  cidr?: string;
}> {
  const lines = input.split('\n').filter((line) => line.trim());
  const results = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      if (trimmed.includes('-')) {
        // Range format
        const [start, end] = trimmed.split('-').map((s) => s.trim());
        results.push({ start_ip: start, end_ip: end });
      } else if (trimmed.includes('/')) {
        // CIDR format
        const parts = trimmed.split('/');
        if (parts.length !== 2) {
          throw new Error(`Invalid CIDR format: ${trimmed}`);
        }

        const [ip, prefixStr] = parts;
        const version = detectIPVersion(ip);
        const prefix = parseInt(prefixStr);
        const maxPrefix = version === 4 ? 32 : 128;

        if (isNaN(prefix) || prefix < 0 || prefix > maxPrefix) {
          throw new Error(`Invalid prefix length: ${prefixStr}`);
        }

        const ipBig = ipToNumber(ip, version);
        const hostBits = BigInt(maxPrefix - prefix);
        const networkBig = (ipBig >> hostBits) << hostBits;
        const broadcastBig = networkBig + (1n << hostBits) - 1n;

        results.push({
          start_ip: numberToIP(networkBig, version),
          end_ip: numberToIP(broadcastBig, version),
          cidr: trimmed,
        });
      } else {
        // Single IP
        results.push({ start_ip: trimmed, end_ip: trimmed });
      }
    } catch {
      // Skip invalid entries
    }
  }

  return results;
}

function convertToIPRanges(parsed: Array<{ start_ip: string; end_ip: string; cidr?: string }>): IPRange[] {
  return parsed.map((item) => {
    const version = detectIPVersion(item.start_ip);
    return {
      start: ipToNumber(item.start_ip, version),
      end: ipToNumber(item.end_ip, version),
      version,
    };
  });
}

export interface NextAvailableInput {
  pools: string;
  allocations: string;
  desiredPrefix?: number;
  desiredHostCount?: number;
  ipv4UsableHosts: boolean;
  policy: AllocationPolicy;
  maxCandidates: number;
}

export interface AvailableSubnet {
  cidr: string;
  network: string;
  broadcast: string;
  parentPool: string;
  size: string;
  usableHosts: string;
  gapSize: string;
  firstHost?: string;
  lastHost?: string;
}

export interface NextAvailableResult {
  candidates: AvailableSubnet[];
  stats: {
    totalPools: number;
    totalAllocations: number;
    totalFreeSpace: string;
    largestFreeBlock: string;
    fragmentationCount: number;
    requestedPrefix: number;
    requestedSize: string;
  };
  freeSpaceBlocks: {
    cidr: string;
    size: string;
    parentPool: string;
  }[];
  visualization?: {
    pools: { start: bigint; end: bigint; cidr: string }[];
    allocations: { start: bigint; end: bigint; cidr: string }[];
    freeSpace: { start: bigint; end: bigint; cidr: string; parentPool: string }[];
    candidates: { start: bigint; end: bigint; cidr: string }[];
    version: 4 | 6;
    totalRange: { start: bigint; end: bigint };
  };
  warnings: string[];
  errors: string[];
}

/**
 * Calculate the minimum prefix length needed for a given host count
 */
function calculateRequiredPrefix(hostCount: number, version: 4 | 6, usableHosts: boolean): number {
  const maxPrefix = version === 4 ? 32 : 128;

  if (hostCount <= 0) {
    return maxPrefix;
  }

  let requiredAddresses = hostCount;

  // For IPv4, if usableHosts is true, we need to account for network and broadcast
  if (version === 4 && usableHosts && hostCount > 1) {
    requiredAddresses = hostCount + 2;
  }

  // Find the minimum prefix that can accommodate the required addresses
  const requiredBits = Math.ceil(Math.log2(requiredAddresses));
  const prefix = maxPrefix - requiredBits;

  return Math.max(0, prefix);
}

/**
 * Align an IP address to subnet boundaries for a given prefix
 */
function alignToSubnetBoundary(ip: bigint, prefix: number, version: 4 | 6): bigint {
  const maxPrefix = version === 4 ? 32 : 128;
  const hostBits = maxPrefix - prefix;
  const subnetSize = 1n << BigInt(hostBits);

  return (ip / subnetSize) * subnetSize;
}

/**
 * Generate all possible subnets of a given prefix within a free block
 */
function generateSubnetsInBlock(blockStart: bigint, blockEnd: bigint, targetPrefix: number, version: 4 | 6): bigint[] {
  const maxPrefix = version === 4 ? 32 : 128;
  const hostBits = maxPrefix - targetPrefix;
  const subnetSize = 1n << BigInt(hostBits);

  const subnets: bigint[] = [];
  const alignedStart = alignToSubnetBoundary(blockStart, targetPrefix, version);

  for (let addr = alignedStart; addr <= blockEnd - subnetSize + 1n; addr += subnetSize) {
    if (addr >= blockStart) {
      subnets.push(addr);
    }
  }

  return subnets;
}

/**
 * Create subnet info from network address
 */
function createSubnetInfo(
  network: bigint,
  prefix: number,
  version: 4 | 6,
  parentPool: string,
  gapSize: bigint,
  usableHosts: boolean,
): AvailableSubnet {
  const maxPrefix = version === 4 ? 32 : 128;
  const hostBits = maxPrefix - prefix;
  const totalAddresses = 1n << BigInt(hostBits);

  const networkAddr = network;
  const broadcastAddr = network + totalAddresses - 1n;

  const networkStr = numberToIP(networkAddr, version);
  const broadcastStr = numberToIP(broadcastAddr, version);

  let usableAddresses = totalAddresses;
  let firstHostStr = networkStr;
  let lastHostStr = broadcastStr;

  if (version === 4 && prefix < 31 && usableHosts) {
    usableAddresses = totalAddresses - 2n;
    firstHostStr = numberToIP(networkAddr + 1n, version);
    lastHostStr = numberToIP(broadcastAddr - 1n, version);
  } else if (version === 6 && prefix < 128) {
    firstHostStr = numberToIP(networkAddr + 1n, version);
    lastHostStr = numberToIP(broadcastAddr - 1n, version);
  }

  return {
    cidr: `${networkStr}/${prefix}`,
    network: networkStr,
    broadcast: broadcastStr,
    parentPool,
    size: totalAddresses.toLocaleString(),
    usableHosts: usableAddresses.toLocaleString(),
    gapSize: gapSize.toLocaleString(),
    firstHost: firstHostStr,
    lastHost: lastHostStr,
  };
}

/**
 * Find the next available subnet(s) from pools minus allocations
 */
export function findNextAvailableSubnet(input: NextAvailableInput): NextAvailableResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Parse pools
    let pools: IPRange[] = [];
    if (input.pools.trim()) {
      try {
        const parsed = parseIPInput(input.pools);
        pools = convertToIPRanges(parsed);
      } catch (error) {
        errors.push(`Pool parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (pools.length === 0) {
      errors.push('At least one pool CIDR is required');
    }

    // Parse allocations
    let allocations: IPRange[] = [];
    if (input.allocations.trim()) {
      try {
        const parsed = parseIPInput(input.allocations);
        allocations = convertToIPRanges(parsed);
      } catch (error) {
        warnings.push(`Allocation parsing warning: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Determine IP version (use first pool)
    const version = pools.length > 0 ? pools[0].version : 4;
    const maxPrefix = version === 4 ? 32 : 128;

    // Filter pools and allocations by IP version
    const versionPools = pools.filter((p) => p.version === version);
    const versionAllocations = allocations.filter((a) => a.version === version);

    // Determine target prefix
    let targetPrefix: number;

    if (input.desiredPrefix !== undefined && input.desiredHostCount !== undefined) {
      errors.push('Specify either desired prefix OR host count, not both');
      targetPrefix = input.desiredPrefix;
    } else if (input.desiredPrefix !== undefined) {
      targetPrefix = input.desiredPrefix;
      if (targetPrefix < 0 || targetPrefix > maxPrefix) {
        errors.push(`Invalid prefix /${targetPrefix}. Must be 0-${maxPrefix} for IPv${version}`);
      }
    } else if (input.desiredHostCount !== undefined) {
      targetPrefix = calculateRequiredPrefix(input.desiredHostCount, version, input.ipv4UsableHosts);
      if (targetPrefix < 0) {
        errors.push(`Host count ${input.desiredHostCount} is too large for IPv${version}`);
      }
    } else {
      errors.push('Must specify either desired prefix or host count');
      targetPrefix = 24; // Default fallback
    }

    if (errors.length > 0) {
      return {
        candidates: [],
        stats: {
          totalPools: versionPools.length,
          totalAllocations: versionAllocations.length,
          totalFreeSpace: '0',
          largestFreeBlock: '0',
          fragmentationCount: 0,
          requestedPrefix: targetPrefix,
          requestedSize: '0',
        },
        freeSpaceBlocks: [],
        warnings,
        errors,
      };
    }

    // Calculate free space for each pool
    const allFreeBlocks: { start: bigint; end: bigint; cidr: string; parentPool: string }[] = [];
    const poolResults: { pool: string; freeBlocks: IPRange[] }[] = [];

    for (const pool of versionPools) {
      const poolStr = `${numberToIP(pool.start, version)}-${numberToIP(pool.end, version)}`;
      try {
        // Calculate pool - allocations for this specific pool
        const poolAllocationsStr = versionAllocations
          .filter((alloc) => {
            // Check if allocation overlaps with this pool
            return alloc.start <= pool.end && alloc.end >= pool.start;
          })
          .map((alloc) => `${numberToIP(alloc.start, version)}-${numberToIP(alloc.end, version)}`)
          .join('\n');

        const diffResult = computeCIDRDifference(poolStr, poolAllocationsStr, 'minimal');

        const freeBlocks: IPRange[] = [];

        // Convert difference result back to IPRange format
        const allFreeAddresses = [...diffResult.ipv4, ...diffResult.ipv6];
        for (const freeCidr of allFreeAddresses) {
          try {
            const parsed = parseIPInput(freeCidr);
            const converted = convertToIPRanges(parsed);
            freeBlocks.push(...converted);
          } catch {
            // Skip invalid blocks
          }
        }

        poolResults.push({ pool: poolStr, freeBlocks });

        // Add to global free blocks list
        for (const block of freeBlocks) {
          allFreeBlocks.push({
            start: block.start,
            end: block.end,
            cidr: `${numberToIP(block.start, version)}-${numberToIP(block.end, version)}`,
            parentPool: poolStr,
          });
        }
      } catch (error) {
        warnings.push(`Error processing pool ${poolStr}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Check for allocations outside pools
    for (const allocation of versionAllocations) {
      let isInsideAnyPool = false;
      for (const pool of versionPools) {
        if (allocation.start >= pool.start && allocation.end <= pool.end) {
          isInsideAnyPool = true;
          break;
        }
      }

      if (!isInsideAnyPool) {
        const allocStr = `${numberToIP(allocation.start, version)}-${numberToIP(allocation.end, version)}`;
        warnings.push(`Allocation ${allocStr} is outside all pools`);
      }
    }

    // Generate candidate subnets
    const candidates: AvailableSubnet[] = [];
    const subnetCandidates: { network: bigint; gapSize: bigint; parentPool: string }[] = [];

    for (const block of allFreeBlocks) {
      const possibleSubnets = generateSubnetsInBlock(block.start, block.end, targetPrefix, version);

      for (const subnet of possibleSubnets) {
        subnetCandidates.push({
          network: subnet,
          gapSize: block.end - block.start + 1n,
          parentPool: block.parentPool,
        });
      }
    }

    // Sort candidates based on policy
    if (input.policy === 'first-fit') {
      // Sort by network address (lowest first)
      subnetCandidates.sort((a, b) => (a.network < b.network ? -1 : 1));
    } else if (input.policy === 'best-fit') {
      // Sort by gap size (smallest gap first), then by network address
      subnetCandidates.sort((a, b) => {
        if (a.gapSize !== b.gapSize) {
          return a.gapSize < b.gapSize ? -1 : 1;
        }
        return a.network < b.network ? -1 : 1;
      });
    }

    // Take top candidates
    const maxCandidates = Math.min(input.maxCandidates, subnetCandidates.length);
    for (let i = 0; i < maxCandidates; i++) {
      const candidate = subnetCandidates[i];
      const subnetInfo = createSubnetInfo(
        candidate.network,
        targetPrefix,
        version,
        candidate.parentPool,
        candidate.gapSize,
        input.ipv4UsableHosts,
      );
      candidates.push(subnetInfo);
    }

    // Calculate stats
    let totalFreeAddresses = 0n;
    let largestBlock = 0n;

    for (const block of allFreeBlocks) {
      const blockSize = block.end - block.start + 1n;
      totalFreeAddresses += blockSize;
      if (blockSize > largestBlock) {
        largestBlock = blockSize;
      }
    }

    const requestedSize = 1n << BigInt(maxPrefix - targetPrefix);

    // Create free space blocks for display
    const freeSpaceBlocks = allFreeBlocks.map((block) => ({
      cidr: block.cidr,
      size: (block.end - block.start + 1n).toLocaleString(),
      parentPool: block.parentPool,
    }));

    // Generate visualization data
    const visualization = generateVisualization(versionPools, versionAllocations, allFreeBlocks, candidates, version);

    return {
      candidates,
      stats: {
        totalPools: versionPools.length,
        totalAllocations: versionAllocations.length,
        totalFreeSpace: totalFreeAddresses.toLocaleString(),
        largestFreeBlock: largestBlock.toLocaleString(),
        fragmentationCount: allFreeBlocks.length,
        requestedPrefix: targetPrefix,
        requestedSize: requestedSize.toLocaleString(),
      },
      freeSpaceBlocks,
      visualization,
      warnings,
      errors,
    };
  } catch (error) {
    return {
      candidates: [],
      stats: {
        totalPools: 0,
        totalAllocations: 0,
        totalFreeSpace: '0',
        largestFreeBlock: '0',
        fragmentationCount: 0,
        requestedPrefix: 24,
        requestedSize: '0',
      },
      freeSpaceBlocks: [],
      warnings,
      errors: [error instanceof Error ? error.message : 'Unknown error', ...errors],
    };
  }
}

/**
 * Generate visualization data
 */
function generateVisualization(
  pools: IPRange[],
  allocations: IPRange[],
  freeBlocks: { start: bigint; end: bigint; cidr: string; parentPool: string }[],
  candidates: AvailableSubnet[],
  version: 4 | 6,
) {
  if (pools.length === 0) return undefined;

  try {
    const poolRanges = pools.map((p) => ({
      start: p.start,
      end: p.end,
      cidr: `${numberToIP(p.start, version)}-${numberToIP(p.end, version)}`,
    }));

    const allocationRanges = allocations.map((a) => ({
      start: a.start,
      end: a.end,
      cidr: `${numberToIP(a.start, version)}-${numberToIP(a.end, version)}`,
    }));

    const candidateRanges = candidates.map((c) => {
      const start = ipToNumber(c.network, version);
      const end = ipToNumber(c.broadcast, version);
      return { start, end, cidr: c.cidr };
    });

    // Calculate total range
    let minAddr = poolRanges[0].start;
    let maxAddr = poolRanges[0].end;

    for (const pool of poolRanges) {
      if (pool.start < minAddr) minAddr = pool.start;
      if (pool.end > maxAddr) maxAddr = pool.end;
    }

    return {
      pools: poolRanges,
      allocations: allocationRanges,
      freeSpace: freeBlocks.map((f) => ({ ...f, cidr: f.cidr })),
      candidates: candidateRanges,
      version,
      totalRange: { start: minAddr, end: maxAddr },
    };
  } catch {
    return undefined;
  }
}
