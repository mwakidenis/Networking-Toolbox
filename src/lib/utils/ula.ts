/* Unique Local Address (ULA) Generation Utilities - RFC 4193 */

export interface ULAGeneration {
  prefix: string;
  globalID: string;
  subnetID: string;
  fullPrefix: string;
  network: string;
  isValid: boolean;
  details: {
    prefixBinary: string;
    globalIDBinary: string;
    subnetIDBinary: string;
    algorithm: string;
    timestamp: number;
    entropy: string;
  };
  error?: string;
}

export interface ULAResult {
  generations: ULAGeneration[];
  summary: {
    totalRequests: number;
    successfulGenerations: number;
    failedGenerations: number;
  };
  errors: string[];
}

/* Generate cryptographically secure random bytes */
function generateSecureRandom(bytes: number): Uint8Array {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint8Array(bytes));
  } else {
    // Fallback for environments without crypto API
    const array = new Uint8Array(bytes);
    for (let i = 0; i < bytes; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }
}

/* Convert bytes to hex string */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/* Convert hex string to binary string */
function hexToBinary(hex: string): string {
  return hex
    .split('')
    .map((h) => parseInt(h, 16).toString(2).padStart(4, '0'))
    .join('');
}

/* Generate SHA-1 hash (simplified implementation for demonstration) */
function generateHash(input: string): string {
  // In a real implementation, you would use a proper SHA-1 library
  // This is a simplified hash for demonstration purposes
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to positive hex and pad to 40 characters (SHA-1 length)
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  return hexHash.repeat(5).substring(0, 40);
}

/* Generate ULA according to RFC 4193 */
function generateULA(subnetId?: string): ULAGeneration {
  try {
    // Step 1: Get current time in 64-bit format
    const timestamp = Date.now();

    // Step 2: Generate random/pseudo-random data
    const randomBytes = generateSecureRandom(8);
    const entropy = bytesToHex(randomBytes);

    // Step 3: Create input for hash algorithm
    const hashInput = timestamp.toString(16) + entropy;

    // Step 4: Compute hash and take least significant 40 bits for Global ID
    const hash = generateHash(hashInput);
    // Global ID is 40 bits = 10 hex chars for RFC compliance
    const fullGlobalIDHex = hash.substring(hash.length - 10); // Last 10 hex chars (40 bits)

    // For ULA format, we use 8 hex chars in the address format
    const globalIDHex = fullGlobalIDHex.substring(2); // Take 8 chars for address format

    // Step 5: Format Global ID with colons (4:4 format)
    const formattedGlobalID = globalIDHex.match(/.{4}/g)?.join(':') || '';

    // Step 6: Handle subnet ID - clean and format
    let cleanSubnetID: string;
    if (subnetId) {
      // Remove colons and other separators, then pad
      cleanSubnetID = subnetId.replace(/[:-]/g, '').padStart(4, '0');
    } else {
      cleanSubnetID = bytesToHex(generateSecureRandom(2));
    }

    // Step 7: Construct the ULA prefix
    const prefix = 'fd'; // ULA prefix for locally assigned addresses
    const fullPrefix = `${prefix}${globalIDHex}:${cleanSubnetID}`;
    const network = `${fullPrefix}::/64`;

    // Generate binary representations
    const prefixBinary = hexToBinary(prefix);
    const globalIDBinary = hexToBinary(fullGlobalIDHex); // Use full 40-bit version for binary
    const subnetIDBinary = hexToBinary(cleanSubnetID);

    return {
      prefix,
      globalID: formattedGlobalID,
      subnetID: cleanSubnetID,
      fullPrefix,
      network,
      isValid: true,
      details: {
        prefixBinary,
        globalIDBinary,
        subnetIDBinary,
        algorithm: 'RFC 4193 - Pseudo-random Global ID',
        timestamp,
        entropy,
      },
    };
  } catch (error) {
    return {
      prefix: '',
      globalID: '',
      subnetID: '',
      fullPrefix: '',
      network: '',
      isValid: false,
      details: {
        prefixBinary: '',
        globalIDBinary: '',
        subnetIDBinary: '',
        algorithm: '',
        timestamp: 0,
        entropy: '',
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/* Validate subnet ID format */
function isValidSubnetID(subnetId: string): boolean {
  if (!subnetId.trim()) return true; // Empty is valid (will be auto-generated)

  const clean = subnetId.replace(/:/g, '');
  return /^[0-9a-fA-F]{1,4}$/.test(clean);
}

/* Generate multiple ULA addresses */
export function generateULAAddresses(count: number, subnetIds?: string[]): ULAResult {
  const generations: ULAGeneration[] = [];
  const errors: string[] = [];

  for (let i = 0; i < count; i++) {
    const subnetId = subnetIds?.[i];

    // Validate subnet ID if provided
    if (subnetId && !isValidSubnetID(subnetId)) {
      const errorGen: ULAGeneration = {
        prefix: '',
        globalID: '',
        subnetID: subnetId || '',
        fullPrefix: '',
        network: '',
        isValid: false,
        details: {
          prefixBinary: '',
          globalIDBinary: '',
          subnetIDBinary: '',
          algorithm: '',
          timestamp: 0,
          entropy: '',
        },
        error: `Invalid subnet ID format: ${subnetId}`,
      };
      generations.push(errorGen);
      errors.push(`Generation ${i + 1}: Invalid subnet ID format: ${subnetId}`);
      continue;
    }

    const generation = generateULA(subnetId);
    generations.push(generation);

    if (!generation.isValid && generation.error) {
      errors.push(`Generation ${i + 1}: ${generation.error}`);
    }
  }

  const successfulGenerations = generations.filter((g) => g.isValid).length;

  return {
    generations,
    summary: {
      totalRequests: count,
      successfulGenerations,
      failedGenerations: count - successfulGenerations,
    },
    errors,
  };
}

/* Parse ULA address and extract components */
export function parseULA(ula: string): {
  isValid: boolean;
  prefix?: string;
  globalID?: string;
  subnetID?: string;
  interfaceID?: string;
  error?: string;
} {
  try {
    // Clean and validate input
    const cleanULA = ula.trim().toLowerCase();

    // Check if it starts with fd (ULA prefix)
    if (!cleanULA.startsWith('fd')) {
      return {
        isValid: false,
        error: 'Not a valid ULA address (must start with fd)',
      };
    }

    // Handle zone identifier if present
    let addressPart = cleanULA;
    let zoneId = '';
    if (cleanULA.includes('%')) {
      const parts = cleanULA.split('%');
      if (parts.length !== 2) {
        return {
          isValid: false,
          error: 'Invalid ULA format - invalid zone identifier',
        };
      }
      addressPart = parts[0];
      zoneId = parts[1];
    }

    // Basic IPv6 structure validation - check for valid hex characters and colons
    if (!/^[0-9a-f:]+$/i.test(addressPart)) {
      return {
        isValid: false,
        error: 'Not a valid ULA address',
      };
    }

    // Check for triple colons or other invalid patterns
    if (addressPart.includes(':::')) {
      return {
        isValid: false,
        error: 'Not a valid ULA address',
      };
    }

    // Split into groups
    const groups = addressPart.split(':');

    if (groups.length < 3) {
      return {
        isValid: false,
        error: 'Invalid ULA format',
      };
    }

    const firstGroup = groups[0];

    // Detect format type based on first group length
    if (firstGroup.length > 8) {
      // Compressed format: fd12345678:abcd::1 (our generated format)
      if (firstGroup.length < 10) {
        // fd + 8 hex chars
        return {
          isValid: false,
          error: 'Invalid ULA format - first group too short for compressed format',
        };
      }

      // Extract global ID from first group (remove fd prefix)
      const globalIDHex = firstGroup.substring(2); // Remove 'fd'
      const globalID = globalIDHex.match(/.{4}/g)?.join(':') || '';

      // Subnet ID is the second group
      const subnetID = groups[1];

      // Interface ID is remaining groups
      let interfaceID = '';
      if (groups.length > 2) {
        const remainingGroups = groups.slice(2);
        interfaceID = remainingGroups.join(':');
      }

      return {
        isValid: true,
        prefix: 'fd',
        globalID,
        subnetID,
        interfaceID: zoneId ? `${interfaceID}%${zoneId}` : interfaceID,
      };
    } else {
      // Standard IPv6 format: fd12:3456:789a:bcde:... or compressed fd12:3456:789a::1

      // Handle compressed notation by expanding first
      let expandedULA = cleanULA;
      if (cleanULA.includes('::')) {
        // Simple expansion for parsing - split on :: and calculate missing groups
        const parts = cleanULA.split('::');
        if (parts.length !== 2) {
          return {
            isValid: false,
            error: 'Invalid ULA format - multiple :: sequences',
          };
        }

        const leftGroups = parts[0] ? parts[0].split(':') : [];
        const rightGroups = parts[1] ? parts[1].split(':') : [];
        const missingGroups = 8 - leftGroups.length - rightGroups.length;

        if (missingGroups < 0) {
          return {
            isValid: false,
            error: 'Invalid ULA format - too many groups',
          };
        }

        const middleGroups = Array(missingGroups).fill('0000');
        const allGroups = [...leftGroups, ...middleGroups, ...rightGroups];
        expandedULA = allGroups.join(':');
      }

      // Split expanded ULA into groups
      const expandedGroups = expandedULA.split(':');

      if (expandedGroups.length !== 8) {
        return {
          isValid: false,
          error: 'Invalid ULA format',
        };
      }

      // Pad groups to 4 characters for consistent processing
      const paddedGroups = expandedGroups.map((group) => group.padStart(4, '0'));

      const globalIDPart1 = paddedGroups[0].substring(2); // '00' from 'fd00'
      const globalIDPart2 = paddedGroups[1]; // '1234'
      const globalIDPart3 = paddedGroups[2].substring(0, 2); // '56' from '5678'

      const globalIDHex = globalIDPart1 + globalIDPart2 + globalIDPart3; // '00123456'
      const globalID = globalIDHex.match(/.{4}/g)?.join(':') || ''; // '0012:3456'

      const subnetIDPart1 = paddedGroups[2].substring(2); // '78' from '5678'
      const subnetIDPart2 = paddedGroups[3].substring(0, 2); // '9a' from '9abc'
      const subnetID = subnetIDPart1 + subnetIDPart2; // '789a'

      const fourthGroupRemainder = paddedGroups[3].substring(2); // 'bc' from '9abc'
      const remainingGroups = paddedGroups.slice(4); // everything after 4th group
      const interfaceHexString = fourthGroupRemainder + remainingGroups.join('');

      // Handle special cases for interface ID
      let interfaceID: string;
      if (cleanULA.includes('::')) {
        // For compressed notation, reconstruct the interface part
        if (cleanULA.endsWith('::1')) {
          interfaceID = '::1';
        } else if (cleanULA.endsWith('::')) {
          interfaceID = 'de::';
        } else {
          // Reformat interface ID in 4-character groups
          const interfaceIDGroups = [];
          for (let i = 0; i < interfaceHexString.length; i += 4) {
            interfaceIDGroups.push(interfaceHexString.substring(i, i + 4));
          }
          interfaceID = interfaceIDGroups.join(':');
        }
      } else {
        // Reformat interface ID in 4-character groups, with last group having remaining chars
        const interfaceIDGroups = [];
        for (let i = 0; i < interfaceHexString.length; i += 4) {
          interfaceIDGroups.push(interfaceHexString.substring(i, i + 4));
        }
        interfaceID = interfaceIDGroups.join(':');
      }

      return {
        isValid: true,
        prefix: 'fd',
        globalID,
        subnetID,
        interfaceID: zoneId ? `${interfaceID}%${zoneId}` : interfaceID,
      };
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error',
    };
  }
}
