export const multicastContent = {
  title: 'IPv4 & IPv6 Multicast Basics',
  description: 'Understanding multicast addressing, scopes, well-known groups, and local subnet limitations.',

  sections: {
    overview: {
      title: 'What is Multicast?',
      content: `Multicast allows one sender to transmit data to multiple receivers simultaneously. Unlike broadcast (everyone) or unicast (one specific recipient), multicast sends to a specific group of interested receivers.

This is more efficient than sending individual unicast packets to each recipient, especially for streaming media, software updates, or real-time communications.`,
    },
  },

  ipv4Multicast: {
    title: 'IPv4 Multicast',
    range: '224.0.0.0/4 (224.0.0.0 to 239.255.255.255)',

    classes: [
      {
        range: '224.0.0.0/24',
        name: 'Local Network Control Block',
        description: 'Well-known multicast addresses for protocols',
        scope: 'Local subnet only',
        examples: [
          '224.0.0.1 - All Systems',
          '224.0.0.2 - All Routers',
          '224.0.0.5 - OSPF All SPF Routers',
          '224.0.0.6 - OSPF All DR Routers',
          '224.0.0.9 - RIP Version 2',
          '224.0.0.22 - IGMP',
          '224.0.0.251 - mDNS',
          '224.0.0.252 - LLMNR',
        ],
      },
      {
        range: '224.0.1.0/24',
        name: 'Internetwork Control Block',
        description: 'Internet-wide control protocols',
        scope: 'Global',
        examples: ['224.0.1.1 - NTP', '224.0.1.60 - DHCP Server/Relay'],
      },
      {
        range: '224.1.0.0 to 224.1.255.255',
        name: 'AD-HOC Block I',
        description: 'Transient use for applications',
        scope: 'Variable',
        examples: ['Application-specific addresses'],
      },
      {
        range: '224.2.0.0 to 224.2.255.255',
        name: 'SDP/SAP Block',
        description: 'Session Directory Protocol',
        scope: 'Global',
        examples: ['Session announcements'],
      },
      {
        range: '239.0.0.0/8',
        name: 'Organization Local Scope',
        description: 'Private multicast addresses',
        scope: 'Organization-wide',
        examples: ['Private applications, enterprise use'],
      },
    ],
  },

  ipv6Multicast: {
    title: 'IPv6 Multicast',
    range: 'ff00::/8 (all addresses starting with ff)',

    structure: {
      format: 'ff[flags][scope]::/16',
      flags: [
        { bit: '0', meaning: 'Reserved (always 0)' },
        { bit: '0', meaning: 'Reserved (always 0)' },
        { bit: '0', meaning: 'Reserved (always 0)' },
        { bit: 'T', meaning: '0=Permanent, 1=Temporary' },
      ],
      scopes: [
        { code: '0', name: 'Reserved' },
        { code: '1', name: 'Interface-Local' },
        { code: '2', name: 'Link-Local' },
        { code: '3', name: 'Reserved' },
        { code: '4', name: 'Admin-Local' },
        { code: '5', name: 'Site-Local' },
        { code: '8', name: 'Organization-Local' },
        { code: 'e', name: 'Global' },
      ],
    },

    wellKnown: [
      {
        address: 'ff01::1',
        name: 'All Nodes (Interface-Local)',
        description: 'All nodes on the same interface',
      },
      {
        address: 'ff02::1',
        name: 'All Nodes (Link-Local)',
        description: 'All nodes on the local network segment',
      },
      {
        address: 'ff02::2',
        name: 'All Routers (Link-Local)',
        description: 'All routers on the local network segment',
      },
      {
        address: 'ff02::5',
        name: 'OSPFv3 All SPF Routers',
        description: 'All OSPF routers',
      },
      {
        address: 'ff02::6',
        name: 'OSPFv3 All DR Routers',
        description: 'OSPF designated routers',
      },
      {
        address: 'ff02::9',
        name: 'RIPng Routers',
        description: 'RIP next generation routers',
      },
      {
        address: 'ff02::fb',
        name: 'mDNSv6',
        description: 'Multicast DNS over IPv6',
      },
      {
        address: 'ff05::2',
        name: 'All Routers (Site-Local)',
        description: 'All routers within the site',
      },
    ],
  },

  limitations: [
    {
      title: 'Local Subnet Only Caveat',
      description: 'Many multicast addresses are designed for local subnet use only',
      details: [
        "224.0.0.x addresses don't cross router boundaries by default",
        'ff02:: addresses are link-local scope in IPv6',
        'Routers need multicast routing (PIM, IGMP) to forward between subnets',
        'Without multicast routing, traffic stays on the local segment',
        'This is intentional for protocol efficiency and security',
      ],
    },
    {
      title: 'IGMP/MLD Requirements',
      description: 'Devices must signal interest in multicast groups',
      details: [
        'IGMP (IPv4) or MLD (IPv6) tells routers which groups are wanted',
        'Without IGMP/MLD, routers may drop multicast traffic',
        'Switches need IGMP snooping to avoid flooding',
        'Managed switches should have multicast features enabled',
      ],
    },
    {
      title: 'Firewall Considerations',
      description: 'Firewalls often block multicast by default',
      details: [
        'Corporate firewalls frequently block multicast ranges',
        'Home routers may not forward multicast between VLANs',
        "VPN tunnels typically don't carry multicast traffic",
        "Cloud environments often don't support multicast",
      ],
    },
  ],

  commonProtocols: [
    {
      protocol: 'OSPF',
      ipv4: '224.0.0.5, 224.0.0.6',
      ipv6: 'ff02::5, ff02::6',
      purpose: 'Routing protocol communication',
    },
    { protocol: 'RIP', ipv4: '224.0.0.9', ipv6: 'ff02::9', purpose: 'Routing updates' },
    { protocol: 'DHCP', ipv4: '224.0.0.252', ipv6: 'ff02::1:2', purpose: 'Configuration relay' },
    { protocol: 'mDNS', ipv4: '224.0.0.251', ipv6: 'ff02::fb', purpose: 'Zero-configuration networking' },
    { protocol: 'LLMNR', ipv4: '224.0.0.252', ipv6: 'ff02::1:3', purpose: 'Link-local name resolution' },
    { protocol: 'SSDP', ipv4: '239.255.255.250', ipv6: 'ff0x::c', purpose: 'UPnP device discovery' },
  ],

  troubleshooting: [
    {
      issue: 'Multicast not working across VLANs',
      causes: ['No multicast routing configured', 'IGMP snooping disabled', 'Firewall blocking'],
      solutions: ['Enable PIM on routers', 'Configure IGMP snooping', 'Allow multicast ranges in firewall'],
    },
    {
      issue: 'High multicast traffic flooding network',
      causes: ['No IGMP snooping', 'Switches flooding multicast', 'Rogue applications'],
      solutions: ['Enable IGMP snooping on switches', 'Monitor multicast sources', 'Implement multicast rate limiting'],
    },
    {
      issue: 'Devices not receiving multicast',
      causes: ['Not joined to group', 'IGMP queries not working', 'Wrong scope'],
      solutions: ['Verify group membership', 'Check IGMP querier', 'Use correct multicast scope'],
    },
  ],

  bestPractices: [
    'Use appropriate multicast scopes (link-local vs site-local vs global)',
    'Enable IGMP snooping on managed switches',
    'Configure multicast routing (PIM) only where needed',
    'Monitor multicast traffic to prevent network flooding',
    'Use organization-local ranges (239.x.x.x) for private applications',
    'Test multicast applications in isolated environments first',
    'Document multicast group assignments to avoid conflicts',
  ],

  quickReference: {
    ipv4: [
      '224.0.0.1 - All systems on subnet',
      '224.0.0.2 - All routers on subnet',
      '239.x.x.x - Private/organization use',
    ],
    ipv6: ['ff02::1 - All nodes on link', 'ff02::2 - All routers on link', 'ff0x::... - Various scopes (x = scope)'],
  },
};
