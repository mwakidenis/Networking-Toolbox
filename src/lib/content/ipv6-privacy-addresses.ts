export const ipv6PrivacyContent = {
  title: 'IPv6 Privacy Addresses (RFC 4941/8981)',
  description:
    'SLAAC privacy extensions: temporary vs stable interface identifiers, how they protect privacy, and configuration guidance.',

  sections: {
    overview: {
      title: 'What are IPv6 Privacy Addresses?',
      content: `IPv6 privacy addresses (temporary addresses) are automatically generated to prevent tracking based on stable interface identifiers. They're created alongside stable addresses and change periodically.

Without privacy extensions, devices use predictable interface identifiers (often based on MAC addresses), making them trackable across networks.`,
    },

    problem: {
      title: 'The Privacy Problem',
      content: `Standard IPv6 addresses often contain predictable interface identifiers that remain constant across different networks, creating privacy concerns similar to a permanent device fingerprint.`,
    },
  },

  addressTypes: [
    {
      type: 'Stable Address (Standard SLAAC)',
      formation: 'Prefix + EUI-64 or configured interface ID',
      example: '2001:db8:1234:5678:21a:2bff:fe3c:4d5e',
      characteristics: [
        'Interface identifier stays the same across networks',
        'Often derived from MAC address using EUI-64',
        'Predictable and trackable across network changes',
        'Required for some services that need consistent addressing',
      ],
      privacy: 'Poor - enables tracking across networks',
    },
    {
      type: 'Temporary Address (Privacy Extension)',
      formation: 'Prefix + cryptographically generated random bits',
      example: '2001:db8:1234:5678:a1b2:c3d4:e5f6:7890',
      characteristics: [
        'Randomly generated interface identifier',
        'Changes periodically (daily by default)',
        'Multiple temporary addresses can coexist',
        'Used for outbound connections by default',
      ],
      privacy: 'Good - prevents cross-network tracking',
    },
    {
      type: 'Stable Private Address (RFC 7217)',
      formation: 'Prefix + hash of secret key + network info',
      example: '2001:db8:1234:5678:9abc:def0:1234:5678',
      characteristics: [
        'Stable within the same network',
        'Changes when moving to different networks',
        'More predictable than temporary addresses',
        'Good balance of privacy and stability',
      ],
      privacy: 'Better - network-specific but stable',
    },
  ],

  howItWorks: {
    title: 'How Privacy Extensions Work',

    addressGeneration: [
      'Device receives Router Advertisement with prefix',
      'Creates stable address using EUI-64 or configured method',
      'Generates temporary address using cryptographic random bits',
      'Both addresses are assigned to the same interface',
      'Temporary address preferred for outbound connections',
    ],

    temporaryLifecycle: [
      'New temporary address generated periodically',
      'Old temporary addresses remain valid until expiry',
      'Multiple temporary addresses can coexist',
      'Addresses have preferred and valid lifetimes',
      'Deprecated addresses still accept incoming traffic',
    ],

    defaultBehavior: [
      'Outbound connections use temporary addresses',
      'Inbound services use stable addresses',
      'Applications can request specific address types',
      'Operating system manages address selection automatically',
    ],
  },

  lifetimes: {
    title: 'Address Lifetimes',

    preferredLifetime: {
      description: 'How long address is preferred for new connections',
      typical: '1 day (86400 seconds)',
      behavior: 'After expiry, address can receive but not initiate connections',
    },

    validLifetime: {
      description: 'How long address remains usable',
      typical: '7 days (604800 seconds)',
      behavior: 'After expiry, address is completely removed',
    },

    regenerationInterval: {
      description: 'How often new temporary addresses are created',
      typical: '5 minutes to 24 hours',
      behavior: 'New address created before old one expires',
    },

    maxTempAddresses: {
      description: 'Maximum temporary addresses per prefix',
      typical: '5-10 addresses',
      behavior: 'Oldest addresses removed when limit reached',
    },
  },

  osImplementations: {
    title: 'Operating System Support',

    windows: {
      os: 'Windows',
      defaultBehavior: 'Privacy extensions enabled by default (Vista+)',
      configuration: [
        'netsh interface ipv6 set global randomizeidentifiers=enabled',
        'netsh interface ipv6 set privacy state=enabled',
        'Registry: HKLM\\System\\CurrentControlSet\\Services\\Tcpip6\\Parameters',
      ],
      commands: ['netsh interface ipv6 show privacy', 'netsh interface ipv6 show addresses'],
    },

    linux: {
      os: 'Linux',
      defaultBehavior: 'Varies by distribution, often disabled by default',
      configuration: [
        'sysctl net.ipv6.conf.all.use_tempaddr=2',
        'sysctl net.ipv6.conf.default.use_tempaddr=2',
        '/proc/sys/net/ipv6/conf/*/use_tempaddr',
      ],
      values: ['0 = Disabled', '1 = Enabled but prefer stable', '2 = Enabled and prefer temporary'],
      commands: ['ip -6 addr show scope global', 'cat /proc/sys/net/ipv6/conf/eth0/use_tempaddr'],
    },

    macos: {
      os: 'macOS',
      defaultBehavior: 'Privacy extensions enabled by default',
      configuration: [
        'Built into system preferences',
        'networksetup command line tool',
        'System-wide setting affects all interfaces',
      ],
      commands: ['ifconfig | grep inet6', 'networksetup -getinfo Wi-Fi'],
    },

    android: {
      os: 'Android',
      defaultBehavior: 'Privacy extensions enabled by default (Android 8+)',
      configuration: [
        'Settings > Network & Internet > Advanced',
        'Developer options for advanced control',
        'Per-network configuration possible',
      ],
      behavior: 'Randomizes MAC and uses privacy addresses',
    },
  },

  identifyingAddresses: [
    {
      method: 'Interface Identifier Pattern',
      stable: "Often contains 'fffe' in middle (EUI-64) or predictable pattern",
      temporary: 'Random-looking interface identifier',
      example: 'Stable: ::21a:2bff:fe3c:4d5e vs Temporary: ::a1b2:c3d4:e5f6:7890',
    },
    {
      method: 'Address Consistency',
      stable: 'Same interface ID across different network prefixes',
      temporary: 'Different interface ID on each network',
      example: 'Device keeps same ::21a:2bff:fe3c:4d5e on all networks vs random on each',
    },
    {
      method: 'Command Output',
      stable: "Often labeled as 'permanent' or primary",
      temporary: "Labeled as 'temporary' or 'deprecated'",
      example: "Linux ip command shows 'temporary' flag",
    },
  ],

  troubleshooting: [
    {
      issue: 'Privacy addresses not working',
      symptoms: ['Same IPv6 address on different networks', 'Tracking concerns'],
      diagnosis: 'Check OS privacy extension settings',
      solutions: [
        'Enable privacy extensions in OS settings',
        'Verify router supports SLAAC',
        'Check for disabled IPv6 privacy in network manager',
      ],
    },
    {
      issue: 'Too many IPv6 addresses',
      symptoms: ['Multiple IPv6 addresses per interface', 'Address list constantly changing'],
      diagnosis: 'Privacy extensions working normally',
      solutions: [
        'This is normal behavior for privacy extensions',
        'Adjust regeneration timers if needed',
        'Reduce max temporary addresses if causing issues',
      ],
    },
    {
      issue: 'Applications using wrong address',
      symptoms: ['Server not reachable', 'Unexpected source addresses'],
      diagnosis: 'Address selection preference issues',
      solutions: [
        'Configure application to bind specific addresses',
        'Adjust address selection policy',
        'Use stable addresses for server applications',
      ],
    },
    {
      issue: 'Privacy addresses not preferred',
      symptoms: ['Always using stable addresses for outbound'],
      diagnosis: 'Address selection policy favoring stable addresses',
      solutions: [
        'Configure temporary address preference',
        'Check application-specific settings',
        'Verify privacy extension configuration',
      ],
    },
  ],

  securityConsiderations: [
    {
      aspect: 'Privacy Protection',
      benefits: [
        'Prevents device tracking across networks',
        'Makes traffic analysis more difficult',
        'Reduces correlation of activities',
        'Protects against location tracking',
      ],
      limitations: [
        'Application-layer tracking still possible',
        'DNS queries may reveal information',
        'Stable addresses still exposed for services',
        'Requires proper application configuration',
      ],
    },
    {
      aspect: 'Network Management',
      benefits: [
        'Devices harder to target maliciously',
        'Reduces effectiveness of IP-based blocking',
        'Makes reconnaissance more difficult',
      ],
      challenges: [
        'Harder to whitelist specific devices',
        'Complicates network troubleshooting',
        'May interfere with IP-based access control',
        'Requires different monitoring approaches',
      ],
    },
  ],

  bestPractices: [
    'Enable privacy extensions on client devices',
    'Use stable addresses only for servers and infrastructure',
    'Configure appropriate regeneration intervals',
    'Monitor for privacy extension support in applications',
    'Balance privacy with network management needs',
    'Document which services require stable addressing',
    'Test applications with privacy addresses enabled',
    'Consider RFC 7217 stable privacy addresses for better balance',
  ],

  whenToUse: [
    {
      scenario: 'Client Devices',
      recommendation: 'Enable privacy extensions',
      reasoning: 'Protects user privacy without impacting functionality',
      configuration: 'Prefer temporary addresses for outbound connections',
    },
    {
      scenario: 'Servers',
      recommendation: 'Use stable addresses',
      reasoning: 'Consistent addressing needed for services',
      configuration: 'Disable privacy extensions or use stable addresses only',
    },
    {
      scenario: 'IoT Devices',
      recommendation: 'Consider device requirements',
      reasoning: 'Balance privacy with device management needs',
      configuration: 'May need stable addresses for remote management',
    },
    {
      scenario: 'Enterprise Networks',
      recommendation: 'Policy-based approach',
      reasoning: 'Different requirements for different device types',
      configuration: 'Client devices: privacy on, servers: stable addresses',
    },
  ],

  commonMistakes: [
    'Assuming all IPv6 addresses are permanent',
    'Not testing applications with privacy addresses',
    'Blocking temporary addresses in firewalls',
    'Using temporary addresses for server services',
    'Not understanding address selection preferences',
    'Confusing temporary addresses with link-local addresses',
    'Expecting consistent addressing with privacy extensions enabled',
  ],

  quickReference: {
    addressTypes: [
      'Stable: Same interface ID everywhere (trackable)',
      'Temporary: Random interface ID, changes periodically (private)',
      'Stable Privacy (7217): Stable per-network, changes between networks',
    ],

    identification: [
      'EUI-64 pattern (fffe in middle) = stable address',
      'Random-looking interface ID = temporary address',
      'Multiple addresses per interface = privacy extensions active',
    ],

    configuration: [
      'Windows: netsh interface ipv6 set privacy state=enabled',
      'Linux: sysctl net.ipv6.conf.all.use_tempaddr=2',
      'macOS: System Preferences > Network > Advanced',
    ],

    troubleshooting: [
      'Multiple IPv6 addresses = normal with privacy extensions',
      'Same address everywhere = privacy extensions disabled',
      'Services unreachable = check stable address binding',
    ],
  },

  tools: [
    { tool: 'ip -6 addr show', purpose: 'Show all IPv6 addresses with flags (Linux)' },
    { tool: 'ipconfig /all', purpose: 'Display IPv6 addresses and configuration (Windows)' },
    { tool: 'ifconfig', purpose: 'Show network interfaces and addresses (Unix/macOS)' },
    { tool: 'netsh interface ipv6 show addresses', purpose: 'Detailed IPv6 address info (Windows)' },
    { tool: 'sysctl net.ipv6.conf.all.use_tempaddr', purpose: 'Check privacy extension status (Linux)' },
  ],
};
