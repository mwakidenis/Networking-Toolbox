export const linkLocalApipaContent = {
  title: 'Link-Local & APIPA Addresses',
  description:
    'Quick guide to IPv4 APIPA (169.254/16) and IPv6 link-local (fe80::/10) addresses - when they appear and what they mean.',

  sections: {
    overview: {
      title: 'What are Link-Local Addresses?',
      content: `Link-local addresses are special IP addresses that only work on the local network segment. They're automatically assigned when normal IP configuration fails or isn't available.

These addresses allow basic network communication even when DHCP servers are down or network configuration is missing.`,
    },
  },

  apipa: {
    title: 'IPv4 APIPA (Automatic Private IP Addressing)',
    range: '169.254.0.0/16',
    fullRange: '169.254.0.1 to 169.254.255.254',
    usableRange: '169.254.1.0 to 169.254.254.255',
    reservedAddresses: ['169.254.0.0', '169.254.255.255', '169.254.0.x', '169.254.255.x'],

    description: 'APIPA addresses are automatically assigned by Windows, macOS, and Linux when DHCP fails',

    whenUsed: [
      'DHCP server is unreachable or down',
      'Network cable unplugged then reconnected',
      "DHCP lease expires and can't be renewed",
      'Static IP conflicts with another device',
      'Network interface enabled without configuration',
    ],

    howItWorks: [
      'Device requests IP address from DHCP server',
      'No DHCP response received after multiple attempts',
      'Device randomly selects address in 169.254.x.x range',
      'Device sends ARP probe to check if address is already used',
      'If no conflict, device assigns itself the address',
      'Device continues trying to find DHCP server periodically',
    ],

    characteristics: [
      'Only works on local network segment (not routed)',
      'Subnet mask is always 255.255.0.0 (/16)',
      'No default gateway assigned',
      'Cannot reach internet or other subnets',
      'Devices can communicate with other APIPA devices',
    ],

    troubleshooting: [
      {
        symptom: 'Computer has 169.254.x.x address',
        meaning: 'DHCP assignment failed',
        solution: 'Check DHCP server, network cables, switch ports',
      },
      {
        symptom: "Can't access internet with APIPA",
        meaning: 'APIPA addresses are not routed',
        solution: 'Fix DHCP server or configure static IP',
      },
      {
        symptom: "Some devices have APIPA, others don't",
        meaning: 'Inconsistent DHCP server response',
        solution: 'Check DHCP server capacity and network connectivity',
      },
    ],
  },

  ipv6LinkLocal: {
    title: 'IPv6 Link-Local Addresses',
    range: 'fe80::/10',
    fullRange: 'fe80:: to febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
    commonFormat: 'fe80::xxxx:xxxx:xxxx:xxxx',

    description: 'Every IPv6-enabled interface automatically gets a link-local address',

    formation: [
      'Start with fe80::/64 prefix',
      'Interface identifier from MAC address (EUI-64) or random',
      'Example: MAC 00:1a:2b:3c:4d:5e becomes fe80::21a:2bff:fe3c:4d5e',
      'Modified EUI-64: flip universal/local bit, insert fffe',
    ],

    whenUsed: [
      'Neighbor Discovery Protocol (NDP)',
      'Router Solicitation and Advertisement',
      'Initial IPv6 communication before global addresses',
      'DHCPv6 communication',
      'Network troubleshooting and diagnostics',
      'Always present on IPv6 interfaces',
    ],

    characteristics: [
      'Automatically assigned to every IPv6 interface',
      'Only valid on local network segment',
      'Cannot be routed beyond local link',
      'Required for IPv6 to function properly',
      'Used for Neighbor Discovery Protocol',
      'Subnet prefix is always /64',
    ],

    types: [
      {
        type: 'EUI-64 Based',
        description: 'Derived from MAC address using EUI-64 process',
        example: 'fe80::21a:2bff:fe3c:4d5e',
        privacy: 'Reveals MAC address - privacy concerns',
      },
      {
        type: 'Random',
        description: 'Randomly generated interface identifier',
        example: 'fe80::a1b2:c3d4:e5f6:7890',
        privacy: "Better privacy, doesn't reveal MAC",
      },
      {
        type: 'Manual',
        description: 'Administratively configured',
        example: 'fe80::1',
        privacy: 'Often used for routers and servers',
      },
    ],
  },

  comparison: [
    {
      aspect: 'Address Range',
      ipv4: '169.254.0.0/16',
      ipv6: 'fe80::/10 (commonly fe80::/64)',
    },
    {
      aspect: 'Assignment Method',
      ipv4: 'Random selection with conflict detection',
      ipv6: 'Automatic from interface MAC or random',
    },
    {
      aspect: 'When Assigned',
      ipv4: 'Only when DHCP fails',
      ipv6: 'Always assigned to every interface',
    },
    {
      aspect: 'Scope',
      ipv4: 'Local subnet only',
      ipv6: 'Local link only',
    },
    {
      aspect: 'Internet Access',
      ipv4: 'No (requires NAT/gateway)',
      ipv6: 'No (link-local only)',
    },
    {
      aspect: 'Protocol Integration',
      ipv4: 'Fallback mechanism',
      ipv6: 'Essential for IPv6 operation',
    },
  ],

  practicalExamples: [
    {
      scenario: 'DHCP Server Down',
      ipv4Behavior: 'Devices get 169.254.x.x addresses, can communicate locally',
      ipv6Behavior: 'Devices keep fe80:: addresses, IPv6 still works locally',
      impact: 'Local communication possible, internet access lost',
    },
    {
      scenario: 'Network Isolation Testing',
      ipv4Behavior: 'Create isolated network with APIPA addresses',
      ipv6Behavior: 'Devices automatically have link-local connectivity',
      impact: 'Useful for testing without full network configuration',
    },
    {
      scenario: 'Router Configuration',
      ipv4Behavior: "APIPA doesn't help with router access",
      ipv6Behavior: 'Can access router via its fe80:: address',
      impact: 'IPv6 provides better administrative access options',
    },
  ],

  troubleshootingCommands: [
    {
      purpose: 'View APIPA/Link-Local Addresses',
      windows: 'ipconfig /all',
      linux: 'ip addr show',
      macOS: 'ifconfig',
    },
    {
      purpose: 'Test Link-Local Connectivity',
      windows: 'ping 169.254.x.x or ping fe80::x%interface',
      linux: 'ping 169.254.x.x or ping6 fe80::x%eth0',
      macOS: 'ping 169.254.x.x or ping6 fe80::x%en0',
    },
    {
      purpose: 'Force DHCP Renewal',
      windows: 'ipconfig /release && ipconfig /renew',
      linux: 'dhclient -r && dhclient',
      macOS: 'sudo ipconfig set en0 DHCP',
    },
    {
      purpose: 'View IPv6 Link-Local',
      windows: 'netsh interface ipv6 show addresses',
      linux: 'ip -6 addr show scope link',
      macOS: 'ifconfig | grep fe80',
    },
  ],

  bestPractices: [
    "Don't block link-local addresses in firewalls",
    'Monitor for widespread APIPA addresses (indicates DHCP issues)',
    'Use link-local addresses for IPv6 router access',
    'Understand that APIPA indicates network configuration problems',
    'Test connectivity using link-local addresses for troubleshooting',
    'Document link-local addresses of critical infrastructure',
  ],

  commonMistakes: [
    'Thinking APIPA addresses provide internet access',
    'Blocking fe80::/10 addresses in IPv6 firewalls',
    'Not recognizing APIPA as a symptom of DHCP failure',
    'Trying to route link-local addresses between subnets',
    'Forgetting to specify interface when pinging IPv6 link-local',
    'Assuming IPv6 is broken when only seeing link-local addresses',
  ],

  quickReference: {
    recognition: [
      '169.254.x.x = IPv4 APIPA (DHCP failed)',
      'fe80::x = IPv6 link-local (normal and required)',
      'APIPA = problem to fix, Link-local = normal operation',
    ],

    troubleshooting: [
      'APIPA present? Check DHCP server and connectivity',
      'Can ping link-local? Network layer is working',
      'IPv6 link-local missing? IPv6 is disabled or broken',
      'Multiple APIPA devices? They can communicate locally',
    ],
  },

  whenToWorry: [
    {
      situation: 'Single device has APIPA',
      concern: 'Low - likely local network issue',
      action: 'Check cable, switch port, DHCP reservation',
    },
    {
      situation: 'Multiple devices have APIPA',
      concern: 'High - DHCP server or network problem',
      action: 'Check DHCP server status, network infrastructure',
    },
    {
      situation: 'No IPv6 link-local addresses',
      concern: 'High - IPv6 disabled or seriously broken',
      action: 'Check IPv6 configuration, driver issues',
    },
    {
      situation: "Can't ping IPv6 link-local",
      concern: 'Medium - local IPv6 connectivity issue',
      action: 'Check firewall, interface status, addressing',
    },
  ],
};
