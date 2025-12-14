/* IPv6 Zone ID Handler Utilities */

export interface IPv6ZoneProcessing {
  input: string;
  hasZoneId: boolean;
  address: string;
  zoneId: string;
  addressType: 'link-local' | 'unique-local' | 'multicast' | 'global' | 'loopback' | 'unspecified';
  requiresZoneId: boolean;
  isValid: boolean;
  error?: string;
  processing: {
    withZone: string;
    withoutZone: string;
    suggestedZones: string[];
    zoneIdValid: boolean;
  };
}

export interface IPv6ZoneResult {
  processings: IPv6ZoneProcessing[];
  summary: {
    totalInputs: number;
    validInputs: number;
    invalidInputs: number;
    addressesWithZones: number;
    addressesRequiringZones: number;
  };
  errors: string[];
}

/* Common zone identifiers */
const COMMON_ZONE_IDENTIFIERS = [
  'eth0',
  'eth1',
  'eth2',
  'wlan0',
  'wlan1',
  'lo0',
  'lo',
  'en0',
  'en1',
  'en2',
  'wlp2s0',
  'enp0s3',
  'bond0',
  'br0',
  'vlan100',
  'tun0',
  '%1',
  '%2',
  '%3',
  '%4',
  '%5',
];

/* Validate IPv6 address format (without zone identifier) */
function isValidIPv6Address(ip: string): boolean {
  try {
    // Basic format checks
    if (ip.includes(':::')) return false; // Invalid triple colon
    if (ip.split('::').length > 2) return false; // Multiple :: sequences

    // Split by ::
    const parts = ip.split('::');
    let groups: string[] = [];

    if (parts.length === 1) {
      // No compression
      groups = ip.split(':');
      if (groups.length !== 8) return false;
    } else if (parts.length === 2) {
      // With compression
      const leftGroups = parts[0] ? parts[0].split(':') : [];
      const rightGroups = parts[1] ? parts[1].split(':') : [];

      // Check for IPv4-mapped addresses in the right part
      const lastGroup = rightGroups[rightGroups.length - 1];
      let ipv4Groups = 0;

      if (lastGroup && lastGroup.includes('.')) {
        // IPv4-mapped IPv6 address
        const ipv4Parts = lastGroup.split('.');
        if (ipv4Parts.length === 4) {
          // Validate IPv4 part
          for (const part of ipv4Parts) {
            const num = parseInt(part, 10);
            if (isNaN(num) || num < 0 || num > 255) return false;
          }
          ipv4Groups = 2; // IPv4 part counts as 2 groups
          rightGroups.pop(); // Remove IPv4 part from IPv6 groups
        }
      }

      const totalGroups = leftGroups.length + rightGroups.length + ipv4Groups;
      if (totalGroups >= 8) return false; // No compression needed

      groups = [...leftGroups, ...rightGroups];
    }

    // Validate each group (excluding IPv4 part)
    for (const group of groups) {
      if (group.includes('.')) {
        // IPv4 part - validate separately
        const ipv4Parts = group.split('.');
        if (ipv4Parts.length !== 4) return false;
        for (const part of ipv4Parts) {
          const num = parseInt(part, 10);
          if (isNaN(num) || num < 0 || num > 255) return false;
        }
      } else {
        // IPv6 group
        if (group.length === 0 || group.length > 4) return false;
        if (!/^[0-9a-fA-F]+$/.test(group)) return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/* Validate zone identifier */
function isValidZoneId(zoneId: string): boolean {
  if (!zoneId) return false;

  // Zone ID can be:
  // - Interface name (alphanumeric with some special chars)
  // - Numeric ID (for Windows-style)
  // - Empty is invalid

  // Basic validation: non-empty, reasonable length, valid characters
  if (zoneId.length === 0 || zoneId.length > 64) return false;

  // Allow alphanumeric, digits, hyphens, underscores, dots, percentage
  const validZonePattern = /^[a-zA-Z0-9._%-]+$/;
  return validZonePattern.test(zoneId);
}

/* Determine IPv6 address type */
function getIPv6AddressType(
  address: string,
): 'link-local' | 'unique-local' | 'multicast' | 'global' | 'loopback' | 'unspecified' {
  const normalized = address.toLowerCase();

  // Unspecified address
  if (normalized === '::' || normalized === '0000:0000:0000:0000:0000:0000:0000:0000') {
    return 'unspecified';
  }

  // Loopback address
  if (normalized === '::1' || normalized === '0000:0000:0000:0000:0000:0000:0000:0001') {
    return 'loopback';
  }

  // Link-local addresses (fe80::/10)
  if (
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb')
  ) {
    return 'link-local';
  }

  // Unique Local Addresses (fc00::/7)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return 'unique-local';
  }

  // Multicast addresses (ff00::/8)
  if (normalized.startsWith('ff')) {
    return 'multicast';
  }

  // Everything else is global unicast
  return 'global';
}

/* Check if address type requires zone identifier */
function requiresZoneIdentifier(
  addressType: 'link-local' | 'unique-local' | 'multicast' | 'global' | 'loopback' | 'unspecified',
): boolean {
  // Link-local addresses typically require zone identifiers in most contexts
  // Multicast addresses may require zone identifiers depending on scope
  return addressType === 'link-local';
}

/* Generate suggested zone identifiers */
function generateSuggestedZones(
  addressType: 'link-local' | 'unique-local' | 'multicast' | 'global' | 'loopback' | 'unspecified',
): string[] {
  if (addressType === 'link-local') {
    return COMMON_ZONE_IDENTIFIERS.slice(0, 10); // Return first 10 common zones
  } else if (addressType === 'multicast') {
    return COMMON_ZONE_IDENTIFIERS.slice(0, 5); // Return fewer for multicast
  }

  return []; // Other types typically don't need zone IDs
}

/* Process IPv6 address with zone identifier */
function processIPv6Zone(input: string): IPv6ZoneProcessing {
  try {
    const trimmed = input.trim();

    // Check if input contains zone identifier
    const hasZoneId = trimmed.includes('%');
    let address: string;
    let zoneId: string;

    if (hasZoneId) {
      const parts = trimmed.split('%');
      if (parts.length !== 2) {
        return {
          input,
          hasZoneId: false,
          address: '',
          zoneId: '',
          addressType: 'global',
          requiresZoneId: false,
          isValid: false,
          error: 'Invalid zone identifier format. Use address%zone format.',
          processing: {
            withZone: '',
            withoutZone: '',
            suggestedZones: [],
            zoneIdValid: false,
          },
        };
      }

      address = parts[0];
      zoneId = parts[1];
    } else {
      address = trimmed;
      zoneId = '';
    }

    // Validate the IPv6 address part
    if (!isValidIPv6Address(address)) {
      return {
        input,
        hasZoneId,
        address,
        zoneId,
        addressType: 'global',
        requiresZoneId: false,
        isValid: false,
        error: 'Invalid IPv6 address format',
        processing: {
          withZone: '',
          withoutZone: '',
          suggestedZones: [],
          zoneIdValid: false,
        },
      };
    }

    // Validate zone identifier if present
    const zoneIdValid = !hasZoneId || isValidZoneId(zoneId);
    if (hasZoneId && !zoneIdValid) {
      return {
        input,
        hasZoneId,
        address,
        zoneId,
        addressType: 'global',
        requiresZoneId: false,
        isValid: false,
        error: 'Invalid zone identifier format',
        processing: {
          withZone: '',
          withoutZone: '',
          suggestedZones: [],
          zoneIdValid: false,
        },
      };
    }

    // Determine address type and requirements
    const addressType = getIPv6AddressType(address);
    const requiresZoneId = requiresZoneIdentifier(addressType);
    const suggestedZones = generateSuggestedZones(addressType);

    // Generate processing results
    const withZone = hasZoneId
      ? `${address}%${zoneId}`
      : suggestedZones.length > 0
        ? `${address}%${suggestedZones[0]}`
        : address;
    const withoutZone = address;

    return {
      input,
      hasZoneId,
      address,
      zoneId,
      addressType,
      requiresZoneId,
      isValid: true,
      processing: {
        withZone,
        withoutZone,
        suggestedZones,
        zoneIdValid,
      },
    };
  } catch (error) {
    return {
      input,
      hasZoneId: false,
      address: '',
      zoneId: '',
      addressType: 'global',
      requiresZoneId: false,
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processing: {
        withZone: '',
        withoutZone: '',
        suggestedZones: [],
        zoneIdValid: false,
      },
    };
  }
}

/* Process multiple IPv6 addresses with zone identifiers */
export function processIPv6ZoneIdentifiers(inputs: string[]): IPv6ZoneResult {
  const processings: IPv6ZoneProcessing[] = [];
  const errors: string[] = [];

  for (const input of inputs) {
    if (!input.trim()) continue;

    const processing = processIPv6Zone(input);
    processings.push(processing);

    if (!processing.isValid && processing.error) {
      errors.push(`"${input}": ${processing.error}`);
    }
  }

  const validCount = processings.filter((p) => p.isValid).length;
  const withZonesCount = processings.filter((p) => p.isValid && p.hasZoneId).length;
  const requiringZonesCount = processings.filter((p) => p.isValid && p.requiresZoneId).length;

  return {
    processings,
    summary: {
      totalInputs: processings.length,
      validInputs: validCount,
      invalidInputs: processings.length - validCount,
      addressesWithZones: withZonesCount,
      addressesRequiringZones: requiringZonesCount,
    },
    errors,
  };
}
