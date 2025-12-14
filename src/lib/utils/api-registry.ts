/**
 * API Registry - Maps API endpoints to utility functions
 * Central registry for all tool utility functions exposed via API
 */

// Import utility functions
import { calculateSubnet, cidrToMask, maskToCidr } from './ip-calculations.js';
import { calculateIPv6Subnet } from './ipv6-subnet-calculations.js';
import { splitCIDRByCount, splitCIDRByPrefix } from './cidr-split.js';
import { cidrDeaggregate } from './cidr-deaggregate.js';
import { cidrCompare } from './cidr-compare.js';
import { validateIP, validateIPv4 } from './ip-validation.js';
import { normalizeIPv6Addresses } from './ipv6-normalize.js';
import { generatePTRName, generateCIDRPTRs, calculateReverseZones } from './dns-tools.js';
import { calculateVLSM } from './vlsm-calculations.js';
import { calculateSupernet } from './supernet-calculations.js';
import { summarizeCIDRs } from './cidr-summarization.js';
import { findNextAvailableSubnet } from './next-available.js';
import { computeCIDRContains } from './cidr-contains.js';
import { computeCIDROverlap } from './cidr-overlap.js';
import { computeCIDRDifference } from './cidr-diff.js';
import { checkCIDRAlignment } from './cidr-alignment.js';
import { convertWildcardMasks } from './wildcard-mask.js';
import { convertIPFormats } from './ip-conversions.js';
import { calculateIPDistances } from './ip-distance.js';
import { generateRandomIPAddresses } from './random-ip.js';
import { calculateNthIPs } from './nth-ip.js';
import { generateRegex } from './ip-regex-gen.js';
import { validateRegexInput as validateWithRegex } from './ip-regex-validator.js';
import { ipv4ToIPv6, ipv6ToIPv4, compressIPv6, expandIPv6 } from './ip-family-conversions.js';
import { generateULAAddresses } from './ula.js';
import { processIPv6ZoneIdentifiers } from './ipv6-zone-id.js';
import { convertEUI64Addresses } from './eui64.js';
import { serializeBigInt } from './json-serialization.js';

// DNS utilities
import {
  validateARecord,
  validateAAAARecord,
  validateCNAMERecord,
  validateMXRecord,
  validateTXTRecord,
  validateSRVRecord,
  validateCAARecord,
  humanizeTTL,
  calculateCacheExpiry,
  estimateEDNSSize,
  normalizeLabel,
  isValidDomainName,
  validateDNSLookupInput,
  validateReverseLookupInput,
  formatDNSError,
  validateDomainName,
  validateEmail,
  validateTTL,
  calculateTTLExpiry,
  validateDNSRecord,
} from './dns-validation.js';
import {
  parseDNSKEYRecord,
  calculateKeyTag,
  generateDSRecord,
  calculateNSEC3Hash,
  formatDSRecord,
  formatCDSRecord,
  formatCDNSKEYRecord,
  generateCDSRecords,
  generateCDNSKEYRecord,
  validateCDSCDNSKEYUsage,
  suggestRRSIGWindows,
  formatRRSIGDates,
  validateRRSIGTiming,
  validateDNSKEY,
  type RRSIGPlanningOptions,
} from './dnssec.js';
import {
  generatePTRName as generateReversePTRName,
  generateCIDRPTRs as generateReverseCIDRPTRs,
  calculateReverseZones as calcReverseZones,
  generateReverseZoneFile,
  analyzePTRCoverage,
  isValidIP as dnsIsValidIP,
  isValidCIDR as dnsIsValidCIDR,
} from './reverse-dns.js';

// Type definitions for API handlers
export type APIHandler = (params: any) => any;

export interface APIEndpoint {
  handler: APIHandler;
  category: string;
  description: string;
}

/**
 * Registry of working API endpoints and their handlers
 * Organized by category for the catch-all routes
 */
export const apiRegistry: Record<string, APIEndpoint> = {
  // ============= SUBNETTING TOOLS =============
  'ipv4-subnet-calculator': {
    handler: (params) => {
      const parts = params.cidr.split('/');
      if (parts.length !== 2) {
        throw new Error('Invalid CIDR format. Expected format: 192.168.1.0/24');
      }
      const ip = parts[0];
      const prefix = parseInt(parts[1], 10);
      return calculateSubnet(ip, prefix);
    },
    category: 'subnetting',
    description: 'Calculate IPv4 subnet information',
  },
  'ipv6-subnet-calculator': {
    handler: (params) => {
      const parts = params.cidr.split('/');
      if (parts.length !== 2) {
        throw new Error('Invalid CIDR format. Expected format: 2001:db8::/64');
      }
      const address = parts[0];
      const prefix = parseInt(parts[1], 10);
      if (isNaN(prefix)) {
        throw new Error('Prefix length must be a valid number');
      }
      return calculateIPv6Subnet(address, prefix);
    },
    category: 'subnetting',
    description: 'Calculate IPv6 subnet information',
  },
  'vlsm-calculator': {
    handler: (params) => calculateVLSM(params.network, params.cidr, params.requirements),
    category: 'subnetting',
    description: 'Calculate Variable Length Subnet Mask allocations',
  },
  'supernet-calculator': {
    handler: (params) => {
      const networks = params.networks.map((cidr: string) => {
        const [network, prefix] = cidr.split('/');
        return { network, cidr: parseInt(prefix, 10) };
      });
      return calculateSupernet(networks);
    },
    category: 'subnetting',
    description: 'Calculate supernet aggregation for multiple networks',
  },

  // ============= CIDR TOOLS =============
  'cidr-to-subnet-mask': {
    handler: (params) => ({ mask: cidrToMask(params.prefix) }),
    category: 'cidr',
    description: 'Convert CIDR notation to subnet mask',
  },
  'subnet-mask-to-cidr': {
    handler: (params) => ({ prefix: maskToCidr(params.mask) }),
    category: 'cidr',
    description: 'Convert subnet mask to CIDR notation',
  },
  summarize: {
    handler: (params) => summarizeCIDRs(params.input, params.mode),
    category: 'cidr',
    description: 'Summarize and optimize CIDR blocks, ranges, and IPs',
  },
  split: {
    handler: (params) => {
      let result;
      if (params.prefix || params.targetPrefix) {
        result = splitCIDRByPrefix(params.cidr, params.prefix || params.targetPrefix);
      } else if (params.parts || params.count) {
        result = splitCIDRByCount(params.cidr, params.parts || params.count);
      } else {
        throw new Error('Either prefix/targetPrefix or parts/count parameter required');
      }
      return serializeBigInt(result);
    },
    category: 'cidr',
    description: 'Split a CIDR block into smaller subnets',
  },
  'next-available': {
    handler: (params) => findNextAvailableSubnet(params),
    category: 'cidr',
    description: 'Find next available subnet from pools minus allocations',
  },
  deaggregate: {
    handler: (params) => cidrDeaggregate(params),
    category: 'cidr',
    description: 'Deaggregate CIDR blocks into uniform subnets',
  },
  compare: {
    handler: (params) => cidrCompare(params),
    category: 'cidr',
    description: 'Compare two lists of CIDR blocks',
  },
  alignment: {
    handler: (params) => checkCIDRAlignment(params.inputs, params.targetPrefix),
    category: 'cidr',
    description: 'Check CIDR prefix boundary alignment',
  },
  'wildcard-mask': {
    handler: (params) => convertWildcardMasks(params.inputs),
    category: 'cidr',
    description: 'Convert between CIDR, subnet masks, and wildcard masks',
  },
  diff: {
    handler: (params) => {
      const inputA = Array.isArray(params.setA) ? params.setA.join('\n') : params.setA;
      const inputB = Array.isArray(params.setB) ? params.setB.join('\n') : params.setB;
      const result = computeCIDRDifference(inputA, inputB);
      return serializeBigInt(result);
    },
    category: 'cidr',
    description: 'Compute difference (A - B) between CIDR sets',
  },
  overlap: {
    handler: (params) => {
      const inputA = Array.isArray(params.setA) ? params.setA.join('\n') : params.setA;
      const inputB = Array.isArray(params.setB) ? params.setB.join('\n') : params.setB;
      const result = computeCIDROverlap(inputA, inputB);
      return serializeBigInt(result);
    },
    category: 'cidr',
    description: 'Find overlaps/intersections between CIDR sets',
  },
  contains: {
    handler: (params) => {
      const inputA = Array.isArray(params.setA) ? params.setA.join('\n') : params.setA;
      const inputB = Array.isArray(params.setB) ? params.setB.join('\n') : params.setB;
      const result = computeCIDRContains(inputA, inputB);
      return serializeBigInt(result);
    },
    category: 'cidr',
    description: 'Check containment relationships between CIDR sets',
  },

  // ============= IP ADDRESS CONVERTOR TOOLS =============
  validator: {
    handler: (params) => {
      const result = validateIP(params.ip);
      const ipv4Result = validateIPv4(params.ip);
      return {
        valid: result?.isValid || false,
        ipv4: ipv4Result.valid,
        ipv6: result?.type === 'ipv6' && result.isValid,
      };
    },
    category: 'ip-address-convertor',
    description: 'Validate IP address format and type',
  },
  normalize: {
    handler: (params) => {
      const result = normalizeIPv6Addresses([params.ip]);
      const normalization = result.normalizations[0];
      return {
        normalized: normalization?.normalized || '',
        isValid: normalization?.isValid || false,
      };
    },
    category: 'ip-address-convertor',
    description: 'Normalize IPv6 to RFC 5952 format',
  },
  representations: {
    handler: (params) => convertIPFormats(params.ip),
    category: 'ip-address-convertor',
    description: 'Convert IP between decimal, binary, hex, and octal formats',
  },
  distance: {
    handler: (params) => {
      const input = `${params.ip1} ${params.ip2}`;
      const result = calculateIPDistances([input], params.inclusive || false);
      return serializeBigInt(result);
    },
    category: 'ip-address-convertor',
    description: 'Calculate distance between two IP addresses',
  },
  random: {
    handler: (params) => {
      if (!params.input) throw new Error('input parameter is required');
      const result = generateRandomIPAddresses(params.input, params.count || 10, params.seed);
      return serializeBigInt(result);
    },
    category: 'ip-address-convertor',
    description: 'Generate random IP addresses from networks/ranges',
  },
  'nth-ip': {
    handler: (params) => {
      if (!params.input) throw new Error('input parameter is required');
      const result = calculateNthIPs(params.input);
      return serializeBigInt(result);
    },
    category: 'ip-address-convertor',
    description: 'Calculate nth IP address from networks/ranges',
  },
  regex: {
    handler: (params) => {
      if (!params.input) throw new Error('input parameter is required');
      return generateRegex(
        params.regexType || 'both',
        params.mode || 'standard',
        params.ipv4Options || {},
        params.ipv6Options || {},
        params.crossOptions || {},
      );
    },
    category: 'ip-address-convertor',
    description: 'Generate regex patterns for IP addresses',
  },
  'regex-validator': {
    handler: (params) => {
      if (!params.regex) throw new Error('regex parameter is required');
      if (!params.testInput) throw new Error('testInput parameter is required');
      return validateWithRegex(params.regex, params.testInput);
    },
    category: 'ip-address-convertor',
    description: 'Validate input against IP regex patterns',
  },
  'ipv6-to-ipv4': {
    handler: (params) => {
      if (!params.ipv6) throw new Error('ipv6 parameter is required');
      return ipv6ToIPv4(params.ipv6);
    },
    category: 'ip-address-convertor',
    description: 'Convert IPv6 addresses to IPv4 (embedded, mapped, etc.)',
  },
  'ipv4-to-ipv6': {
    handler: (params) => {
      if (!params.ipv4) throw new Error('ipv4 parameter is required');
      return ipv4ToIPv6(params.ipv4);
    },
    category: 'ip-address-convertor',
    description: 'Convert IPv4 addresses to IPv6 (mapped, embedded, etc.)',
  },
  'ula-generator': {
    handler: (params) => {
      const count = params.count || 1;
      return generateULAAddresses(count, params.subnetIds);
    },
    category: 'ip-address-convertor',
    description: 'Generate IPv6 Unique Local Address (ULA)',
  },
  'ipv6-compress': {
    handler: (params) => {
      if (!params.ipv6) throw new Error('ipv6 parameter is required');
      return { compressed: compressIPv6(params.ipv6) };
    },
    category: 'ip-address-convertor',
    description: 'Compress IPv6 address using :: notation',
  },
  'ipv6-expand': {
    handler: (params) => {
      if (!params.ipv6) throw new Error('ipv6 parameter is required');
      return { expanded: expandIPv6(params.ipv6) };
    },
    category: 'ip-address-convertor',
    description: 'Expand IPv6 address to full form',
  },
  'zone-id': {
    handler: (params) => {
      if (!params.inputs) throw new Error('inputs parameter is required');
      return processIPv6ZoneIdentifiers(params.inputs);
    },
    category: 'ip-address-convertor',
    description: 'Parse or format IPv6 zone identifiers',
  },
  eui64: {
    handler: (params) => {
      if (!params.inputs) throw new Error('inputs parameter is required');
      return convertEUI64Addresses(params.inputs, params.globalPrefix);
    },
    category: 'ip-address-convertor',
    description: 'Generate or validate EUI-64 interface identifiers',
  },
  enumerate: {
    handler: (params) => {
      // This will use existing utilities to enumerate IPs in ranges
      if (!params.input) throw new Error('input parameter is required');
      // Use calculateNthIPs with enumerate mode
      const result = calculateNthIPs([`${params.input}\n1,${params.limit || 100}`]);
      return serializeBigInt(result);
    },
    category: 'ip-address-convertor',
    description: 'Enumerate IP addresses in networks/ranges',
  },

  // ============= DNS TOOLS =============
  'ptr-generator': {
    handler: (params) => {
      if (params.ip) return generatePTRName(params.ip);
      if (params.cidr) return generateCIDRPTRs(params.cidr, params.template);
      throw new Error('Either ip or cidr parameter required');
    },
    category: 'dns',
    description: 'Generate PTR records for IP addresses or CIDR blocks',
  },
  'reverse-zones': {
    handler: (params) => calculateReverseZones(params.cidr),
    category: 'dns',
    description: 'Calculate required reverse DNS zones for CIDR blocks',
  },

  // ============= DNS TOOLS =============

  // DNS Record Validation
  'validate-a-record': {
    handler: (params) => {
      if (!params.value) throw new Error('value parameter is required');
      return validateARecord(params.value);
    },
    category: 'dns',
    description: 'Validate A record format and value',
  },
  'validate-aaaa-record': {
    handler: (params) => {
      if (!params.value) throw new Error('value parameter is required');
      return validateAAAARecord(params.value);
    },
    category: 'dns',
    description: 'Validate AAAA record format and value',
  },
  'validate-cname-record': {
    handler: (params) => {
      if (!params.value) throw new Error('value parameter is required');
      return validateCNAMERecord(params.value);
    },
    category: 'dns',
    description: 'Validate CNAME record format and value',
  },
  'validate-mx-record': {
    handler: (params) => {
      if (!params.value) throw new Error('value parameter is required');
      return validateMXRecord(params.value, params.priority);
    },
    category: 'dns',
    description: 'Validate MX record format and value',
  },
  'validate-txt-record': {
    handler: (params) => {
      if (!params.value) throw new Error('value parameter is required');
      return validateTXTRecord(params.value);
    },
    category: 'dns',
    description: 'Validate TXT record format and value',
  },
  'validate-srv-record': {
    handler: (params) => {
      if (!params.service || !params.protocol || !params.priority || !params.weight || !params.port || !params.target) {
        throw new Error('service, protocol, priority, weight, port, and target parameters are required');
      }
      return validateSRVRecord(
        params.service,
        params.protocol,
        params.priority,
        params.weight,
        params.port,
        params.target,
      );
    },
    category: 'dns',
    description: 'Validate SRV record format and value',
  },
  'validate-caa-record': {
    handler: (params) => {
      if (params.flags === undefined || !params.tag || !params.value) {
        throw new Error('flags, tag, and value parameters are required');
      }
      return validateCAARecord(params.flags, params.tag, params.value);
    },
    category: 'dns',
    description: 'Validate CAA record format and value',
  },
  'validate-dns-record': {
    handler: (params) => {
      if (!params.type || !params.value) throw new Error('type and value parameters are required');
      return validateDNSRecord(params.type, params.value, params.domain);
    },
    category: 'dns',
    description: 'Validate any DNS record type',
  },

  // Domain and Email Validation
  'validate-domain': {
    handler: (params) => {
      if (!params.domain) throw new Error('domain parameter is required');
      return validateDomainName(params.domain);
    },
    category: 'dns',
    description: 'Validate domain name format',
  },
  'validate-email': {
    handler: (params) => {
      if (!params.email) throw new Error('email parameter is required');
      return validateEmail(params.email);
    },
    category: 'dns',
    description: 'Validate email address format',
  },
  'check-domain-valid': {
    handler: (params) => {
      if (!params.domain) throw new Error('domain parameter is required');
      return { valid: isValidDomainName(params.domain) };
    },
    category: 'dns',
    description: 'Check if domain name is valid',
  },
  'validate-dns-lookup': {
    handler: (params) => {
      if (!params.input) throw new Error('input parameter is required');
      return validateDNSLookupInput(params.input, params.recordType);
    },
    category: 'dns',
    description: 'Validate DNS lookup input',
  },
  'validate-reverse-lookup': {
    handler: (params) => {
      if (!params.ip) throw new Error('ip parameter is required');
      return validateReverseLookupInput(params.ip);
    },
    category: 'dns',
    description: 'Validate reverse DNS lookup input',
  },

  // TTL Tools
  'validate-ttl': {
    handler: (params) => {
      if (params.ttl === undefined) throw new Error('ttl parameter is required');
      return validateTTL(params.ttl);
    },
    category: 'dns',
    description: 'Validate TTL value',
  },
  'humanize-ttl': {
    handler: (params) => {
      if (params.seconds === undefined) throw new Error('seconds parameter is required');
      return humanizeTTL(params.seconds);
    },
    category: 'dns',
    description: 'Convert TTL seconds to human readable format',
  },
  'calculate-ttl-expiry': {
    handler: (params) => {
      if (params.ttl === undefined) throw new Error('ttl parameter is required');
      return calculateTTLExpiry(params.ttl);
    },
    category: 'dns',
    description: 'Calculate TTL expiry information',
  },
  'calculate-cache-expiry': {
    handler: (params) => {
      if (params.ttlSeconds === undefined) throw new Error('ttlSeconds parameter is required');
      const recordCreated = params.recordCreated ? new Date(params.recordCreated) : undefined;
      return calculateCacheExpiry(params.ttlSeconds, recordCreated);
    },
    category: 'dns',
    description: 'Calculate DNS cache expiry time',
  },

  // DNS Analysis Tools
  'estimate-edns-size': {
    handler: (params) => {
      if (!params.name || !params.type || !params.records) {
        throw new Error('name, type, and records parameters are required');
      }
      return estimateEDNSSize(params.name, params.type, params.records);
    },
    category: 'dns',
    description: 'Estimate EDNS response size',
  },
  'normalize-label': {
    handler: (params) => {
      if (!params.label) throw new Error('label parameter is required');
      return normalizeLabel(params.label);
    },
    category: 'dns',
    description: 'Normalize DNS label',
  },
  'format-dns-error': {
    handler: (params) => {
      if (!params.error) throw new Error('error parameter is required');
      return { formatted: formatDNSError(params.error) };
    },
    category: 'dns',
    description: 'Format DNS error message',
  },

  // DNSSEC Tools
  'parse-dnskey': {
    handler: (params) => {
      if (!params.dnskeyRR) throw new Error('dnskeyRR parameter is required');
      return parseDNSKEYRecord(params.dnskeyRR);
    },
    category: 'dns',
    description: 'Parse DNSKEY resource record',
  },
  'calculate-key-tag': {
    handler: (params) => {
      if (!params.dnskey) throw new Error('dnskey parameter is required');
      return { keyTag: calculateKeyTag(params.dnskey) };
    },
    category: 'dns',
    description: 'Calculate DNSKEY key tag',
  },
  'generate-ds-record': {
    handler: async (params) => {
      if (!params.dnskey || !params.ownerName) {
        throw new Error('dnskey and ownerName parameters are required');
      }
      const digestType = params.digestType || 2; // Default to SHA-256
      return await generateDSRecord(params.dnskey, params.ownerName, digestType);
    },
    category: 'dns',
    description: 'Generate DS record from DNSKEY',
  },
  'calculate-nsec3-hash': {
    handler: async (params) => {
      if (!params.name || !params.salt || params.iterations === undefined) {
        throw new Error('name, salt, and iterations parameters are required');
      }
      const hashAlg = params.hashAlg || 1; // Default to SHA-1
      return await calculateNSEC3Hash(params.name, params.salt, params.iterations, hashAlg);
    },
    category: 'dns',
    description: 'Calculate NSEC3 hash',
  },
  'format-ds-record': {
    handler: (params) => {
      if (!params.ds) throw new Error('ds parameter is required');
      return { formatted: formatDSRecord(params.ds, params.ownerName) };
    },
    category: 'dns',
    description: 'Format DS record',
  },
  'format-cds-record': {
    handler: (params) => {
      if (!params.ds) throw new Error('ds parameter is required');
      return { formatted: formatCDSRecord(params.ds, params.ownerName) };
    },
    category: 'dns',
    description: 'Format CDS record',
  },
  'format-cdnskey-record': {
    handler: (params) => {
      if (!params.dnskey) throw new Error('dnskey parameter is required');
      return { formatted: formatCDNSKEYRecord(params.dnskey, params.ownerName) };
    },
    category: 'dns',
    description: 'Format CDNSKEY record',
  },
  'generate-cds-records': {
    handler: async (params) => {
      if (!params.dnskey || !params.ownerName) {
        throw new Error('dnskey and ownerName parameters are required');
      }
      return await generateCDSRecords(params.dnskey, params.ownerName);
    },
    category: 'dns',
    description: 'Generate CDS records',
  },
  'generate-cdnskey-record': {
    handler: (params) => {
      if (!params.dnskey) throw new Error('dnskey parameter is required');
      return generateCDNSKEYRecord(params.dnskey);
    },
    category: 'dns',
    description: 'Generate CDNSKEY record',
  },
  'validate-cds-cdnskey': {
    handler: (params) => {
      if (!params.dnskey) throw new Error('dnskey parameter is required');
      return validateCDSCDNSKEYUsage(params.dnskey);
    },
    category: 'dns',
    description: 'Validate CDS/CDNSKEY usage',
  },
  'suggest-rrsig-windows': {
    handler: (params) => {
      const options: RRSIGPlanningOptions = {
        ttl: params.ttl || 86400,
        signatureValidityDays: params.signatureValidityDays || 30,
        renewalLeadTime: params.renewalLeadTime || 24,
        desiredOverlap: params.desiredOverlap || 24,
        clockSkew: params.clockSkew || 1,
      };
      return suggestRRSIGWindows(options);
    },
    category: 'dns',
    description: 'Suggest RRSIG signing windows',
  },
  'format-rrsig-dates': {
    handler: (params) => {
      if (!params.window) throw new Error('window parameter is required');
      return formatRRSIGDates(params.window);
    },
    category: 'dns',
    description: 'Format RRSIG dates',
  },
  'validate-rrsig-timing': {
    handler: (params) => {
      if (!params.window || params.ttl === undefined) {
        throw new Error('window and ttl parameters are required');
      }
      return validateRRSIGTiming(params.window, params.ttl);
    },
    category: 'dns',
    description: 'Validate RRSIG timing',
  },
  'validate-dnskey': {
    handler: (params) => {
      if (!params.dnskeyRR) throw new Error('dnskeyRR parameter is required');
      return validateDNSKEY(params.dnskeyRR);
    },
    category: 'dns',
    description: 'Validate DNSKEY record',
  },

  // Reverse DNS Tools
  'generate-ptr-name': {
    handler: (params) => {
      if (!params.ip) throw new Error('ip parameter is required');
      return generateReversePTRName(params.ip);
    },
    category: 'dns',
    description: 'Generate PTR record name for IP address',
  },
  'generate-cidr-ptrs': {
    handler: (params) => {
      if (!params.cidr) throw new Error('cidr parameter is required');
      const maxEntries = params.maxEntries || 1000;
      return { records: generateReverseCIDRPTRs(params.cidr, maxEntries) };
    },
    category: 'dns',
    description: 'Generate PTR records for CIDR block',
  },
  'calculate-reverse-zones': {
    handler: (params) => {
      if (!params.cidr) throw new Error('cidr parameter is required');
      return { zones: calcReverseZones(params.cidr) };
    },
    category: 'dns',
    description: 'Calculate reverse DNS zones for CIDR',
  },
  'generate-reverse-zone': {
    handler: (params) => {
      if (!params.cidr || !params.nameservers) {
        throw new Error('cidr and nameservers parameters are required');
      }
      const options = {
        hostmaster: params.hostmaster || 'hostmaster.example.com.',
        serial: params.serial,
        refresh: params.refresh || 3600,
        retry: params.retry || 1800,
        expire: params.expire || 604800,
        minimum: params.minimum || 86400,
        ttl: params.ttl || 3600,
        includeSOA: params.includeSOA !== false,
        includeNS: params.includeNS !== false,
        namingPattern: params.namingPattern,
        maxEntries: params.maxEntries || 1000,
      };
      const records = generateReverseCIDRPTRs(params.cidr, params.nameservers || []);
      return { zoneFile: generateReverseZoneFile(params.cidr, records, params.template, options) };
    },
    category: 'dns',
    description: 'Generate reverse DNS zone file',
  },
  'analyze-ptr-coverage': {
    handler: (params) => {
      if (!params.cidr || !params.existingPTRs) {
        throw new Error('cidr and existingPTRs parameters are required');
      }
      return analyzePTRCoverage(params.cidr, params.existingPTRs, params.namingPattern);
    },
    category: 'dns',
    description: 'Analyze PTR record coverage',
  },
  'validate-ip-dns': {
    handler: (params) => {
      if (!params.ip) throw new Error('ip parameter is required');
      return dnsIsValidIP(params.ip);
    },
    category: 'dns',
    description: 'Validate IP address for DNS use',
  },
  'validate-cidr-dns': {
    handler: (params) => {
      if (!params.cidr) throw new Error('cidr parameter is required');
      return dnsIsValidCIDR(params.cidr);
    },
    category: 'dns',
    description: 'Validate CIDR notation for DNS use',
  },
};

/**
 * Get handler for a specific tool
 */
export function getAPIHandler(category: string, tool: string): APIEndpoint | null {
  // Try direct lookup first
  const directKey = tool;
  if (apiRegistry[directKey] && apiRegistry[directKey].category === category) {
    return apiRegistry[directKey];
  }

  // Try with category prefix removed
  const withoutCategory = tool.replace(`${category}-`, '');
  if (apiRegistry[withoutCategory] && apiRegistry[withoutCategory].category === category) {
    return apiRegistry[withoutCategory];
  }

  return null;
}

/**
 * List all available endpoints for a category
 */
export function listCategoryEndpoints(category: string): string[] {
  return Object.entries(apiRegistry)
    .filter(([_, endpoint]) => endpoint.category === category)
    .map(([key]) => key);
}
