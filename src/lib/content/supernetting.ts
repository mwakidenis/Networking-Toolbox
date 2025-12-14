export const supernetContent = {
  title: 'Route Summarization / Supernetting',
  description: 'Learn how to aggregate multiple networks into a single route for more efficient routing tables.',

  sections: {
    whatIs: {
      title: 'What is Supernetting?',
      content: `Supernetting (also called route aggregation or summarization) combines multiple smaller networks into one larger network announcement. Instead of advertising many routes, you advertise just one route that covers them all.

This reduces routing table size and makes networks more manageable.`,
    },

    howWorks: {
      title: 'How Route Summarization Works',
      content: `When you have multiple contiguous networks, you can often summarize them into a single route by using a shorter prefix length.

The key is finding the common bits shared by all the networks you want to summarize.`,
    },

    requirements: {
      title: 'Requirements for Summarization',
      content: `Two main requirements must be met:

1. **Contiguous Address Space**: The networks must be adjacent to each other
2. **Power of Two**: You need exactly 2, 4, 8, 16, etc. networks to summarize cleanly

If you have 3 or 5 networks, you cannot create a perfect summary without including unused space.`,
    },
  },

  examples: [
    {
      title: 'Basic Example: Two /24s',
      networks: ['192.168.0.0/24', '192.168.1.0/24'],
      summary: '192.168.0.0/23',
      explanation: 'Two adjacent /24 networks combine into one /23',
      addresses: '512 total addresses (2 × 256)',
    },
    {
      title: 'Four /24s',
      networks: ['10.1.0.0/24', '10.1.1.0/24', '10.1.2.0/24', '10.1.3.0/24'],
      summary: '10.1.0.0/22',
      explanation: 'Four adjacent /24 networks combine into one /22',
      addresses: '1,024 total addresses (4 × 256)',
    },
    {
      title: 'Eight /27s',
      networks: [
        '172.16.0.0/27',
        '172.16.0.32/27',
        '172.16.0.64/27',
        '172.16.0.96/27',
        '172.16.0.128/27',
        '172.16.0.160/27',
        '172.16.0.192/27',
        '172.16.0.224/27',
      ],
      summary: '172.16.0.0/24',
      explanation: 'Eight adjacent /27 networks combine into one /24',
      addresses: '256 total addresses (8 × 32)',
    },
  ],

  stepByStep: {
    title: 'Step-by-Step Process',
    steps: [
      'List all networks you want to summarize',
      'Convert network addresses to binary',
      'Find the common bits from left to right',
      'Count the common bits to get your new prefix length',
      'Verify the summary covers all your networks',
      'Check if any unwanted networks are included',
    ],
  },

  binaryExample: {
    title: 'Binary Example',
    scenario: 'Summarizing 192.168.0.0/24 and 192.168.1.0/24',
    binary: [
      { network: '192.168.0.0', binary: '11000000.10101000.00000000.00000000' },
      { network: '192.168.1.0', binary: '11000000.10101000.00000001.00000000' },
    ],
    analysis: 'First 23 bits are identical, so summary is 192.168.0.0/23',
  },

  benefits: [
    'Smaller routing tables mean faster lookups',
    'Reduced memory usage on routers',
    'Less routing protocol overhead',
    'Simpler network management',
    'Better network stability (fewer route changes)',
  ],

  pitfalls: [
    {
      title: 'Including Unwanted Networks',
      problem: "Summary might include networks you don't own or want to advertise",
      example:
        'Summarizing 192.168.0.0/24 and 192.168.2.0/24 as 192.168.0.0/22 also includes 192.168.1.0/24 and 192.168.3.0/24',
    },
    {
      title: 'Non-Contiguous Networks',
      problem: "Trying to summarize networks that aren't adjacent",
      example: 'Cannot cleanly summarize 10.1.0.0/24 and 10.1.5.0/24 without including unwanted space',
    },
    {
      title: 'Wrong Powers of Two',
      problem: 'Having 3, 5, 6, 7 networks instead of 2, 4, 8, 16',
      example: 'Three /24s cannot be perfectly summarized without wasting addresses',
    },
  ],

  quickReference: [
    { networks: '2 × /24', summary: '/23', saves: '1 route' },
    { networks: '4 × /24', summary: '/22', saves: '3 routes' },
    { networks: '8 × /24', summary: '/21', saves: '7 routes' },
    { networks: '16 × /24', summary: '/20', saves: '15 routes' },
    { networks: '2 × /23', summary: '/22', saves: '1 route' },
    { networks: '4 × /23', summary: '/21', saves: '3 routes' },
  ],
};
