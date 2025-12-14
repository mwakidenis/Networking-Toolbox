/* CIDR Split Utilities */

export interface CIDRSplitInput {
  cidr: string;
  version: 4 | 6;
  network: bigint;
  prefix: number;
  maxPrefix: number;
}

export interface SubnetInfo {
  cidr: string;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  totalHosts: string;
  usableHosts: string;
}

export interface SplitResult {
  subnets: SubnetInfo[];
  stats: {
    parentCIDR: string;
    childCount: number;
    childPrefix: number;
    addressesPerChild: string;
    totalAddressesCovered: string;
    utilizationPercent: number;
  };
  visualization: {
    parentStart: bigint;
    parentEnd: bigint;
    childRanges: Array<{
      start: bigint;
      end: bigint;
      cidr: string;
      size: bigint;
    }>;
  };
  error?: string;
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

/* Parse CIDR input */
function parseCIDR(cidr: string): CIDRSplitInput {
  if (!cidr.includes('/')) {
    throw new Error('Input must be in CIDR format (e.g., 192.168.1.0/24)');
  }

  const [ip, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr);

  const version = ip.includes(':') ? 6 : 4;
  const maxPrefix = version === 4 ? 32 : 128;

  if (prefix < 0 || prefix > maxPrefix) {
    throw new Error(`Invalid prefix: ${prefix}. Must be 0-${maxPrefix} for IPv${version}`);
  }

  const network = version === 4 ? ipv4ToBigInt(ip) : ipv6ToBigInt(ip);
  const hostBits = BigInt(maxPrefix - prefix);
  const networkMask = ~((1n << hostBits) - 1n);
  const networkAddr = network & networkMask;

  return {
    cidr,
    version,
    network: networkAddr,
    prefix,
    maxPrefix,
  };
}

/* Create subnet info */
function createSubnetInfo(network: bigint, prefix: number, version: 4 | 6): SubnetInfo {
  const maxPrefix = version === 4 ? 32 : 128;
  const hostBits = BigInt(maxPrefix - prefix);
  const totalAddresses = 1n << hostBits;

  const networkAddr = network;
  const broadcastAddr = network + totalAddresses - 1n;

  const networkStr = version === 4 ? bigIntToIPv4(networkAddr) : bigIntToIPv6(networkAddr);
  const broadcastStr = version === 4 ? bigIntToIPv4(broadcastAddr) : bigIntToIPv6(broadcastAddr);

  let firstHostStr = networkStr;
  let lastHostStr = broadcastStr;
  let usableHosts = totalAddresses;

  if (version === 4 && prefix < 31) {
    firstHostStr = bigIntToIPv4(networkAddr + 1n);
    lastHostStr = bigIntToIPv4(broadcastAddr - 1n);
    usableHosts = totalAddresses - 2n;
  } else if (version === 6 && prefix < 128) {
    firstHostStr = bigIntToIPv6(networkAddr + 1n);
    lastHostStr = bigIntToIPv6(broadcastAddr - 1n);
    usableHosts = totalAddresses - 2n;
  }

  return {
    cidr: `${networkStr}/${prefix}`,
    network: networkStr,
    broadcast: broadcastStr,
    firstHost: firstHostStr,
    lastHost: lastHostStr,
    totalHosts: totalAddresses.toLocaleString(),
    usableHosts: usableHosts.toLocaleString(),
  };
}

/* Split CIDR into N equal subnets */
export function splitCIDRByCount(cidr: string, count: number): SplitResult {
  try {
    const input = parseCIDR(cidr);

    if (count <= 0) {
      return {
        subnets: [],
        stats: {
          parentCIDR: '',
          childCount: 0,
          childPrefix: 0,
          addressesPerChild: '0',
          totalAddressesCovered: '0',
          utilizationPercent: 0,
        },
        visualization: {
          parentStart: 0n,
          parentEnd: 0n,
          childRanges: [],
        },
        error: 'Count must be positive',
      };
    }

    // Find required prefix length for N subnets
    const requiredBits = Math.ceil(Math.log2(count));
    const childPrefix = input.prefix + requiredBits;

    if (childPrefix > input.maxPrefix) {
      return {
        subnets: [],
        stats: {
          parentCIDR: '',
          childCount: 0,
          childPrefix: 0,
          addressesPerChild: '0',
          totalAddressesCovered: '0',
          utilizationPercent: 0,
        },
        visualization: {
          parentStart: 0n,
          parentEnd: 0n,
          childRanges: [],
        },
        error: `Cannot create ${count} subnets: would require /${childPrefix} (max is /${input.maxPrefix})`,
      };
    }

    const actualSubnetCount = Math.pow(2, requiredBits);
    const subnetSize = 1n << BigInt(input.maxPrefix - childPrefix);

    const subnets: SubnetInfo[] = [];
    const childRanges = [];

    for (let i = 0; i < actualSubnetCount; i++) {
      const subnetNetwork = input.network + BigInt(i) * subnetSize;
      const subnet = createSubnetInfo(subnetNetwork, childPrefix, input.version);
      subnets.push(subnet);

      childRanges.push({
        start: subnetNetwork,
        end: subnetNetwork + subnetSize - 1n,
        cidr: subnet.cidr,
        size: subnetSize,
      });
    }

    const totalParentSize = 1n << BigInt(input.maxPrefix - input.prefix);
    const utilizationPercent = Math.round((count / actualSubnetCount) * 100);

    return {
      subnets: subnets.slice(0, count),
      stats: {
        parentCIDR: input.cidr,
        childCount: count,
        childPrefix,
        addressesPerChild: subnetSize.toLocaleString(),
        totalAddressesCovered: (BigInt(count) * subnetSize).toLocaleString(),
        utilizationPercent,
      },
      visualization: {
        parentStart: input.network,
        parentEnd: input.network + totalParentSize - 1n,
        childRanges: childRanges.slice(0, count),
      },
    };
  } catch (error) {
    return {
      subnets: [],
      stats: {
        parentCIDR: '',
        childCount: 0,
        childPrefix: 0,
        addressesPerChild: '0',
        totalAddressesCovered: '0',
        utilizationPercent: 0,
      },
      visualization: {
        parentStart: 0n,
        parentEnd: 0n,
        childRanges: [],
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/* Split CIDR to target prefix length */
export function splitCIDRByPrefix(cidr: string, targetPrefix: number): SplitResult {
  try {
    const input = parseCIDR(cidr);

    if (targetPrefix <= input.prefix) {
      return {
        subnets: [],
        stats: {
          parentCIDR: '',
          childCount: 0,
          childPrefix: 0,
          addressesPerChild: '0',
          totalAddressesCovered: '0',
          utilizationPercent: 0,
        },
        visualization: {
          parentStart: 0n,
          parentEnd: 0n,
          childRanges: [],
        },
        error: `Target prefix /${targetPrefix} must be greater than parent /${input.prefix}`,
      };
    }

    if (targetPrefix > input.maxPrefix) {
      return {
        subnets: [],
        stats: {
          parentCIDR: '',
          childCount: 0,
          childPrefix: 0,
          addressesPerChild: '0',
          totalAddressesCovered: '0',
          utilizationPercent: 0,
        },
        visualization: {
          parentStart: 0n,
          parentEnd: 0n,
          childRanges: [],
        },
        error: `Target prefix /${targetPrefix} exceeds maximum /${input.maxPrefix} for IPv${input.version}`,
      };
    }

    const subnetBits = targetPrefix - input.prefix;
    const subnetCount = Math.pow(2, subnetBits);
    const subnetSize = 1n << BigInt(input.maxPrefix - targetPrefix);

    const subnets: SubnetInfo[] = [];
    const childRanges = [];

    for (let i = 0; i < subnetCount; i++) {
      const subnetNetwork = input.network + BigInt(i) * subnetSize;
      const subnet = createSubnetInfo(subnetNetwork, targetPrefix, input.version);
      subnets.push(subnet);

      childRanges.push({
        start: subnetNetwork,
        end: subnetNetwork + subnetSize - 1n,
        cidr: subnet.cidr,
        size: subnetSize,
      });
    }

    const totalParentSize = 1n << BigInt(input.maxPrefix - input.prefix);

    return {
      subnets,
      stats: {
        parentCIDR: input.cidr,
        childCount: subnetCount,
        childPrefix: targetPrefix,
        addressesPerChild: subnetSize.toLocaleString(),
        totalAddressesCovered: (BigInt(subnetCount) * subnetSize).toLocaleString(),
        utilizationPercent: 100,
      },
      visualization: {
        parentStart: input.network,
        parentEnd: input.network + totalParentSize - 1n,
        childRanges,
      },
    };
  } catch (error) {
    return {
      subnets: [],
      stats: {
        parentCIDR: '',
        childCount: 0,
        childPrefix: 0,
        addressesPerChild: '0',
        totalAddressesCovered: '0',
        utilizationPercent: 0,
      },
      visualization: {
        parentStart: 0n,
        parentEnd: 0n,
        childRanges: [],
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
