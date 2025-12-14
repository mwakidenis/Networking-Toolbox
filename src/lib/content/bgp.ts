export const bgpContent = {
  title: 'BGP Route Lookup',
  description: 'Look up BGP routing information for IP addresses and prefixes',
  sections: {
    whatIsBGP: {
      title: 'What is BGP?',
      content:
        "Border Gateway Protocol (BGP) is the routing protocol of the Internet. It's used to exchange routing information between autonomous systems (AS) and determines the best path for data to travel across the global Internet.",
    },
    howItWorks: {
      title: 'How BGP Works',
      content:
        'BGP routers exchange routing information with their peers, building a table of network reachability. Each route includes:',
      steps: [
        'Network prefix (destination)',
        'AS path (route through autonomous systems)',
        'Next hop (where to forward packets)',
        'Various attributes (preferences, communities, etc.)',
      ],
    },
    asNumbers: {
      title: 'Autonomous System Numbers',
      content:
        'An AS (Autonomous System) is a collection of IP networks under a single administrative domain. Each AS is identified by a unique ASN.',
      ranges: [
        { range: '1-64495', type: 'Public ASNs', description: 'Globally unique ASNs for Internet routing' },
        {
          range: '64496-64511',
          type: 'Reserved for documentation',
          description: 'Example ASNs for documentation',
        },
        { range: '64512-65534', type: 'Private ASNs', description: 'For private use (16-bit)' },
        {
          range: '65536-4199999999',
          type: 'Public ASNs (32-bit)',
          description: 'Extended range of public ASNs',
        },
        {
          range: '4200000000-4294967294',
          type: 'Private ASNs (32-bit)',
          description: 'Extended private use',
        },
      ],
    },
    asPath: {
      title: 'AS Path',
      content:
        'The AS path shows the sequence of autonomous systems a route has traversed. It is used to prevent routing loops and as a primary path selection criterion.',
      attributes: [
        {
          name: 'Origin AS',
          description: 'The AS that originally advertised the prefix',
        },
        {
          name: 'Path Length',
          description: 'Number of ASes in the path; shorter is preferred',
        },
        {
          name: 'AS Prepending',
          description: 'Artificially lengthening path by repeating ASN for traffic engineering',
        },
      ],
    },
    routeTypes: {
      title: 'BGP Route Types',
      types: [
        {
          type: 'Announced',
          description: 'Prefix is actively advertised in BGP',
          indicator: 'Visible in global routing tables',
        },
        {
          type: 'Not Announced',
          description: 'Prefix not currently advertised',
          indicator: 'May be allocated but not routed',
        },
        {
          type: 'More Specific',
          description: 'Longer prefix (more specific) within a larger block',
          indicator: 'Overrides less specific routes',
        },
        {
          type: 'Less Specific',
          description: 'Shorter prefix (less specific) covering this range',
          indicator: 'Backup route if more specific withdrawn',
        },
      ],
    },
    useCases: {
      title: 'Common Use Cases',
      cases: [
        {
          scenario: 'Network Troubleshooting',
          use: 'Identify routing path and potential issues',
          action: 'Check AS path for unexpected routes or AS prepending',
        },
        {
          scenario: 'IP Ownership Verification',
          use: 'Determine which organization controls an IP range',
          action: 'Look up origin AS and holder information',
        },
        {
          scenario: 'Route Hijacking Detection',
          use: 'Detect unauthorized BGP announcements',
          action: 'Compare current origin AS with expected owner',
        },
        {
          scenario: 'Peering Analysis',
          use: 'Understand network connectivity and peering relationships',
          action: 'Review peer list and geographic distribution',
        },
        {
          scenario: 'Traffic Engineering',
          use: 'Plan route optimization and load balancing',
          action: 'Analyze AS paths and select optimal routes',
        },
      ],
    },
    interpretingResults: {
      title: 'Interpreting Results',
      elements: [
        {
          element: 'Origin AS',
          description: 'The AS that owns and announces the prefix',
          example: 'AS15169 (Google LLC)',
        },
        {
          element: 'AS Path',
          description: 'Complete path from your perspective to origin',
          example: '3356 2914 15169',
        },
        {
          element: 'Prefix',
          description: 'The specific IP range being announced',
          example: '8.8.8.0/24',
        },
        {
          element: 'Peers',
          description: 'Neighboring ASes that exchange routes',
          example: 'AS174, AS3257, AS1299',
        },
      ],
    },
    commonIssues: {
      title: 'Common BGP Issues',
      issues: [
        {
          issue: 'Route Hijacking',
          description: 'Unauthorized announcement of IP prefixes',
          impact: 'Traffic misdirection, security risks',
          detection: 'Origin AS mismatch with known owner',
        },
        {
          issue: 'Route Leaks',
          description: 'Incorrect propagation of routes to peers',
          impact: 'Suboptimal routing, potential traffic blackholing',
          detection: 'Unexpected AS in path, unusually long paths',
        },
        {
          issue: 'Prefix Deaggregation',
          description: 'Announcing many small prefixes instead of aggregated block',
          impact: 'Routing table bloat, increased memory/CPU usage',
          detection: 'Many more-specific prefixes within an allocation',
        },
        {
          issue: 'AS Path Prepending Abuse',
          description: 'Excessive AS repetition for traffic engineering',
          impact: 'Routing instability, suboptimal paths',
          detection: 'Same ASN repeated many times in path',
        },
      ],
    },
    bestPractices: {
      title: 'BGP Best Practices',
      practices: [
        {
          practice: 'Verify RPKI ROAs',
          description: 'Check Resource Public Key Infrastructure Route Origin Authorizations',
          reason: 'Prevents route hijacking and validates origin AS',
        },
        {
          practice: 'Monitor Route Changes',
          description: 'Track BGP announcements for your prefixes',
          reason: 'Detect hijacking attempts and misconfigurations quickly',
        },
        {
          practice: 'Use BGP Communities',
          description: 'Tag routes with metadata for traffic engineering',
          reason: 'Enables fine-grained control over route propagation',
        },
        {
          practice: 'Implement Prefix Filtering',
          description: 'Filter invalid or suspicious route announcements',
          reason: 'Protects against bogons, private IPs, and hijacks',
        },
        {
          practice: 'Document Your AS Policies',
          description: 'Maintain clear routing and peering policies',
          reason: 'Helps peers understand your routing intentions',
        },
      ],
    },
    dataSource: {
      title: 'About RIPE RIS',
      content:
        "This tool uses RIPE NCC's Routing Information Service (RIS), which collects and stores Internet routing data from multiple locations worldwide. RIS provides valuable insight into the global routing system.",
      features: [
        'Real-time BGP data collection from route collectors worldwide',
        'Historical routing data for trend analysis',
        'AS-level connectivity and peering information',
        'Prefix announcement monitoring',
        'Looking glass functionality for path visibility',
      ],
    },
  },
  quickTips: [
    'More specific prefixes (longer subnet masks) take precedence over less specific ones',
    'AS paths show the route from observer to origin, not your local path',
    'Multiple prefixes for an IP may indicate deaggregation or anycast',
    'Compare origin AS with WHOIS data to verify legitimate ownership',
    'Route changes can take minutes to propagate globally',
    'Private ASNs (64512-65535) should never appear in the global routing table',
    'Unusually long AS paths may indicate route leaks or suboptimal routing',
  ],
};
