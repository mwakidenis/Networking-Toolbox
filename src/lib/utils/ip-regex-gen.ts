export type RegexType = 'ipv4' | 'ipv6' | 'both';
export type Mode = 'simple' | 'advanced';

export interface IPv4Options {
  allowLeadingZeros: boolean;
  requireAllOctets: boolean;
  allowPrivateOnly: boolean;
  allowPublicOnly: boolean;
  wordBoundaries: boolean;
  caseInsensitive: boolean;
}

export interface IPv6Options {
  allowCompressed: boolean;
  allowFullForm: boolean;
  allowZoneId: boolean;
  allowEmbeddedIPv4: boolean;
  wordBoundaries: boolean;
  caseInsensitive: boolean;
  allowBrackets: boolean;
}

export interface CrossOptions {
  exactMatch: boolean;
  engineSafeBoundaries: boolean;
  allowPort: boolean;
  allowCIDR: boolean;
  namedCaptures: boolean;
}

export interface RegexResult {
  pattern: string;
  flags: string;
  description: string;
  tradeoffs: string[];
  limitations: string[];
  testCases: {
    valid: string[];
    invalid: string[];
  };
}

export interface AdvancedOption {
  key: string;
  label: string;
  description: string;
  ipClass: 'IPv4' | 'IPv6' | 'Both';
  optionsObject: 'ipv4Options' | 'ipv6Options' | 'crossOptions';
  showForType: RegexType[];
}

export interface LanguageExample {
  name: string;
  icon: string;
  code: string;
  note?: string;
}

export const ADVANCED_OPTIONS: AdvancedOption[] = [
  // Cross-cutting options
  {
    key: 'exactMatch',
    label: 'Exact Match Only',
    description: 'Use anchors (^...$) for validation vs find-in-text',
    ipClass: 'Both',
    optionsObject: 'crossOptions',
    showForType: ['ipv4', 'ipv6', 'both'],
  },
  {
    key: 'engineSafeBoundaries',
    label: 'Engine-Safe Boundaries',
    description: 'Use portable boundaries instead of \\b (more reliable)',
    ipClass: 'Both',
    optionsObject: 'crossOptions',
    showForType: ['ipv4', 'ipv6', 'both'],
  },
  {
    key: 'allowPort',
    label: 'Allow Port Numbers',
    description: 'Accept :port suffix (e.g., 192.168.1.1:8080)',
    ipClass: 'Both',
    optionsObject: 'crossOptions',
    showForType: ['ipv4', 'ipv6', 'both'],
  },
  {
    key: 'allowCIDR',
    label: 'Allow CIDR Notation',
    description: 'Accept /prefix suffix (e.g., 192.168.1.0/24)',
    ipClass: 'Both',
    optionsObject: 'crossOptions',
    showForType: ['ipv4', 'ipv6', 'both'],
  },
  {
    key: 'namedCaptures',
    label: 'Named Capture Groups',
    description: 'Use named groups for easier extraction',
    ipClass: 'Both',
    optionsObject: 'crossOptions',
    showForType: ['ipv4', 'ipv6', 'both'],
  },
  // IPv4 options
  {
    key: 'allowLeadingZeros',
    label: 'Allow Leading Zeros',
    description: 'Accept 001.002.003.004 format',
    ipClass: 'IPv4',
    optionsObject: 'ipv4Options',
    showForType: ['ipv4', 'both'],
  },
  {
    key: 'wordBoundaries',
    label: 'Word Boundaries',
    description: 'Prevent partial matches in text',
    ipClass: 'IPv4',
    optionsObject: 'ipv4Options',
    showForType: ['ipv4', 'both'],
  },
  {
    key: 'allowPrivateOnly',
    label: 'Private IPs Only',
    description: '10.x.x.x, 172.16-31.x.x, 192.168.x.x',
    ipClass: 'IPv4',
    optionsObject: 'ipv4Options',
    showForType: ['ipv4', 'both'],
  },
  {
    key: 'caseInsensitive',
    label: 'Case Insensitive',
    description: "Add 'i' flag for case insensitive matching",
    ipClass: 'IPv4',
    optionsObject: 'ipv4Options',
    showForType: ['ipv4', 'both'],
  },
  // IPv6 options
  {
    key: 'allowCompressed',
    label: 'Allow Compressed',
    description: 'Support :: notation (2001:db8::1)',
    ipClass: 'IPv6',
    optionsObject: 'ipv6Options',
    showForType: ['ipv6', 'both'],
  },
  {
    key: 'allowFullForm',
    label: 'Allow Full Form',
    description: 'Support full 8-group format',
    ipClass: 'IPv6',
    optionsObject: 'ipv6Options',
    showForType: ['ipv6', 'both'],
  },
  {
    key: 'allowZoneId',
    label: 'Allow Zone ID',
    description: 'Support %eth0 suffixes',
    ipClass: 'IPv6',
    optionsObject: 'ipv6Options',
    showForType: ['ipv6', 'both'],
  },
  {
    key: 'allowEmbeddedIPv4',
    label: 'Allow Embedded IPv4',
    description: 'Support ::ffff:192.168.1.1',
    ipClass: 'IPv6',
    optionsObject: 'ipv6Options',
    showForType: ['ipv6', 'both'],
  },
  {
    key: 'wordBoundaries',
    label: 'Word Boundaries',
    description: 'Prevent partial matches in text',
    ipClass: 'IPv6',
    optionsObject: 'ipv6Options',
    showForType: ['ipv6', 'both'],
  },
  {
    key: 'caseInsensitive',
    label: 'Case Insensitive',
    description: "Add 'i' flag (recommended for IPv6)",
    ipClass: 'IPv6',
    optionsObject: 'ipv6Options',
    showForType: ['ipv6', 'both'],
  },
  {
    key: 'allowBrackets',
    label: 'Allow Brackets',
    description: 'Accept [IPv6] literal format (required for URLs with ports)',
    ipClass: 'IPv6',
    optionsObject: 'ipv6Options',
    showForType: ['ipv6', 'both'],
  },
];

export function getLanguageExamples(pattern: string, flags: string): LanguageExample[] {
  return [
    {
      name: 'JavaScript',
      icon: 'javascript',
      code: `const ipRegex = /${pattern}/${flags};
const isValid = ipRegex.test(ipAddress);`,
    },
    {
      name: 'Python',
      icon: 'python',
      code: `import re
pattern = r'${pattern}'
is_valid = bool(re.match(pattern, ip_address${flags ? ', re.IGNORECASE' : ''}))`,
      note: flags ? 'Use re.IGNORECASE flag for case-insensitive matching' : undefined,
    },
    {
      name: 'PHP',
      icon: 'php',
      code: `$pattern = '/${pattern}/${flags}';
$isValid = preg_match($pattern, $ipAddress);`,
    },
    {
      name: 'Rust',
      icon: 'rust',
      code: `use regex::Regex;
let re = Regex::new(r"${pattern}").unwrap();
let is_valid = re.is_match(&ip_address);`,
      note: 'Add regex = "1.0" to Cargo.toml dependencies',
    },
    {
      name: 'Go',
      icon: 'go',
      code: `import "regexp"
re := regexp.MustCompile(\`${pattern}\`)
isValid := re.MatchString(ipAddress)`,
    },
    {
      name: 'Java',
      icon: 'openjdk',
      code: `import java.util.regex.Pattern;
Pattern pattern = Pattern.compile("${pattern}"${flags ? ', Pattern.CASE_INSENSITIVE' : ''});
boolean isValid = pattern.matcher(ipAddress).matches();`,
    },
    {
      name: 'Ruby',
      icon: 'ruby',
      code: `pattern = /${pattern}/${flags === 'i' ? 'i' : ''}
is_valid = !!(ip_address =~ pattern)`,
    },
    {
      name: 'Bash',
      icon: 'gnubash',
      code: `if [[ "$ip_address" =~ ${pattern} ]]; then
  echo "Valid IP"
fi`,
      note: 'Bash regex is case-sensitive by default',
    },
  ];
}

export function generateIPv4Regex(mode: Mode, ipv4Options: IPv4Options, crossOptions: CrossOptions): RegexResult {
  let pattern: string;
  const tradeoffs: string[] = [];
  const limitations: string[] = [];

  // Core octet pattern - shortest possible
  let octetPattern: string;
  if (mode === 'simple') {
    // Shortest pattern that works for most cases
    octetPattern = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
    tradeoffs.push('Short pattern optimized for common use cases');
  } else if (ipv4Options.allowLeadingZeros) {
    octetPattern = '(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)';
    tradeoffs.push('Allows leading zeros in octets');
  } else {
    octetPattern = '(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])';
    tradeoffs.push('Rejects leading zeros for stricter validation');
  }

  // Base IPv4 pattern with optional named capture
  const ipCapture = crossOptions.namedCaptures ? '?<ipv4>' : '?:';
  let basePattern = `(${ipCapture}${octetPattern}\\.${octetPattern}\\.${octetPattern}\\.${octetPattern})`;

  // Handle private/public IP restrictions
  if (ipv4Options.allowPrivateOnly && mode === 'advanced') {
    const privateOctet = ipv4Options.allowLeadingZeros
      ? '(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)'
      : '(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])';
    basePattern = `(${ipCapture}(?:10\\.${privateOctet}\\.${privateOctet}\\.${privateOctet}|172\\.(?:1[6-9]|2[0-9]|3[01])\\.${privateOctet}\\.${privateOctet}|192\\.168\\.${privateOctet}\\.${privateOctet}))`;
    tradeoffs.push('Only matches private IP ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)');
    limitations.push('Complex pattern - harder to read and maintain');
  }

  pattern = basePattern;

  // Add port if requested
  if (crossOptions.allowPort) {
    const portCapture = crossOptions.namedCaptures ? '?<port>' : '?:';
    pattern += `(?::(${portCapture}[0-9]{1,5}))?`;
    tradeoffs.push('Supports optional port numbers (:1-65535)');
    limitations.push('Port range validation (0-65535) not enforced by regex');
  }

  // Add CIDR if requested
  if (crossOptions.allowCIDR) {
    const cidrCapture = crossOptions.namedCaptures ? '?<cidr>' : '?:';
    pattern += `(?:/(${cidrCapture}(?:3[0-2]|[12]?[0-9])))?`;
    tradeoffs.push('Supports optional CIDR notation (/0-32)');
  }

  // Apply boundaries or anchors
  if (crossOptions.exactMatch) {
    pattern = `^${pattern}$`;
    tradeoffs.push('Uses anchors for exact match validation');
  } else if (crossOptions.engineSafeBoundaries) {
    pattern = `(?:^|[^0-9])${pattern}(?![0-9])`;
    tradeoffs.push('Uses engine-safe boundaries (more reliable than \\b)');
  } else if (mode === 'simple') {
    // Use exact match anchors for simple mode to ensure full string validation
    pattern = `^${pattern}$`;
    tradeoffs.push('Uses exact match anchors for strict validation');
  } else if (ipv4Options.wordBoundaries) {
    pattern = `\\b${pattern}\\b`;
    tradeoffs.push('Uses word boundaries to prevent partial matches');
    limitations.push('Word boundaries may not work reliably with all regex engines');
  }

  // Generate test cases
  const validCases = [
    '192.168.1.1',
    '10.0.0.1',
    '255.255.255.255',
    '0.0.0.0',
    '172.16.254.1', // Private IP in 172.16.x.x range
  ];
  const invalidCases = ['256.256.256.256', '192.168.1', '192.168.1.1.1', 'not.an.ip.address'];

  // Leading zeros are only valid when explicitly enabled in advanced mode
  if (ipv4Options.allowLeadingZeros && mode === 'advanced') {
    validCases.push('001.002.003.004');
  } else {
    invalidCases.push('001.002.003.004');
  }

  if (crossOptions.allowPort) {
    validCases.push('192.168.1.1:8080', '10.0.0.1:443');
    invalidCases.push('192.168.1.1:99999');
  }

  if (crossOptions.allowCIDR) {
    validCases.push('192.168.1.0/24', '10.0.0.0/8');
    invalidCases.push('192.168.1.1/33');
  }

  return {
    pattern,
    flags: ipv4Options.caseInsensitive ? 'i' : '',
    description: 'IPv4 address pattern with configurable validation options',
    tradeoffs,
    limitations,
    testCases: {
      valid: validCases,
      invalid: invalidCases,
    },
  };
}

export function generateIPv6Regex(
  mode: Mode,
  ipv4Options: IPv4Options,
  ipv6Options: IPv6Options,
  crossOptions: CrossOptions,
): RegexResult {
  let pattern: string;
  const tradeoffs: string[] = [];
  const limitations: string[] = [];

  // Build core IPv6 patterns with better validation
  const parts: string[] = [];

  // Shortest hex pattern for IPv6
  const hexPattern = '[\\da-f]{1,4}';

  if (mode === 'simple' || ipv6Options.allowFullForm) {
    // Full form: exactly 8 groups of 1-4 hex digits
    parts.push(`(?:${hexPattern}:){7}${hexPattern}`);
    tradeoffs.push('Supports full uncompressed IPv6 format');
  }

  if (mode === 'simple' || ipv6Options.allowCompressed) {
    // Much simpler IPv6 compression pattern that actually works
    parts.push(
      // Any valid IPv6 with :: - simplified but functional approach
      `${hexPattern}(?::${hexPattern})*::(?:${hexPattern}(?::${hexPattern})*)?`,
      // Starting with ::
      `::(?:${hexPattern}(?::${hexPattern})*)?`,
      // Ending with ::
      `${hexPattern}(?::${hexPattern})*::`,
      // Just ::
      '::',
    );
    tradeoffs.push('Supports IPv6 compression with :: notation');
    limitations.push('Simplified pattern optimized for common cases');
  }

  if ((mode === 'simple' || ipv6Options.allowEmbeddedIPv4) && mode !== 'simple') {
    const ipv4Pattern = ipv4Options.allowLeadingZeros
      ? '(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)'
      : '(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])';
    parts.push(`(?:${hexPattern}:){6}${ipv4Pattern}(?:\\.${ipv4Pattern}){3}`);
    parts.push(`::${ipv4Pattern}(?:\\.${ipv4Pattern}){3}`);
    tradeoffs.push('Supports IPv4-mapped IPv6 addresses');
  }

  let basePattern = parts.join('|');

  // Add zone ID support
  if (ipv6Options.allowZoneId && mode === 'advanced') {
    basePattern = `(?:${basePattern})(?:%[0-9a-zA-Z-_.~]*)?`;
    tradeoffs.push('Supports zone IDs (e.g., %eth0, %1)');
    limitations.push('Zone ID validation is basic - allows most characters');
  }

  // Apply named captures to the core IPv6 pattern
  const ipCapture = crossOptions.namedCaptures ? '?<ipv6>' : '?:';
  let ipv6Pattern = `(${ipCapture}${basePattern})`;

  // Handle bracketed IPv6 literals
  if (ipv6Options.allowBrackets && mode === 'advanced') {
    const bracketCapture = crossOptions.namedCaptures ? '?<bracketed>' : '?:';
    ipv6Pattern = `(?:${ipv6Pattern}|\\[(${bracketCapture}${basePattern})\\])`;
    tradeoffs.push('Supports bracketed IPv6 literals [IPv6] for URLs');
  }

  pattern = ipv6Pattern;

  // Add port for IPv6 (more complex due to brackets)
  if (crossOptions.allowPort) {
    const portCapture = crossOptions.namedCaptures ? '?<port>' : '?:';
    if (ipv6Options.allowBrackets) {
      // If brackets are allowed, port can come after bracketed form
      pattern = `(?:${pattern}(?::(${portCapture}[0-9]{1,5}))?|\\[${basePattern}\\]:(${portCapture}[0-9]{1,5}))`;
    } else {
      // Without brackets, ports are ambiguous with IPv6, so we don't add them
      limitations.push('Port numbers require bracketed IPv6 format to avoid ambiguity');
    }
    tradeoffs.push('Supports optional port numbers with bracketed IPv6');
  }

  // Add CIDR if requested
  if (crossOptions.allowCIDR) {
    const cidrCapture = crossOptions.namedCaptures ? '?<cidr>' : '?:';
    pattern += `(?:/(${cidrCapture}(?:12[0-8]|1[01][0-9]|[1-9]?[0-9])))?`;
    tradeoffs.push('Supports optional CIDR notation (/0-128)');
  }

  // Apply boundaries or anchors
  if (crossOptions.exactMatch) {
    pattern = `^${pattern}$`;
    tradeoffs.push('Uses anchors for exact match validation');
  } else if (crossOptions.engineSafeBoundaries) {
    pattern = `(?:^|[^0-9A-Fa-f:.%])${pattern}(?![0-9A-Fa-f:.%])`;
    tradeoffs.push('Uses engine-safe boundaries (more reliable than \\b)');
  } else if (ipv6Options.wordBoundaries && mode === 'advanced') {
    pattern = `\\b${pattern}\\b`;
    tradeoffs.push('Uses word boundaries for precise matching');
    limitations.push('Word boundaries unreliable for IPv6 (: not considered word character)');
  } else if (mode === 'simple') {
    // Use exact match anchors for simple mode to ensure full string validation
    pattern = `^${pattern}$`;
    tradeoffs.push('Uses exact match anchors for strict validation');
  }

  // Generate test cases
  const validCases = [
    '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
    '2001:db8:85a3::8a2e:370:7334',
    '::1',
    '::',
    'fe80::1', // Link-local address
    '::c0de:bad:beef',
    '1234:face:feed:dead:beef:c0de:abba:1',
  ];
  const invalidCases = [
    'gggg::1',
    '2001:db8::85a3::7334',
    '2001:db8:85a3:0000:0000:8a2e:0370:7334:extra',
    'not:an:ipv6:address',
    '12345::1',
    'dead:beef:fa11:bad:0:0:0:0ffee',
    '::dead::',
  ];

  if (ipv6Options.allowEmbeddedIPv4 && mode === 'advanced') {
    validCases.push('::ffff:192.168.1.1', '2001:db8::192.168.1.1');
  }

  if (ipv6Options.allowZoneId && mode === 'advanced') {
    validCases.push('fe80::1%eth0', 'fe80::1%1');
  }

  if (ipv6Options.allowBrackets && mode === 'advanced') {
    validCases.push('[2001:db8::1]', '[::1]');
  }

  if (crossOptions.allowPort && ipv6Options.allowBrackets) {
    validCases.push('[2001:db8::1]:8080', '[::1]:443');
    invalidCases.push('[2001:db8::1]:99999');
  }

  if (crossOptions.allowCIDR) {
    validCases.push('2001:db8::/32', 'fe80::/64');
    invalidCases.push('2001:db8::/129');
  }

  return {
    pattern,
    flags: ipv6Options.caseInsensitive ? 'i' : '',
    description: 'IPv6 address pattern with configurable format support',
    tradeoffs,
    limitations: [
      ...limitations,
      'IPv6 regex is inherently complex - consider using dedicated parsing libraries',
      'Full RFC compliance requires more sophisticated validation',
    ],
    testCases: {
      valid: validCases,
      invalid: invalidCases,
    },
  };
}

export function generateBothRegex(
  mode: Mode,
  ipv4Options: IPv4Options,
  ipv6Options: IPv6Options,
  crossOptions: CrossOptions,
): RegexResult {
  // Generate individual patterns, but modify them to work together
  const tradeoffs: string[] = [];
  const limitations: string[] = [];

  // Get base patterns without boundaries/anchors
  const originalExactMatch = crossOptions.exactMatch;
  const originalSafeBoundaries = crossOptions.engineSafeBoundaries;
  const originalIPv4WordBoundaries = ipv4Options.wordBoundaries;
  const originalIPv6WordBoundaries = ipv6Options.wordBoundaries;

  // Temporarily disable boundaries to get clean base patterns
  const tempCrossOptions = { ...crossOptions, exactMatch: false, engineSafeBoundaries: false };
  const tempIPv4Options = mode === 'advanced' ? { ...ipv4Options, wordBoundaries: false } : ipv4Options;
  const tempIPv6Options = mode === 'advanced' ? { ...ipv6Options, wordBoundaries: false } : ipv6Options;

  const ipv4Result = generateIPv4Regex(mode, tempIPv4Options, tempCrossOptions);
  const ipv6Result = generateIPv6Regex(mode, tempIPv4Options, tempIPv6Options, tempCrossOptions);

  // Combine patterns
  let combinedPattern: string;
  if (crossOptions.namedCaptures) {
    // Use separate named groups for IPv4 and IPv6
    combinedPattern = `(?:${ipv4Result.pattern}|${ipv6Result.pattern})`;
  } else {
    combinedPattern = `(?:${ipv4Result.pattern}|${ipv6Result.pattern})`;
  }

  // Apply boundaries or anchors to the combined pattern
  if (originalExactMatch) {
    combinedPattern = `^${combinedPattern}$`;
    tradeoffs.push('Uses anchors for exact match validation');
  } else if (originalSafeBoundaries) {
    combinedPattern = `(?:^|[^0-9A-Fa-f:.%])${combinedPattern}(?![0-9A-Fa-f:.%])`;
    tradeoffs.push('Uses engine-safe boundaries for both IPv4 and IPv6');
  } else if ((originalIPv4WordBoundaries || originalIPv6WordBoundaries) && mode === 'advanced') {
    combinedPattern = `\\b${combinedPattern}\\b`;
    tradeoffs.push('Uses word boundaries (may be unreliable for IPv6)');
    limitations.push('Word boundaries unreliable for IPv6 addresses containing :');
  } else if (mode === 'simple') {
    // Use exact match anchors for simple mode to ensure full string validation
    combinedPattern = `^${combinedPattern}$`;
    tradeoffs.push('Uses exact match anchors for strict validation');
  }

  // Combine tradeoffs and limitations, avoiding duplicates
  const allTradeoffs = [...new Set([...ipv4Result.tradeoffs, ...ipv6Result.tradeoffs, ...tradeoffs])];
  const allLimitations = [...new Set([...ipv4Result.limitations, ...ipv6Result.limitations, ...limitations])];

  allTradeoffs.push('Large combined pattern - impacts performance');
  allTradeoffs.push('May be overkill if you only need one IP version');
  allLimitations.push('Complex maintenance due to combined patterns');
  allLimitations.push('Harder to debug when patterns conflict');

  return {
    pattern: combinedPattern,
    flags: ipv4Options.caseInsensitive || ipv6Options.caseInsensitive ? 'i' : '',
    description: 'Combined pattern matching both IPv4 and IPv6 addresses with unified options',
    tradeoffs: allTradeoffs,
    limitations: allLimitations,
    testCases: {
      valid: [...ipv4Result.testCases.valid, ...ipv6Result.testCases.valid],
      invalid: [...ipv4Result.testCases.invalid, ...ipv6Result.testCases.invalid],
    },
  };
}

export function generateRegex(
  regexType: RegexType,
  mode: Mode,
  ipv4Options: IPv4Options,
  ipv6Options: IPv6Options,
  crossOptions: CrossOptions,
): RegexResult {
  switch (regexType) {
    case 'ipv4':
      return generateIPv4Regex(mode, ipv4Options, crossOptions);
    case 'ipv6':
      return generateIPv6Regex(mode, ipv4Options, ipv6Options, crossOptions);
    case 'both':
      return generateBothRegex(mode, ipv4Options, ipv6Options, crossOptions);
    default:
      throw new Error(`Unknown regex type: ${regexType}`);
  }
}

export function getRegexRUrl(result: RegexResult): string {
  if (!result) return 'https://regexr.com';

  // Remove anchors for RegexR since it expects patterns that match within text
  let regexrPattern = result.pattern;
  if (regexrPattern.startsWith('^') && regexrPattern.endsWith('$')) {
    // Remove both anchors
    regexrPattern = regexrPattern.slice(1, -1);
  } else if (regexrPattern.startsWith('^')) {
    // Remove start anchor only
    regexrPattern = regexrPattern.slice(1);
  } else if (regexrPattern.endsWith('$')) {
    // Remove end anchor only
    regexrPattern = regexrPattern.slice(0, -1);
  }

  const pattern = encodeURIComponent(regexrPattern);
  // Always include 'g' flag for RegexR to match all occurrences (per-line matching)
  const regexrFlags = result.flags.includes('g') ? result.flags : result.flags + 'g';
  const flags = encodeURIComponent(regexrFlags);
  const testText = encodeURIComponent(result.testCases.valid.concat(result.testCases.invalid).join('\n'));

  return `https://regexr.com/?expression=${pattern}&flags=${flags}&text=${testText}`;
}
