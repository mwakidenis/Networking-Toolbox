export const reverseDnsContent = {
  title: 'Reverse DNS (in-addr.arpa / ip6.arpa)',
  description: 'How reverse DNS works, PTR record construction, and examples for IPv4 and IPv6 addresses.',

  sections: {
    overview: {
      title: 'What is Reverse DNS?',
      content: `Reverse DNS (rDNS) converts IP addresses back to domain names using PTR records. While normal DNS goes from name to IP address, reverse DNS goes from IP address to name.

This is used for logging, email verification, security checks, and troubleshooting. Many mail servers require valid reverse DNS to accept email.`,
    },

    howWorks: {
      title: 'How Reverse DNS Works',
      content: `Reverse DNS uses special domains that represent IP addresses in reverse order:

- IPv4 uses the .in-addr.arpa domain
- IPv6 uses the .ip6.arpa domain

The IP address is reversed and each part becomes a label in the domain name, then a PTR record provides the hostname.`,
    },
  },

  ipv4Reverse: {
    title: 'IPv4 Reverse DNS (in-addr.arpa)',

    process: [
      'Take the IPv4 address (e.g., 192.0.2.1)',
      'Reverse the octets (1.2.0.192)',
      'Add .in-addr.arpa domain (1.2.0.192.in-addr.arpa)',
      'Query for PTR record at that name',
      'PTR record contains the hostname',
    ],

    examples: [
      {
        ip: '192.0.2.1',
        reversed: '1.2.0.192.in-addr.arpa',
        ptrRecord: 'host1.example.com',
        explanation: 'Each octet becomes a label, in reverse order',
      },
      {
        ip: '10.0.0.1',
        reversed: '1.0.0.10.in-addr.arpa',
        ptrRecord: 'gateway.internal',
        explanation: 'Private addresses can have internal PTR records',
      },
      {
        ip: '172.16.254.1',
        reversed: '1.254.16.172.in-addr.arpa',
        ptrRecord: 'router.company.local',
        explanation: 'Common for infrastructure devices',
      },
      {
        ip: '8.8.8.8',
        reversed: '8.8.8.8.in-addr.arpa',
        ptrRecord: 'dns.google',
        explanation: 'Public DNS servers typically have rDNS',
      },
    ],

    delegation: {
      title: 'Network Delegation',
      explanation: 'ISPs delegate reverse DNS zones to customers for their IP blocks',
      examples: [
        {
          network: '192.0.2.0/24',
          zone: '2.0.192.in-addr.arpa',
          description: 'Entire /24 network reverse zone',
        },
        {
          network: '203.0.113.0/27',
          zone: '0-27.113.0.203.in-addr.arpa',
          description: 'Smaller subnet with CNAME delegation',
        },
      ],
    },
  },

  ipv6Reverse: {
    title: 'IPv6 Reverse DNS (ip6.arpa)',

    process: [
      'Take IPv6 address and expand to full form',
      'Remove colons and reverse all hex digits',
      'Insert dots between each hex digit',
      'Add .ip6.arpa domain',
      'Query for PTR record',
    ],

    examples: [
      {
        ip: '2001:db8::1',
        expanded: '2001:0db8:0000:0000:0000:0000:0000:0001',
        nibbles: '1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa',
        ptrRecord: 'host1.example.com',
        explanation: 'Each hex digit (nibble) becomes a separate label',
      },
      {
        ip: '2001:db8:85a3::8a2e:370:7334',
        expanded: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        nibbles: '4.3.3.7.0.7.3.0.e.2.a.8.0.0.0.0.0.0.0.0.3.a.5.8.8.b.d.0.1.0.0.2.ip6.arpa',
        ptrRecord: 'server.company.net',
        explanation: 'Full expansion required before nibble reversal',
      },
      {
        ip: 'fe80::1%eth0',
        expanded: 'fe80:0000:0000:0000:0000:0000:0000:0001',
        nibbles: '1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.e.f.ip6.arpa',
        ptrRecord: '(typically not configured)',
        explanation: 'Link-local addresses rarely have reverse DNS',
      },
    ],

    delegation: {
      title: 'IPv6 Reverse Delegation',
      explanation: 'IPv6 reverse zones are typically delegated on nibble boundaries',
      examples: [
        {
          network: '2001:db8::/32',
          zone: '8.b.d.0.1.0.0.2.ip6.arpa',
          description: 'Typical RIR allocation reverse zone',
        },
        {
          network: '2001:db8:1::/48',
          zone: '1.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa',
          description: 'Site allocation reverse zone',
        },
      ],
    },
  },

  practicalExamples: {
    title: 'Practical Examples and Tools',

    digExamples: [
      {
        command: 'dig -x 8.8.8.8',
        description: 'Query reverse DNS for 8.8.8.8',
        expectedResult: 'dns.google.',
      },
      {
        command: 'dig PTR 8.8.8.8.in-addr.arpa',
        description: 'Direct PTR query (same as above)',
        expectedResult: 'dns.google.',
      },
      {
        command: 'dig -x 2001:4860:4860::8888',
        description: 'IPv6 reverse DNS query',
        expectedResult: 'dns.google.',
      },
      {
        command: 'nslookup 1.1.1.1',
        description: 'Windows/generic reverse lookup',
        expectedResult: 'one.one.one.one.',
      },
    ],

    commonChecks: [
      'Email servers checking sender reputation',
      'Web server logs showing hostnames instead of IPs',
      'Security tools identifying suspicious connections',
      'Network troubleshooting and asset identification',
      'Compliance auditing and documentation',
    ],
  },

  troubleshooting: [
    {
      issue: 'No reverse DNS record found',
      causes: ['PTR record not configured', 'Wrong delegation', 'DNS server issue'],
      solutions: ['Check with IP provider', 'Verify PTR record exists', 'Test different DNS servers'],
    },
    {
      issue: "Reverse DNS doesn't match forward DNS",
      causes: ['Misconfigured PTR record', 'Stale DNS cache', 'Wrong hostname'],
      solutions: ['Verify PTR points to correct name', 'Clear DNS cache', 'Check forward/reverse match'],
    },
    {
      issue: 'Email being rejected due to missing rDNS',
      causes: ['Mail server missing PTR record', "PTR doesn't match HELO name"],
      solutions: ['Configure PTR record with ISP', 'Ensure PTR matches mail server name'],
    },
  ],

  bestPractices: [
    'Always configure reverse DNS for mail servers',
    'Use meaningful hostnames in PTR records',
    'Ensure forward and reverse DNS match',
    'Keep PTR records up to date when changing hostnames',
    'Test reverse DNS from multiple locations',
    'Document your reverse DNS naming convention',
  ],

  quickReference: {
    ipv4: [
      '192.0.2.1 → 1.2.0.192.in-addr.arpa',
      '10.0.0.1 → 1.0.0.10.in-addr.arpa',
      "Use 'dig -x' for easy reverse lookups",
    ],
    ipv6: [
      '2001:db8::1 → 1.0.0.0...8.b.d.0.1.0.0.2.ip6.arpa',
      'Each hex digit gets its own label (nibble format)',
      'Much longer than IPv4 reverse names',
    ],
  },

  tools: [
    { name: 'dig -x', description: 'Command-line reverse DNS lookup' },
    { name: 'nslookup', description: 'Cross-platform DNS lookup tool' },
    { name: 'host', description: 'Linux/Unix DNS lookup utility' },
    { name: 'Online reverse DNS tools', description: 'Web-based lookup services' },
  ],
};
