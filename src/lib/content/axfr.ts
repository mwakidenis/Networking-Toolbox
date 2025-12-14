export const axfrContent = {
  title: 'DNS Zone Transfer (AXFR) Security Tester',
  description:
    'Test if your DNS zone transfers are improperly exposed. AXFR vulnerabilities can leak entire DNS records to unauthorized parties.',

  sections: {
    whatIsAXFR: {
      title: 'What is DNS Zone Transfer (AXFR)?',
      content: `DNS Zone Transfer (AXFR) is a mechanism for replicating DNS zone data between authoritative nameservers. When configured properly, it allows secondary nameservers to maintain synchronized copies of zone data from primary servers.

However, if AXFR is misconfigured to allow transfers from any source, it becomes a serious security vulnerability. Attackers can download your entire DNS zone, revealing all subdomains, internal hostnames, IP addresses, and infrastructure details that should remain private.`,
    },

    security: {
      title: 'Security Implications',
      risks: [
        {
          risk: 'Information Disclosure',
          severity: 'High',
          description:
            'Entire DNS zone exposed, revealing all subdomains, internal hostnames, IP addresses, mail servers, and infrastructure topology.',
          impact: 'Provides attackers with complete map of your DNS infrastructure',
        },
        {
          risk: 'Reconnaissance for Attacks',
          severity: 'High',
          description:
            'Leaked zone data enables targeted attacks on discovered internal systems, dev/staging environments, and admin interfaces.',
          impact: 'Significantly increases attack surface and enables focused exploitation',
        },
        {
          risk: 'Subdomain Enumeration',
          severity: 'Medium',
          description:
            'Discovery of hidden subdomains like admin.example.com, staging.example.com, vpn.example.com that attackers can target.',
          impact: 'Exposes systems intended to be hidden from public knowledge',
        },
        {
          risk: 'Internal IP Exposure',
          severity: 'Medium',
          description: 'Private IP addresses and internal network topology revealed through zone records.',
          impact: 'Helps attackers understand internal network architecture',
        },
      ],
    },

    howItWorks: {
      title: 'How AXFR Testing Works',
      steps: [
        'Query nameservers (NS records) for the target domain',
        'Resolve each nameserver to its IP address',
        'Attempt AXFR query against each nameserver using dig',
        'Analyze response to determine if transfer succeeded',
        'Parse and count zone records if transfer allowed',
        'Report vulnerability status for each nameserver',
      ],
    },

    interpretation: {
      title: 'Understanding Test Results',
      statuses: [
        {
          status: 'Vulnerable',
          color: 'error',
          meaning: 'Zone transfer succeeded',
          description:
            'The nameserver allowed unrestricted zone transfer and returned DNS records. This is a critical security vulnerability.',
          action: 'Immediately restrict AXFR to authorized secondary nameservers only',
        },
        {
          status: 'Secure',
          color: 'success',
          meaning: 'Transfer refused',
          description:
            'The nameserver properly rejected the zone transfer request. This is the correct configuration for public queries.',
          action: 'No action needed - nameserver is properly configured',
        },
        {
          status: 'Error',
          color: 'warning',
          meaning: 'Query failed',
          description:
            'Could not complete the AXFR test due to timeout, connection failure, or other error. Nameserver may be unreachable.',
          action: 'Verify nameserver is functioning properly',
        },
      ],
    },

    properConfiguration: {
      title: 'Proper AXFR Configuration',
      configurations: [
        {
          server: 'BIND',
          syntax: `zone "example.com" {
    type master;
    file "/etc/bind/zones/example.com";
    allow-transfer {
        192.0.2.1;    // Secondary NS IP
        203.0.113.5;  // Another authorized secondary
    };
};`,
          description: 'Restrict transfers to specific IP addresses of secondary nameservers',
        },
        {
          server: 'NSD',
          syntax: `zone:
    name: "example.com"
    zonefile: "example.com.zone"
    provide-xfr: 192.0.2.1 NOKEY
    provide-xfr: 203.0.113.5 NOKEY`,
          description: 'Explicitly list authorized IPs for zone transfers',
        },
        {
          server: 'PowerDNS',
          syntax: `allow-axfr-ips=192.0.2.1,203.0.113.5
# Or in SQL zone metadata:
INSERT INTO domainmetadata (domain_id, kind, content)
VALUES (1, 'ALLOW-AXFR-FROM', '192.0.2.1');`,
          description: 'Configure allowed transfer IPs in configuration or database',
        },
        {
          server: 'Microsoft DNS',
          syntax: `Right-click zone → Properties → Zone Transfers:
☑ Allow zone transfers
  ○ Only to servers listed on the Name Servers tab
  ○ Only to the following servers: [Add IPs]
  ☐ To any server`,
          description: 'Use GUI to restrict transfers to specific servers only',
        },
      ],
    },

    bestPractices: {
      title: 'DNS Security Best Practices',
      practices: [
        {
          practice: 'Restrict Zone Transfers',
          description: 'Only allow AXFR from authorized secondary nameservers. Never allow unrestricted transfers.',
          priority: 'Critical',
        },
        {
          practice: 'Use TSIG Authentication',
          description: 'Implement TSIG (Transaction Signature) for authenticated zone transfers between servers.',
          priority: 'High',
        },
        {
          practice: 'Regular Security Audits',
          description: 'Periodically test your nameservers for AXFR vulnerabilities using tools like this one.',
          priority: 'High',
        },
        {
          practice: 'Minimize Public DNS Records',
          description: "Don't publish internal hostnames or private infrastructure details in public DNS zones.",
          priority: 'Medium',
        },
        {
          practice: 'Split-Horizon DNS',
          description:
            'Use separate internal and external DNS zones. Internal zone contains private records, external only public ones.',
          priority: 'Medium',
        },
        {
          practice: 'Monitor DNS Query Logs',
          description: 'Log and monitor AXFR requests to detect unauthorized transfer attempts.',
          priority: 'Medium',
        },
      ],
    },

    remediation: {
      title: 'Fixing AXFR Vulnerabilities',
      steps: [
        {
          step: 'Identify Vulnerable Nameservers',
          details: 'Use this tool or manual dig commands to test all authoritative nameservers',
          command: 'dig @nameserver.example.com example.com AXFR',
        },
        {
          step: 'Configure Transfer Restrictions',
          details: 'Edit nameserver config to allow transfers only from secondary NS IP addresses',
          command: 'allow-transfer { 192.0.2.1; 203.0.113.5; };',
        },
        {
          step: 'Reload DNS Configuration',
          details: 'Apply configuration changes and reload the nameserver',
          command: 'rndc reload (BIND) or service nsd reload (NSD)',
        },
        {
          step: 'Verify Fix',
          details:
            'Test from external IP to confirm AXFR is now refused, and from secondary to confirm authorized transfers still work',
          command: 'dig @nameserver.example.com example.com AXFR',
        },
        {
          step: 'Implement TSIG',
          details: 'Add TSIG keys for cryptographic authentication of zone transfers',
          command: 'tsig-keygen -a hmac-sha256 transfer-key',
        },
      ],
    },

    commonMisconfigurations: {
      title: 'Common AXFR Misconfigurations',
      misconfigurations: [
        {
          issue: 'No Transfer Restrictions',
          example: 'allow-transfer { any; };',
          problem: 'Allows anyone to download entire zone',
          fix: 'Replace "any" with specific secondary NS IPs',
        },
        {
          issue: 'Network-Based Trust',
          example: 'allow-transfer { 192.168.0.0/16; };',
          problem: 'Trusts entire network range - too permissive',
          fix: 'Specify exact IP addresses of secondary nameservers',
        },
        {
          issue: 'Default Permit Configuration',
          example: 'Zone transfers enabled by default without restrictions',
          problem: 'Many DNS servers default to allowing transfers',
          fix: 'Explicitly configure allow-transfer directive',
        },
        {
          issue: 'Forgotten Test Nameserver',
          example: 'Old test/dev nameserver still in production with open AXFR',
          problem: 'Test servers often have relaxed security',
          fix: 'Remove or properly secure all nameservers',
        },
      ],
    },

    detectionMethods: {
      title: 'How Attackers Exploit AXFR',
      methods: [
        {
          method: 'Manual dig Query',
          command: 'dig @ns1.target.com target.com AXFR',
          description: 'Direct zone transfer request to each nameserver',
        },
        {
          method: 'Automated Scanning',
          command: 'fierce --domain target.com',
          description: 'Tools like fierce, dnsrecon automatically test AXFR',
        },
        {
          method: 'Subdomain Enumeration',
          command: 'After successful AXFR, extract all A/AAAA records for subdomain list',
          description: 'Parse zone file to discover all subdomains and targets',
        },
        {
          method: 'Infrastructure Mapping',
          command: 'grep "IN A\\|IN AAAA\\|IN MX\\|IN CNAME" zone_dump.txt',
          description: 'Map entire infrastructure from leaked zone data',
        },
      ],
    },

    compliance: {
      title: 'Compliance & Standards',
      standards: [
        {
          standard: 'CIS DNS Benchmark',
          requirement: 'Restrict zone transfers to authorized secondary nameservers',
          reference: 'Section 3.7',
        },
        {
          standard: 'PCI DSS',
          requirement: 'Secure DNS configuration to prevent information disclosure',
          reference: 'Requirement 2.2',
        },
        {
          standard: 'NIST 800-81-2',
          requirement: 'DNS Security Recommendations - Restrict AXFR',
          reference: 'Section 3.1.1',
        },
        {
          standard: 'ISO 27001',
          requirement: 'Protection against information leakage',
          reference: 'A.13.2.1',
        },
      ],
    },
  },

  quickTips: [
    'Zone transfers should only work from authorized secondary nameservers',
    'Test all your nameservers - one misconfigured server compromises the entire zone',
    'Use TSIG authentication for additional transfer security',
    'Monitor DNS logs for unauthorized AXFR attempts',
    'Regular security audits help catch configuration drift',
    'Split internal and external DNS to minimize exposure',
  ],
};
