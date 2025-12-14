/* IPv6 Normalization Utilities (RFC 5952) */

export interface IPv6Normalization {
  input: string;
  normalized: string;
  isValid: boolean;
  error?: string;
  steps: NormalizationStep[];
  originalFormat: string;
  compressionApplied: boolean;
  leadingZerosRemoved: boolean;
  lowercaseApplied: boolean;
}

export interface NormalizationStep {
  step: string;
  description: string;
  before: string;
  after: string;
}

export interface IPv6NormalizeResult {
  normalizations: IPv6Normalization[];
  summary: {
    totalInputs: number;
    validInputs: number;
    invalidInputs: number;
    alreadyNormalizedInputs: number;
  };
  errors: string[];
}

/* Validate IPv6 address format */
function isValidIPv6(ip: string): boolean {
  try {
    // Remove zone identifier if present
    const cleanIP = ip.split('%')[0];

    // Basic format checks
    if (cleanIP.includes(':::')) return false; // Invalid triple colon
    if (cleanIP.split('::').length > 2) return false; // Multiple :: sequences

    // Split by ::
    const parts = cleanIP.split('::');
    let groups: string[] = [];

    if (parts.length === 1) {
      // No compression
      groups = cleanIP.split(':');

      // Check for IPv4-mapped addresses
      const lastGroup = groups[groups.length - 1];
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
          ipv4Groups = 1; // IPv4 part replaces one group, but we need to account for it being 2 groups worth
          groups.pop(); // Remove IPv4 part from groups for validation
        }
      }

      // Should have 8 groups total (or 6 + IPv4 which counts as 2)
      const expectedGroups = ipv4Groups > 0 ? 6 : 8;
      if (groups.length !== expectedGroups) return false;
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
      if (group === '') continue; // Empty groups from :: are ok
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

/* Expand IPv6 address to full form */
function expandIPv6(ip: string): string {
  // Remove zone identifier
  const [cleanIP, zone] = ip.split('%');

  if (!cleanIP.includes('::')) {
    // Already expanded, just pad with zeros
    const groups = cleanIP.split(':');
    const expandedGroups: string[] = [];

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      if (group.includes('.')) {
        // IPv4 part - convert to IPv6 groups
        const ipv4Parts = group.split('.').map(Number);
        const high = ((ipv4Parts[0] << 8) | ipv4Parts[1]).toString(16).padStart(4, '0');
        const low = ((ipv4Parts[2] << 8) | ipv4Parts[3]).toString(16).padStart(4, '0');
        expandedGroups.push(high, low);
      } else {
        expandedGroups.push(group.padStart(4, '0'));
      }
    }

    const expanded = expandedGroups.join(':');
    return zone ? expanded + '%' + zone : expanded;
  }

  const parts = cleanIP.split('::');
  const left = parts[0] ? parts[0].split(':') : [];
  const right = parts[1] ? parts[1].split(':') : [];

  // Handle IPv4-mapped addresses
  const lastGroup = right[right.length - 1];
  if (lastGroup && lastGroup.includes('.')) {
    const ipv4Parts = lastGroup.split('.').map(Number);
    const high = ((ipv4Parts[0] << 8) | ipv4Parts[1]).toString(16).padStart(4, '0');
    const low = ((ipv4Parts[2] << 8) | ipv4Parts[3]).toString(16).padStart(4, '0');
    right[right.length - 1] = high;
    right.push(low);
    // ipv4Groups = 1; // We added one extra group - removed as unused
  }

  const missing = 8 - left.length - right.length;
  const middle = Array(missing).fill('0000');

  const allGroups = [...left, ...middle, ...right];
  const expanded = allGroups.map((group) => group.padStart(4, '0')).join(':');

  return zone ? expanded + '%' + zone : expanded;
}

/* Find longest sequence of consecutive zero groups */
function findLongestZeroSequence(groups: string[]): { start: number; length: number } {
  let longestStart = -1;
  let longestLength = 0;
  let currentStart = -1;
  let currentLength = 0;

  for (let i = 0; i < groups.length; i++) {
    if (groups[i] === '0') {
      if (currentStart === -1) {
        currentStart = i;
        currentLength = 1;
      } else {
        currentLength++;
      }
    } else {
      // Only update if we find a strictly longer sequence (prefer leftmost on ties)
      if (currentLength > longestLength && currentLength > 1) {
        longestStart = currentStart;
        longestLength = currentLength;
      }
      currentStart = -1;
      currentLength = 0;
    }
  }

  // Check the final sequence - only update if strictly longer
  if (currentLength > longestLength && currentLength > 1) {
    longestStart = currentStart;
    longestLength = currentLength;
  }

  return { start: longestStart, length: longestLength };
}

/* Normalize IPv6 address according to RFC 5952 */
function normalizeIPv6(input: string): IPv6Normalization {
  const steps: NormalizationStep[] = [];
  let current = input;
  let compressionApplied = false;
  let leadingZerosRemoved = false;
  let lowercaseApplied = false;

  try {
    if (!isValidIPv6(input)) {
      return {
        input,
        normalized: '',
        isValid: false,
        error: 'Invalid IPv6 address format',
        steps: [],
        originalFormat: input,
        compressionApplied: false,
        leadingZerosRemoved: false,
        lowercaseApplied: false,
      };
    }

    // Preserve original zone identifier case
    const [_originalIP, originalZone] = input.split('%');

    // Step 1: Convert to lowercase (RFC 5952 Section 4.1) - but preserve zone case
    const [ipPart, zonePart] = current.split('%');
    const lowercaseIP = ipPart.toLowerCase();
    if (ipPart !== lowercaseIP) {
      const before = current;
      current = lowercaseIP + (zonePart ? '%' + zonePart : '');
      lowercaseApplied = true;
      steps.push({
        step: '1',
        description: 'Convert hexadecimal digits to lowercase',
        before,
        after: current,
      });
    }

    // Step 2: Expand to full form
    const expanded = expandIPv6(current);

    if (expanded !== current) {
      steps.push({
        step: '2',
        description: 'Expand compressed address to full form',
        before: current,
        after: expanded,
      });
      current = expanded;
    }

    // Step 3: Remove leading zeros (RFC 5952 Section 4.1)
    const [expandedClean, expandedZone] = current.split('%');
    const groups = expandedClean.split(':');
    const trimmedGroups = groups.map((group) => group.replace(/^0+/, '') || '0');
    const trimmed = trimmedGroups.join(':') + (expandedZone ? '%' + expandedZone : '');

    if (trimmed !== current) {
      leadingZerosRemoved = true;
      steps.push({
        step: '3',
        description: 'Remove leading zeros from each group',
        before: current,
        after: trimmed,
      });
      current = trimmed;
    }

    // Step 4: Apply compression (RFC 5952 Section 4.2)
    const [trimmedClean, trimmedZone] = current.split('%');
    const trimmedGroupsForCompression = trimmedClean.split(':');

    // Find longest sequence of consecutive zeros
    const zeroSeq = findLongestZeroSequence(trimmedGroupsForCompression);

    if (zeroSeq.start !== -1 && zeroSeq.length > 1) {
      compressionApplied = true;
      const before = trimmedGroupsForCompression.slice(0, zeroSeq.start);
      const after = trimmedGroupsForCompression.slice(zeroSeq.start + zeroSeq.length);

      let compressed: string;
      if (before.length === 0 && after.length === 0) {
        compressed = '::';
      } else if (before.length === 0) {
        compressed = '::' + after.join(':');
      } else if (after.length === 0) {
        compressed = before.join(':') + '::';
      } else {
        compressed = before.join(':') + '::' + after.join(':');
      }

      // Use original zone case if present
      const compressedWithZone = compressed + (originalZone ? '%' + originalZone : '');

      if (compressedWithZone !== current) {
        steps.push({
          step: '4',
          description: `Compress longest sequence of ${zeroSeq.length} consecutive zero groups`,
          before: current,
          after: compressedWithZone,
        });
        current = compressedWithZone;
      }
    } else if (originalZone && trimmedZone !== originalZone) {
      // Restore original zone case even if no compression was applied
      current = trimmedClean + '%' + originalZone;
    }

    return {
      input,
      normalized: current,
      isValid: true,
      steps,
      originalFormat: input,
      compressionApplied,
      leadingZerosRemoved,
      lowercaseApplied,
    };
  } catch (error) {
    return {
      input,
      normalized: '',
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      steps: [],
      originalFormat: input,
      compressionApplied: false,
      leadingZerosRemoved: false,
      lowercaseApplied: false,
    };
  }
}

/* Normalize multiple IPv6 addresses */
export function normalizeIPv6Addresses(inputs: string[]): IPv6NormalizeResult {
  const normalizations: IPv6Normalization[] = [];
  const errors: string[] = [];

  for (const input of inputs) {
    if (!input.trim()) continue;

    const normalization = normalizeIPv6(input.trim());
    normalizations.push(normalization);

    if (!normalization.isValid && normalization.error) {
      errors.push(`"${input}": ${normalization.error}`);
    }
  }

  const validCount = normalizations.filter((n) => n.isValid).length;
  const alreadyNormalizedCount = normalizations.filter((n) => n.isValid && n.input === n.normalized).length;

  return {
    normalizations,
    summary: {
      totalInputs: normalizations.length,
      validInputs: validCount,
      invalidInputs: normalizations.length - validCount,
      alreadyNormalizedInputs: alreadyNormalizedCount,
    },
    errors,
  };
}
