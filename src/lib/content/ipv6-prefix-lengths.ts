export const ipv6PrefixLengthsContent = {
  title: 'Common IPv6 Prefix Lengths',
  description: 'Quick reference for common IPv6 prefix lengths and their typical uses in network design.',

  sections: {
    overview: {
      title: 'IPv6 Prefix Length Overview',
      content: `IPv6 uses prefix lengths just like IPv4 CIDR, but the numbers are different due to IPv6's 128-bit address space. Understanding common prefix lengths helps with IPv6 network planning and address allocation.

Unlike IPv4 where /24 is common, IPv6 networks typically use /64 for end-user networks and larger prefixes for routing aggregation.`,
    },
  },

  commonPrefixes: [
    {
      prefix: '/128',
      name: 'Single Host',
      hosts: '1 address',
      typical: 'Host routes, loopback interfaces',
      examples: ['::1/128 - IPv6 loopback', '2001:db8::1/128 - Single server'],
      description: 'Equivalent to IPv4 /32, identifies one specific address',
    },
    {
      prefix: '/127',
      name: 'Point-to-Point Link',
      hosts: '2 addresses',
      typical: 'Router-to-router links',
      examples: ['2001:db8:1:1::/127 - Router link'],
      description: 'Saves address space on point-to-point links, like IPv4 /30',
    },
    {
      prefix: '/64',
      name: 'Standard Subnet',
      hosts: '18,446,744,073,709,551,616 addresses',
      typical: 'LAN segments, end-user networks',
      examples: ['2001:db8:1::/64 - Office network', 'fe80::/64 - Link-local'],
      description: 'Standard subnet size, allows SLAAC and EUI-64',
    },
    {
      prefix: '/60',
      name: 'Small Site',
      hosts: '16 /64 subnets',
      typical: 'Small offices, residential sites',
      examples: ['2001:db8:1000::/60 - Small office allocation'],
      description: 'Provides 16 /64 networks for a small site',
    },
    {
      prefix: '/56',
      name: 'Typical Site',
      hosts: '256 /64 subnets',
      typical: 'Medium businesses, large homes',
      examples: ['2001:db8:1200::/56 - Business allocation'],
      description: 'Common allocation for business sites and power users',
    },
    {
      prefix: '/48',
      name: 'Large Site',
      hosts: '65,536 /64 subnets',
      typical: 'Enterprises, ISP customers',
      examples: ['2001:db8::/48 - Enterprise allocation'],
      description: 'Traditional site allocation, very generous subnet space',
    },
    {
      prefix: '/32',
      name: 'ISP/RIR Allocation',
      hosts: '4,294,967,296 /64 subnets',
      typical: 'ISPs, large organizations',
      examples: ['2001:db8::/32 - ISP allocation'],
      description: 'Minimum allocation from Regional Internet Registries',
    },
  ],

  usageGuidelines: {
    title: 'When to Use Each Prefix',
    residential: {
      title: 'Residential/Small Office',
      allocations: [
        { size: '/60', description: 'Small home with multiple VLANs/networks' },
        { size: '/56', description: 'Power user or small business' },
        { size: '/48', description: 'Large home office or small enterprise' },
      ],
    },
    enterprise: {
      title: 'Enterprise Networks',
      allocations: [
        { size: '/48', description: 'Single large site' },
        { size: '/44 or /40', description: 'Multi-site organization' },
        { size: '/32', description: 'Large enterprise or ISP' },
      ],
    },
    subnets: {
      title: 'Individual Subnets',
      allocations: [
        { size: '/64', description: 'Standard LAN segment' },
        { size: '/127', description: 'Point-to-point router links' },
        { size: '/128', description: 'Loopbacks, host routes' },
      ],
    },
  },

  comparison: {
    title: 'IPv4 vs IPv6 Prefix Comparison',
    mappings: [
      { ipv4: '/32 (1 host)', ipv6: '/128 (1 host)', note: 'Single host address' },
      { ipv4: '/30 (2 hosts)', ipv6: '/127 (2 hosts)', note: 'Point-to-point links' },
      { ipv4: '/24 (254 hosts)', ipv6: '/64 (huge)', note: 'LAN segment' },
      { ipv4: '/16 (65k hosts)', ipv6: '/48 (65k subnets)', note: 'Large network' },
      { ipv4: '/8 (16M hosts)', ipv6: '/32 (4B subnets)', note: 'ISP allocation' },
    ],
  },

  bestPractices: [
    'Always use /64 for end-user networks (required for SLAAC)',
    'Use /127 for point-to-point links to save address space',
    'Plan your addressing hierarchy before assigning prefixes',
    'Reserve some prefix space for future growth',
    'Document your prefix allocation scheme',
    'Use consistent prefix lengths within network tiers',
  ],

  quickReference: [
    { prefix: '/32', subnets: '4.3B /64s', note: 'RIR minimum allocation' },
    { prefix: '/40', subnets: '16M /64s', note: 'Large enterprise' },
    { prefix: '/44', subnets: '1M /64s', note: 'Medium enterprise' },
    { prefix: '/48', subnets: '65k /64s', note: 'Traditional site' },
    { prefix: '/52', subnets: '4k /64s', note: 'Large site' },
    { prefix: '/56', subnets: '256 /64s', note: 'Typical site' },
    { prefix: '/60', subnets: '16 /64s', note: 'Small site' },
    { prefix: '/64', subnets: '1 subnet', note: 'End-user network' },
  ],

  tips: [
    "IPv6 has so much address space that conservation isn't usually necessary",
    '/64 is mandatory for SLAAC (Stateless Address Autoconfiguration)',
    'Shorter prefixes mean more subnets available',
    'Most home users get /60 or /56 from their ISP',
    'Enterprise networks typically start with /48 or shorter',
    'Use nibble boundaries (multiples of 4) for easier management',
  ],
};
