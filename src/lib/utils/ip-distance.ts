/* IP Distance Calculation Utilities */

export interface DistanceCalculation {
  startIP: string;
  endIP: string;
  distance: string;
  distanceNumber: bigint;
  version: 4 | 6;
  inclusive: boolean;
  direction: 'forward' | 'backward';
  intermediateAddresses: string[];
  isValid: boolean;
  error?: string;
}

export interface DistanceResult {
  calculations: DistanceCalculation[];
  summary: {
    totalCalculations: number;
    validCalculations: number;
    invalidCalculations: number;
    totalDistance: string;
    averageDistance: string;
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

  let ipv6 = groups.join(':');

  // Apply IPv6 compression - replace longest sequence of consecutive zeros
  // Find all sequences of consecutive zero groups
  const zeroSequences = [];
  let currentStart = -1;

  for (let i = 0; i < groups.length; i++) {
    if (groups[i] === '0') {
      if (currentStart === -1) currentStart = i;
    } else {
      if (currentStart !== -1) {
        zeroSequences.push({ start: currentStart, length: i - currentStart });
        currentStart = -1;
      }
    }
  }

  // Check if there's a trailing sequence
  if (currentStart !== -1) {
    zeroSequences.push({ start: currentStart, length: groups.length - currentStart });
  }

  // Find the longest sequence (at least 2 consecutive zeros)
  const longestSequence = zeroSequences.filter((seq) => seq.length >= 2).sort((a, b) => b.length - a.length)[0];

  if (longestSequence) {
    const before = groups.slice(0, longestSequence.start).join(':');
    const after = groups.slice(longestSequence.start + longestSequence.length).join(':');

    if (before && after) {
      ipv6 = `${before}::${after}`;
    } else if (before) {
      ipv6 = `${before}::`;
    } else if (after) {
      ipv6 = `::${after}`;
    } else {
      ipv6 = '::';
    }
  }

  return ipv6;
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

/* Generate intermediate IP addresses */
function generateIntermediateAddresses(
  start: bigint,
  end: bigint,
  version: 4 | 6,
  maxAddresses: number = 10,
): string[] {
  const distance = end > start ? end - start : start - end;

  if (distance <= BigInt(maxAddresses)) {
    // Generate all addresses if distance is small
    const addresses: string[] = [];
    const [minAddr, maxAddr] = start < end ? [start, end] : [end, start];

    for (let addr = minAddr + 1n; addr < maxAddr && addresses.length < maxAddresses; addr++) {
      addresses.push(numberToIP(addr, version));
    }

    return addresses;
  } else {
    // Generate sample addresses across the range
    const addresses: string[] = [];
    const step = distance / BigInt(maxAddresses + 1);

    for (let i = 1; i <= maxAddresses; i++) {
      const addr = start < end ? start + step * BigInt(i) : start - step * BigInt(i);
      addresses.push(numberToIP(addr, version));
    }

    return addresses;
  }
}

/* Calculate distance between two IP addresses */
function calculateIPDistance(
  startIP: string,
  endIP: string,
  inclusive: boolean = true,
  showIntermediates: boolean = false,
): DistanceCalculation {
  try {
    const startVersion = detectIPVersion(startIP);
    const endVersion = detectIPVersion(endIP);

    if (startVersion !== endVersion) {
      throw new Error('Both IP addresses must be the same version');
    }

    const startNum = ipToNumber(startIP, startVersion);
    const endNum = ipToNumber(endIP, startVersion);

    let distance = endNum > startNum ? endNum - startNum : startNum - endNum;
    const direction: 'forward' | 'backward' = endNum >= startNum ? 'forward' : 'backward';

    // Adjust for inclusive/exclusive counting
    if (inclusive) {
      distance += 1n;
    }

    const intermediateAddresses =
      showIntermediates && distance > 1n ? generateIntermediateAddresses(startNum, endNum, startVersion) : [];

    return {
      startIP,
      endIP,
      distance: distance.toLocaleString(),
      distanceNumber: distance,
      version: startVersion,
      inclusive,
      direction,
      intermediateAddresses,
      isValid: true,
    };
  } catch (error) {
    return {
      startIP,
      endIP,
      distance: '0',
      distanceNumber: 0n,
      version: 4,
      inclusive,
      direction: 'forward',
      intermediateAddresses: [],
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/* Parse IP pair input */
function parseIPPair(input: string): { startIP: string; endIP: string } {
  const trimmed = input.trim();

  // Try different separators - order matters! Longer separators first
  const separators = ['<->', '->', '↔', '→', '-', '|', ','];

  for (const sep of separators) {
    if (trimmed.includes(sep)) {
      const parts = trimmed.split(sep).map((p) => p.trim());
      if (parts.length === 2 && parts[0] && parts[1]) {
        return { startIP: parts[0], endIP: parts[1] };
      }
    }
  }

  // Try space-separated if no separator found
  const spaceParts = trimmed.split(/\s+/);
  if (spaceParts.length === 2) {
    return { startIP: spaceParts[0], endIP: spaceParts[1] };
  }

  throw new Error('Invalid format. Use: start_ip -> end_ip or start_ip end_ip');
}

/* Calculate distances for multiple IP pairs */
export function calculateIPDistances(
  inputs: string[],
  inclusive: boolean = true,
  showIntermediates: boolean = false,
): DistanceResult {
  const calculations: DistanceCalculation[] = [];
  const errors: string[] = [];

  for (const input of inputs) {
    if (!input.trim()) continue;

    try {
      const { startIP, endIP } = parseIPPair(input);
      const calculation = calculateIPDistance(startIP, endIP, inclusive, showIntermediates);
      calculations.push(calculation);

      if (!calculation.isValid && calculation.error) {
        errors.push(`"${input}": ${calculation.error}`);
      }
    } catch (error) {
      errors.push(`"${input}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Add invalid calculation for display
      calculations.push({
        startIP: input,
        endIP: '',
        distance: '0',
        distanceNumber: 0n,
        version: 4,
        inclusive,
        direction: 'forward',
        intermediateAddresses: [],
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const validCalculations = calculations.filter((c) => c.isValid);
  const totalDistance = validCalculations.reduce((sum, calc) => sum + calc.distanceNumber, 0n);
  const averageDistance = validCalculations.length > 0 ? totalDistance / BigInt(validCalculations.length) : 0n;

  return {
    calculations,
    summary: {
      totalCalculations: calculations.length,
      validCalculations: validCalculations.length,
      invalidCalculations: calculations.length - validCalculations.length,
      totalDistance: totalDistance.toLocaleString(),
      averageDistance: averageDistance.toLocaleString(),
    },
    errors,
  };
}
