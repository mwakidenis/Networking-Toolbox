/**
 * VLSM (Variable Length Subnet Mask) Calculation Utilities
 */

export interface SubnetRequirement {
  id: string;
  name: string;
  hostsNeeded: number;
  description?: string;
}

export interface CalculatedSubnet {
  id: string;
  name: string;
  description?: string;
  hostsNeeded: number;
  hostsProvided: number;
  subnetMask: string;
  cidr: number;
  networkAddress: string;
  broadcastAddress: string;
  firstUsableHost: string;
  lastUsableHost: string;
  wildcardMask: string;
  binaryMask: string;
  actualHostBits: number;
  wastedHosts: number;
}

export interface VLSMResult {
  success: boolean;
  subnets: CalculatedSubnet[];
  error?: string;
  originalNetwork: string;
  originalCIDR: number;
  totalHostsRequested: number;
  totalHostsProvided: number;
  totalWastedHosts: number;
  remainingAddresses: number;
  nextAvailableNetwork?: string;
}

/**
 * Convert IP address to 32-bit integer
 */
function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

/**
 * Convert 32-bit integer to IP address
 */
function intToIp(int: number): string {
  return [(int >>> 24) & 0xff, (int >>> 16) & 0xff, (int >>> 8) & 0xff, int & 0xff].join('.');
}

/**
 * Calculate subnet mask from CIDR
 */
function cidrToSubnetMask(cidr: number): string {
  const mask = 0xffffffff << (32 - cidr);
  return intToIp(mask >>> 0);
}

/**
 * Calculate wildcard mask from CIDR
 */
function cidrToWildcardMask(cidr: number): string {
  const wildcardInt = (1 << (32 - cidr)) - 1;
  return intToIp(wildcardInt);
}

/**
 * Convert subnet mask to binary representation
 */
function subnetMaskToBinary(mask: string): string {
  return mask
    .split('.')
    .map((octet) => {
      return parseInt(octet).toString(2).padStart(8, '0');
    })
    .join('.');
}

/**
 * Calculate the minimum number of host bits needed for a given number of hosts
 */
function calculateRequiredHostBits(hostsNeeded: number): number {
  // Special case: 1 host = /32 (host route)
  if (hostsNeeded === 1) {
    return 0; // 0 host bits = /32
  }
  // Special case: 2 hosts = /30 (point-to-point)
  if (hostsNeeded === 2) {
    return 2; // 2 host bits = /30
  }
  // Normal case: Need 2 extra addresses (network and broadcast)
  const totalAddresses = hostsNeeded + 2;
  return Math.ceil(Math.log2(totalAddresses));
}

/**
 * Calculate the number of hosts that can be accommodated with given host bits
 */
function calculateHostsFromBits(hostBits: number): number {
  if (hostBits === 0) {
    return 1; // /32 = 1 host
  }
  if (hostBits === 2) {
    return 2; // /30 = 2 hosts (point-to-point)
  }
  return Math.pow(2, hostBits) - 2; // Subtract network and broadcast addresses
}

/**
 * Validate IP address format
 */
function isValidIP(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    const num = parseInt(part);
    return !isNaN(num) && num >= 0 && num <= 255;
  });
}

/**
 * Validate CIDR notation
 */
function isValidCIDR(cidr: number): boolean {
  return cidr >= 0 && cidr <= 32; // Allow all valid CIDR ranges
}

/**
 * Sort subnet requirements by hosts needed (descending order for optimal allocation)
 */
function sortSubnetRequirements(requirements: SubnetRequirement[]): SubnetRequirement[] {
  return [...requirements].sort((a, b) => b.hostsNeeded - a.hostsNeeded);
}

/**
 * Check if there's enough address space in the network
 */
function validateAddressSpace(networkIP: string, cidr: number, requirements: SubnetRequirement[]): boolean {
  const totalAvailableAddresses = Math.pow(2, 32 - cidr);
  const totalRequiredAddresses = requirements.reduce((sum, req) => {
    const hostBits = calculateRequiredHostBits(req.hostsNeeded);
    return sum + Math.pow(2, hostBits);
  }, 0);

  return totalRequiredAddresses <= totalAvailableAddresses;
}

/**
 * Main VLSM calculation function
 */
export function calculateVLSM(networkIP: string, cidr: number, requirements: SubnetRequirement[]): VLSMResult {
  try {
    // Input validation
    if (!isValidIP(networkIP)) {
      return {
        success: false,
        subnets: [],
        error: 'Invalid IP address format',
        originalNetwork: networkIP,
        originalCIDR: cidr,
        totalHostsRequested: 0,
        totalHostsProvided: 0,
        totalWastedHosts: 0,
        remainingAddresses: 0,
      };
    }

    if (!isValidCIDR(cidr)) {
      return {
        success: false,
        subnets: [],
        error: 'CIDR must be between /0 and /32',
        originalNetwork: networkIP,
        originalCIDR: cidr,
        totalHostsRequested: 0,
        totalHostsProvided: 0,
        totalWastedHosts: 0,
        remainingAddresses: 0,
      };
    }

    // Handle empty requirements - should succeed
    if (requirements.length === 0) {
      const totalNetworkSize = Math.pow(2, 32 - cidr);
      return {
        success: true,
        subnets: [],
        originalNetwork: networkIP,
        originalCIDR: cidr,
        totalHostsRequested: 0,
        totalHostsProvided: 0,
        totalWastedHosts: 0,
        remainingAddresses: totalNetworkSize,
      };
    }

    // Validate individual requirements
    for (const req of requirements) {
      const validation = validateSubnetRequirement(req);
      if (!validation.valid) {
        return {
          success: false,
          subnets: [],
          error: validation.error || 'Invalid subnet requirement',
          originalNetwork: networkIP,
          originalCIDR: cidr,
          totalHostsRequested: 0,
          totalHostsProvided: 0,
          totalWastedHosts: 0,
          remainingAddresses: 0,
        };
      }
    }

    // Validate unique subnet names
    const names = requirements.map((req) => req.name);
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
      return {
        success: false,
        subnets: [],
        error: 'Subnet names must be unique',
        originalNetwork: networkIP,
        originalCIDR: cidr,
        totalHostsRequested: 0,
        totalHostsProvided: 0,
        totalWastedHosts: 0,
        remainingAddresses: 0,
      };
    }

    // Check if there's enough address space
    if (!validateAddressSpace(networkIP, cidr, requirements)) {
      return {
        success: false,
        subnets: [],
        error: 'insufficient address space in the network for all requirements',
        originalNetwork: networkIP,
        originalCIDR: cidr,
        totalHostsRequested: requirements.reduce((sum, req) => sum + req.hostsNeeded, 0),
        totalHostsProvided: 0,
        totalWastedHosts: 0,
        remainingAddresses: calculateHostsFromBits(32 - cidr),
      };
    }

    // Sort requirements by hosts needed (largest first)
    const sortedRequirements = sortSubnetRequirements(requirements);

    // Calculate subnets
    const calculatedSubnets: CalculatedSubnet[] = [];
    let currentNetworkInt = ipToInt(networkIP);
    const originalNetworkMask = 0xffffffff << (32 - cidr);

    // Ensure we start with the network address
    currentNetworkInt = currentNetworkInt & (originalNetworkMask >>> 0);

    let totalHostsRequested = 0;
    let totalHostsProvided = 0;
    let totalWastedHosts = 0;

    for (const requirement of sortedRequirements) {
      const hostBits = calculateRequiredHostBits(requirement.hostsNeeded);
      const subnetCIDR = 32 - hostBits;
      const hostsProvided = calculateHostsFromBits(hostBits);
      const subnetSize = Math.pow(2, hostBits);

      // Calculate addresses
      const networkAddress = intToIp(currentNetworkInt);
      const broadcastInt = currentNetworkInt + subnetSize - 1;
      const broadcastAddress = intToIp(broadcastInt);
      const firstUsableHost = intToIp(currentNetworkInt + 1);
      const lastUsableHost = intToIp(broadcastInt - 1);

      // Calculate masks
      const subnetMask = cidrToSubnetMask(subnetCIDR);
      const wildcardMask = cidrToWildcardMask(subnetCIDR);
      const binaryMask = subnetMaskToBinary(subnetMask);

      const wastedHosts = hostsProvided - requirement.hostsNeeded;

      calculatedSubnets.push({
        id: requirement.id,
        name: requirement.name,
        description: requirement.description,
        hostsNeeded: requirement.hostsNeeded,
        hostsProvided,
        subnetMask,
        cidr: subnetCIDR,
        networkAddress,
        broadcastAddress,
        firstUsableHost,
        lastUsableHost,
        wildcardMask,
        binaryMask,
        actualHostBits: hostBits,
        wastedHosts,
      });

      totalHostsRequested += requirement.hostsNeeded;
      totalHostsProvided += hostsProvided;
      totalWastedHosts += wastedHosts;

      // Move to next available network address
      currentNetworkInt += subnetSize;
    }

    // Calculate remaining address space
    const totalNetworkSize = Math.pow(2, 32 - cidr);
    const usedAddresses = currentNetworkInt - ipToInt(networkIP);
    const remainingAddresses = totalNetworkSize - usedAddresses;
    const nextAvailableNetwork = remainingAddresses > 0 ? intToIp(currentNetworkInt) : undefined;

    return {
      success: true,
      subnets: calculatedSubnets,
      originalNetwork: networkIP,
      originalCIDR: cidr,
      totalHostsRequested,
      totalHostsProvided,
      totalWastedHosts,
      remainingAddresses,
      nextAvailableNetwork,
    };
  } catch (error) {
    return {
      success: false,
      subnets: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      originalNetwork: networkIP,
      originalCIDR: cidr,
      totalHostsRequested: 0,
      totalHostsProvided: 0,
      totalWastedHosts: 0,
      remainingAddresses: 0,
    };
  }
}

/**
 * Generate a unique ID for subnet requirements
 */
export function generateSubnetId(): string {
  return 'subnet_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Validate subnet requirement
 */
export function validateSubnetRequirement(requirement: SubnetRequirement): { valid: boolean; error?: string } {
  if (!requirement.name.trim()) {
    return { valid: false, error: 'Subnet name is required' };
  }

  if (requirement.hostsNeeded <= 0) {
    return { valid: false, error: 'hosts needed must be greater than 0' };
  }

  if (requirement.hostsNeeded > 16777214) {
    // Max hosts in a /8 network
    return { valid: false, error: 'Number of hosts too large (max: 16,777,214)' };
  }

  return { valid: true };
}
