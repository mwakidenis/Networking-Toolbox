export const vlsmContent = {
  title: 'VLSM in Plain English',
  description: 'Variable Length Subnet Masking explained - when to use it, how it works, and common pitfalls to avoid.',

  sections: {
    whatIs: {
      title: 'What is VLSM?',
      content: `VLSM (Variable Length Subnet Masking) lets you divide a network into subnets of different sizes. Instead of making all subnets the same size, you can create exactly the right size for each need.

Think of it like cutting a pizza: instead of cutting it into equal slices, you cut bigger pieces for hungry people and smaller pieces for those who want less.`,
    },

    whenWhy: {
      title: 'When and Why to Use VLSM',
      content: `Use VLSM when different parts of your network need different numbers of hosts:

- Server farm needs 50 addresses
- Office network needs 200 addresses  
- Point-to-point links need only 2 addresses

Without VLSM, you would waste many addresses by making all subnets big enough for your largest need.`,
    },

    howItWorks: {
      title: 'How VLSM Works',
      content: `VLSM works by subdividing networks step by step:

1. Start with your main network
2. Identify your largest subnet needs first
3. Create subnets for the largest needs
4. Subdivide remaining space for smaller needs
5. Keep point-to-point links for last (they only need /30)`,
    },
  },

  example: {
    title: 'Worked Example',
    scenario: 'You have 192.168.1.0/24 and need:',
    requirements: [
      { name: 'Sales Department', hosts: 100, needsPrefix: '/25' },
      { name: 'IT Department', hosts: 50, needsPrefix: '/26' },
      { name: 'Guest WiFi', hosts: 30, needsPrefix: '/27' },
      { name: 'Router Links', hosts: 2, needsPrefix: '/30' },
    ],
    solution: [
      { subnet: '192.168.1.0/25', hosts: '126 hosts', use: 'Sales Department' },
      { subnet: '192.168.1.128/26', hosts: '62 hosts', use: 'IT Department' },
      { subnet: '192.168.1.192/27', hosts: '30 hosts', use: 'Guest WiFi' },
      { subnet: '192.168.1.224/30', hosts: '2 hosts', use: 'Router Link 1' },
      { subnet: '192.168.1.228/30', hosts: '2 hosts', use: 'Router Link 2' },
      { subnet: '192.168.1.232/30', hosts: '2 hosts', use: 'Router Link 3' },
    ],
  },

  pitfalls: [
    {
      title: 'Address Fragmentation',
      problem: 'Creating subnets in the wrong order leaves unusable gaps',
      solution: 'Always allocate largest subnets first, then work down to smaller ones',
    },
    {
      title: 'Poor Planning',
      problem: 'Not leaving room for growth',
      solution: 'Plan for 25-50% growth in each subnet',
    },
    {
      title: 'Alignment Issues',
      problem: "Subnet boundaries don't align properly",
      solution: 'Use online calculators or tools to verify your subnetting',
    },
    {
      title: 'Routing Complexity',
      problem: 'Too many small subnets create routing table bloat',
      solution: 'Use route summarization where possible',
    },
  ],

  bestPractices: [
    'Document your subnetting plan before implementing',
    'Leave room for growth in each subnet',
    'Use consistent naming conventions',
    'Start with largest subnets and work down',
    'Reserve some address space for future expansion',
    'Test your design in a lab before production',
  ],

  tips: [
    'A /25 gives you 126 hosts, /26 gives 62, /27 gives 30, /28 gives 14',
    'Point-to-point links between routers only need /30 (2 hosts)',
    'Loopback interfaces only need /32 (1 host)',
    "Always verify your subnets don't overlap",
    'Use VLSM calculators to check your work',
  ],
};
