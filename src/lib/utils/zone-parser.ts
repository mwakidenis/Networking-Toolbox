export interface ResourceRecord {
  owner: string;
  ttl?: number;
  class: string;
  type: string;
  rdata: string;
  line?: number;
  raw?: string;
}

export interface ParsedZone {
  records: ResourceRecord[];
  errors: ParseError[];
  warnings: ParseWarning[];
  soa?: ResourceRecord;
  defaultTTL?: number;
  origin?: string;
}

export interface ParseError {
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface ParseWarning extends ParseError {
  severity: 'warning';
}

export interface ZoneStats {
  totalRecords: number;
  recordsByType: Record<string, number>;
  ttlDistribution: Record<number, number>;
  nameDepths: {
    min: number;
    max: number;
    average: number;
  };
  largestRecord: {
    record: ResourceRecord;
    size: number;
  };
  longestName: {
    name: string;
    length: number;
  };
  sanityChecks: {
    hasSoa: boolean;
    hasNs: boolean;
    duplicates: ResourceRecord[];
    orphanedGlue: ResourceRecord[];
  };
}

export interface ZoneDiff {
  added: ResourceRecord[];
  removed: ResourceRecord[];
  changed: Array<{
    before: ResourceRecord;
    after: ResourceRecord;
  }>;
  unchanged: ResourceRecord[];
}

export interface NameLengthViolation {
  name: string;
  type: 'label' | 'fqdn';
  length: number;
  limit: number;
  labels?: string[];
}

// Constants
const MAX_LABEL_LENGTH = 63;
const MAX_FQDN_LENGTH = 255;
const DEFAULT_CLASS = 'IN';
const DEFAULT_TTL = 3600;

// Helper validation functions
function isValidDomainName(name: string): boolean {
  if (!name || name.length > MAX_FQDN_LENGTH) return false;

  // Allow @ as placeholder for origin
  if (name === '@') return true;

  // Split by dots and validate each label
  const labels = name.split('.');

  // Remove empty trailing label (for FQDN ending with .)
  if (labels[labels.length - 1] === '') {
    labels.pop();
  }

  for (const label of labels) {
    if (!isValidLabel(label)) return false;
  }

  return true;
}

function isValidLabel(label: string): boolean {
  if (!label || label.length > MAX_LABEL_LENGTH) return false;

  // Allow wildcards
  if (label === '*') return true;

  // Allow single character labels
  if (label.length === 1) return true;

  // Allow underscores for SRV records (e.g., _sip, _tcp)
  if (label.startsWith('_')) {
    return /^_[a-zA-Z0-9-]+$/.test(label);
  }

  // Must start and end with alphanumeric
  if (!/^[a-zA-Z0-9]/.test(label) || !/[a-zA-Z0-9]$/.test(label)) {
    return false;
  }

  // Can contain hyphens in the middle
  return /^[a-zA-Z0-9-]+$/.test(label);
}

function isValidIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });
}

function isValidIPv6(ip: string): boolean {
  // Comprehensive IPv6 validation
  if (!ip || typeof ip !== 'string') return false;

  // Check for invalid patterns
  if (ip.includes(':::')) return false; // Triple colon is invalid
  if (ip.split('::').length > 2) return false; // Multiple double colons

  // Handle special cases
  if (ip === '::') return true; // All zeros
  if (ip === '::1') return true; // Loopback

  // Split on double colon if present
  if (ip.includes('::')) {
    const parts = ip.split('::');
    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];

    // Total groups must not exceed 8
    if (left.length + right.length >= 8) return false;

    // Validate all groups
    const allGroups = [...left, ...right];
    return allGroups.every((group) => /^[0-9a-fA-F]{0,4}$/.test(group));
  } else {
    // No compression - must have exactly 8 groups
    const groups = ip.split(':');
    if (groups.length !== 8) return false;

    // All groups must be valid hex (1-4 characters)
    return groups.every((group) => /^[0-9a-fA-F]{1,4}$/.test(group));
  }
}

function validateRData(type: string, rdata: string, _owner: string): void {
  switch (type) {
    case 'A':
      if (!isValidIPv4(rdata)) {
        throw new Error(`Invalid IPv4 address in A record: "${rdata}"`);
      }
      break;

    case 'AAAA':
      if (!isValidIPv6(rdata)) {
        throw new Error(`Invalid IPv6 address in AAAA record: "${rdata}"`);
      }
      break;

    case 'CNAME':
    case 'NS':
    case 'PTR':
      if (!rdata.trim()) {
        throw new Error(`${type} record cannot have empty target`);
      }
      if (!isValidDomainName(rdata.trim())) {
        throw new Error(`Invalid domain name in ${type} record: "${rdata}"`);
      }
      break;

    case 'MX': {
      const mxParts = rdata.trim().split(/\s+/);
      if (mxParts.length !== 2) {
        throw new Error('MX record must have format "priority target"');
      }
      const priority = parseInt(mxParts[0]);
      if (isNaN(priority) || priority < 0 || priority > 65535) {
        throw new Error(`Invalid MX priority: ${mxParts[0]} (must be 0-65535)`);
      }
      if (!isValidDomainName(mxParts[1])) {
        throw new Error(`Invalid MX target: "${mxParts[1]}"`);
      }
      break;
    }

    case 'SOA': {
      const soaParts = rdata.trim().split(/\s+/);
      if (soaParts.length < 7) {
        throw new Error('SOA record must have 7 fields: mname rname serial refresh retry expire minimum');
      }
      if (!isValidDomainName(soaParts[0])) {
        throw new Error(`Invalid SOA mname: "${soaParts[0]}"`);
      }
      if (!isValidDomainName(soaParts[1])) {
        throw new Error(`Invalid SOA rname: "${soaParts[1]}"`);
      }
      // Validate numeric fields
      for (let i = 2; i < 7; i++) {
        const value = parseInt(soaParts[i]);
        if (isNaN(value) || value < 0) {
          throw new Error(`Invalid SOA numeric value: "${soaParts[i]}"`);
        }
      }
      break;
    }

    case 'SRV': {
      const srvParts = rdata.trim().split(/\s+/);
      if (srvParts.length !== 4) {
        throw new Error('SRV record must have format "priority weight port target"');
      }
      const srvPriority = parseInt(srvParts[0]);
      const srvWeight = parseInt(srvParts[1]);
      const srvPort = parseInt(srvParts[2]);

      if (isNaN(srvPriority) || srvPriority < 0 || srvPriority > 65535) {
        throw new Error(`Invalid SRV priority: ${srvParts[0]}`);
      }
      if (isNaN(srvWeight) || srvWeight < 0 || srvWeight > 65535) {
        throw new Error(`Invalid SRV weight: ${srvParts[1]}`);
      }
      if (isNaN(srvPort) || srvPort < 0 || srvPort > 65535) {
        throw new Error(`Invalid SRV port: ${srvParts[2]}`);
      }
      if (!isValidDomainName(srvParts[3])) {
        throw new Error(`Invalid SRV target: "${srvParts[3]}"`);
      }
      break;
    }

    case 'TXT':
      // TXT records can contain any text, but should be properly quoted if containing spaces
      if (!rdata.trim()) {
        throw new Error('TXT record cannot be empty');
      }
      break;

    case 'CAA': {
      const caaParts = rdata.trim().split(/\s+/);
      if (caaParts.length < 3) {
        throw new Error('CAA record must have format "flags tag value"');
      }
      const caaFlags = parseInt(caaParts[0]);
      if (isNaN(caaFlags) || caaFlags < 0 || caaFlags > 255) {
        throw new Error(`Invalid CAA flags: ${caaParts[0]} (must be 0-255)`);
      }
      break;
    }

    default:
      // For other record types, just ensure RDATA is not empty
      if (!rdata.trim()) {
        throw new Error(`${type} record cannot have empty RDATA`);
      }
  }
}

export function parseZoneFile(content: string): ParsedZone {
  const lines = content.split('\n');
  const records: ResourceRecord[] = [];
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];

  let currentOrigin = '';
  let defaultTTL = DEFAULT_TTL;
  let lastOwner = '';
  let soa: ResourceRecord | undefined;

  // Preprocess lines to handle multi-line records
  const processedLines: { line: string; lineNum: number; startsWithWhitespace: boolean }[] = [];
  let multiLineBuffer = '';
  let multiLineStartNum = 0;
  let inMultiLine = false;

  for (let i = 0; i < lines.length; i++) {
    const originalLine = lines[i];
    const line = originalLine.trim();
    const lineNum = i + 1;

    // Skip empty lines and comments
    if (!line || line.startsWith(';')) continue;

    // Check if line started with whitespace (indicating inherited owner)
    const startsWithWhitespace = originalLine !== line && originalLine.length > 0;

    if (line.includes('(') && !line.includes(')')) {
      // Start of multi-line record
      inMultiLine = true;
      multiLineBuffer = line.replace('(', '').trim();
      multiLineStartNum = lineNum;
    } else if (inMultiLine && line.includes(')')) {
      // End of multi-line record
      const cleanLine = line.replace(')', '').trim();
      const commentIndex = cleanLine.indexOf(';');
      const lineWithoutComment = commentIndex >= 0 ? cleanLine.substring(0, commentIndex).trim() : cleanLine;
      multiLineBuffer += ' ' + lineWithoutComment;
      processedLines.push({ line: multiLineBuffer.trim(), lineNum: multiLineStartNum, startsWithWhitespace: false });
      multiLineBuffer = '';
      inMultiLine = false;
    } else if (inMultiLine) {
      // Middle of multi-line record - strip comments
      const commentIndex = line.indexOf(';');
      const lineWithoutComment = commentIndex >= 0 ? line.substring(0, commentIndex).trim() : line;
      multiLineBuffer += ' ' + lineWithoutComment;
    } else {
      // Regular single-line record
      processedLines.push({ line, lineNum, startsWithWhitespace });
    }
  }

  for (const { line, lineNum, startsWithWhitespace } of processedLines) {
    try {
      // Handle $ORIGIN directive
      if (line.startsWith('$ORIGIN')) {
        const match = line.match(/^\$ORIGIN\s+(\S+)/);
        if (!match) {
          throw new Error('Invalid $ORIGIN directive syntax');
        }
        currentOrigin = match[1];
        if (!currentOrigin.endsWith('.')) {
          currentOrigin += '.';
        }
        if (!isValidDomainName(currentOrigin)) {
          throw new Error(`Invalid domain name in $ORIGIN: "${currentOrigin}"`);
        }
        continue;
      }

      // Handle $TTL directive
      if (line.startsWith('$TTL')) {
        const match = line.match(/^\$TTL\s+(\d+)/);
        if (!match) {
          throw new Error('Invalid $TTL directive syntax');
        }
        const newTTL = parseInt(match[1]);
        if (newTTL < 0 || newTTL > 2147483647) {
          throw new Error(`Invalid $TTL value: ${newTTL} (must be 0-2147483647)`);
        }
        defaultTTL = newTTL;
        continue;
      }

      // Check for unknown directives
      if (line.startsWith('$')) {
        throw new Error(`Unknown directive: ${line.split(/\s+/)[0]}`);
      }

      // Parse resource record
      const record = parseResourceRecord(line, lastOwner, defaultTTL, currentOrigin, lineNum, startsWithWhitespace);
      if (record) {
        records.push(record);
        lastOwner = record.owner;

        // Auto-detect origin from first FQDN if not set
        if (!currentOrigin && record.owner.endsWith('.')) {
          currentOrigin = record.owner;
        }

        if (record.type === 'SOA' && !soa) {
          soa = record;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
      errors.push({
        line: lineNum,
        message: errorMessage,
        severity: 'error',
      });
    }
  }

  // Add warnings for common issues
  if (!soa) {
    warnings.push({
      line: 0,
      message: 'No SOA record found in zone',
      severity: 'warning',
    });
  }

  return {
    records,
    errors,
    warnings,
    soa,
    defaultTTL,
    origin: currentOrigin,
  };
}

function parseResourceRecord(
  line: string,
  lastOwner: string,
  defaultTTL: number,
  origin: string,
  lineNum: number,
  startsWithWhitespace: boolean = false,
): ResourceRecord | null {
  // Remove comments
  const commentIndex = line.indexOf(';');
  const cleanLine = commentIndex >= 0 ? line.substring(0, commentIndex).trim() : line;

  if (!cleanLine) return null;

  const parts = cleanLine.split(/\s+/);
  if (parts.length < 3) {
    throw new Error(`Invalid record format: insufficient fields (minimum 3 required, found ${parts.length})`);
  }

  let owner = parts[0];
  let ttl: number | undefined;
  let recordClass = DEFAULT_CLASS;
  let partIndex = 1;

  // Handle implicit owner (blank or continuation)
  if (owner === '' || owner === '@' || startsWithWhitespace) {
    // If line started with whitespace, the first field is actually the class/type/TTL, not owner
    if (startsWithWhitespace) {
      owner = lastOwner || origin;
      // Prepend a placeholder for the missing owner field
      parts.unshift('');
      partIndex = 1; // Reset to start parsing from the actual first field
    } else {
      owner = lastOwner || origin;
    }
  } else if (!owner.endsWith('.')) {
    // For relative names, append the origin if available
    if (origin) {
      owner = owner + '.' + origin;
    }
  }

  // Validate owner name
  if (!isValidDomainName(owner)) {
    throw new Error(`Invalid owner name: "${owner}"`);
  }

  // Parse TTL (optional)
  if (/^-?\d+$/.test(parts[partIndex])) {
    ttl = parseInt(parts[partIndex]);
    if (ttl < 0 || ttl > 2147483647) {
      throw new Error(`Invalid TTL value: ${ttl} (must be 0-2147483647)`);
    }
    partIndex++;
  }

  // Parse class (optional, usually IN)
  if (parts[partIndex] && ['IN', 'CH', 'HS'].includes(parts[partIndex].toUpperCase())) {
    recordClass = parts[partIndex].toUpperCase();
    partIndex++;
  }

  // Parse type (required)
  if (partIndex >= parts.length) {
    throw new Error('Missing record type');
  }
  const type = parts[partIndex].toUpperCase();
  partIndex++;

  // Validate record type
  const validTypes = [
    'A',
    'AAAA',
    'CNAME',
    'MX',
    'NS',
    'PTR',
    'SOA',
    'SRV',
    'TXT',
    'CAA',
    'DNAME',
    'HINFO',
    'LOC',
    'NAPTR',
    'RP',
    'SSHFP',
    'SVCB',
    'HTTPS',
    'TLSA',
  ];
  if (!validTypes.includes(type)) {
    throw new Error(`Unknown or unsupported record type: "${type}"`);
  }

  // Parse RDATA (rest of the line)
  if (partIndex >= parts.length) {
    throw new Error(`Missing RDATA for ${type} record`);
  }
  const rdata = parts.slice(partIndex).join(' ');

  // Validate RDATA based on record type
  validateRData(type, rdata, owner);

  return {
    owner,
    ttl: ttl || defaultTTL,
    class: recordClass,
    type,
    rdata,
    line: lineNum,
    raw: line,
  };
}

export function normalizeZone(zone: ParsedZone): ParsedZone {
  const normalizedRecords = [...zone.records]
    .sort((a, b) => {
      // Sort by owner name first
      if (a.owner !== b.owner) {
        return a.owner.localeCompare(b.owner);
      }
      // Then by type
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }
      // Then by RDATA
      return a.rdata.localeCompare(b.rdata);
    })
    // Remove duplicates
    .filter((record, index, array) => {
      if (index === 0) return true;
      const prev = array[index - 1];
      return !(record.owner === prev.owner && record.type === prev.type && record.rdata === prev.rdata);
    });

  return {
    ...zone,
    records: normalizedRecords,
  };
}

export function generateZoneStats(zone: ParsedZone): ZoneStats {
  const recordsByType: Record<string, number> = {};
  const ttlDistribution: Record<number, number> = {};
  const nameLengths: number[] = [];

  let largestRecord = { record: zone.records[0], size: 0 };
  let longestName = { name: '', length: 0 };

  for (const record of zone.records) {
    // Count by type
    recordsByType[record.type] = (recordsByType[record.type] || 0) + 1;

    // Count TTL distribution
    const ttl = record.ttl || 0;
    ttlDistribution[ttl] = (ttlDistribution[ttl] || 0) + 1;

    // Track name lengths and depths
    const nameLength = record.owner.length;
    nameLengths.push(nameLength);

    if (nameLength > longestName.length) {
      longestName = { name: record.owner, length: nameLength };
    }

    // Track largest record
    const recordSize = (record.raw || '').length;
    if (recordSize > largestRecord.size) {
      largestRecord = { record, size: recordSize };
    }
  }

  // Calculate name depth statistics
  const nameDepths = {
    min: Math.min(...nameLengths),
    max: Math.max(...nameLengths),
    average: nameLengths.reduce((sum, len) => sum + len, 0) / nameLengths.length || 0,
  };

  // Find duplicates
  const duplicates: ResourceRecord[] = [];
  const seen = new Set<string>();

  for (const record of zone.records) {
    const key = `${record.owner}:${record.type}:${record.rdata}`;
    if (seen.has(key)) {
      duplicates.push(record);
    } else {
      seen.add(key);
    }
  }

  // Basic sanity checks
  const hasSoa = zone.records.some((r) => r.type === 'SOA');
  const hasNs = zone.records.some((r) => r.type === 'NS');

  // Find orphaned glue records (A/AAAA records for NS that don't exist)
  const nsTargets = new Set(zone.records.filter((r) => r.type === 'NS').map((r) => r.rdata.trim()));

  const orphanedGlue = zone.records.filter((record) => {
    return (record.type === 'A' || record.type === 'AAAA') && !nsTargets.has(record.owner);
  });

  return {
    totalRecords: zone.records.length,
    recordsByType,
    ttlDistribution,
    nameDepths,
    largestRecord,
    longestName,
    sanityChecks: {
      hasSoa,
      hasNs,
      duplicates,
      orphanedGlue,
    },
  };
}

export function compareZones(oldZone: ParsedZone, newZone: ParsedZone): ZoneDiff {
  const oldRecords = new Map<string, ResourceRecord>();
  const newRecords = new Map<string, ResourceRecord>();

  // Create maps for easy comparison
  oldZone.records.forEach((record) => {
    const key = `${record.owner}:${record.type}`;
    oldRecords.set(key, record);
  });

  newZone.records.forEach((record) => {
    const key = `${record.owner}:${record.type}`;
    newRecords.set(key, record);
  });

  const added: ResourceRecord[] = [];
  const removed: ResourceRecord[] = [];
  const changed: Array<{ before: ResourceRecord; after: ResourceRecord }> = [];
  const unchanged: ResourceRecord[] = [];

  // Find added and changed records
  newRecords.forEach((newRecord, key) => {
    const oldRecord = oldRecords.get(key);
    if (!oldRecord) {
      added.push(newRecord);
    } else if (oldRecord.rdata !== newRecord.rdata || oldRecord.ttl !== newRecord.ttl) {
      changed.push({ before: oldRecord, after: newRecord });
    } else {
      unchanged.push(newRecord);
    }
  });

  // Find removed records
  oldRecords.forEach((oldRecord, key) => {
    if (!newRecords.has(key)) {
      removed.push(oldRecord);
    }
  });

  return {
    added,
    removed,
    changed,
    unchanged,
  };
}

export function checkNameLengths(zone: ParsedZone): NameLengthViolation[] {
  const violations: NameLengthViolation[] = [];
  const checkedNames = new Set<string>();

  for (const record of zone.records) {
    const name = record.owner;

    if (checkedNames.has(name)) continue;
    checkedNames.add(name);

    // Check FQDN length
    if (name.length > MAX_FQDN_LENGTH) {
      violations.push({
        name,
        type: 'fqdn',
        length: name.length,
        limit: MAX_FQDN_LENGTH,
      });
    }

    // Check individual label lengths
    const labels = name.split('.');
    for (const label of labels) {
      if (label.length > MAX_LABEL_LENGTH) {
        violations.push({
          name,
          type: 'label',
          length: label.length,
          limit: MAX_LABEL_LENGTH,
          labels,
        });
        break; // Only report once per name
      }
    }
  }

  return violations;
}

export function formatZoneFile(zone: ParsedZone): string {
  const lines: string[] = [];

  // Add directives
  if (zone.origin) {
    lines.push(`$ORIGIN ${zone.origin}`);
  }

  if (zone.defaultTTL) {
    lines.push(`$TTL ${zone.defaultTTL}`);
  }

  if (lines.length > 0) {
    lines.push(''); // Empty line after directives
  }

  // Add records
  let lastOwner = '';
  for (const record of zone.records) {
    const owner = record.owner === lastOwner ? '' : record.owner;
    const ttl = record.ttl === zone.defaultTTL || !zone.defaultTTL ? '' : record.ttl?.toString() || '';
    const parts = [owner, ttl, record.class, record.type, record.rdata];
    lines.push(parts.join('\t'));
    lastOwner = record.owner;
  }

  return lines.join('\n');
}
