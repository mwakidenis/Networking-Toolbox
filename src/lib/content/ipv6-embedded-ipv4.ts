export const ipv6EmbeddedIPv4Content = {
  title: 'IPv4 in IPv6',
  description: 'IPv4-mapped addresses, 6to4, Teredo, and other IPv4-in-IPv6 transition mechanisms.',

  sections: {
    overview: {
      title: 'Why IPv4-in-IPv6?',
      content: `During the transition from IPv4 to IPv6, several mechanisms were created to embed or reference IPv4 addresses within IPv6 addresses. These help with compatibility, tunneling, and gradual migration.

Most of these are legacy mechanisms, but you'll still encounter them in network troubleshooting and configuration.`,
    },
  },

  mechanisms: [
    {
      name: 'IPv4-Mapped IPv6 Addresses',
      prefix: '::ffff:0:0/96',
      fullPrefix: '0000:0000:0000:0000:0000:ffff:0000:0000/96',
      status: 'Active',
      purpose: 'Represent IPv4 addresses in IPv6 format for dual-stack applications',
      format: '::ffff:w.x.y.z or ::ffff:wxyz (hex)',
      examples: [
        '::ffff:192.0.2.1 (maps 192.0.2.1)',
        '::ffff:c000:201 (same as above in hex)',
        '::ffff:127.0.0.1 (maps 127.0.0.1)',
      ],
      usage: [
        'Dual-stack socket programming',
        'Applications that need to handle both IPv4 and IPv6',
        'Internal system representation',
      ],
      notes: 'Still widely used in modern systems for dual-stack compatibility',
    },
    {
      name: 'IPv4-Compatible IPv6 (Deprecated)',
      prefix: '::/96',
      fullPrefix: '0000:0000:0000:0000:0000:0000:0000:0000/96',
      status: 'Deprecated',
      purpose: 'Originally for automatic IPv6 tunneling over IPv4',
      format: '::w.x.y.z',
      examples: ['::192.0.2.1', '::10.0.0.1'],
      usage: ['Automatic tunneling (no longer used)', 'Early IPv6 transition mechanisms'],
      notes: 'Deprecated due to security concerns. Never use in new deployments.',
    },
    {
      name: '6to4',
      prefix: '2002::/16',
      fullPrefix: '2002:0000:0000:0000:0000:0000:0000:0000/16',
      status: 'Deprecated',
      purpose: 'Automatic tunneling of IPv6 over IPv4 internet',
      format: '2002:wxyz::/48 (where wxyz is IPv4 in hex)',
      examples: ['2002:c000:201::/48 (for 192.0.2.1)', '2002:0a00:0001::/48 (for 10.0.0.1)'],
      usage: ['Automatic IPv6 connectivity over IPv4', 'Legacy transition mechanism', '6to4 relay routers'],
      notes: 'Largely deprecated due to reliability issues and NAT incompatibility',
    },
    {
      name: 'Teredo',
      prefix: '2001:0::/32',
      fullPrefix: '2001:0000:0000:0000:0000:0000:0000:0000/32',
      status: 'Legacy',
      purpose: 'IPv6 connectivity through NAT devices',
      format: '2001:0:server:flags:cone:port:client:client',
      examples: ['2001:0:4137:9e76:2847:f613:446a:5dcb', '2001:0:9d38:90d7:0:0:0:0'],
      usage: ['Microsoft Windows IPv6 connectivity', 'NAT traversal for IPv6', 'Peer-to-peer applications'],
      notes: 'Complex encoding includes server, client IPs, ports, and NAT type',
    },
    {
      name: 'ISATAP',
      prefix: 'fe80::/64 or 2001:db8::/32',
      fullPrefix: 'Various prefixes with :0:5efe: infix',
      status: 'Legacy',
      purpose: 'IPv6 over IPv4 intranet tunneling',
      format: 'prefix::5efe:w.x.y.z',
      examples: ['fe80::5efe:192.0.2.1', '2001:db8:1:1::5efe:10.0.0.1'],
      usage: ['Enterprise intranet IPv6 deployment', 'Windows automatic tunneling', 'Site-local IPv6 over IPv4'],
      notes: 'Uses special infix :0:5efe: followed by IPv4 address',
    },
    {
      name: '6rd (IPv6 Rapid Deployment)',
      prefix: 'Variable',
      fullPrefix: 'ISP-specific prefix',
      status: 'Limited Use',
      purpose: 'ISP-provided IPv6 over existing IPv4 infrastructure',
      format: 'ISP-prefix:encoded-ipv4::/suffix-length',
      examples: ['2001:db8:c0a8:101::/64 (example encoding)', 'Varies by ISP implementation'],
      usage: ['ISP IPv6 service over IPv4 infrastructure', 'Broadband IPv6 deployment', 'Customer premises equipment'],
      notes: 'ISP-specific encoding of customer IPv4 address into IPv6 prefix',
    },
  ],

  recognition: {
    title: 'Quick Recognition Guide',
    patterns: [
      { pattern: '::ffff:x.x.x.x', meaning: 'IPv4-mapped address', action: 'Extract IPv4 from the end' },
      { pattern: '::x.x.x.x', meaning: 'IPv4-compatible (deprecated)', action: 'Avoid using' },
      { pattern: '2002:xxxx:xxxx::', meaning: '6to4 address', action: 'Convert hex back to IPv4' },
      { pattern: '2001:0::', meaning: 'Teredo address', action: 'Complex encoding, use tools' },
      { pattern: 'xxxx::5efe:x.x.x.x', meaning: 'ISATAP address', action: 'IPv4 follows :5efe:' },
    ],
  },

  conversion: {
    title: 'IPv4 to Hex Conversion Examples',
    examples: [
      { ipv4: '192.0.2.1', hex: 'c000:0201', breakdown: '192=c0, 0=00, 2=02, 1=01' },
      { ipv4: '10.0.0.1', hex: '0a00:0001', breakdown: '10=0a, 0=00, 0=00, 1=01' },
      { ipv4: '172.16.1.100', hex: 'ac10:0164', breakdown: '172=ac, 16=10, 1=01, 100=64' },
      { ipv4: '203.0.113.1', hex: 'cb00:7101', breakdown: '203=cb, 0=00, 113=71, 1=01' },
    ],
  },

  modernUsage: [
    'IPv4-mapped addresses are still used in dual-stack applications',
    '6to4 and Teredo are mostly disabled by default in modern systems',
    'New deployments should use native IPv6 or IPv4/IPv6 dual-stack',
    'Legacy mechanisms may appear in old configurations or troubleshooting',
    'Most transition mechanisms are being phased out as IPv6 adoption grows',
  ],

  troubleshooting: [
    {
      issue: 'Seeing ::ffff: addresses in logs',
      cause: 'Dual-stack application treating IPv4 clients as IPv6',
      solution: 'Normal behavior, indicates IPv4-mapped addressing',
    },
    {
      issue: '2002:: addresses not working',
      cause: '6to4 infrastructure being deprecated',
      solution: 'Switch to native IPv6 or other transition mechanisms',
    },
    {
      issue: 'Teredo connectivity issues',
      cause: 'NAT or firewall blocking UDP 3544',
      solution: 'Configure firewall or disable Teredo if not needed',
    },
    {
      issue: 'ISATAP addresses appearing',
      cause: 'Windows automatic tunneling enabled',
      solution: 'Disable if not needed: netsh interface ipv6 set global randomizeidentifiers=disabled',
    },
  ],

  securityNotes: [
    'IPv4-compatible addresses (::) are deprecated due to security issues',
    '6to4 can be exploited for traffic injection attacks',
    'Teredo may bypass firewall rules if not properly configured',
    'Disable unused transition mechanisms to reduce attack surface',
    'Monitor for unexpected embedded IPv4 traffic patterns',
  ],
};
