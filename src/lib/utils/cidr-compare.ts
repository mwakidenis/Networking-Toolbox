/**
 * CIDR Compare Utility
 * Compare two lists of CIDR blocks to identify added, removed, and unchanged entries
 */

export interface CompareResult {
  success: boolean;
  error?: string;
  added: string[];
  removed: string[];
  unchanged: string[];
  normalizedA: string[];
  normalizedB: string[];
  summary: {
    totalA: number;
    totalB: number;
    addedCount: number;
    removedCount: number;
    unchangedCount: number;
  };
}

export interface CompareInput {
  listA: string;
  listB: string;
}

function parseIP(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

function ipToString(ip: number): string {
  return [(ip >>> 24) & 0xff, (ip >>> 16) & 0xff, (ip >>> 8) & 0xff, ip & 0xff].join('.');
}

function normalizeCIDR(cidr: string): string {
  if (!cidr.includes('/')) {
    // Single IP, convert to /32
    return `${cidr}/32`;
  }

  const [ipStr, prefixStr] = cidr.split('/');
  const prefixLength = parseInt(prefixStr);

  if (prefixLength < 0 || prefixLength > 32) {
    throw new Error(`Invalid prefix length: /${prefixLength}`);
  }

  // Calculate network address
  const ip = parseIP(ipStr);
  const mask = (0xffffffff << (32 - prefixLength)) >>> 0;
  const networkAddress = ip & mask;

  return `${ipToString(networkAddress)}/${prefixLength}`;
}

function parseAndNormalizeList(input: string): string[] {
  if (!input.trim()) return [];

  const lines = input
    .trim()
    .split('\n')
    .filter((line) => line.trim());
  const normalized = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      if (trimmed.includes('-')) {
        // IP range - convert to CIDR blocks
        const [startStr, endStr] = trimmed.split('-').map((s) => s.trim());
        const startIP = parseIP(startStr);
        const endIP = parseIP(endStr);

        if (startIP > endIP) {
          throw new Error(`Invalid range: start IP is greater than end IP in ${trimmed}`);
        }

        // Convert range to CIDR blocks (simplified - assumes aligned blocks)
        let current = startIP;
        while (current <= endIP) {
          // Find the largest CIDR block that fits
          let prefixLength = 32;
          let blockSize = 1;

          // Find largest power of 2 that fits
          for (let p = 0; p <= 32; p++) {
            const size = Math.pow(2, 32 - p);
            if (current % size === 0 && current + size - 1 <= endIP) {
              prefixLength = p;
              blockSize = size;
            } else {
              break;
            }
          }

          normalized.add(`${ipToString(current)}/${prefixLength}`);
          current += blockSize;
        }
      } else if (trimmed.match(/^\d+\.\d+\.\d+\.\d+(\/\d+)?$/)) {
        // CIDR or single IP
        normalized.add(normalizeCIDR(trimmed));
      } else {
        throw new Error(`Invalid format: ${trimmed}`);
      }
    } catch (error) {
      throw new Error(`Error processing "${trimmed}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Sort by network address
  return Array.from(normalized).sort((a, b) => {
    const aNetwork = parseIP(a.split('/')[0]);
    const bNetwork = parseIP(b.split('/')[0]);
    if (aNetwork !== bNetwork) {
      return aNetwork - bNetwork;
    }
    // If same network, sort by prefix length (more specific first)
    const aPrefix = parseInt(a.split('/')[1]);
    const bPrefix = parseInt(b.split('/')[1]);
    return bPrefix - aPrefix;
  });
}

/**
 * Compare two lists of CIDR blocks
 * @param params - The two lists to compare
 * @returns Comparison result with added, removed, and unchanged entries
 */
export function cidrCompare(params: CompareInput): CompareResult {
  try {
    const normalizedA = parseAndNormalizeList(params.listA);
    const normalizedB = parseAndNormalizeList(params.listB);

    const setA = new Set(normalizedA);
    const setB = new Set(normalizedB);

    const added = normalizedB.filter((item) => !setA.has(item));
    const removed = normalizedA.filter((item) => !setB.has(item));
    const unchanged = normalizedA.filter((item) => setB.has(item));

    return {
      success: true,
      added: added,
      removed: removed,
      unchanged: unchanged,
      normalizedA: normalizedA,
      normalizedB: normalizedB,
      summary: {
        totalA: normalizedA.length,
        totalB: normalizedB.length,
        addedCount: added.length,
        removedCount: removed.length,
        unchangedCount: unchanged.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      added: [],
      removed: [],
      unchanged: [],
      normalizedA: [],
      normalizedB: [],
      summary: {
        totalA: 0,
        totalB: 0,
        addedCount: 0,
        removedCount: 0,
        unchangedCount: 0,
      },
    };
  }
}
