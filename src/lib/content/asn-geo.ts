export const asnGeoContent = {
  title: 'ASN & Geolocation Lookup',
  description: 'Look up IP address geolocation, ISP, and autonomous system information',
  sections: {
    whatIsGeoIP: {
      title: 'What is IP Geolocation?',
      content:
        'IP geolocation is the mapping of an IP address to its real-world geographic location. Combined with ASN (Autonomous System Number) data, it provides comprehensive information about the network ownership, ISP, and approximate physical location of an IP address.',
    },
    howItWorks: {
      title: 'How Geolocation Works',
      content: 'Geolocation databases map IP address ranges to locations by combining data from:',
      steps: [
        'Regional Internet Registries (RIRs) - Provide IP allocation data',
        'ISP registration records - Organization and network details',
        'User-submitted data - Crowdsourced location corrections',
        'Active probing - Latency measurements and traceroutes',
        'Wi-Fi and mobile data - Location signals from devices',
      ],
    },
    dataProvided: {
      title: 'Information Provided',
      categories: [
        {
          category: 'Network Information',
          fields: [
            { field: 'ASN', description: 'Autonomous System Number of the network' },
            { field: 'Organization', description: 'Network owner or operator' },
            { field: 'ISP', description: 'Internet Service Provider name' },
          ],
        },
        {
          category: 'Geographic Location',
          fields: [
            { field: 'Country', description: 'Country name and code' },
            { field: 'Region/State', description: 'Administrative region' },
            { field: 'City', description: 'City name (approximate)' },
            { field: 'Coordinates', description: 'Latitude and longitude' },
            { field: 'Timezone', description: 'Local timezone identifier' },
          ],
        },
        {
          category: 'Connection Type',
          fields: [
            { field: 'Mobile', description: 'Whether the IP is from a mobile network' },
            { field: 'Proxy', description: 'If the IP is a known proxy/VPN' },
            { field: 'Hosting', description: 'If the IP belongs to a datacenter/hosting provider' },
          ],
        },
      ],
    },
    accuracy: {
      title: 'Accuracy Considerations',
      levels: [
        {
          level: 'Country',
          accuracy: '95-99%',
          description: 'Very high accuracy for country-level identification',
        },
        {
          level: 'Region/State',
          accuracy: '75-85%',
          description: 'Good accuracy but can vary by country and ISP',
        },
        {
          level: 'City',
          accuracy: '50-75%',
          description: 'Moderate accuracy; actual location may be in nearby cities',
        },
        {
          level: 'Coordinates',
          accuracy: '10-50 km radius',
          description: 'Approximate location; not precise enough for exact addresses',
        },
      ],
    },
    useCases: {
      title: 'Common Use Cases',
      cases: [
        {
          scenario: 'Content Localization',
          use: 'Serve region-appropriate content and language',
          action: 'Check country and timezone for automatic localization',
        },
        {
          scenario: 'Fraud Detection',
          use: 'Identify suspicious access patterns',
          action: 'Compare login location with user profile and detect proxies',
        },
        {
          scenario: 'Analytics & Insights',
          use: 'Understand user demographics and traffic sources',
          action: 'Analyze geographic distribution of visitors',
        },
        {
          scenario: 'Compliance & Restrictions',
          use: 'Enforce geographic access policies',
          action: 'Block or allow access based on country or region',
        },
        {
          scenario: 'Network Troubleshooting',
          use: 'Identify network path and routing issues',
          action: 'Check ISP, ASN, and location of problem connections',
        },
        {
          scenario: 'Security Analysis',
          use: 'Detect datacenter/proxy usage',
          action: 'Flag hosting and proxy IPs for additional verification',
        },
      ],
    },
    limitations: {
      title: 'Limitations & Privacy',
      points: [
        {
          limitation: 'Not Precise Location',
          description:
            'IP geolocation cannot pinpoint exact addresses or buildings. Accuracy is typically at city level or broader.',
        },
        {
          limitation: 'VPNs and Proxies',
          description:
            'Users with VPNs or proxies will appear to be in the VPN server location, not their actual location.',
        },
        {
          limitation: 'Mobile Networks',
          description:
            'Mobile IPs may show central office locations rather than user location due to carrier-grade NAT.',
        },
        {
          limitation: 'Dynamic IPs',
          description: 'IP addresses can be reassigned, so historical data may not reflect current location.',
        },
        {
          limitation: 'Privacy Concerns',
          description: 'Geolocation can reveal general location; always handle with appropriate privacy safeguards.',
        },
      ],
    },
    asnExplained: {
      title: 'Understanding ASN Data',
      content:
        'An Autonomous System Number (ASN) identifies a network on the Internet. Each ASN represents a collection of IP prefixes under common administrative control.',
      aspects: [
        {
          aspect: 'Network Ownership',
          description: 'ASN reveals which organization operates the network',
          example: 'AS15169 belongs to Google LLC',
        },
        {
          aspect: 'ISP Identification',
          description: 'Identifies the Internet Service Provider',
          example: 'Residential users typically share ISP ASN',
        },
        {
          aspect: 'Routing Analysis',
          description: 'ASN is crucial for BGP routing and peering',
          example: 'Large networks may have multiple ASNs',
        },
        {
          aspect: 'Network Type',
          description: 'ASN can indicate hosting, residential, or mobile networks',
          example: 'Datacenter ASNs often host multiple services',
        },
      ],
    },
    bestPractices: {
      title: 'Best Practices',
      practices: [
        {
          practice: 'Never Rely Solely on Geolocation',
          description: 'Use as one signal among many, not the sole decision factor',
          reason: 'Accuracy varies and can be circumvented',
        },
        {
          practice: 'Cache Results Appropriately',
          description: 'Cache geolocation data but refresh periodically',
          reason: 'IP allocations change over time',
        },
        {
          practice: 'Handle Privacy Responsibly',
          description: 'Be transparent about geolocation usage',
          reason: 'Users have privacy expectations and legal rights',
        },
        {
          practice: 'Consider Proxy Detection',
          description: 'Check hosting and proxy flags for security decisions',
          reason: 'Helps identify potentially suspicious traffic',
        },
        {
          practice: 'Combine Multiple Data Points',
          description: 'Use geolocation with other signals (browser, language, etc.)',
          reason: 'Improves accuracy and reduces false positives',
        },
      ],
    },
    dataSource: {
      title: 'About IP-API',
      content:
        'This tool uses IP-API.com, a free geolocation API that provides accurate location data sourced from multiple regional registries and ISP databases.',
      features: [
        'Supports both IPv4 and IPv6 addresses',
        'Country, region, city, and coordinate data',
        'ISP, organization, and ASN information',
        'Mobile, proxy, and hosting detection',
        'Timezone identification',
        'No authentication required for basic usage',
      ],
    },
  },
  quickTips: [
    'City-level accuracy is approximate; actual location may vary by 10-50km',
    'VPN users will appear in the VPN server location, not their real location',
    'Mobile IPs often show carrier hub locations due to CGNAT',
    'Hosting flag indicates datacenter IPs (servers, cloud instances)',
    'Proxy flag helps identify VPN, proxy, and anonymization services',
    'ASN reveals network ownership; same ASN often means same organization',
    'Coordinates are based on IP allocation, not GPS or device location',
    'Timezone data is useful for scheduling and displaying local times',
  ],
};
