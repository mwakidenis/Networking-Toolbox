export const dnsPerformanceContent = {
  title: 'DNS Query Performance',
  description:
    'Compare DNS resolver speeds, identify performance bottlenecks, and optimize your DNS configuration for faster website loading.',

  sections: {
    whatIsDnsPerformance: {
      title: 'Why DNS Performance Matters',
      content: `DNS (Domain Name System) performance directly impacts how fast websites and applications load. Every time you visit a website, your device must first query a DNS resolver to translate the domain name into an IP address. This lookup happens before any content can be downloaded.

A slow DNS resolver can add hundreds of milliseconds to every page load, making websites feel sluggish even on fast internet connections. By testing and choosing the fastest resolver for your location, you can significantly improve your browsing experience.`,
    },

    howItWorks: {
      title: 'How DNS Performance Testing Works',
      content: `This tool measures the time it takes for different DNS resolvers to answer queries for a specific domain. Here's what happens:`,
      steps: [
        'A DNS query is sent to each resolver simultaneously',
        'The resolver looks up the requested record type (A, AAAA, MX, etc.)',
        'Response time is measured from query start to response received',
        'Results are compared across all resolvers',
        'Statistics show fastest, slowest, average, and median times',
      ],
    },

    recordTypes: {
      title: 'DNS Record Types',
      types: [
        {
          type: 'A',
          description: 'Maps domain to IPv4 address',
          example: 'example.com → 93.184.216.34',
          common: 'Most common record type',
        },
        {
          type: 'AAAA',
          description: 'Maps domain to IPv6 address',
          example: 'example.com → 2606:2800:220:1:248:1893:25c8:1946',
          common: 'Growing importance with IPv6 adoption',
        },
        {
          type: 'MX',
          description: 'Mail server records for email delivery',
          example: '10 mail.example.com',
          common: 'Essential for email routing',
        },
        {
          type: 'TXT',
          description: 'Text records for various purposes (SPF, DKIM, verification)',
          example: 'v=spf1 include:_spf.google.com ~all',
          common: 'Used for email auth, domain verification',
        },
        {
          type: 'NS',
          description: 'Nameserver records - authoritative DNS servers for domain',
          example: 'ns1.example.com, ns2.example.com',
          common: 'Shows where domain is hosted',
        },
        {
          type: 'CNAME',
          description: 'Alias record pointing to another domain',
          example: 'www.example.com → example.com',
          common: 'For CDNs and subdomains',
        },
        {
          type: 'SOA',
          description: 'Start of Authority - zone metadata and configuration',
          example: 'Contains serial, refresh, retry, expire times',
          common: 'One per DNS zone',
        },
      ],
    },

    publicResolvers: {
      title: 'Public DNS Resolvers',
      resolvers: [
        {
          name: 'Cloudflare',
          ip: '1.1.1.1',
          description: 'Privacy-focused, claims to be fastest',
          pros: ['Very fast', 'Strong privacy policy', 'No logging', 'Global anycast network'],
          cons: ['Relatively new (2018)', 'Some ISPs may block it'],
          bestFor: 'Privacy-conscious users wanting speed',
        },
        {
          name: 'Google',
          ip: '8.8.8.8',
          description: 'Most widely used public resolver',
          pros: ['Excellent reliability', 'Fast response times', 'Good global coverage', 'Well-established'],
          cons: ['Privacy concerns (Google)', 'Logs queries', 'May track usage'],
          bestFor: 'Users prioritizing reliability over privacy',
        },
        {
          name: 'Quad9',
          ip: '9.9.9.9',
          description: 'Security and privacy focused',
          pros: ['Blocks malware domains', 'No logging', 'Privacy-focused', 'Threat intelligence'],
          cons: ['Slightly slower than top competitors', 'Blocking may cause issues'],
          bestFor: 'Security-conscious users',
        },
        {
          name: 'OpenDNS',
          ip: '208.67.222.222',
          description: 'Cisco-owned, customizable filtering',
          pros: ['Content filtering options', 'Phishing protection', 'Reliable', 'Dashboard for monitoring'],
          cons: ['Logs queries', 'Redirects NXDOMAIN', 'Can be slower'],
          bestFor: 'Families wanting content filtering',
        },
        {
          name: 'ControlD',
          ip: '76.76.2.0',
          description: 'Modern resolver with extensive customization',
          pros: ['Highly customizable', 'Multiple blocking lists', 'Fast', 'Detailed analytics'],
          cons: ['Newer service', 'Some features require account', 'Less proven'],
          bestFor: 'Advanced users wanting control',
        },
        {
          name: 'AdGuard',
          ip: '94.140.14.14',
          description: 'Ad-blocking DNS service',
          pros: ['Blocks ads and trackers', 'Privacy-focused', 'No logging', 'Multiple variants'],
          cons: ['May break some sites', 'Can be slower', 'Aggressive blocking'],
          bestFor: 'Users wanting ad-blocking at DNS level',
        },
      ],
    },

    interpretingResults: {
      title: 'Understanding Your Results',
      content: `Response times tell you how quickly each resolver can answer queries:`,
      ranges: [
        {
          range: '< 20ms',
          performance: 'Excellent',
          description: 'Barely noticeable delay. Resolver is very close or highly optimized.',
          color: 'success',
        },
        {
          range: '20-50ms',
          performance: 'Good',
          description: "Fast enough for smooth browsing. Most users won't notice the delay.",
          color: 'success',
        },
        {
          range: '50-100ms',
          performance: 'Acceptable',
          description: 'Noticeable on slow connections. May want to test alternatives.',
          color: 'warning',
        },
        {
          range: '100-200ms',
          performance: 'Slow',
          description: 'Adds noticeable delay to page loads. Consider switching resolvers.',
          color: 'warning',
        },
        {
          range: '> 200ms',
          performance: 'Very Slow',
          description: 'Significant impact on browsing speed. Definitely switch resolvers.',
          color: 'error',
        },
      ],
    },

    factorsAffecting: {
      title: 'Factors Affecting DNS Performance',
      factors: [
        {
          factor: 'Geographic Distance',
          impact: 'High',
          explanation:
            'Resolvers closer to you respond faster. Use resolvers with servers in your region or global anycast networks.',
        },
        {
          factor: 'Network Path',
          impact: 'High',
          explanation:
            'The route between you and the resolver matters. Poor peering or routing can add significant latency.',
        },
        {
          factor: 'Resolver Load',
          impact: 'Medium',
          explanation:
            'Overloaded resolvers respond slower. Popular resolvers with good infrastructure handle load better.',
        },
        {
          factor: 'Cache Hit Rate',
          impact: 'Medium',
          explanation:
            'Cached results return instantly. Popular domains are more likely cached. First query is always slower.',
        },
        {
          factor: 'Record Type',
          impact: 'Low',
          explanation: 'Some record types (MX, TXT) may take longer to resolve than simple A records.',
        },
        {
          factor: 'Time of Day',
          impact: 'Low',
          explanation: 'Network congestion varies by time. Test at different times for accurate averages.',
        },
      ],
    },

    optimization: {
      title: 'Optimizing DNS Performance',
      tips: [
        {
          tip: 'Choose the Fastest Resolver for Your Location',
          description:
            'Use this tool to test multiple resolvers and pick the consistently fastest one. Geographic proximity usually helps.',
        },
        {
          tip: 'Configure DNS at Router Level',
          description:
            'Setting DNS at your router applies to all devices on your network and allows router-level caching.',
        },
        {
          tip: 'Use Multiple Resolvers',
          description:
            'Configure primary and secondary DNS servers. If one fails or is slow, the system fails over to the backup.',
        },
        {
          tip: 'Enable DNS Caching',
          description:
            'Most operating systems cache DNS results. Ensure caching is enabled to avoid repeated lookups for the same domains.',
        },
        {
          tip: 'Consider DNS-over-HTTPS (DoH) or DNS-over-TLS (DoT)',
          description:
            'Encrypted DNS prevents ISP snooping but may add slight overhead. Test to see if the privacy benefit is worth it.',
        },
        {
          tip: 'Monitor and Retest Periodically',
          description:
            "Resolver performance changes over time. Retest quarterly to ensure you're still using the best option.",
        },
      ],
    },

    troubleshooting: {
      title: 'Troubleshooting DNS Issues',
      issues: [
        {
          issue: 'All Resolvers Timing Out',
          causes: ['Firewall blocking port 53', 'Network connectivity issues', 'ISP DNS hijacking'],
          solutions: [
            'Check firewall rules for UDP/TCP port 53',
            'Test basic network connectivity',
            'Try DNS over HTTPS (port 443) instead',
          ],
        },
        {
          issue: 'Specific Resolver Always Fails',
          causes: ['ISP blocking resolver', 'Resolver geographic restrictions', 'Temporary outage'],
          solutions: [
            'Try accessing from different network',
            'Check resolver status page',
            'Switch to alternative resolver',
          ],
        },
        {
          issue: 'Inconsistent Performance',
          causes: ['Network congestion', 'Resolver load balancing', 'Cache misses'],
          solutions: [
            'Run multiple tests at different times',
            'Test different record types',
            'Consider using more consistent resolver',
          ],
        },
        {
          issue: 'NXDOMAIN for Valid Domains',
          causes: ['DNSSEC validation failure', 'Resolver filtering', 'Propagation delay'],
          solutions: [
            'Try resolver without DNSSEC',
            'Check if domain is on block list',
            'Wait for DNS propagation (up to 48h)',
          ],
        },
      ],
    },

    bestPractices: {
      title: 'DNS Configuration Best Practices',
      practices: [
        'Always configure at least two DNS servers (primary and secondary)',
        'Choose resolvers from different providers for redundancy',
        'Test resolvers from your actual location, not a VPN',
        'Consider privacy policies when choosing public resolvers',
        'Monitor DNS performance over time, not just once',
        'For businesses, consider running your own caching resolver',
        'Use DNSSEC-validating resolvers for security',
        'Document your DNS configuration for troubleshooting',
      ],
    },

    technicalDetails: {
      title: 'Technical Implementation',
      details: [
        {
          aspect: 'Measurement Method',
          explanation:
            'Response time is measured from query initiation to first byte of response, including network latency and resolver processing time.',
        },
        {
          aspect: 'Timeout Handling',
          explanation:
            'Queries are given 5 seconds to complete. Timeouts indicate severe performance issues or connectivity problems.',
        },
        {
          aspect: 'Parallel Testing',
          explanation: 'All resolvers are tested simultaneously to provide fair comparison and avoid sequential bias.',
        },
        {
          aspect: 'Error Handling',
          explanation:
            'Different error codes (NXDOMAIN, SERVFAIL, REFUSED) are distinguished to help diagnose specific issues.',
        },
      ],
    },
  },

  quickTips: [
    'Lower response time = faster browsing',
    'Test from your actual location for accurate results',
    'Cache hits make subsequent queries much faster',
    'Geographic proximity usually improves performance',
    'Reliability matters as much as speed',
    'Privacy and speed often trade-off - choose wisely',
  ],
};
