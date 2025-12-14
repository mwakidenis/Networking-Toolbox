export const icmpContent = {
  title: 'ICMP & ICMPv6: Common Types',
  description:
    "Practical guide to ICMP and ICMPv6 message types and codes you'll encounter in real network troubleshooting.",

  sections: {
    overview: {
      title: 'What is ICMP?',
      content: `ICMP (Internet Control Message Protocol) is used by network devices to send error messages and operational information. It's not used for data transfer, but rather for network diagnostics and error reporting.

ICMPv6 serves the same purpose for IPv6 networks, but also handles additional functions like Neighbor Discovery that ARP handles in IPv4.`,
    },
  },

  icmpv4Types: [
    {
      type: 0,
      name: 'Echo Reply',
      description: 'Response to ping request',
      commonUse: 'Ping response - confirms host is reachable',
      example: 'When you ping 8.8.8.8 and get a response back',
      troubleshooting: 'No reply = host down, filtered, or network issue',
    },
    {
      type: 3,
      name: 'Destination Unreachable',
      description: 'Cannot reach the destination',
      commonUse: 'Various network connectivity problems',
      example: 'Host unreachable, port unreachable, network unreachable',
      troubleshooting: 'Check routing, firewall rules, and destination status',
      codes: [
        { code: 0, meaning: 'Network Unreachable' },
        { code: 1, meaning: 'Host Unreachable' },
        { code: 2, meaning: 'Protocol Unreachable' },
        { code: 3, meaning: 'Port Unreachable' },
        { code: 4, meaning: 'Fragmentation Needed (MTU)' },
        { code: 13, meaning: 'Communication Prohibited (Firewall)' },
      ],
    },
    {
      type: 5,
      name: 'Redirect',
      description: 'Suggests better route to destination',
      commonUse: 'Router tells host about better path',
      example: 'Default gateway redirects to more specific router',
      troubleshooting: 'Often disabled for security reasons',
    },
    {
      type: 8,
      name: 'Echo Request',
      description: 'Ping request message',
      commonUse: 'Testing connectivity with ping command',
      example: 'ping 192.168.1.1 sends ICMP type 8',
      troubleshooting: 'Most common diagnostic tool for connectivity',
    },
    {
      type: 11,
      name: 'Time Exceeded',
      description: 'TTL expired or fragment reassembly timeout',
      commonUse: 'Traceroute functionality and loop detection',
      example: 'Each hop in traceroute sends Time Exceeded',
      troubleshooting: 'Indicates routing loops or excessive hop counts',
      codes: [
        { code: 0, meaning: 'TTL Expired in Transit' },
        { code: 1, meaning: 'Fragment Reassembly Time Exceeded' },
      ],
    },
    {
      type: 12,
      name: 'Parameter Problem',
      description: 'Invalid IP header or required option missing',
      commonUse: 'Malformed packets or unsupported options',
      example: 'Bad IP header length or unknown IP option',
      troubleshooting: 'Usually indicates software bugs or attacks',
    },
  ],

  icmpv6Types: [
    {
      type: 1,
      name: 'Destination Unreachable',
      description: 'Cannot reach IPv6 destination',
      commonUse: 'IPv6 connectivity problems',
      example: 'No route to destination, port unreachable',
      troubleshooting: 'Similar to ICMPv4 type 3',
      codes: [
        { code: 0, meaning: 'No Route to Destination' },
        { code: 1, meaning: 'Communication Prohibited' },
        { code: 3, meaning: 'Address Unreachable' },
        { code: 4, meaning: 'Port Unreachable' },
      ],
    },
    {
      type: 2,
      name: 'Packet Too Big',
      description: 'Packet exceeds link MTU',
      commonUse: 'Path MTU discovery for IPv6',
      example: "Router can't forward large packet",
      troubleshooting: 'Check MTU settings along path',
    },
    {
      type: 3,
      name: 'Time Exceeded',
      description: 'Hop limit exceeded',
      commonUse: 'IPv6 traceroute and loop detection',
      example: 'IPv6 equivalent of ICMPv4 type 11',
      troubleshooting: 'Routing loops or too many hops',
    },
    {
      type: 128,
      name: 'Echo Request',
      description: 'IPv6 ping request',
      commonUse: 'Testing IPv6 connectivity',
      example: 'ping6 2001:db8::1',
      troubleshooting: 'Primary IPv6 connectivity test',
    },
    {
      type: 129,
      name: 'Echo Reply',
      description: 'IPv6 ping response',
      commonUse: 'Response to IPv6 ping',
      example: 'Confirms IPv6 host is reachable',
      troubleshooting: 'No reply indicates IPv6 connectivity issues',
    },
    {
      type: 133,
      name: 'Router Solicitation (RS)',
      description: 'Request for router advertisements',
      commonUse: 'Host discovering IPv6 routers',
      example: 'New host joining IPv6 network',
      troubleshooting: 'Part of IPv6 address autoconfiguration',
    },
    {
      type: 134,
      name: 'Router Advertisement (RA)',
      description: 'Router announcing its presence and prefixes',
      commonUse: 'IPv6 address autoconfiguration',
      example: 'Router tells hosts about available prefixes',
      troubleshooting: 'Critical for SLAAC and IPv6 operation',
    },
    {
      type: 135,
      name: 'Neighbor Solicitation (NS)',
      description: 'IPv6 equivalent of ARP request',
      commonUse: 'Finding MAC address for IPv6 address',
      example: 'Resolving link-layer address',
      troubleshooting: 'Part of Neighbor Discovery Protocol',
    },
    {
      type: 136,
      name: 'Neighbor Advertisement (NA)',
      description: 'IPv6 equivalent of ARP reply',
      commonUse: 'Responding with MAC address',
      example: 'Response to Neighbor Solicitation',
      troubleshooting: 'Confirms neighbor reachability',
    },
  ],

  practicalExamples: [
    {
      scenario: 'Ping Not Working',
      icmpTypes: ['Type 8 (Echo Request)', 'Type 0 (Echo Reply)'],
      whatToCheck: [
        'Is ICMP type 8 being sent?',
        'Is ICMP type 0 coming back?',
        'Are firewalls blocking ICMP?',
        'Check destination host status',
      ],
      commonCauses: ['Firewall blocking ICMP', 'Host down', 'Network congestion'],
    },
    {
      scenario: 'Traceroute Shows * * *',
      icmpTypes: ['Type 11 (Time Exceeded)'],
      whatToCheck: [
        'Are routers sending Time Exceeded?',
        'Firewall blocking ICMP type 11?',
        'Router configured to not send ICMP?',
      ],
      commonCauses: ['ICMP rate limiting', 'Security policy', 'Router misconfiguration'],
    },
    {
      scenario: "Large Files Won't Transfer",
      icmpTypes: ['Type 3 Code 4 (Fragmentation Needed)', 'ICMPv6 Type 2 (Packet Too Big)'],
      whatToCheck: ['Path MTU discovery working?', 'ICMP being filtered by firewall?', 'MSS clamping configured?'],
      commonCauses: ['Firewall blocking ICMP', 'MTU mismatch', 'Fragmentation issues'],
    },
    {
      scenario: 'IPv6 Address Not Working',
      icmpTypes: ['Type 135/136 (Neighbor Discovery)', 'Type 133/134 (Router Discovery)'],
      whatToCheck: ['Router Advertisements being sent?', 'Neighbor Discovery working?', 'IPv6 enabled on all devices?'],
      commonCauses: ['No IPv6 router', 'NDP filtering', 'IPv6 disabled'],
    },
  ],

  filteringIssues: [
    {
      issue: 'Firewall Blocks All ICMP',
      problem: 'Breaks ping, traceroute, and Path MTU Discovery',
      solution: 'Allow specific ICMP types (0, 3, 8, 11) instead of blocking all',
      recommendation: 'Never block ICMP types 3 and 11 completely',
    },
    {
      issue: 'Router Drops ICMP Due to Rate Limiting',
      problem: 'Intermittent ping/traceroute failures',
      solution: 'Adjust ICMP rate limiting thresholds',
      recommendation: 'Configure reasonable rate limits, not zero',
    },
    {
      issue: 'IPv6 NDP Messages Filtered',
      problem: 'IPv6 connectivity completely broken',
      solution: 'Allow ICMPv6 types 133-137 on local network',
      recommendation: 'Critical for IPv6 operation - never filter on LAN',
    },
  ],

  bestPractices: [
    'Allow ICMP types 0, 3, 8, 11 through firewalls',
    'For IPv6, allow ICMPv6 types 1, 2, 3, 128, 129, 133-137',
    'Use ICMP rate limiting instead of complete blocking',
    'Monitor ICMP traffic for network health',
    "Don't filter ICMP on internal networks",
    'Log ICMP messages for troubleshooting purposes',
  ],

  troubleshootingCommands: [
    {
      command: 'ping 8.8.8.8',
      purpose: 'Test IPv4 connectivity with ICMP Echo',
      icmpType: 'Type 8 (request) and Type 0 (reply)',
    },
    {
      command: 'ping6 2001:db8::1',
      purpose: 'Test IPv6 connectivity',
      icmpType: 'Type 128 (request) and Type 129 (reply)',
    },
    {
      command: 'traceroute 8.8.8.8',
      purpose: 'Show path using ICMP Time Exceeded',
      icmpType: 'Type 11 (Time Exceeded responses)',
    },
    {
      command: 'traceroute6 ipv6.google.com',
      purpose: 'IPv6 path tracing',
      icmpType: 'Type 3 (Time Exceeded)',
    },
    {
      command: 'tcpdump -i eth0 icmp',
      purpose: 'Capture ICMP traffic for analysis',
      icmpType: 'All ICMP types',
    },
    {
      command: 'wireshark (filter: icmp or icmpv6)',
      purpose: 'Detailed ICMP packet analysis',
      icmpType: 'All ICMP and ICMPv6 types',
    },
  ],

  quickReference: {
    mustAllow: [
      'ICMP Type 0 - Echo Reply (ping responses)',
      'ICMP Type 3 - Destination Unreachable',
      'ICMP Type 8 - Echo Request (ping)',
      'ICMP Type 11 - Time Exceeded (traceroute)',
      'ICMPv6 Type 1 - Destination Unreachable',
      'ICMPv6 Type 2 - Packet Too Big (MTU)',
      'ICMPv6 Type 128/129 - Echo Request/Reply',
      'ICMPv6 Type 133-137 - Neighbor Discovery',
    ],
    neverFilter: [
      'ICMP Type 3 Code 4 (Fragmentation Needed)',
      'ICMPv6 Type 2 (Packet Too Big)',
      'ICMPv6 Types 135/136 (Neighbor Discovery on LAN)',
    ],
  },

  commonMistakes: [
    'Blocking all ICMP types (breaks PMTU discovery)',
    'Filtering ICMPv6 Neighbor Discovery on LANs',
    'Not understanding the difference between ICMP filtering and rate limiting',
    'Blocking ICMP for security without considering operational impact',
    'Forgetting that some applications depend on specific ICMP messages',
  ],
};
