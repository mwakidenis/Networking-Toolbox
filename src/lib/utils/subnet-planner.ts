/* Subnet Planner Utilities for VLSM Design */

export interface SubnetRequest {
  id: string;
  name: string;
  size: number; // number of required hosts
  prefix?: number; // calculated prefix length
  priority: number; // for sorting
}

export interface AllocatedSubnet {
  id: string;
  name: string;
  cidr: string;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  totalHosts: string;
  usableHosts: string;
  requestedSize: number;
  efficiency: number; // percentage utilization
}

export interface PlannerResult {
  allocated: AllocatedSubnet[];
  leftover: {
    cidr: string;
    size: string;
  }[];
  stats: {
    parentCIDR: string;
    totalRequested: number;
    totalAllocated: string;
    totalLeftover: string;
    efficiency: number;
    successfulAllocations: number;
    failedAllocations: number;
  };
  visualization: {
    parent: { start: bigint; end: bigint; cidr: string };
    allocated: { start: bigint; end: bigint; cidr: string; name: string; id: string }[];
    leftover: { start: bigint; end: bigint; cidr: string }[];
    version: 4 | 6;
    totalRange: { start: bigint; end: bigint };
  };
  errors: string[];
  warnings: string[];
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

/* Calculate required prefix for host count */
function calculateRequiredPrefix(hostCount: number, version: 4 | 6, usableHosts: boolean = true): number {
  const maxPrefix = version === 4 ? 32 : 128;

  if (hostCount <= 0) return maxPrefix;

  let requiredAddresses = hostCount;

  // For IPv4, account for network and broadcast addresses
  if (version === 4 && usableHosts && hostCount > 1) {
    requiredAddresses = hostCount + 2;
  }

  // Find minimum prefix that can accommodate the addresses
  const requiredBits = Math.ceil(Math.log2(requiredAddresses));
  const prefix = maxPrefix - requiredBits;

  return Math.max(0, prefix);
}

/* Parse parent CIDR */
function parseParentCIDR(cidr: string): {
  version: 4 | 6;
  network: bigint;
  broadcast: bigint;
  prefix: number;
  totalSize: bigint;
} {
  if (!cidr.includes('/')) {
    throw new Error('Parent must be in CIDR format (e.g., 192.168.1.0/24)');
  }

  const [ip, prefixStr] = cidr.split('/');
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
    version,
    network: networkBig,
    broadcast: broadcastBig,
    prefix,
    totalSize,
  };
}

/* Create allocated subnet info */
function createAllocatedSubnet(
  request: SubnetRequest,
  network: bigint,
  prefix: number,
  version: 4 | 6,
  usableHosts: boolean,
): AllocatedSubnet {
  const maxPrefix = version === 4 ? 32 : 128;
  const hostBits = BigInt(maxPrefix - prefix);
  const totalAddresses = 1n << hostBits;

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

  const efficiency = Math.round((request.size / Number(usableAddresses)) * 100);

  return {
    id: request.id,
    name: request.name,
    cidr: `${networkStr}/${prefix}`,
    network: networkStr,
    broadcast: broadcastStr,
    firstHost: firstHostStr,
    lastHost: lastHostStr,
    totalHosts: totalAddresses.toLocaleString(),
    usableHosts: usableAddresses.toLocaleString(),
    requestedSize: request.size,
    efficiency,
  };
}

/* Find leftover space blocks */
function findLeftoverSpace(
  parentNetwork: bigint,
  parentBroadcast: bigint,
  allocatedRanges: { start: bigint; end: bigint }[],
  version: 4 | 6,
): { cidr: string; size: string }[] {
  if (allocatedRanges.length === 0) {
    // Entire parent is leftover
    const size = parentBroadcast - parentNetwork + 1n;
    return [
      {
        cidr: `${numberToIP(parentNetwork, version)}-${numberToIP(parentBroadcast, version)}`,
        size: size.toLocaleString(),
      },
    ];
  }

  // Sort allocated ranges
  const sorted = [...allocatedRanges].sort((a, b) => (a.start < b.start ? -1 : 1));
  const leftover: { cidr: string; size: string }[] = [];

  // Check space before first allocation
  if (sorted[0].start > parentNetwork) {
    const size = sorted[0].start - parentNetwork;
    leftover.push({
      cidr: `${numberToIP(parentNetwork, version)}-${numberToIP(sorted[0].start - 1n, version)}`,
      size: size.toLocaleString(),
    });
  }

  // Check gaps between allocations
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = sorted[i + 1].start - sorted[i].end - 1n;
    if (gap > 0n) {
      leftover.push({
        cidr: `${numberToIP(sorted[i].end + 1n, version)}-${numberToIP(sorted[i + 1].start - 1n, version)}`,
        size: gap.toLocaleString(),
      });
    }
  }

  // Check space after last allocation
  const lastEnd = sorted[sorted.length - 1].end;
  if (lastEnd < parentBroadcast) {
    const size = parentBroadcast - lastEnd;
    leftover.push({
      cidr: `${numberToIP(lastEnd + 1n, version)}-${numberToIP(parentBroadcast, version)}`,
      size: size.toLocaleString(),
    });
  }

  return leftover;
}

/* Plan subnet allocation using VLSM */
export function planSubnets(
  parentCIDR: string,
  requests: SubnetRequest[],
  strategy: 'preserve-order' | 'fit-best' = 'fit-best',
  usableHosts: boolean = true,
): PlannerResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Parse parent CIDR
    const parent = parseParentCIDR(parentCIDR);

    // Validate and calculate prefixes for requests
    const processedRequests = requests
      .map((req) => {
        if (req.size <= 0) {
          errors.push(`Invalid size for "${req.name}": must be positive`);
          return { ...req, prefix: parent.version === 4 ? 32 : 128 };
        }

        const prefix = calculateRequiredPrefix(req.size, parent.version, usableHosts);
        if (prefix <= parent.prefix) {
          errors.push(`"${req.name}" requires /${prefix} which is larger than parent /${parent.prefix}`);
        }

        return { ...req, prefix };
      })
      .filter((req) => req.prefix > parent.prefix);

    if (errors.length > 0) {
      return {
        allocated: [],
        leftover: [],
        stats: {
          parentCIDR,
          totalRequested: requests.reduce((sum, r) => sum + r.size, 0),
          totalAllocated: '0',
          totalLeftover: parent.totalSize.toLocaleString(),
          efficiency: 0,
          successfulAllocations: 0,
          failedAllocations: requests.length,
        },
        visualization: {
          parent: { start: parent.network, end: parent.broadcast, cidr: parentCIDR },
          allocated: [],
          leftover: [],
          version: parent.version,
          totalRange: { start: parent.network, end: parent.broadcast },
        },
        errors,
        warnings,
      };
    }

    // Sort requests based on strategy
    const sortedRequests =
      strategy === 'fit-best'
        ? [...processedRequests].sort((a, b) => a.prefix! - b.prefix!) // Largest first
        : [...processedRequests]; // Preserve order

    // Allocate subnets
    const allocated: AllocatedSubnet[] = [];
    const allocatedRanges: { start: bigint; end: bigint }[] = [];
    let currentAddress = parent.network;

    for (const request of sortedRequests) {
      const maxPrefix = parent.version === 4 ? 32 : 128;
      const hostBits = BigInt(maxPrefix - request.prefix!);
      const subnetSize = 1n << hostBits;

      // Align to subnet boundary
      const mask = ~(subnetSize - 1n);
      const alignedAddress = (currentAddress + subnetSize - 1n) & mask;

      // Check if subnet fits in remaining space
      if (alignedAddress + subnetSize - 1n > parent.broadcast) {
        warnings.push(`Could not allocate "${request.name}": insufficient space remaining`);
        continue;
      }

      // Create allocated subnet
      const subnet = createAllocatedSubnet(request, alignedAddress, request.prefix!, parent.version, usableHosts);

      allocated.push(subnet);
      allocatedRanges.push({
        start: alignedAddress,
        end: alignedAddress + subnetSize - 1n,
      });

      currentAddress = alignedAddress + subnetSize;
    }

    // Calculate leftover space
    const leftover = findLeftoverSpace(parent.network, parent.broadcast, allocatedRanges, parent.version);

    // Calculate statistics
    const totalAllocatedAddresses = allocatedRanges.reduce((sum, range) => sum + (range.end - range.start + 1n), 0n);
    const totalLeftoverAddresses = leftover.reduce((sum, block) => sum + BigInt(block.size.replace(/,/g, '')), 0n);
    const efficiency = Math.round(Number(totalAllocatedAddresses * 100n) / Number(parent.totalSize));

    // Generate visualization
    const visualization = {
      parent: { start: parent.network, end: parent.broadcast, cidr: parentCIDR },
      allocated: allocated.map((subnet, i) => ({
        start: allocatedRanges[i].start,
        end: allocatedRanges[i].end,
        cidr: subnet.cidr,
        name: subnet.name,
        id: subnet.id,
      })),
      leftover: leftover.map((block, _i) => {
        const [startStr, endStr] = block.cidr.split('-');
        return {
          start: ipToNumber(startStr, parent.version),
          end: ipToNumber(endStr, parent.version),
          cidr: block.cidr,
        };
      }),
      version: parent.version,
      totalRange: { start: parent.network, end: parent.broadcast },
    };

    return {
      allocated,
      leftover,
      stats: {
        parentCIDR,
        totalRequested: requests.reduce((sum, r) => sum + r.size, 0),
        totalAllocated: totalAllocatedAddresses.toLocaleString(),
        totalLeftover: totalLeftoverAddresses.toLocaleString(),
        efficiency,
        successfulAllocations: allocated.length,
        failedAllocations: requests.length - allocated.length,
      },
      visualization,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      allocated: [],
      leftover: [],
      stats: {
        parentCIDR,
        totalRequested: 0,
        totalAllocated: '0',
        totalLeftover: '0',
        efficiency: 0,
        successfulAllocations: 0,
        failedAllocations: requests.length,
      },
      visualization: {
        parent: { start: 0n, end: 0n, cidr: parentCIDR },
        allocated: [],
        leftover: [],
        version: 4,
        totalRange: { start: 0n, end: 0n },
      },
      errors: [error instanceof Error ? error.message : 'Unknown error', ...errors],
      warnings,
    };
  }
}
