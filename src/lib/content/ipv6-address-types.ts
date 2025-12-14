export const ipv6AddressTypesContent = {
  title: 'IPv6 Address Types & Key Prefixes',
  description: 'Complete guide to IPv6 address types including unicast, multicast, anycast, and special-use prefixes.',

  sections: {
    overview: {
      title: 'IPv6 Address Categories',
      content: `IPv6 addresses are organized into three main categories:

- **Unicast**: One-to-one communication (most common)
- **Multicast**: One-to-many communication  
- **Anycast**: One-to-nearest communication

Unlike IPv4, IPv6 has no broadcast addresses. Multicast handles broadcast-like functions.`,
    },
  },

  unicastTypes: [
    {
      type: 'Global Unicast',
      prefix: '2000::/3',
      range: '2000:: to 3fff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      description: 'Internet-routable addresses, like IPv4 public addresses',
      usage: 'Public websites, servers, internet-facing devices',
      example: '2001:db8:85a3::8a2e:370:7334',
    },
    {
      type: 'Unique Local (ULA)',
      prefix: 'fc00::/7',
      range: 'fc00:: to fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      description: 'Private addresses for local networks, like IPv4 RFC 1918',
      usage: 'Internal networks, VPNs, private communication',
      example: 'fd12:3456:789a::1',
    },
    {
      type: 'Link-Local',
      prefix: 'fe80::/10',
      range: 'fe80:: to febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      description: 'Auto-configured on every interface, not routed beyond local link',
      usage: 'Neighbor discovery, router advertisements, local communication',
      example: 'fe80::1%eth0',
    },
  ],

  specialAddresses: [
    {
      address: '::1/128',
      name: 'Loopback',
      description: 'IPv6 equivalent of 127.0.0.1',
      usage: 'Testing, local services',
    },
    {
      address: '::/128',
      name: 'Unspecified',
      description: 'IPv6 equivalent of 0.0.0.0',
      usage: 'Default route, uninitialized addresses',
    },
    {
      address: '::/0',
      name: 'Default Route',
      description: 'Matches all addresses',
      usage: 'Default gateway route',
    },
    {
      address: '::ffff:0:0/96',
      name: 'IPv4-Mapped',
      description: 'IPv4 addresses mapped into IPv6 space',
      usage: 'Dual-stack applications, IPv4 compatibility',
    },
  ],

  multicastTypes: [
    {
      prefix: 'ff00::/8',
      scope: 'All',
      description: 'All multicast addresses start with ff',
      examples: [],
    },
    {
      prefix: 'ff01::/16',
      scope: 'Interface-Local',
      description: 'Multicast within single interface',
      examples: ['ff01::1 - All nodes (interface-local)'],
    },
    {
      prefix: 'ff02::/16',
      scope: 'Link-Local',
      description: 'Multicast within local network segment',
      examples: [
        'ff02::1 - All nodes (link-local)',
        'ff02::2 - All routers (link-local)',
        'ff02::5 - OSPFv3 routers',
        'ff02::6 - OSPFv3 designated routers',
      ],
    },
    {
      prefix: 'ff05::/16',
      scope: 'Site-Local',
      description: 'Multicast within entire site/organization',
      examples: ['ff05::2 - All routers (site-local)'],
    },
    {
      prefix: 'ff0e::/16',
      scope: 'Global',
      description: 'Internet-wide multicast',
      examples: ['ff0e::1 - All nodes (global)'],
    },
  ],

  anycast: {
    title: 'Anycast Addresses',
    description: `Anycast addresses look identical to unicast addresses but are assigned to multiple devices. Traffic goes to the "nearest" device with that address.

There's no special prefix for anycast - they use the same ranges as unicast addresses.`,

    commonUses: [
      'DNS root servers (multiple servers, same IP)',
      'Content delivery networks (CDNs)',
      'Load balancing across geographic locations',
      'Subnet router anycast (all routers on a subnet)',
    ],

    example: '2001:db8::1 could be anycast if assigned to multiple servers',
  },

  reservedRanges: [
    { prefix: '0000::/8', purpose: 'Reserved (includes ::1 and IPv4-mapped)' },
    { prefix: '0100::/8', purpose: 'Reserved' },
    { prefix: '0200::/7', purpose: 'Reserved' },
    { prefix: '0400::/6', purpose: 'Reserved' },
    { prefix: '0800::/5', purpose: 'Reserved' },
    { prefix: '1000::/4', purpose: 'Reserved' },
    { prefix: '4000::/3', purpose: 'Reserved' },
    { prefix: '6000::/3', purpose: 'Reserved' },
    { prefix: '8000::/3', purpose: 'Reserved' },
    { prefix: 'a000::/3', purpose: 'Reserved' },
    { prefix: 'c000::/3', purpose: 'Reserved' },
    { prefix: 'e000::/4', purpose: 'Reserved' },
    { prefix: 'f000::/5', purpose: 'Reserved' },
    { prefix: 'f800::/6', purpose: 'Reserved' },
    { prefix: 'fc00::/7', purpose: 'Unique Local Addresses' },
    { prefix: 'fe00::/9', purpose: 'Reserved' },
    { prefix: 'fe80::/10', purpose: 'Link-Local Addresses' },
    { prefix: 'fec0::/10', purpose: 'Reserved (deprecated site-local)' },
    { prefix: 'ff00::/8', purpose: 'Multicast' },
  ],

  quickTips: [
    'Most public IPv6 addresses start with 2 or 3',
    "If you see fe80::, it's link-local (not routed)",
    "If you see fd or fc, it's unique local (private)",
    "If you see ff, it's multicast",
    '::1 is IPv6 loopback (like 127.0.0.1)',
    ':: means all zeros (like 0.0.0.0)',
  ],
};
