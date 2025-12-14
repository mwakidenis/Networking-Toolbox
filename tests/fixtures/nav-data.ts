// Test-friendly navigation data without SvelteKit dependencies
// This is used by e2e tests to get all page URLs without importing SvelteKit modules

export type NavItem = {
  href: string;
  label: string;
  description?: string;
  icon?: string;
  keywords?: string[];
};

export type NavGroup = {
  title: string;
  description?: string;
  items: NavItem[];
};

// Top-level navigation pages (without makePath/resolve calls)
export const TOP_NAV: NavItem[] = [
  {
    href: '/subnetting',
    label: 'Subnetting',
    description: 'Subnet calculators and network planning tools for IPv4, IPv6, VLSM, and supernetting',
    keywords: [
      'subnet',
      'calculator',
      'subnetting',
      'network',
      'planning',
      'ipv4',
      'ipv6',
      'vlsm',
      'supernet',
      'netmask',
      'cidr',
      'broadcast',
      'hosts',
      'addressing',
      'allocation',
    ],
  },
  {
    href: '/cidr',
    label: 'CIDR',
    description: 'CIDR tools and converters for network analysis and optimization',
    keywords: [
      'cidr',
      'subnet',
      'mask',
      'converter',
      'summarizer',
      'splitter',
      'set operations',
      'aggregation',
      'deaggregation',
      'prefix',
      'notation',
      'blocks',
      'ranges',
      'supernet',
      'allocation',
    ],
  },
  {
    href: '/ip-address-convertor',
    label: 'IP Tools',
    description: 'IP address converters, validators, generators, and format transformation tools',
    keywords: [
      'ip',
      'address',
      'converter',
      'validator',
      'generator',
      'format',
      'binary',
      'hex',
      'decimal',
      'ipv4',
      'ipv6',
      'distance',
      'random',
      'regex',
      'enumerate',
      'validation',
      'transformation',
    ],
  },
  {
    href: '/dns',
    label: 'DNS Tools',
    description: 'DNS record generators, validators, zone tools, and DNSSEC utilities',
    keywords: [
      'dns',
      'records',
      'generator',
      'validator',
      'zone',
      'dnssec',
      'ptr',
      'reverse',
      'a record',
      'aaaa',
      'cname',
      'mx',
      'txt',
      'srv',
      'caa',
      'spf',
      'dmarc',
      'dkim',
      'soa',
      'ns',
    ],
  },
  {
    href: '/diagnostics',
    label: 'Lookups',
    description: 'Network diagnostics, DNS lookups, HTTP analysis, TLS testing, and connectivity checks',
    keywords: [
      'diagnostics',
      'lookup',
      'dns',
      'http',
      'tls',
      'network',
      'connectivity',
      'ping',
      'port',
      'check',
      'security',
      'headers',
      'certificate',
      'propagation',
      'rdap',
      'whois',
      'analysis',
    ],
  },
  {
    href: '/reference',
    label: 'Ref',
    description: 'Networking reference guides, explanations, and quick lookup tables',
    keywords: [
      'reference',
      'guide',
      'explanation',
      'networking',
      'fundamentals',
      'cidr',
      'vlsm',
      'ipv6',
      'dns',
      'protocols',
      'ports',
      'asn',
      'icmp',
      'arp',
      'ndp',
      'multicast',
      'private',
      'public',
    ],
  },
];

// Sub-navigation pages (sample of key pages for testing)
export const SUB_NAV_PAGES: NavItem[] = [
  // Subnetting
  { href: '/subnetting/ipv4-subnet-calculator', label: 'IPv4 Subnet Calculator' },
  { href: '/subnetting/ipv6-subnet-calculator', label: 'IPv6 Subnet Calculator' },
  { href: '/subnetting/vlsm-calculator', label: 'VLSM Calculator' },
  { href: '/subnetting/supernet-calculator', label: 'Supernet Calculator' },
  { href: '/subnetting/planner', label: 'Subnet Planner' },

  // CIDR
  { href: '/cidr/mask-converter/cidr-to-subnet-mask', label: 'CIDR → Mask' },
  { href: '/cidr/mask-converter/subnet-mask-to-cidr', label: 'Mask → CIDR' },
  { href: '/cidr/summarize', label: 'CIDR Summarizer' },
  { href: '/cidr/split', label: 'CIDR Split' },
  { href: '/cidr/next-available', label: 'Next Available Subnet' },
  { href: '/cidr/gaps', label: 'Free Space Finder' },
  { href: '/cidr/deaggregate', label: 'CIDR Deaggregate' },
  { href: '/cidr/compare', label: 'CIDR Compare' },
  { href: '/cidr/allocator', label: 'CIDR Allocator' },
  { href: '/cidr/alignment', label: 'CIDR Alignment' },
  { href: '/cidr/wildcard-mask', label: 'Wildcard Mask Converter' },
  { href: '/cidr/set-operations/diff', label: 'Difference (A - B)' },
  { href: '/cidr/set-operations/overlap', label: 'Overlap (A ∩ B)' },
  { href: '/cidr/set-operations/contains', label: 'Contains (A ⊆ B)' },

  // IP Tools
  { href: '/ip-address-convertor/representations', label: 'Format Representations' },
  { href: '/ip-address-convertor/distance', label: 'IP Distance Calculator' },
  { href: '/ip-address-convertor/nth-ip', label: 'Nth IP Calculator' },
  { href: '/ip-address-convertor/random', label: 'Random IP Generator' },
  { href: '/ip-address-convertor/regex', label: 'IP Regex Generator' },
  { href: '/ip-address-convertor/validator', label: 'IP Address Validator' },
  { href: '/ip-address-convertor/enumerate', label: 'IP Enumerate' },
  { href: '/ip-address-convertor/notation/ipv6-expand', label: 'IPv6 Expand' },
  { href: '/ip-address-convertor/notation/ipv6-compress', label: 'IPv6 Compress' },
  { href: '/ip-address-convertor/notation/normalize', label: 'IPv6 Normalizer' },
  { href: '/ip-address-convertor/notation/zone-id', label: 'IPv6 Zone ID Handler' },
  { href: '/ip-address-convertor/ipv6/solicited-node', label: 'IPv6 Solicited-Node' },
  { href: '/ip-address-convertor/ipv6/teredo', label: 'IPv6 Teredo Parser' },
  { href: '/ip-address-convertor/ipv6/nat64', label: 'IPv6 NAT64 Translator' },
  { href: '/ip-address-convertor/families/ipv4-to-ipv6', label: 'IPv4 → IPv6' },
  { href: '/ip-address-convertor/families/ipv6-to-ipv4', label: 'IPv6 → IPv4' },
  { href: '/ip-address-convertor/eui64', label: 'EUI-64 Converter' },
  { href: '/ip-address-convertor/ula-generator', label: 'ULA Generator' },

  // DNS Tools (sample)
  { href: '/dns/reverse/ptr-generator', label: 'PTR Generator' },
  { href: '/dns/reverse/zone-generator', label: 'Reverse Zone Generator' },
  { href: '/dns/generators/a-aaaa-bulk', label: 'A/AAAA Bulk Generator' },
  { href: '/dns/generators/cname-builder', label: 'CNAME Builder' },
  { href: '/dns/record-validator', label: 'DNS Record Validator' },

  // Diagnostics (sample)
  { href: '/diagnostics/dns/lookup', label: 'DNS Lookup' },
  { href: '/diagnostics/http/headers', label: 'HTTP Headers Analyzer' },
  { href: '/diagnostics/tls/certificate', label: 'TLS Certificate Analyzer' },

  // Reference (sample)
  { href: '/reference/cidr', label: 'CIDR Notation Explained' },
  { href: '/reference/vlsm', label: 'VLSM in Plain English' },
  { href: '/reference/ipv6-address-types', label: 'IPv6 Address Types & Key Prefixes' },
];

// About pages
export const aboutPages: NavItem[] = [
  { href: '/about', label: 'About' },
  { href: '/about/api', label: 'API Usage' },
  { href: '/about/attributions', label: 'Attributions' },
  { href: '/about/author', label: 'Author' },
  { href: '/about/building', label: 'Building' },
  { href: '/about/license', label: 'MIT License' },
  { href: '/about/self-hosting', label: 'Self-Hosting' },
];

// All pages for testing
export const ALL_TEST_PAGES: NavItem[] = [
  ...TOP_NAV,
  ...SUB_NAV_PAGES,
  ...aboutPages,
  { href: '/', label: 'Home' },
];