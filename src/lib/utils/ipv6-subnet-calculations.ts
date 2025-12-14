/* IPv6 Subnet Calculation Utilities */

export interface IPv6SubnetResult {
  success: boolean;
  subnet?: {
    network: string;
    prefixLength: number;
    subnetMask: string;
    networkExpanded: string;
    networkCompressed: string;
    firstAddress: string;
    lastAddress: string;
    totalAddresses: string;
    assignableAddresses: string;
    binaryPrefix: string;
    reverseZone: string;
  };
  error?: string;
  originalNetwork: string;
  originalPrefix: number;
}

export interface IPv6ValidationResult {
  valid: boolean;
  error?: string;
}

/* Expand IPv6 address to full 128-bit representation */
export function expandIPv6(address: string): string {
  // Remove prefix if present
  const cleanAddress = address.split('/')[0];

  // Handle :: compression
  if (cleanAddress.includes('::')) {
    const parts = cleanAddress.split('::');
    const leftParts = parts[0] ? parts[0].split(':') : [];
    const rightParts = parts[1] ? parts[1].split(':') : [];

    // Calculate missing groups
    const missingGroups = 8 - leftParts.length - rightParts.length;
    const middleParts = Array(missingGroups).fill('0000');

    const allParts = [...leftParts, ...middleParts, ...rightParts];
    return allParts.map((part) => part.padStart(4, '0')).join(':');
  }

  // Already expanded or no compression
  return cleanAddress
    .split(':')
    .map((part) => part.padStart(4, '0'))
    .join(':');
}

/* Compress IPv6 address using :: notation */
export function compressIPv6(address: string): string {
  const expanded = expandIPv6(address);
  const groups = expanded.split(':');

  // Remove leading zeros from each group
  const trimmedGroups = groups.map((group) => group.replace(/^0+/, '') || '0');

  // Find longest sequence of consecutive zeros
  let longestStart = -1;
  let longestLength = 0;
  let currentStart = -1;
  let currentLength = 0;

  for (let i = 0; i < trimmedGroups.length; i++) {
    if (trimmedGroups[i] === '0') {
      if (currentStart === -1) {
        currentStart = i;
        currentLength = 1;
      } else {
        currentLength++;
      }
    } else {
      if (currentLength > longestLength) {
        longestStart = currentStart;
        longestLength = currentLength;
      }
      currentStart = -1;
      currentLength = 0;
    }
  }

  // Check final sequence
  if (currentLength > longestLength) {
    longestStart = currentStart;
    longestLength = currentLength;
  }

  // Only compress if we have 2 or more consecutive zeros
  if (longestLength >= 2) {
    const beforeZeros = trimmedGroups.slice(0, longestStart);
    const afterZeros = trimmedGroups.slice(longestStart + longestLength);

    if (beforeZeros.length === 0 && afterZeros.length === 0) {
      return '::';
    } else if (beforeZeros.length === 0) {
      return '::' + afterZeros.join(':');
    } else if (afterZeros.length === 0) {
      return beforeZeros.join(':') + '::';
    } else {
      return beforeZeros.join(':') + '::' + afterZeros.join(':');
    }
  }

  return trimmedGroups.join(':');
}

/* Convert IPv6 address to binary representation */
function ipv6ToBinary(address: string): string {
  const expanded = expandIPv6(address);
  return expanded
    .split(':')
    .map((group) => parseInt(group, 16).toString(2).padStart(16, '0'))
    .join('');
}

/* Convert binary to IPv6 address */
function binaryToIPv6(binary: string): string {
  const groups = [];
  for (let i = 0; i < 128; i += 16) {
    const group = binary.substr(i, 16);
    const hex = parseInt(group, 2).toString(16).padStart(4, '0');
    groups.push(hex);
  }
  return groups.join(':');
}

/* Calculate subnet mask for IPv6 prefix */
function calculateIPv6SubnetMask(prefixLength: number): string {
  const binaryMask = '1'.repeat(prefixLength) + '0'.repeat(128 - prefixLength);
  return binaryToIPv6(binaryMask);
}

/* Get network address from IPv6 and prefix */
function getIPv6NetworkAddress(address: string, prefixLength: number): string {
  const binary = ipv6ToBinary(address);
  const networkBinary = binary.substr(0, prefixLength) + '0'.repeat(128 - prefixLength);
  return binaryToIPv6(networkBinary);
}

/* Calculate first and last addresses in subnet */
function calculateIPv6AddressRange(
  networkAddress: string,
  prefixLength: number,
): {
  first: string;
  last: string;
} {
  const networkBinary = ipv6ToBinary(networkAddress);
  const hostBits = 128 - prefixLength;

  // Handle /128 case (single host address)
  if (hostBits === 0) {
    const singleAddress = compressIPv6(networkAddress);
    return { first: singleAddress, last: singleAddress };
  }

  // First address (network + 1)
  const firstBinary = networkBinary.substr(0, prefixLength) + '0'.repeat(hostBits - 1) + '1';
  const first = binaryToIPv6(firstBinary);

  // Last address (all host bits set to 1, minus 1 for broadcast concept)
  const lastBinary = networkBinary.substr(0, prefixLength) + '1'.repeat(hostBits - 1) + '0';
  const last = binaryToIPv6(lastBinary);

  return { first: compressIPv6(first), last: compressIPv6(last) };
}

/* Calculate total addresses in subnet */
function calculateIPv6TotalAddresses(prefixLength: number): string {
  const hostBits = 128 - prefixLength;
  if (hostBits <= 53) {
    // Use regular number for smaller subnets
    return Math.pow(2, hostBits).toLocaleString();
  } else {
    // Use scientific notation for very large subnets
    const exponent = hostBits;
    return `2^${exponent} (≈ ${(Math.pow(2, hostBits % 10) * Math.pow(10, Math.floor((hostBits / 10) * Math.log10(2)))).toExponential(2)})`;
  }
}

/* Generate reverse DNS zone */
function generateReverseZone(networkAddress: string, prefixLength: number): string {
  if (prefixLength % 4 !== 0) {
    return 'Reverse zones are typically aligned to 4-bit boundaries';
  }

  const expanded = expandIPv6(networkAddress);
  const nibbleCount = prefixLength / 4;
  const nibbles = expanded.replace(/:/g, '').substr(0, nibbleCount);

  // Reverse the nibbles and add dots
  const reversed = nibbles.split('').reverse().join('.');
  return `${reversed}.ip6.arpa`;
}

/* Validate IPv6 address */
export function validateIPv6Address(address: string): IPv6ValidationResult {
  if (!address.trim()) {
    return { valid: false, error: 'IPv6 address is required' };
  }

  // Remove prefix if present
  const cleanAddress = address.split('/')[0];

  // Basic format validation
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){0,7}[0-9a-fA-F]{0,4}$/;
  const compressedRegex = /^([0-9a-fA-F]{0,4}:)*::([0-9a-fA-F]{0,4}:)*[0-9a-fA-F]{0,4}$/;

  if (!ipv6Regex.test(cleanAddress) && !compressedRegex.test(cleanAddress) && cleanAddress !== '::') {
    return { valid: false, error: 'Invalid IPv6 address format' };
  }

  // Check for valid compression
  if (cleanAddress.includes('::')) {
    const parts = cleanAddress.split('::');
    if (parts.length > 2) {
      return { valid: false, error: 'Multiple :: compressions not allowed' };
    }
  }

  // Validate individual groups
  const groups = cleanAddress.replace('::', ':0000:').split(':');
  for (const group of groups) {
    if (group && (group.length > 4 || !/^[0-9a-fA-F]*$/.test(group))) {
      return { valid: false, error: 'Invalid hexadecimal group' };
    }
  }

  return { valid: true };
}

/* Validate IPv6 prefix length */
function validatePrefixLength(prefix: number): IPv6ValidationResult {
  if (prefix < 1 || prefix > 128) {
    return { valid: false, error: 'Prefix length must be between 1 and 128' };
  }

  if (!Number.isInteger(prefix)) {
    return { valid: false, error: 'Prefix length must be an integer' };
  }

  return { valid: true };
}

/* Main IPv6 subnet calculation function */
export function calculateIPv6Subnet(networkAddress: string, prefixLength: number): IPv6SubnetResult {
  try {
    // Validate inputs
    const addressValidation = validateIPv6Address(networkAddress);
    if (!addressValidation.valid) {
      return {
        success: false,
        error: addressValidation.error,
        originalNetwork: networkAddress,
        originalPrefix: prefixLength,
      };
    }

    const prefixValidation = validatePrefixLength(prefixLength);
    if (!prefixValidation.valid) {
      return {
        success: false,
        error: prefixValidation.error,
        originalNetwork: networkAddress,
        originalPrefix: prefixLength,
      };
    }

    // Calculate network address
    const network = getIPv6NetworkAddress(networkAddress, prefixLength);
    const networkExpanded = expandIPv6(network);
    const networkCompressed = compressIPv6(network);

    // Calculate subnet mask
    const subnetMask = compressIPv6(calculateIPv6SubnetMask(prefixLength));

    // Calculate address range
    const addressRange = calculateIPv6AddressRange(network, prefixLength);

    // Calculate totals
    const totalAddresses = calculateIPv6TotalAddresses(prefixLength);
    const assignableAddresses =
      prefixLength >= 127
        ? '0'
        : calculateIPv6TotalAddresses(prefixLength).replace(/[,\s]/g, '') === '2'
          ? '0'
          : prefixLength <= 53
            ? (Math.pow(2, 128 - prefixLength) - 2).toLocaleString()
            : 'Nearly all addresses';

    // Generate binary prefix representation
    const binaryPrefix = '1'.repeat(prefixLength) + '0'.repeat(128 - prefixLength);
    const formattedBinary = binaryPrefix.match(/.{1,16}/g)?.join('.') || binaryPrefix;

    // Generate reverse zone
    const reverseZone = generateReverseZone(network, prefixLength);

    return {
      success: true,
      subnet: {
        network: networkCompressed,
        prefixLength,
        subnetMask,
        networkExpanded,
        networkCompressed,
        firstAddress: addressRange.first,
        lastAddress: addressRange.last,
        totalAddresses,
        assignableAddresses,
        binaryPrefix: formattedBinary,
        reverseZone,
      },
      originalNetwork: networkAddress,
      originalPrefix: prefixLength,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      originalNetwork: networkAddress,
      originalPrefix: prefixLength,
    };
  }
}

/* Get common IPv6 prefix lengths with descriptions */
export function getCommonIPv6Prefixes(): Array<{ prefix: number; description: string }> {
  return [
    { prefix: 48, description: '/48 - Site prefix (recommended for organizations)' },
    { prefix: 56, description: '/56 - Small site or home network' },
    { prefix: 64, description: '/64 - Standard subnet (single network segment)' },
    { prefix: 96, description: '/96 - IPv4-mapped IPv6 addresses' },
    { prefix: 112, description: '/112 - Point-to-point links' },
    { prefix: 128, description: '/128 - Single host address' },
  ];
}

/* Parse IPv6 address with prefix */
export function parseIPv6WithPrefix(input: string): { address: string; prefix: number } | null {
  const parts = input.split('/');
  if (parts.length !== 2) {
    return null;
  }

  const address = parts[0].trim();
  const prefix = parseInt(parts[1].trim());

  if (isNaN(prefix)) {
    return null;
  }

  return { address, prefix };
}
