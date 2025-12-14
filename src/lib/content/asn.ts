export const asnContent = {
  title: 'What is an ASN?',
  description:
    'Understanding Autonomous System Numbers, BGP basics, and how IP addresses map to ASNs in internet routing.',

  sections: {
    overview: {
      title: 'What is an Autonomous System (AS)?',
      content: `An Autonomous System (AS) is a collection of IP networks and routers under the control of one organization that presents a common routing policy to the internet. Each AS is identified by a unique number called an ASN (Autonomous System Number).

Think of an AS as an independent piece of the internet - like an ISP, a large company, or a university - that can make its own decisions about how to route traffic.`,
    },

    asn: {
      title: 'ASN (Autonomous System Number)',
      content: `ASNs are unique numbers that identify each Autonomous System. They work like postal codes for internet routing - they help routers know which organization controls which IP addresses.

ASNs are assigned by Regional Internet Registries (RIRs) and are essential for Border Gateway Protocol (BGP) routing.`,
    },
  },

  asnTypes: [
    {
      range: '1 - 64,511',
      name: '16-bit Public ASNs',
      description: 'Original ASN format, globally unique',
      usage: 'Large ISPs, major organizations',
      examples: ['AS7018 - AT&T', 'AS15169 - Google', 'AS32934 - Facebook'],
    },
    {
      range: '64,512 - 65,534',
      name: '16-bit Private ASNs',
      description: 'For private use, not routed on internet',
      usage: 'Internal networks, testing, private peering',
      examples: ['AS64512 - Common private ASN', 'AS65001 - Lab networks'],
    },
    {
      range: '65,536 - 4,199,999,999',
      name: '32-bit Public ASNs',
      description: 'Extended format due to exhaustion of 16-bit',
      usage: 'New allocations since 2009',
      examples: ['AS200000+ - Newer organizations'],
    },
  ],

  bgpBasics: {
    title: 'BGP (Border Gateway Protocol) Basics',
    description: 'BGP is the routing protocol that connects Autonomous Systems together',

    concepts: [
      {
        term: 'BGP Speaker',
        definition: 'A router that runs BGP and can announce/receive routes',
        example: 'ISP edge routers, content delivery network nodes',
      },
      {
        term: 'BGP Peer/Neighbor',
        definition: 'Two ASes that directly exchange routing information',
        example: 'Your ISP peers with other ISPs and content networks',
      },
      {
        term: 'Route Advertisement',
        definition: 'Announcing which IP prefixes your AS can reach',
        example: 'AS15169 announces it can reach 8.8.8.0/24',
      },
      {
        term: 'AS Path',
        definition: 'List of ASNs a route has passed through',
        example: 'Path: AS100 -> AS200 -> AS300 shows route traversal',
      },
    ],

    types: [
      {
        type: 'eBGP (External BGP)',
        description: 'BGP between different Autonomous Systems',
        usage: 'Inter-ISP routing, connecting to internet',
        port: 'TCP 179',
      },
      {
        type: 'iBGP (Internal BGP)',
        description: 'BGP within the same Autonomous System',
        usage: 'Distributing external routes within large networks',
        port: 'TCP 179',
      },
    ],
  },

  ipToAsnMapping: {
    title: 'How IP Addresses Map to ASNs',
    description: 'Every public IP address belongs to exactly one ASN',

    process: [
      'RIRs allocate IP blocks to organizations',
      'Organizations get assigned an ASN if they need BGP routing',
      'The ASN announces (advertises) their IP prefixes via BGP',
      'Internet routers learn which ASN controls which IP ranges',
      'Traffic destined for those IPs is routed toward that ASN',
    ],

    examples: [
      {
        ipRange: '8.8.8.0/24',
        asn: 'AS15169',
        organization: 'Google LLC',
        description: "Google's public DNS servers",
      },
      {
        ipRange: '1.1.1.0/24',
        asn: 'AS13335',
        organization: 'Cloudflare',
        description: "Cloudflare's public DNS and CDN",
      },
      {
        ipRange: '157.240.0.0/16',
        asn: 'AS32934',
        organization: 'Facebook',
        description: "Facebook's social media platform",
      },
      {
        ipRange: '192.0.2.0/24',
        asn: 'N/A',
        organization: 'TEST-NET-1',
        description: 'Documentation range, not routed',
      },
    ],
  },

  lookupTools: {
    title: 'ASN Lookup Tools',
    description: 'How to find which ASN owns an IP address',

    methods: [
      {
        method: 'WHOIS Query',
        command: 'whois 8.8.8.8',
        description: 'Command-line lookup for IP ownership',
        example: 'Shows: AS15169 Google LLC',
      },
      {
        method: 'BGP Looking Glass',
        command: 'Web-based tools',
        description: 'View BGP routing tables from ISP perspective',
        example: 'Shows AS path and route information',
      },
      {
        method: 'Online ASN Tools',
        command: 'Various websites',
        description: 'User-friendly ASN and IP lookup services',
        example: 'ASN lookup databases and APIs',
      },
    ],

    commonCommands: [
      'whois -h whois.radb.net 8.8.8.8',
      'dig TXT 8.8.8.8.origin.asn.cymru.com',
      'curl ipinfo.io/8.8.8.8',
    ],
  },

  realWorldExamples: [
    {
      scenario: 'Major ISP',
      asn: 'AS7018',
      organization: 'AT&T',
      role: 'Provides internet connectivity to millions of customers',
      ipBlocks: 'Hundreds of different IP ranges',
      peers: 'Connects to other ISPs, content networks, enterprises',
    },
    {
      scenario: 'Content Network',
      asn: 'AS15169',
      organization: 'Google',
      role: 'Serves content globally with low latency',
      ipBlocks: '8.8.8.0/24, many others worldwide',
      peers: 'Peers with ISPs and other content networks',
    },
    {
      scenario: 'Enterprise',
      asn: 'AS64496',
      organization: 'Large Corporation',
      role: 'Multi-homed for redundancy and performance',
      ipBlocks: 'Corporate public IP ranges',
      peers: 'Connects to multiple ISPs for redundancy',
    },
    {
      scenario: 'University',
      asn: 'AS11537',
      organization: 'University Network',
      role: 'Provides connectivity for campus and research',
      ipBlocks: 'Educational institution IP ranges',
      peers: 'Connects to commercial ISPs and research networks',
    },
  ],

  benefits: [
    'Enables internet-scale routing between organizations',
    'Provides routing policy control and traffic engineering',
    'Allows redundant connections for improved reliability',
    'Enables direct peering between content and eyeball networks',
    'Supports internet growth through hierarchical addressing',
    'Facilitates network troubleshooting and security analysis',
  ],

  troubleshooting: [
    {
      issue: 'Slow connections to specific websites',
      cause: 'Poor BGP routing or lack of direct peering',
      investigation: 'Check AS path length and peering relationships',
      solution: 'Contact ISP about peering or use different DNS/CDN',
    },
    {
      issue: 'Cannot reach certain IP ranges',
      cause: 'BGP routing issues or filtering',
      investigation: 'Use traceroute and BGP looking glass tools',
      solution: 'Verify BGP advertisements and routing policies',
    },
    {
      issue: 'Asymmetric routing problems',
      cause: 'Different AS paths for inbound vs outbound traffic',
      investigation: 'Check BGP path attributes and policies',
      solution: 'Adjust BGP policies or consider additional peering',
    },
  ],

  quickFacts: [
    'AS numbers are globally unique identifiers',
    'Every public IP address is announced by exactly one ASN',
    'BGP is the only protocol that connects different ASes',
    'Private ASNs (64512-65534) are not routed on the internet',
    'AS path length affects routing decisions (shorter is preferred)',
    'Large organizations often have multiple ASNs for different purposes',
  ],

  gettingStarted: [
    {
      step: 'Understanding Your ISP',
      description: "Find out your ISP's ASN and peering relationships",
      action: 'Use whois lookup on your public IP address',
    },
    {
      step: 'Network Troubleshooting',
      description: 'Use ASN information to understand connectivity issues',
      action: 'Learn traceroute and BGP looking glass tools',
    },
    {
      step: 'For Enterprises',
      description: 'Consider getting your own ASN for multi-homing',
      action: 'Evaluate benefits of redundant ISP connections',
    },
  ],
};
