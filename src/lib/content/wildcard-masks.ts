export const wildcardMasksContent = {
  title: 'ACL Wildcard Masks',
  description:
    'Understanding wildcard masks for ACLs - how they differ from subnet masks and quick conversion methods.',

  sections: {
    overview: {
      title: 'What are Wildcard Masks?',
      content: `Wildcard masks are used in Access Control Lists (ACLs) to specify which parts of an IP address to match. Unlike subnet masks, wildcard masks use inverted logic:

- 0 means "must match exactly"
- 1 means "don't care" or "can be anything"

This is the opposite of subnet masks, where 1 means network and 0 means host.`,
    },

    difference: {
      title: 'Wildcard vs Subnet Masks',
      content: `The key difference is the bit meaning:

**Subnet Mask:** 1 = network portion, 0 = host portion
**Wildcard Mask:** 0 = must match, 1 = don't care

Wildcard masks are essentially the inverse (bitwise NOT) of subnet masks.`,
    },
  },

  conversionExamples: [
    {
      subnet: '255.255.255.0',
      subnetBinary: '11111111.11111111.11111111.00000000',
      wildcard: '0.0.0.255',
      wildcardBinary: '00000000.00000000.00000000.11111111',
      description: '/24 network - match first 24 bits exactly, any host',
    },
    {
      subnet: '255.255.248.0',
      subnetBinary: '11111111.11111111.11111000.00000000',
      wildcard: '0.0.7.255',
      wildcardBinary: '00000000.00000000.00000111.11111111',
      description: '/21 network - match first 21 bits, any of last 11 bits',
    },
    {
      subnet: '255.255.255.252',
      subnetBinary: '11111111.11111111.11111111.11111100',
      wildcard: '0.0.0.3',
      wildcardBinary: '00000000.00000000.00000000.00000011',
      description: '/30 network - match first 30 bits, last 2 can vary',
    },
    {
      subnet: '255.0.0.0',
      subnetBinary: '11111111.00000000.00000000.00000000',
      wildcard: '0.255.255.255',
      wildcardBinary: '00000000.11111111.11111111.11111111',
      description: "/8 network - match first 8 bits, rest don't care",
    },
  ],

  quickConversion: {
    title: 'Quick Conversion Method',
    steps: ['Take the subnet mask', 'Subtract each octet from 255', 'The result is your wildcard mask'],
    formula: 'Wildcard = 255.255.255.255 - Subnet Mask',
    examples: [
      { subnet: '255.255.255.0', calculation: '255-255, 255-255, 255-255, 255-0', wildcard: '0.0.0.255' },
      { subnet: '255.255.240.0', calculation: '255-255, 255-255, 255-240, 255-0', wildcard: '0.0.15.255' },
      { subnet: '255.255.255.252', calculation: '255-255, 255-255, 255-255, 255-252', wildcard: '0.0.0.3' },
    ],
  },

  aclExamples: [
    {
      title: 'Cisco Router ACL Examples',
      entries: [
        {
          acl: 'access-list 10 permit 192.168.1.0 0.0.0.255',
          meaning: 'Allow entire 192.168.1.0/24 network',
          explanation: "First 24 bits must match, last 8 bits don't care",
        },
        {
          acl: 'access-list 10 deny 10.0.0.0 0.255.255.255',
          meaning: 'Block entire 10.0.0.0/8 network',
          explanation: "First 8 bits must match, last 24 bits don't care",
        },
        {
          acl: 'access-list 10 permit 172.16.0.0 0.0.255.255',
          meaning: 'Allow 172.16.0.0/16 network',
          explanation: "First 16 bits must match, last 16 bits don't care",
        },
        {
          acl: 'access-list 10 permit 192.168.1.100 0.0.0.0',
          meaning: 'Allow only host 192.168.1.100',
          explanation: 'All 32 bits must match exactly',
        },
      ],
    },
    {
      title: 'Juniper Firewall Examples',
      entries: [
        {
          acl: 'from source-address 10.0.0.0/8',
          meaning: 'Match 10.0.0.0/8 network',
          explanation: 'Juniper uses CIDR notation, equivalent to wildcard 0.255.255.255',
        },
        {
          acl: 'from source-address 192.168.1.0/24',
          meaning: 'Match 192.168.1.0/24 network',
          explanation: 'Equivalent to wildcard mask 0.0.0.255',
        },
      ],
    },
  ],

  specialCases: [
    {
      case: 'Any Host (0.0.0.0 255.255.255.255)',
      wildcard: '255.255.255.255',
      meaning: 'Match any IP address',
      usage: "Often written as 'any' in ACLs",
    },
    {
      case: 'Specific Host (X.X.X.X 0.0.0.0)',
      wildcard: '0.0.0.0',
      meaning: 'Match exactly one IP address',
      usage: 'Can be written as just the IP without mask',
    },
    {
      case: 'Odd/Even Addresses',
      wildcard: '0.0.0.1',
      meaning: 'Last bit can vary (odd/even addresses)',
      usage: 'Match pairs of consecutive addresses',
    },
    {
      case: 'Every 4th Address',
      wildcard: '0.0.0.3',
      meaning: 'Last 2 bits can vary',
      usage: 'Match groups of 4 consecutive addresses',
    },
  ],

  commonMistakes: [
    {
      mistake: 'Using subnet mask instead of wildcard mask',
      problem: "ACL won't match intended addresses",
      solution: 'Remember to invert the mask (subtract from 255.255.255.255)',
    },
    {
      mistake: 'Forgetting wildcard mask entirely',
      problem: 'Many devices assume 0.0.0.0 (host-only match)',
      solution: 'Always specify the wildcard mask explicitly',
    },
    {
      mistake: 'Using non-contiguous wildcard bits',
      problem: 'Can create unexpected matches',
      solution: 'Stick to contiguous bit patterns for predictable results',
    },
  ],

  platformDifferences: [
    {
      platform: 'Cisco IOS',
      format: 'access-list [number] [permit|deny] [source] [wildcard]',
      example: 'access-list 10 permit 192.168.1.0 0.0.0.255',
      notes: 'Explicit wildcard mask required',
    },
    {
      platform: 'Cisco ASA',
      format: 'access-list [name] [permit|deny] [protocol] [source/mask] [dest/mask]',
      example: 'access-list INSIDE permit ip 192.168.1.0/24 any',
      notes: 'Can use CIDR notation or wildcard masks',
    },
    {
      platform: 'Juniper',
      format: 'from source-address [network/prefix]',
      example: 'from source-address 192.168.1.0/24',
      notes: 'Uses CIDR notation, not wildcard masks',
    },
    {
      platform: 'Palo Alto',
      format: '[network/prefix] or [start-ip]-[end-ip]',
      example: '192.168.1.0/24 or 192.168.1.1-192.168.1.254',
      notes: 'CIDR or range format, no wildcard masks',
    },
  ],

  quickReference: [
    { prefix: '/32', subnet: '255.255.255.255', wildcard: '0.0.0.0', use: 'Single host' },
    { prefix: '/30', subnet: '255.255.255.252', wildcard: '0.0.0.3', use: '4 addresses' },
    { prefix: '/29', subnet: '255.255.255.248', wildcard: '0.0.0.7', use: '8 addresses' },
    { prefix: '/28', subnet: '255.255.255.240', wildcard: '0.0.0.15', use: '16 addresses' },
    { prefix: '/27', subnet: '255.255.255.224', wildcard: '0.0.0.31', use: '32 addresses' },
    { prefix: '/26', subnet: '255.255.255.192', wildcard: '0.0.0.63', use: '64 addresses' },
    { prefix: '/25', subnet: '255.255.255.128', wildcard: '0.0.0.127', use: '128 addresses' },
    { prefix: '/24', subnet: '255.255.255.0', wildcard: '0.0.0.255', use: '256 addresses' },
    { prefix: '/16', subnet: '255.255.0.0', wildcard: '0.0.255.255', use: '65k addresses' },
    { prefix: '/8', subnet: '255.0.0.0', wildcard: '0.255.255.255', use: '16M addresses' },
  ],

  tips: [
    "Remember: wildcard 0 = must match, 1 = don't care",
    'Quick conversion: subtract subnet mask from 255.255.255.255',
    'Test your ACLs in a lab before production deployment',
    "Use 'any' keyword instead of 0.0.0.0 255.255.255.255 for readability",
    'Document the purpose of each ACL entry',
    "Wildcard masks don't have to match subnet boundaries",
  ],
};
