export const reverseZonesContent = {
  title: 'Reverse Zones for CIDR Delegation',
  description:
    'Minimal reverse DNS zones needed to properly delegate IPv4 and IPv6 CIDR blocks with practical examples.',

  sections: {
    overview: {
      title: 'What are Reverse Zones?',
      content: `Reverse DNS zones map IP addresses back to domain names using special domains (.in-addr.arpa for IPv4, .ip6.arpa for IPv6). When you're delegated a CIDR block, you need to create the corresponding reverse zones for proper DNS operation.

Reverse zones are essential for mail servers, logging, security tools, and network troubleshooting.`,
    },

    delegation: {
      title: 'How Reverse Delegation Works',
      content: `Your ISP or RIR delegates reverse DNS authority for your IP blocks to your DNS servers. You then create the reverse zones and populate them with PTR records that map IP addresses to hostnames.

The delegation happens at specific boundaries that align with IP addressing hierarchy.`,
    },
  },

  ipv4Zones: {
    title: 'IPv4 Reverse Zones (in-addr.arpa)',

    classfullBoundaries: [
      {
        cidr: '/8',
        example: '10.0.0.0/8',
        reverseZone: '10.in-addr.arpa',
        description: 'Entire Class A network',
        delegation: 'Usually handled by RIRs, not end users',
      },
      {
        cidr: '/16',
        example: '172.16.0.0/16',
        reverseZone: '16.172.in-addr.arpa',
        description: 'Class B network',
        delegation: 'Large organizations or ISPs',
      },
      {
        cidr: '/24',
        example: '192.168.1.0/24',
        reverseZone: '1.168.192.in-addr.arpa',
        description: 'Class C network - most common delegation',
        delegation: 'Standard small business / organization',
      },
    ],

    classlessDelegation: [
      {
        cidr: '/25',
        example: '203.0.113.0/25',
        addresses: '128 addresses',
        problem: "Doesn't align with octet boundaries",
        solution: 'Use CNAME delegation with bit notation',
        zones: ['0-25.113.0.203.in-addr.arpa', '1-25.113.0.203.in-addr.arpa'],
      },
      {
        cidr: '/26',
        example: '203.0.113.64/26',
        addresses: '64 addresses',
        problem: "Quarter of /24, doesn't align with octets",
        solution: 'CNAME delegation for 64-127 range',
        zones: ['64-26.113.0.203.in-addr.arpa'],
      },
      {
        cidr: '/27',
        example: '203.0.113.128/27',
        addresses: '32 addresses',
        problem: 'Eighth of /24, complex delegation',
        solution: 'CNAME delegation with range notation',
        zones: ['128-27.113.0.203.in-addr.arpa'],
      },
    ],

    practicalExamples: [
      {
        scenario: 'Small Business with /24',
        network: '192.0.2.0/24',
        reverseZone: '2.0.192.in-addr.arpa',
        ptrRecords: [
          '1.2.0.192.in-addr.arpa. IN PTR mail.example.com.',
          '10.2.0.192.in-addr.arpa. IN PTR web.example.com.',
          '50.2.0.192.in-addr.arpa. IN PTR server1.example.com.',
        ],
        delegation: 'ISP delegates entire /24 reverse zone to customer DNS',
      },
      {
        scenario: 'Medium Business with /23',
        network: '198.51.100.0/23',
        reverseZones: ['100.51.198.in-addr.arpa', '101.51.198.in-addr.arpa'],
        description: 'Two /24 reverse zones needed',
        delegation: 'ISP delegates both zones or uses automation',
      },
    ],
  },

  ipv6Zones: {
    title: 'IPv6 Reverse Zones (ip6.arpa)',

    nibbleBoundaries: [
      {
        cidr: '/32',
        example: '2001:db8::/32',
        reverseZone: '8.b.d.0.1.0.0.2.ip6.arpa',
        description: 'Typical RIR allocation to ISP',
        delegation: 'RIR delegates to ISP',
      },
      {
        cidr: '/48',
        example: '2001:db8:1234::/48',
        reverseZone: '4.3.2.1.8.b.d.0.1.0.0.2.ip6.arpa',
        description: 'Typical site allocation',
        delegation: 'ISP delegates to organization',
      },
      {
        cidr: '/56',
        example: '2001:db8:1234:ab00::/56',
        reverseZone: '0.0.b.a.4.3.2.1.8.b.d.0.1.0.0.2.ip6.arpa',
        description: 'Large home or small business',
        delegation: 'Common residential allocation',
      },
      {
        cidr: '/64',
        example: '2001:db8:1234:5678::/64',
        reverseZone: '8.7.6.5.4.3.2.1.8.b.d.0.1.0.0.2.ip6.arpa',
        description: 'Single subnet',
        delegation: 'Individual subnet reverse zone',
      },
    ],

    practicalExamples: [
      {
        scenario: 'Enterprise with /48',
        network: '2001:db8:1234::/48',
        reverseZone: '4.3.2.1.8.b.d.0.1.0.0.2.ip6.arpa',
        subZones: [
          '0.0.0.0.4.3.2.1.8.b.d.0.1.0.0.2.ip6.arpa (/64)',
          '1.0.0.0.4.3.2.1.8.b.d.0.1.0.0.2.ip6.arpa (/64)',
          'a.b.c.d.4.3.2.1.8.b.d.0.1.0.0.2.ip6.arpa (/64)',
        ],
        management: 'Create master zone, delegate individual /64s as needed',
      },
    ],
  },

  zoneCreation: {
    title: 'Creating Reverse Zones',

    ipv4Example: {
      network: '192.0.2.0/24',
      zoneName: '2.0.192.in-addr.arpa',
      zoneFile: `$TTL 86400
2.0.192.in-addr.arpa.    IN    SOA    ns1.example.com. hostmaster.example.com. (
                                2024010101  ; serial
                                3600        ; refresh
                                1800        ; retry
                                1209600     ; expire
                                86400 )     ; minimum

                         IN    NS     ns1.example.com.
                         IN    NS     ns2.example.com.

1                        IN    PTR    mail.example.com.
10                       IN    PTR    web.example.com.
50                       IN    PTR    server1.example.com.
100                      IN    PTR    workstation.example.com.`,

      explanation: [
        'Zone name is network reversed + in-addr.arpa',
        'SOA record defines zone authority and parameters',
        'NS records point to authoritative name servers',
        'PTR records map IP to hostname (just last octet for /24)',
      ],
    },

    ipv6Example: {
      network: '2001:db8:1234::/48',
      zoneName: '4.3.2.1.8.b.d.0.1.0.0.2.ip6.arpa',
      zoneFile: `$TTL 86400
4.3.2.1.8.b.d.0.1.0.0.2.ip6.arpa. IN SOA ns1.example.com. hostmaster.example.com. (
                                2024010101  ; serial
                                3600        ; refresh
                                1800        ; retry
                                1209600     ; expire
                                86400 )     ; minimum

                         IN    NS     ns1.example.com.
                         IN    NS     ns2.example.com.

; Delegate /64 subnets
0.0.0.0                  IN    NS     ns1.example.com.
0.0.0.0                  IN    NS     ns2.example.com.

1.0.0.0                  IN    NS     ns1.example.com.
1.0.0.0                  IN    NS     ns2.example.com.`,

      explanation: [
        'Zone name is full prefix in nibble format + ip6.arpa',
        'Each hex digit becomes separate label in reverse',
        'Can delegate individual /64 subnets within /48',
        'Much longer zone names than IPv4',
      ],
    },
  },

  delegationScenarios: [
    {
      scenario: 'ISP to Customer (/24)',
      delegation: "ISP adds NS records for customer's DNS servers in their reverse zone",
      customerActions: [
        'Set up DNS servers with reverse zone',
        'Create PTR records for important hosts',
        'Test reverse lookups work correctly',
      ],
      ispActions: [
        'Add NS delegation in parent zone',
        'Update WHOIS records if required',
        'Verify customer DNS servers are working',
      ],
    },
    {
      scenario: 'Organization Internal (/16 split)',
      delegation: 'Large organization splits /16 into /24s for different departments',
      process: [
        'Create master zone for entire /16',
        'Delegate individual /24s to department DNS servers',
        'Each department manages their own PTR records',
      ],
    },
  ],

  bestPractices: [
    'Always create reverse zones for your allocated IP blocks',
    'Ensure PTR records match forward DNS (A/AAAA records)',
    'Use consistent naming conventions for reverse records',
    'Monitor reverse DNS resolution for important services',
    'Automate PTR record creation/updates where possible',
    'Test reverse lookups from multiple external locations',
    'Keep reverse zone serial numbers updated when making changes',
  ],

  troubleshooting: [
    {
      issue: 'Reverse lookups not working',
      causes: ['Zone not delegated', 'DNS server not responding', 'PTR records missing'],
      diagnosis: 'Use dig -x [ip] to test reverse resolution',
      solution: 'Check delegation, verify DNS server config, add PTR records',
    },
    {
      issue: 'Mail servers rejecting email',
      causes: ['Missing PTR record for mail server IP', "PTR doesn't match HELO name"],
      diagnosis: 'Check mail server logs, test PTR record',
      solution: 'Create PTR record that matches mail server hostname',
    },
    {
      issue: 'IPv6 reverse lookups failing',
      causes: ['Complex nibble format errors', 'Zone delegation issues'],
      diagnosis: 'Verify zone name format, test with dig -x',
      solution: 'Double-check nibble format, verify IPv6 DNS configuration',
    },
  ],

  quickReference: {
    zoneFormulas: [
      'IPv4 /24: [third].[second].[first].in-addr.arpa',
      'IPv4 /16: [second].[first].in-addr.arpa',
      'IPv6 /48: [nibbles-reversed].ip6.arpa',
      'IPv6 /64: [more-nibbles-reversed].ip6.arpa',
    ],

    essentialRecords: [
      'SOA record (required for all zones)',
      'NS records (delegation to authoritative servers)',
      'PTR records (actual IP to name mappings)',
      'Match PTR with forward A/AAAA records',
    ],
  },

  tools: [
    { tool: 'dig -x [ip]', purpose: 'Test reverse DNS lookup' },
    { tool: 'nslookup [ip]', purpose: 'Basic reverse lookup test' },
    { tool: 'host [ip]', purpose: 'Simple reverse resolution check' },
    { tool: 'online reverse DNS tools', purpose: 'Test from external perspective' },
  ],
};
