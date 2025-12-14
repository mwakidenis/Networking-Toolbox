export const cidrContent = {
  title: 'CIDR Notation Explained',
  description:
    'Complete guide to CIDR notation - what it is, why it replaced IP classes, and how to read network prefixes.',

  coreConcepts: [
    {
      icon: 'network',
      title: 'CIDR Notation',
      description:
        'The slash notation (like /24) tells you how many bits identify the network portion of an IP address.',
      example: '192.168.1.0/24 = 24 network bits, 8 host bits',
      color: 'var(--color-primary)',
    },
    {
      icon: 'mask',
      title: 'Subnet Masks',
      description: 'Binary masks that define which part of an IP address is network and which is host.',
      example: '/24 = 255.255.255.0 in decimal',
      color: 'var(--color-info)',
    },
    {
      icon: 'merge',
      title: 'Route Aggregation',
      description: 'Combining multiple networks into fewer, larger prefixes for efficient routing.',
      example: '192.168.0.0/24 + 192.168.1.0/24 = 192.168.0.0/23',
      color: 'var(--color-success)',
    },
    {
      icon: 'split',
      title: 'Network Division',
      description: 'Breaking larger networks into smaller subnets for better organization.',
      example: '10.0.0.0/16 can be split into 256 /24 subnets',
      color: 'var(--color-warning)',
    },
  ],

  aboutSection: {
    content: [
      'CIDR (Classless Inter-Domain Routing) revolutionized how we handle IP addresses. Before CIDR, networks were stuck with fixed class sizes (Class A, B, C). CIDR lets you create networks of any size by specifying exactly how many bits identify the network.',
      'The key insight: instead of wasting addresses with oversized networks or running out with undersized ones, you can right-size your networks to match your actual needs.',
    ],
    advantages: [
      { title: 'Flexible Addressing', description: 'Create networks of any size, not limited to class boundaries' },
      { title: 'Efficient Allocation', description: 'Reduce IP address waste with right-sized subnets' },
      { title: 'Route Aggregation', description: 'Combine multiple routes into summaries for smaller routing tables' },
      { title: 'Hierarchical Design', description: 'Build scalable network architectures with logical addressing' },
    ],
  },

  commonSizes: [
    { cidr: '/8', mask: '255.0.0.0', hosts: '16,777,214', use: 'ISP allocations', color: 'var(--color-error)' },
    { cidr: '/16', mask: '255.255.0.0', hosts: '65,534', use: 'Large organizations', color: 'var(--color-warning)' },
    { cidr: '/24', mask: '255.255.255.0', hosts: '254', use: 'Department networks', color: 'var(--color-success)' },
    { cidr: '/25', mask: '255.255.255.128', hosts: '126', use: 'Small offices', color: 'var(--color-info)' },
    { cidr: '/26', mask: '255.255.255.192', hosts: '62', use: 'VLANs', color: 'var(--color-info)' },
    { cidr: '/28', mask: '255.255.255.240', hosts: '14', use: 'Point-to-point', color: 'var(--color-primary)' },
    { cidr: '/30', mask: '255.255.255.252', hosts: '2', use: 'Router links', color: 'var(--color-primary)' },
    { cidr: '/31', mask: '255.255.255.254', hosts: '2*', use: 'P2P (RFC 3021)', color: 'var(--color-primary)' },
  ],

  howItWorks: [
    {
      type: 'success',
      title: 'Network vs Host Bits',
      content:
        'A /24 network means the first 24 bits identify the network, leaving 8 bits for hosts. That gives you 2^8 = 256 total addresses, minus 2 for network and broadcast = 254 usable hosts.',
      example: {
        type: 'bit',
        networkBits: '11000000.10101000.00000001.',
        hostBits: '00000000',
        networkLabel: 'Network (24 bits)',
        hostLabel: 'Host (8 bits)',
      },
    },
    {
      type: 'info',
      title: 'Route Summarization',
      content:
        'Instead of advertising 4 separate /24 networks, you can summarize them into one /22. This reduces routing table size and improves network performance.',
      example: {
        type: 'summary',
        before: {
          title: 'Before: 4 routes',
          content: ['192.168.0.0/24, 192.168.1.0/24', '192.168.2.0/24, 192.168.3.0/24'],
        },
        after: {
          title: 'After: 1 route',
          content: ['192.168.0.0/22', '(covers all 4 networks)'],
        },
      },
    },
    {
      type: 'warning',
      title: 'Subnet Planning',
      content:
        "Always plan for growth and align to binary boundaries. A /25 gives you room to split into two /26s later, but a /27 doesn't divide evenly into /25s.",
      example: {
        type: 'tip',
        title: 'Pro tip:',
        content: "Start with larger subnets and subdivide as needed. It's easier to split than to merge.",
      },
    },
  ],

  quickReference: [
    {
      title: 'Binary to CIDR',
      items: [
        'Count consecutive 1s from the left',
        '11111111.11111111.11111111.00000000 = /24',
        '11111111.11111111.11111100.00000000 = /22',
      ],
    },
    {
      title: 'Host Calculation',
      items: ['Host bits = 32 - CIDR prefix', 'Total addresses = 2^(host bits)', 'Usable hosts = Total - 2'],
    },
    {
      title: 'Common Patterns',
      items: [
        '/24 = 254 hosts (standard office)',
        '/30 = 2 hosts (point-to-point links)',
        '/16 = 65k hosts (large campus)',
      ],
    },
  ],

  // Legacy content for backward compatibility
  sections: {
    whatIs: {
      title: 'What is CIDR?',
      content: `CIDR (Classless Inter-Domain Routing) is a method for describing IP networks using a slash followed by a number. The number after the slash tells you how many bits are used for the network portion of the address.

For example, in 192.168.1.0/24, the "/24" means the first 24 bits identify the network, and the remaining 8 bits identify individual hosts within that network.`,
    },

    whyReplaced: {
      title: 'Why CIDR Replaced IP Classes',
      content: `The old class system (Class A, B, C) was too rigid and wasteful. It only allowed networks of fixed sizes:

- Class A: 16 million addresses (way too big for most needs)
- Class B: 65,536 addresses (often too big)
- Class C: 256 addresses (often too small)

CIDR lets you create networks of any size by choosing exactly how many network bits you need.`,
    },

    howToRead: {
      title: 'How to Read CIDR Notation',
      content: `The number after the slash is the "prefix length" - it counts the network bits from left to right:

- /8 = 8 network bits (24 host bits)
- /16 = 16 network bits (16 host bits)
- /24 = 24 network bits (8 host bits)
- /30 = 30 network bits (2 host bits)`,
    },
  },

  examples: [
    {
      cidr: '192.168.0.0/24',
      description: 'Home network - 254 usable addresses',
      hosts: '254 hosts',
    },
    {
      cidr: '10.0.0.0/8',
      description: 'Large private network - 16 million addresses',
      hosts: '16,777,214 hosts',
    },
    {
      cidr: '172.16.0.0/12',
      description: 'Medium private network - 1 million addresses',
      hosts: '1,048,574 hosts',
    },
    {
      cidr: '2001:db8::/32',
      description: 'IPv6 network - massive address space',
      hosts: '2^96 addresses',
    },
  ],

  prefixTable: [
    { prefix: '/8', mask: '255.0.0.0', hosts: '16,777,214', typical: 'ISP allocation' },
    { prefix: '/16', mask: '255.255.0.0', hosts: '65,534', typical: 'Large enterprise' },
    { prefix: '/20', mask: '255.255.240.0', hosts: '4,094', typical: 'Medium business' },
    { prefix: '/24', mask: '255.255.255.0', hosts: '254', typical: 'Small office/home' },
    { prefix: '/25', mask: '255.255.255.128', hosts: '126', typical: 'Small subnet' },
    { prefix: '/26', mask: '255.255.255.192', hosts: '62', typical: 'Point-to-point' },
    { prefix: '/30', mask: '255.255.255.252', hosts: '2', typical: 'Router links' },
    { prefix: '/32', mask: '255.255.255.255', hosts: '1', typical: 'Single host' },
  ],

  keyPoints: [
    'Smaller prefix numbers = bigger networks (more hosts)',
    'Larger prefix numbers = smaller networks (fewer hosts)',
    '/24 is the most common size for small networks',
    'IPv6 commonly uses /64 for end-user networks',
    'CIDR allows efficient use of IP address space',
  ],
};
