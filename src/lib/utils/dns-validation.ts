// DNS validation and utility functions

export interface SimpleValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  normalized?: string;
}

export interface DNSRecord {
  name: string;
  type: string;
  value: string;
  ttl?: number;
  priority?: number;
  weight?: number;
  port?: number;
}

export interface TTLInfo {
  seconds: number;
  human: string;
  expiresAt: Date;
  category: 'very-short' | 'short' | 'medium' | 'long' | 'very-long';
  recommendations: string[];
}

export interface EDNSEstimate {
  baseSize: number;
  recordsSize: number;
  totalSize: number;
  udpSafe: boolean;
  fragmentationRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface LabelAnalysis {
  original: string;
  normalized: string;
  warnings: string[];
  errors: string[];
  scripts: string[];
  hasHomoglyphs: boolean;
  isIDN: boolean;
}

// DNS Record Type Validators
export function validateARecord(value: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  if (!ipv4Regex.test(value.trim())) {
    errors.push('Invalid IPv4 address format');
  }

  const octets = value.split('.');
  octets.forEach((octet, index) => {
    const num = parseInt(octet);
    if (num < 0 || num > 255) {
      errors.push(`Octet ${index + 1} (${octet}) is out of range (0-255)`);
    }
  });

  if (value.startsWith('0.') || value.startsWith('255.')) {
    warnings.push('Address in reserved range');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    normalized: value.trim(),
  };
}

export function validateAAAARecord(value: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const normalized = normalizeIPv6(value);

    if (normalized.startsWith('::1')) {
      warnings.push('Loopback address');
    } else if (normalized.startsWith('fe80:')) {
      warnings.push('Link-local address');
    } else if (normalized.startsWith('ff')) {
      warnings.push('Multicast address');
    }

    return {
      valid: true,
      errors,
      warnings,
      normalized,
    };
  } catch {
    errors.push('Invalid IPv6 address format');
    return {
      valid: false,
      errors,
      warnings,
    };
  }
}

export function validateCNAMERecord(value: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const normalized = normalizeDomainName(value);

  if (normalized === '.') {
    errors.push('CNAME cannot point to root');
    return { valid: false, errors, warnings };
  }

  // Use the proper domain validation
  const cleanedValue = value.replace(/\.$/, ''); // Remove trailing dot for validation
  if (!isValidDomainName(cleanedValue)) {
    errors.push('Invalid domain name format');
    return { valid: false, errors, warnings };
  }

  if (!normalized.endsWith('.')) {
    warnings.push('Domain should end with dot (.) to be fully qualified');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    normalized,
  };
}

export function validateMXRecord(value: string, priority?: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (priority !== undefined) {
    if (priority < 0 || priority > 65535) {
      errors.push('MX priority must be between 0 and 65535');
    }
  }

  const domainResult = validateCNAMERecord(value);
  errors.push(...domainResult.errors);
  warnings.push(...domainResult.warnings);

  if (value === '.') {
    warnings.push('Null MX record (mail disabled for domain)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    normalized: domainResult.normalized,
  };
}

export function validateTXTRecord(value: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (value.length > 65535) {
    errors.push('TXT record too long (max 65535 characters)');
  }

  // Check for proper chunking (255 character chunks)
  const chunks = splitTXTRecord(value);
  if (chunks.some((chunk) => chunk.length > 255)) {
    warnings.push('Long strings should be split into 255-character chunks');
  }

  // Check for common record types
  if (value.startsWith('v=spf1')) {
    warnings.push('SPF record detected - validate policy carefully');
  } else if (value.startsWith('v=DMARC1')) {
    warnings.push('DMARC record detected - validate policy syntax');
  } else if (value.includes('._domainkey')) {
    warnings.push('DKIM record detected - validate key format');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    normalized: value,
  };
}

export function validateSRVRecord(
  service: string,
  protocol: string,
  priority: number,
  weight: number,
  port: number,
  target: string,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!service.startsWith('_')) {
    errors.push('Service must start with underscore (_)');
  }

  if (!['_tcp', '_udp'].includes(protocol)) {
    errors.push('Protocol must be _tcp or _udp');
  }

  if (priority < 0 || priority > 65535) {
    errors.push('Priority must be between 0 and 65535');
  }

  if (weight < 0 || weight > 65535) {
    errors.push('Weight must be between 0 and 65535');
  }

  if (port < 0 || port > 65535) {
    errors.push('Port must be between 0 and 65535');
  }

  const targetResult = validateCNAMERecord(target);
  errors.push(...targetResult.errors);
  warnings.push(...targetResult.warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    normalized: `${service}.${protocol}`,
  };
}

export function validateCAARecord(flags: number, tag: string, value: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (flags < 0 || flags > 255) {
    errors.push('Flags must be between 0 and 255');
  }

  if (flags > 128) {
    warnings.push('Critical flag set - validators must understand this record');
  }

  const validTags = ['issue', 'issuewild', 'iodef'];
  if (!validTags.includes(tag)) {
    warnings.push(`Unknown tag "${tag}" - may not be processed by CAs`);
  }

  if (tag === 'issue' || tag === 'issuewild') {
    if (!value && value !== ';') {
      warnings.push('Empty issue tag disallows certificate issuance');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    normalized: `${flags} ${tag} "${value}"`,
  };
}

// TTL Functions
// Simple humanize function that returns just the string (for backwards compatibility)
export function humanizeTTLSimple(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
    }
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''}`;
  } else {
    const weeks = Math.floor(seconds / 604800);
    return `${weeks} week${weeks !== 1 ? 's' : ''}`;
  }
}

export function humanizeTTL(seconds: number): TTLInfo {
  const recommendations: string[] = [];
  let category: TTLInfo['category'];
  let human: string;

  if (seconds < 300) {
    category = 'very-short';
    human = `${seconds} seconds`;
    recommendations.push('Consider increasing');
  } else if (seconds < 3600) {
    category = 'short';
    const minutes = Math.floor(seconds / 60);
    human = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    recommendations.push('Short TTL - good for services that change frequently');
  } else if (seconds < 86400) {
    category = 'medium';
    const hours = Math.floor(seconds / 3600);
    human = `${hours} hour${hours !== 1 ? 's' : ''}`;
    recommendations.push('Medium TTL - balanced between performance and flexibility');
  } else if (seconds < 604800) {
    category = 'long';
    const days = Math.floor(seconds / 86400);
    human = `${days} day${days !== 1 ? 's' : ''}`;
    recommendations.push('Long TTL - good for stable records, reduces DNS queries');
  } else {
    category = 'very-long';
    const weeks = Math.floor(seconds / 604800);
    human = `${weeks} week${weeks !== 1 ? 's' : ''}`;
    recommendations.push('Very long TTL - use only for extremely stable records');
  }

  return {
    seconds,
    human,
    expiresAt: new Date(Date.now() + seconds * 1000),
    category,
    recommendations,
  };
}

export function calculateCacheExpiry(ttlSeconds: number, recordCreated?: Date): Date {
  const created = recordCreated || new Date();
  return new Date(created.getTime() + ttlSeconds * 1000);
}

// EDNS Size Estimation
// Original function for internal use
function estimateEDNSSizeFromRecords(records: DNSRecord[]): EDNSEstimate {
  const baseSize = 12; // DNS header
  let recordsSize = 0;

  records.forEach((record) => {
    // Question section (if query)
    recordsSize += record.name.length + 1 + 4; // name + type + class

    // Answer section
    recordsSize += record.name.length + 1; // name
    recordsSize += 10; // type + class + ttl + rdlength
    recordsSize += estimateRecordDataSize(record);
  });

  const totalSize = baseSize + recordsSize;

  let udpSafe = true;
  let fragmentationRisk: EDNSEstimate['fragmentationRisk'] = 'low';
  const recommendations: string[] = [];

  if (totalSize > 512) {
    udpSafe = false;
    recommendations.push('Response exceeds 512 bytes - EDNS0 required');
  }

  if (totalSize > 1232) {
    fragmentationRisk = 'medium';
    recommendations.push('Response may be fragmented on some networks');
  }

  if (totalSize > 4096) {
    fragmentationRisk = 'high';
    recommendations.push('Consider using TCP');
  }

  return {
    baseSize,
    recordsSize,
    totalSize,
    udpSafe,
    fragmentationRisk,
    recommendations,
  };
}

// Public function that matches test expectations
export function estimateEDNSSize(name: string, type: string, records: unknown[]): EDNSEstimate {
  // Convert parameters to DNSRecord format
  const dnsRecords: DNSRecord[] = records.map((record) => {
    const r = record as Record<string, any>;
    return {
      name: (r.name as string) || name,
      type: (r.type as string) || type,
      value: (r.value as string) || '',
      ttl: (r.ttl as number) || 300,
    };
  });

  return estimateEDNSSizeFromRecords(dnsRecords);
}

// Label Normalization
export function normalizeLabel(label: string): LabelAnalysis {
  const errors: string[] = [];
  const warnings: string[] = [];
  const scripts: string[] = [];
  let hasHomoglyphs = false;
  let isIDN = false;

  let normalized = label.toLowerCase().trim();

  // Remove trailing dots
  if (normalized.endsWith('.')) {
    normalized = normalized.slice(0, -1);
  }

  // Check for IDN
  if (normalized.includes('xn--') || /[^\u0020-\u007F]/.test(normalized)) {
    isIDN = true;
    try {
      // Basic IDN normalization would go here
      // For now, just detect it
    } catch {
      errors.push('Invalid IDN encoding');
    }
  }

  // Check for mixed scripts
  const scriptRanges = [
    { name: 'Latin', regex: /[\u0020-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F]/ },
    { name: 'Cyrillic', regex: /[\u0400-\u04FF\u0500-\u052F]/ },
    { name: 'Arabic', regex: /[\u0600-\u06FF\u0750-\u077F]/ },
    { name: 'Chinese', regex: /[\u4E00-\u9FFF]/ },
  ];

  scriptRanges.forEach((script) => {
    if (script.regex.test(normalized)) {
      scripts.push(script.name);
    }
  });

  if (scripts.length > 1) {
    warnings.push('Mixed scripts detected - potential homograph attack risk');
    hasHomoglyphs = true;
  }

  // Check common homoglyphs
  const homoglyphs = [
    { char: 'а', lookalike: 'a', script: 'Cyrillic' },
    { char: 'о', lookalike: 'o', script: 'Cyrillic' },
    { char: 'р', lookalike: 'p', script: 'Cyrillic' },
  ];

  homoglyphs.forEach((h) => {
    if (normalized.includes(h.char)) {
      warnings.push(`Contains ${h.script} "${h.char}" that looks like Latin "${h.lookalike}"`);
      hasHomoglyphs = true;
    }
  });

  return {
    original: label,
    normalized,
    warnings,
    errors,
    scripts,
    hasHomoglyphs,
    isIDN,
  };
}

// Helper Functions
function normalizeIPv6(ip: string): string {
  // Basic IPv6 normalization - expand and format
  const parts = ip.split(':');
  const expanded: string[] = [];

  // Validate hex characters
  const hexRegex = /^[0-9a-fA-F]*$/;

  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === '') {
      const zerosNeeded = 8 - (parts.length - 1);
      for (let j = 0; j < zerosNeeded; j++) {
        expanded.push('0000');
      }
    } else {
      // Validate that the part contains only valid hex characters
      if (!hexRegex.test(parts[i]) || parts[i].length > 4) {
        throw new Error('Invalid IPv6 address format');
      }
      expanded.push(parts[i].padStart(4, '0'));
    }
  }

  // Basic length validation
  if (expanded.length !== 8) {
    throw new Error('Invalid IPv6 address format');
  }

  return expanded.join(':').toLowerCase();
}

function normalizeDomainName(domain: string): string {
  if (!domain) return '';
  return domain.toLowerCase().trim();
}

function splitTXTRecord(value: string): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += 255) {
    chunks.push(value.slice(i, i + 255));
  }
  return chunks;
}

function estimateRecordDataSize(record: DNSRecord): number {
  switch (record.type.toLowerCase()) {
    case 'a':
      return 4;
    case 'aaaa':
      return 16;
    case 'mx':
      return 2 + record.value.length + 1;
    case 'cname':
      return record.value.length + 1;
    case 'txt':
      return record.value.length + 1;
    case 'srv':
      return 6 + record.value.length + 1;
    case 'caa':
      return 2 + record.value.length;
    default:
      return record.value.length + 10; // Estimate
  }
}

// Simple validation functions for diagnostic tools
export function isValidDomainName(domain: string): boolean {
  if (!domain || domain.trim().length === 0) return false;

  const trimmed = domain.trim();

  // Check length limits (RFC 1035)
  if (trimmed.length > 253) return false;

  // Reject leading/trailing dots or spaces
  if (trimmed.startsWith('.') || trimmed.endsWith('.') || trimmed.includes(' ')) return false;

  // Reject double dots
  if (trimmed.includes('..')) return false;

  // Must have at least one dot (require TLD)
  if (!trimmed.includes('.')) return false;

  // Check individual labels (max 63 bytes each)
  const labels = trimmed.split('.');
  if (labels.some((label) => label.length === 0 || label.length > 63)) return false;

  // Check each label doesn't start/end with hyphen
  if (labels.some((label) => label.startsWith('-') || label.endsWith('-'))) return false;

  // Basic character validation (allow underscores for DNS records like _dmarc)
  const validChars = /^[a-zA-Z0-9_-]+$/;
  if (labels.some((label) => !validChars.test(label))) return false;

  return true;
}

export function isValidIPAddress(ip: string): boolean {
  if (!ip || ip.trim().length === 0) return false;

  const trimmed = ip.trim();

  // IPv4 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv4Regex.test(trimmed)) return true;

  // IPv6 validation (comprehensive)
  const ipv6Full = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  const ipv6Compressed =
    /^(?:[0-9a-fA-F]{1,4}:)*::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:)*::[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:)*::$/;
  const ipv6Loopback = /^::1$/;
  const ipv6Any = /^::$/;

  return ipv6Full.test(trimmed) || ipv6Compressed.test(trimmed) || ipv6Loopback.test(trimmed) || ipv6Any.test(trimmed);
}

export function validateDNSLookupInput(
  domain: string,
  useCustomResolver: boolean = false,
  customResolver: string = '',
): SimpleValidationResult {
  const trimmedDomain = domain.trim();

  if (!trimmedDomain) {
    return { isValid: false, error: 'Domain name is required' };
  }

  if (!isValidDomainName(trimmedDomain)) {
    return {
      isValid: false,
      error: 'Invalid domain name format. Use valid domain names like "example.com"',
    };
  }

  if (useCustomResolver) {
    const trimmedResolver = customResolver.trim();

    if (!trimmedResolver) {
      return {
        isValid: false,
        error: 'Custom DNS resolver IP address is required when custom resolver is selected',
      };
    }

    if (!isValidIPAddress(trimmedResolver)) {
      return {
        isValid: false,
        error: 'Invalid DNS resolver IP address. Use valid IPv4 (8.8.8.8) or IPv6 addresses',
      };
    }
  }

  return { isValid: true };
}

export function validateReverseLookupInput(
  ipAddress: string,
  useCustomResolver: boolean = false,
  customResolver: string = '',
): SimpleValidationResult {
  const trimmedIP = ipAddress.trim();

  if (!trimmedIP) {
    return { isValid: false, error: 'IP address is required' };
  }

  if (!isValidIPAddress(trimmedIP)) {
    return {
      isValid: false,
      error: 'Invalid IP address format. Use valid IPv4 (8.8.8.8) or IPv6 addresses',
    };
  }

  if (useCustomResolver) {
    const trimmedResolver = customResolver.trim();

    if (!trimmedResolver) {
      return {
        isValid: false,
        error: 'Custom DNS resolver IP address is required when custom resolver is selected',
      };
    }

    if (!isValidIPAddress(trimmedResolver)) {
      return {
        isValid: false,
        error: 'Invalid DNS resolver IP address. Use valid IPv4 (8.8.8.8) or IPv6 addresses',
      };
    }
  }

  return { isValid: true };
}

export function formatDNSError(error: unknown): string {
  if (typeof error === 'string') return error;

  const errorObj = error as Record<string, any>;
  if (errorObj?.name === 'TypeError' && typeof errorObj.message === 'string' && errorObj.message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  if (errorObj?.message && typeof errorObj.message === 'string') {
    // Clean up common DNS error messages
    const message = errorObj.message;

    if (message.includes('ENOTFOUND')) {
      return 'Domain not found. Please check the domain name and try again.';
    }

    if (message.includes('ENODATA')) {
      return 'No records found for this query. The domain may not have the requested record type.';
    }

    if (message.includes('ETIMEOUT') || message.includes('timeout')) {
      return 'DNS lookup timed out. Please try again or use a different DNS resolver.';
    }

    if (message.includes('ECONNREFUSED')) {
      return 'DNS server connection refused. Please try a different DNS resolver.';
    }

    return message;
  }

  return 'An unexpected error occurred during DNS lookup.';
}
// Additional functions expected by tests

export function validateDomainName(domain: string): { valid: boolean; errors: string[] } {
  const valid = isValidDomainName(domain);
  return {
    valid,
    errors: valid ? [] : ['Invalid domain name'],
  };
}

export function validateEmail(email: string): { valid: boolean; errors: string[]; normalized?: string } {
  // Basic email validation for DNS use
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, errors: ['Invalid email format'] };
  }

  const [localPart, domain] = email.split('@');
  const domainValidation = validateDomainName(domain);

  if (!domainValidation.valid) {
    return { valid: false, errors: ['Invalid domain in email'] };
  }

  // Convert to DNS format - escape special characters and replace @ with .
  const normalized = localPart.replace(/([.+])/g, '\\$1') + '.' + domain;

  return { valid: true, errors: [], normalized };
}

export function validateTTL(ttl: number): { valid: boolean; error?: string } {
  if (ttl <= 0) {
    return { valid: false, error: 'TTL must be greater than 0' };
  }
  if (ttl > 2147483647) {
    return { valid: false, error: 'TTL too large' };
  }
  return { valid: true };
}

export function calculateTTLExpiry(ttl: number): TTLInfo {
  return humanizeTTL(ttl);
}

export function validateDNSRecord(
  name: string,
  type: string,
  value: string,
): { valid: boolean; errors: string[]; warnings?: string[] } {
  const warnings: string[] = [];

  if (!type) {
    return { valid: false, errors: ['DNS record type is required'] };
  }

  switch (type.toUpperCase()) {
    case 'A': {
      const aResult = validateARecord(value);
      return { valid: aResult.valid, errors: aResult.valid ? [] : ['Invalid IPv4 address'] };
    }

    case 'AAAA': {
      const aaaaResult = validateAAAARecord(value);
      return { valid: aaaaResult.valid, errors: aaaaResult.valid ? [] : ['Invalid IPv6 address'] };
    }

    case 'CNAME': {
      if (name.split('.').length === 2) {
        // apex domain
        warnings.push('CNAME at zone apex');
      }
      const cnameResult = validateCNAMERecord(value);
      return { valid: cnameResult.valid, errors: cnameResult.valid ? [] : ['Invalid CNAME record'], warnings };
    }

    case 'MX': {
      const parts = value.split(' ');
      if (parts.length !== 2 || isNaN(Number(parts[0]))) {
        return { valid: false, errors: ['Invalid MX priority'] };
      }
      const priority = Number(parts[0]);
      const domain = parts[1];
      const mxResult = validateMXRecord(domain, priority);
      return { valid: mxResult.valid, errors: mxResult.errors, warnings: mxResult.warnings };
    }

    case 'TXT': {
      if (value.length > 255) {
        return { valid: false, errors: ['TXT record string too long'] };
      }
      const txtResult = validateTXTRecord(value);
      return { valid: txtResult.valid, errors: txtResult.valid ? [] : ['Invalid TXT record'] };
    }

    case 'SRV': {
      const srvParts = value.split(' ');
      if (srvParts.length !== 4) {
        return { valid: false, errors: ['SRV record must have 4 parts: priority weight port target'] };
      }

      const srvPriority = Number(srvParts[0]);
      const srvWeight = Number(srvParts[1]);
      const srvPort = Number(srvParts[2]);
      const srvTarget = srvParts[3];

      if (isNaN(srvPriority) || isNaN(srvWeight) || isNaN(srvPort)) {
        return { valid: false, errors: ['Invalid SRV record format'] };
      }

      if (srvPort < 0 || srvPort > 65535) {
        return { valid: false, errors: ['Invalid port number'] };
      }

      // For SRV validation, we need to extract service and protocol from the name
      const nameParts = name.split('.');
      const service = nameParts[0] || '_service';
      const protocol = nameParts[1] || '_tcp';

      const srvResult = validateSRVRecord(service, protocol, srvPriority, srvWeight, srvPort, srvTarget);
      return { valid: srvResult.valid, errors: srvResult.errors, warnings: srvResult.warnings };
    }

    default:
      return { valid: true, errors: [] }; // Unknown types pass through
  }
}

export function normalizeDomainLabel(label: string): {
  normalized: string;
  warnings: string[];
  errors: string[];
  hasHomoglyphs?: boolean;
  scripts?: string[];
  isIDN?: boolean;
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  const normalized = label.toLowerCase();

  // Basic homoglyph detection (simplified)
  const hasHomoglyphs = /[а-я]/.test(label) && /[a-z]/.test(label); // Mixed Cyrillic and Latin
  if (hasHomoglyphs) {
    warnings.push('Contains potential homoglyphs');
  }

  // Script detection (simplified)
  const scripts: string[] = [];
  if (/[a-zA-Z]/.test(label)) scripts.push('Latin');
  if (/[а-яА-Я]/.test(label)) scripts.push('Cyrillic');
  if (/[\u4e00-\u9fff]/.test(label)) scripts.push('Han');
  if (/[\u0600-\u06ff]/.test(label)) scripts.push('Arabic');

  if (scripts.length > 1) {
    warnings.push('Mixed scripts detected');
  }

  const isIDN = scripts.some((script) => script !== 'Latin');

  return {
    normalized,
    warnings,
    errors,
    hasHomoglyphs,
    scripts,
    isIDN,
  };
}
