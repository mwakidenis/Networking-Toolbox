export const ipv6ConnectivityContent = {
  title: 'IPv6 Connectivity Checker',
  description: 'Test IPv6 and IPv4 connectivity to determine dual-stack capability and protocol preference',
  sections: {
    whatIsIPv6: {
      title: 'What is IPv6?',
      content:
        'IPv6 (Internet Protocol version 6) is the most recent version of the Internet Protocol, designed to replace IPv4. It provides a vastly larger address space (340 undecillion addresses) and improves routing, security, and network configuration.',
    },
    dualStack: {
      title: 'Dual-Stack Networking',
      content:
        'Dual-stack systems support both IPv4 and IPv6 simultaneously, allowing communication with hosts using either protocol. This is the recommended transition strategy for moving from IPv4 to IPv6.',
      benefits: [
        { benefit: 'Backward Compatibility', description: 'Maintains connectivity with IPv4-only hosts' },
        {
          benefit: 'Future-Ready',
          description: 'Can communicate with IPv6-only services and take advantage of new features',
        },
        {
          benefit: 'Smooth Transition',
          description: 'Allows gradual migration without service disruption',
        },
        {
          benefit: 'Optimal Routing',
          description: 'Automatically selects the best protocol based on availability and performance',
        },
      ],
    },
    ipv6Advantages: {
      title: 'IPv6 Advantages',
      advantages: [
        {
          advantage: 'Massive Address Space',
          description: '128-bit addresses provide 340 undecillion unique addresses (vs 4.3 billion in IPv4)',
        },
        {
          advantage: 'Simplified Headers',
          description: 'More efficient packet processing with streamlined header structure',
        },
        {
          advantage: 'No NAT Required',
          description: 'End-to-end connectivity without Network Address Translation',
        },
        {
          advantage: 'Built-in Security',
          description: 'IPsec is mandatory, providing authentication and encryption at the network layer',
        },
        {
          advantage: 'Better Multicast',
          description: 'Improved multicast routing and anycast addressing',
        },
        {
          advantage: 'Autoconfiguration',
          description: 'Stateless Address Autoconfiguration (SLAAC) simplifies network setup',
        },
      ],
    },
    connectivityTests: {
      title: 'Connectivity Test Types',
      tests: [
        {
          test: 'IPv4 Test',
          description: 'Connects to an IPv4-only endpoint to verify IPv4 connectivity and measure latency',
        },
        {
          test: 'IPv6 Test',
          description: 'Connects to an IPv6-only endpoint to verify native IPv6 connectivity',
        },
        {
          test: 'Dual-Stack Detection',
          description: 'Determines if both protocols are available simultaneously',
        },
        {
          test: 'Protocol Preference',
          description: 'Compares latency to determine which protocol performs better',
        },
      ],
    },
    adoptionStatus: {
      title: 'IPv6 Adoption',
      content:
        'As of 2025, IPv6 adoption varies significantly by region and network type. Major content providers and cloud platforms have largely adopted IPv6, but many residential ISPs and corporate networks are still IPv4-only or in transition.',
      regions: [
        { region: 'Global Average', adoption: '~45%', note: 'Based on Google statistics' },
        { region: 'India', adoption: '~70%', note: 'Leading in mobile IPv6 deployment' },
        { region: 'United States', adoption: '~50%', note: 'Major ISPs deployed, enterprises lagging' },
        { region: 'Germany', adoption: '~60%', note: 'Strong European leadership' },
        { region: 'China', adoption: '~35%', note: 'Rapid growth in recent years' },
      ],
    },
    transitionMechanisms: {
      title: 'IPv4 to IPv6 Transition',
      mechanisms: [
        {
          mechanism: 'Dual-Stack',
          description: 'Run both protocols simultaneously',
          status: 'Recommended',
        },
        {
          mechanism: '6to4',
          description: 'Tunnel IPv6 through IPv4 networks',
          status: 'Legacy',
        },
        {
          mechanism: 'Teredo',
          description: 'NAT traversal for IPv6',
          status: 'Deprecated',
        },
        {
          mechanism: '464XLAT',
          description: 'IPv4 over IPv6 translation for mobile',
          status: 'Active',
        },
        {
          mechanism: 'NAT64/DNS64',
          description: 'Allow IPv6-only hosts to reach IPv4 services',
          status: 'Active',
        },
      ],
    },
    commonIssues: {
      title: 'Common IPv6 Issues',
      issues: [
        {
          issue: 'No IPv6 Connectivity',
          causes: ['ISP does not provide IPv6', 'Router lacks IPv6 support', 'Firewall blocking IPv6'],
          solution: 'Contact ISP, upgrade router/firmware, check firewall rules',
        },
        {
          issue: 'Slow IPv6 Performance',
          causes: ['Suboptimal routing', 'Tunnel overhead', 'Misconfigured MTU'],
          solution: 'Check routing paths, avoid tunnels if possible, adjust MTU settings',
        },
        {
          issue: 'IPv6 Breaks Some Applications',
          causes: ['Application not IPv6-aware', 'Firewall rules too restrictive', 'DNS issues'],
          solution: 'Update applications, configure firewall properly, ensure DNS returns AAAA records',
        },
      ],
    },
    bestPractices: {
      title: 'IPv6 Best Practices',
      practices: [
        {
          practice: 'Enable Dual-Stack',
          description: 'Support both IPv4 and IPv6 for maximum compatibility and future-proofing',
        },
        {
          practice: 'Use Native IPv6',
          description: 'Prefer native connectivity over tunnels for better performance and reliability',
        },
        {
          practice: 'Configure Firewalls Properly',
          description: 'Apply security policies to both protocols, avoid IPv6 as a security backdoor',
        },
        {
          practice: 'Test Both Protocols',
          description: 'Regularly verify connectivity and performance for both IPv4 and IPv6',
        },
        {
          practice: 'Enable Privacy Extensions',
          description: 'Use temporary addresses for client devices to improve privacy',
        },
      ],
    },
  },
  quickTips: [
    'Dual-stack is the recommended approach for IPv6 deployment',
    'IPv6 provides 340 undecillion addresses - no more address exhaustion',
    'Most modern operating systems prefer IPv6 when both are available',
    'NAT is not required with IPv6 due to the enormous address space',
    'IPsec is mandatory in IPv6, providing built-in security',
    'SLAAC allows devices to configure themselves without DHCP',
    'Check your ISP support - residential IPv6 availability varies widely',
  ],
};
