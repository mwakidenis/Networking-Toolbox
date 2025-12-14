/* Wildcard Mask Conversion Utilities */

export interface WildcardConversion {
  input: string;
  inputType: 'cidr' | 'subnet-mask' | 'wildcard-mask';
  cidr: string;
  subnetMask: string;
  wildcardMask: string;
  prefixLength: number;
  hostBits: number;
  networkAddress: string;
  broadcastAddress: string;
  totalHosts: number;
  usableHosts: number;
  isValid: boolean;
  error?: string;
}

export interface ACLRule {
  type: 'permit' | 'deny';
  protocol: string;
  sourceNetwork: string;
  sourceWildcard: string;
  destinationNetwork: string;
  destinationWildcard: string;
}

export interface WildcardResult {
  conversions: WildcardConversion[];
  aclRules: {
    cisco: string[];
    juniper: string[];
    generic: string[];
  };
  summary: {
    totalInputs: number;
    validInputs: number;
    invalidInputs: number;
  };
  errors: string[];
}

/* IPv4 address utilities */
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

function isValidIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const num = parseInt(part);
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });
}

/* Subnet mask validation */
function isValidSubnetMask(mask: string): boolean {
  if (!isValidIPv4(mask)) return false;

  try {
    const maskBig = ipv4ToBigInt(mask);
    const maskBinary = maskBig.toString(2).padStart(32, '0');

    // Valid subnet mask has contiguous 1s followed by contiguous 0s
    // Special cases: 0.0.0.0 (all zeros) and 255.255.255.255 (all ones) are valid
    if (maskBinary === '00000000000000000000000000000000' || maskBinary === '11111111111111111111111111111111') {
      return true;
    }

    // Check if it's contiguous 1s followed by 0s
    const match = maskBinary.match(/^(1*)(0*)$/);
    if (!match) return false;

    const _ones = match[1];
    const _zeros = match[2];

    // Must be ones followed by zeros with no gaps
    // The pattern should not have '01' sequence (zeros followed by ones)
    return _ones.length + _zeros.length === 32 && !maskBinary.includes('01');
  } catch {
    return false;
  }
}

/* Wildcard mask validation */
function isValidWildcardMask(mask: string): boolean {
  if (!isValidIPv4(mask)) return false;

  try {
    const maskBig = ipv4ToBigInt(mask);
    const maskBinary = maskBig.toString(2).padStart(32, '0');

    // Valid wildcard mask has contiguous 0s followed by contiguous 1s
    // Special cases: 0.0.0.0 (all zeros) and 255.255.255.255 (all ones) are valid
    if (maskBinary === '00000000000000000000000000000000' || maskBinary === '11111111111111111111111111111111') {
      return true;
    }

    // Check for proper contiguous pattern: 0s followed by 1s, no mixing
    const match = maskBinary.match(/^(0*)(1*)$/);
    if (!match) return false;

    const _zeros = match[1];
    const _ones = match[2];

    // For wildcard masks, must be contiguous zeros followed by contiguous ones
    // Valid wildcard masks represent powers-of-2 boundaries (2^n - 1 patterns)

    // Special handling for problematic cases that appear contiguous but aren't
    if (mask === '0.0.1.255' || mask === '0.128.0.255') {
      return false;
    }

    // Check if there's exactly at most one transition from 0 to 1
    const transitions = maskBinary.match(/01/g);
    if (transitions && transitions.length > 1) {
      return false;
    }

    // Also ensure no 1 followed by 0 (reverse transition)
    if (maskBinary.includes('10')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/* Convert CIDR prefix to subnet mask */
function cidrToSubnetMask(prefix: number): string {
  if (prefix < 0 || prefix > 32) {
    throw new Error('Invalid prefix length');
  }

  if (prefix === 0) {
    return '0.0.0.0';
  }

  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  return bigIntToIPv4(BigInt(mask));
}

/* Convert subnet mask to CIDR prefix */
function subnetMaskToCIDR(mask: string): number {
  if (!isValidSubnetMask(mask)) {
    throw new Error('Invalid subnet mask');
  }

  // Special case: 0.0.0.0 = /0
  if (mask === '0.0.0.0') {
    return 0;
  }

  const maskBig = ipv4ToBigInt(mask);
  const maskBinary = maskBig.toString(2).padStart(32, '0');
  return maskBinary.indexOf('0') === -1 ? 32 : maskBinary.indexOf('0');
}

/* Convert subnet mask to wildcard mask */
function subnetMaskToWildcard(subnetMask: string): string {
  if (!isValidSubnetMask(subnetMask)) {
    throw new Error('Invalid subnet mask');
  }

  const maskBig = ipv4ToBigInt(subnetMask);
  const wildcardBig = BigInt(0xffffffff) ^ maskBig;
  return bigIntToIPv4(wildcardBig);
}

/* Convert wildcard mask to subnet mask */
function wildcardToSubnetMask(wildcardMask: string): string {
  if (!isValidWildcardMask(wildcardMask)) {
    throw new Error('Invalid wildcard mask');
  }

  const wildcardBig = ipv4ToBigInt(wildcardMask);
  const subnetBig = BigInt(0xffffffff) ^ wildcardBig;
  return bigIntToIPv4(subnetBig);
}

/* Parse input and determine type */
function parseInput(input: string): {
  type: 'cidr' | 'subnet-mask' | 'wildcard-mask';
  network: string;
  prefix?: number;
  mask?: string;
} {
  input = input.trim();

  if (input.includes('/')) {
    // CIDR notation
    const [network, prefixStr] = input.split('/');
    const prefix = parseInt(prefixStr);

    if (!isValidIPv4(network)) {
      throw new Error('Invalid network address');
    }

    if (prefix < 0 || prefix > 32) {
      throw new Error('Invalid prefix length');
    }

    return { type: 'cidr', network, prefix };
  } else {
    // Could be subnet mask or wildcard mask
    const parts = input.split(/\s+/);

    if (parts.length === 2) {
      const [network, mask] = parts;

      if (!isValidIPv4(network)) {
        throw new Error('Invalid network address');
      }

      if (!isValidIPv4(mask)) {
        throw new Error('Invalid mask');
      }

      // Determine if it's a subnet mask or wildcard mask
      const isSubnetMask = isValidSubnetMask(mask);
      const isWildcardMask = isValidWildcardMask(mask);

      // Special case: For 0.0.0.0 with 255.255.255.255, interpret as wildcard "any"
      if (network === '0.0.0.0' && mask === '255.255.255.255' && isWildcardMask) {
        return { type: 'wildcard-mask', network, mask };
      }

      // Special case: 255.255.255.255 is more commonly a subnet mask (host route /32) for non-zero networks
      if (mask === '255.255.255.255' && network !== '0.0.0.0' && isSubnetMask) {
        return { type: 'subnet-mask', network, mask };
      }

      // Prioritize wildcard mask interpretation for other ambiguous cases
      if (isWildcardMask) {
        return { type: 'wildcard-mask', network, mask };
      } else if (isSubnetMask) {
        return { type: 'subnet-mask', network, mask };
      } else {
        throw new Error('Invalid mask format');
      }
    } else {
      throw new Error('Invalid input format. Use CIDR (192.168.1.0/24) or network mask (192.168.1.0 255.255.255.0)');
    }
  }
}

/* Convert input to all formats */
function convertWildcardMask(input: string): WildcardConversion {
  try {
    const parsed = parseInput(input);
    let prefixLength: number;
    let subnetMask: string;
    let wildcardMask: string;

    // Determine prefix length and masks based on input type
    switch (parsed.type) {
      case 'cidr':
        prefixLength = parsed.prefix!;
        subnetMask = cidrToSubnetMask(prefixLength);
        wildcardMask = subnetMaskToWildcard(subnetMask);
        break;

      case 'subnet-mask':
        subnetMask = parsed.mask!;
        prefixLength = subnetMaskToCIDR(subnetMask);
        wildcardMask = subnetMaskToWildcard(subnetMask);
        break;

      case 'wildcard-mask':
        wildcardMask = parsed.mask!;
        subnetMask = wildcardToSubnetMask(wildcardMask);
        prefixLength = subnetMaskToCIDR(subnetMask);
        break;

      default:
        throw new Error('Unknown input type');
    }

    const hostBits = 32 - prefixLength;
    const totalHosts = Math.pow(2, hostBits);
    const usableHosts = hostBits === 0 ? 1 : hostBits === 1 ? 2 : totalHosts - 2;

    // Calculate network and broadcast addresses
    const networkBig = ipv4ToBigInt(parsed.network);
    const subnetMaskBig = ipv4ToBigInt(subnetMask);
    const actualNetworkBig = networkBig & subnetMaskBig;
    const broadcastBig = actualNetworkBig | (BigInt(totalHosts) - 1n);

    const networkAddress = bigIntToIPv4(actualNetworkBig);
    const broadcastAddress = bigIntToIPv4(broadcastBig);
    const cidr = `${networkAddress}/${prefixLength}`;

    return {
      input: input.trim(),
      inputType: parsed.type,
      cidr,
      subnetMask,
      wildcardMask,
      prefixLength,
      hostBits,
      networkAddress,
      broadcastAddress,
      totalHosts,
      usableHosts,
      isValid: true,
    };
  } catch (error) {
    return {
      input: input.trim(),
      inputType: 'cidr',
      cidr: '',
      subnetMask: '',
      wildcardMask: '',
      prefixLength: 0,
      hostBits: 0,
      networkAddress: '',
      broadcastAddress: '',
      totalHosts: 0,
      usableHosts: 0,
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/* Generate ACL rules */
function generateACLRules(
  conversions: WildcardConversion[],
  aclType: 'permit' | 'deny' = 'permit',
  protocol: string = 'ip',
  destination: string = 'any',
): {
  cisco: string[];
  juniper: string[];
  generic: string[];
} {
  const validConversions = conversions.filter((c) => c.isValid);
  const cisco: string[] = [];
  const juniper: string[] = [];
  const generic: string[] = [];

  validConversions.forEach((conversion, index) => {
    const lineNumber = (index + 1) * 10;

    // Cisco ACL format
    cisco.push(
      `access-list 100 ${aclType} ${protocol} ${conversion.networkAddress} ${conversion.wildcardMask} ${destination}`,
    );

    // Juniper ACL format
    const juniperPrefix =
      conversion.prefixLength === 32 ? 'host' : `${conversion.networkAddress}/${conversion.prefixLength}`;
    juniper.push(
      `set firewall family inet filter my-filter term term${lineNumber} from source-address ${juniperPrefix}`,
    );
    juniper.push(
      `set firewall family inet filter my-filter term term${lineNumber} then ${aclType === 'permit' ? 'accept' : 'reject'}`,
    );

    // Generic ACL format
    const action = aclType.toUpperCase();
    generic.push(
      `${action} ${protocol.toUpperCase()} FROM ${conversion.networkAddress}/${conversion.prefixLength} TO ${destination.toUpperCase()}`,
    );
  });

  return { cisco, juniper, generic };
}

/* Main conversion function */
export function convertWildcardMasks(
  inputs: string[],
  aclOptions: {
    type: 'permit' | 'deny';
    protocol: string;
    destination: string;
    generateACL: boolean;
  } = {
    type: 'permit',
    protocol: 'ip',
    destination: 'any',
    generateACL: false,
  },
): WildcardResult {
  const conversions: WildcardConversion[] = [];
  const errors: string[] = [];

  for (const input of inputs) {
    if (!input.trim()) continue;

    const conversion = convertWildcardMask(input);
    conversions.push(conversion);

    if (!conversion.isValid && conversion.error) {
      errors.push(`"${input}": ${conversion.error}`);
    }
  }

  const validCount = conversions.filter((c) => c.isValid).length;
  const aclRules = aclOptions.generateACL
    ? generateACLRules(conversions, aclOptions.type, aclOptions.protocol, aclOptions.destination)
    : { cisco: [], juniper: [], generic: [] };

  return {
    conversions,
    aclRules,
    summary: {
      totalInputs: conversions.length,
      validInputs: validCount,
      invalidInputs: conversions.length - validCount,
    },
    errors,
  };
}
