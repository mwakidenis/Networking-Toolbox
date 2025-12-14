/**
 * CIDR Deaggregation Utility
 * Decompose CIDR blocks and ranges into uniform target prefix subnets
 */

export interface DeaggregateResult {
  success: boolean;
  error?: string;
  subnets: string[];
  totalSubnets: number;
  totalAddresses: number;
  inputSummary: {
    totalInputs: number;
    totalInputAddresses: number;
  };
}

export interface DeaggregateInput {
  input: string;
  targetPrefix: number;
}

function parseIP(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

function ipToString(ip: number): string {
  return [(ip >>> 24) & 0xff, (ip >>> 16) & 0xff, (ip >>> 8) & 0xff, ip & 0xff].join('.');
}

function parseCIDR(cidr: string): { network: number; prefixLength: number; size: number } {
  const [networkStr, prefixStr] = cidr.split('/');
  const prefixLength = parseInt(prefixStr);

  if (isNaN(prefixLength) || prefixLength < 0 || prefixLength > 32) {
    throw new Error(`Invalid prefix length: /${prefixStr}`);
  }

  const network = parseIP(networkStr) & (0xffffffff << (32 - prefixLength));
  const size = Math.pow(2, 32 - prefixLength);
  return { network, prefixLength, size };
}

function parseRange(range: string): { start: number; end: number } {
  const [startStr, endStr] = range.split('-');
  return {
    start: parseIP(startStr.trim()),
    end: parseIP(endStr.trim()),
  };
}

function deaggregateBlock(network: number, size: number, targetPrefix: number): string[] | { error: string } {
  const targetSize = Math.pow(2, 32 - targetPrefix);
  const subnets: string[] = [];

  if (targetSize > size) {
    // Target prefix is larger than the block, return the block as-is if it aligns
    const currentPrefix = 32 - Math.log2(size);
    if (Number.isInteger(currentPrefix) && network % size === 0) {
      subnets.push(`${ipToString(network)}/${currentPrefix}`);
    }
    return subnets;
  }

  // Calculate how many subnets this would generate
  const subnetCount = size / targetSize;

  // Safety limit to prevent browser crashes (max 10,000 subnets per block)
  if (subnetCount > 10000) {
    const sourcePrefix = 32 - Math.log2(size);
    return {
      error: `Block ${ipToString(network)}/${sourcePrefix} would generate ${subnetCount.toLocaleString()} subnets of /${targetPrefix}. This exceeds the safety limit of 10,000 subnets per block to prevent browser crashes.`,
    };
  }

  // Generate subnets of target size
  for (let addr = network; addr < network + size; addr += targetSize) {
    subnets.push(`${ipToString(addr)}/${targetPrefix}`);
  }

  return subnets;
}

/**
 * Deaggregate CIDR blocks and IP ranges into uniform target prefix subnets
 * @param params - The input networks/ranges and target prefix length
 * @returns Deaggregated subnets with statistics
 */
export function cidrDeaggregate(params: DeaggregateInput): DeaggregateResult {
  const { input, targetPrefix } = params;

  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'No input provided',
        subnets: [],
        totalSubnets: 0,
        totalAddresses: 0,
        inputSummary: {
          totalInputs: 0,
          totalInputAddresses: 0,
        },
      };
    }

    if (targetPrefix < 1 || targetPrefix > 32) {
      return {
        success: false,
        error: 'Target prefix must be between 1 and 32',
        subnets: [],
        totalSubnets: 0,
        totalAddresses: 0,
        inputSummary: {
          totalInputs: 0,
          totalInputAddresses: 0,
        },
      };
    }

    const lines = input
      .trim()
      .split('\n')
      .filter((line) => line.trim());
    const allSubnets: string[] = [];
    let totalInputAddresses = 0;
    const seenSubnets = new Set<string>();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let network: number;
      let size: number;

      if (trimmed.includes('/')) {
        // CIDR notation
        try {
          const parsed = parseCIDR(trimmed);
          network = parsed.network;
          size = parsed.size;
          totalInputAddresses += size;
        } catch {
          throw new Error(`Invalid CIDR: ${trimmed}`);
        }
      } else if (trimmed.includes('-')) {
        // IP range
        try {
          const { start, end } = parseRange(trimmed);
          if (start > end) {
            throw new Error(`Invalid range: start IP is greater than end IP in ${trimmed}`);
          }
          network = start;
          size = end - start + 1;
          totalInputAddresses += size;
        } catch {
          throw new Error(`Invalid range: ${trimmed}`);
        }
      } else if (trimmed.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        // Single IP
        network = parseIP(trimmed);
        size = 1;
        totalInputAddresses += 1;
      } else {
        throw new Error(`Invalid input format: ${trimmed}`);
      }

      // Deaggregate this block
      const blockResult = deaggregateBlock(network, size, targetPrefix);

      // Check if it returned an error
      if ('error' in blockResult) {
        throw new Error(blockResult.error);
      }

      // Add unique subnets
      for (const subnet of blockResult) {
        if (!seenSubnets.has(subnet)) {
          seenSubnets.add(subnet);
          allSubnets.push(subnet);
        }
      }
    }

    // Overall safety check for total subnets
    if (allSubnets.length > 25000) {
      throw new Error(
        `Total would generate ${allSubnets.length.toLocaleString()} subnets. This exceeds the safety limit of 25,000 total subnets to prevent browser performance issues.`,
      );
    }

    // Sort subnets by network address
    allSubnets.sort((a, b) => {
      const aNet = parseIP(a.split('/')[0]);
      const bNet = parseIP(b.split('/')[0]);
      return aNet - bNet;
    });

    const targetSize = Math.pow(2, 32 - targetPrefix);
    const totalAddresses = allSubnets.length * targetSize;

    return {
      success: true,
      subnets: allSubnets,
      totalSubnets: allSubnets.length,
      totalAddresses: totalAddresses,
      inputSummary: {
        totalInputs: lines.length,
        totalInputAddresses: totalInputAddresses,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      subnets: [],
      totalSubnets: 0,
      totalAddresses: 0,
      inputSummary: {
        totalInputs: 0,
        totalInputAddresses: 0,
      },
    };
  }
}

/**
 * Get subnet size for a prefix length
 */
export function getSubnetSize(prefixLength: number): number {
  return Math.pow(2, 32 - prefixLength);
}
