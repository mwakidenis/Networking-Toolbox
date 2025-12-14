export const ctLogContent = {
  title: 'Certificate Transparency Log Search',
  description: 'Search Certificate Transparency logs to discover all certificates issued for a domain',
  sections: {
    whatIsCT: {
      title: 'What is Certificate Transparency?',
      content:
        'Certificate Transparency (CT) is an open framework for monitoring and auditing SSL/TLS certificates. All publicly-trusted Certificate Authorities are required to log certificates to public CT logs, creating an append-only, cryptographically-assured record of all certificates issued.',
    },
    benefits: {
      title: 'Benefits of CT Logs',
      benefits: [
        {
          benefit: 'Security Monitoring',
          description: 'Detect unauthorized or mis-issued certificates for your domains in real-time',
        },
        {
          benefit: 'Asset Discovery',
          description:
            'Discover all subdomains and hostnames that have certificates, useful for inventory and security audits',
        },
        {
          benefit: 'Certificate Management',
          description: 'Track certificate renewals, expirations, and issuer patterns across your infrastructure',
        },
        {
          benefit: 'Compliance & Auditing',
          description: 'Maintain compliance by ensuring only authorized CAs issue certificates for your domains',
        },
      ],
    },
    useCases: {
      title: 'Common Use Cases',
      cases: [
        {
          useCase: 'Subdomain Enumeration',
          description: 'Discover all subdomains for a domain by analyzing SANs in issued certificates',
          example: 'Security teams use this for attack surface mapping',
        },
        {
          useCase: 'Mis-issuance Detection',
          description: 'Identify certificates issued by unauthorized CAs or for unexpected hostnames',
          example: 'Detect phishing domains or internal names leaked to public logs',
        },
        {
          useCase: 'Certificate Lifecycle Tracking',
          description: 'Monitor certificate renewals, track expiration dates, and plan migrations',
          example: 'DevOps teams use this to prevent outages from expired certificates',
        },
        {
          useCase: 'CA Diversity Analysis',
          description: 'Understand which CAs are issuing certificates for your organization',
          example: 'Compliance teams verify approved CA usage',
        },
      ],
    },
    certificateFields: {
      title: 'Key Certificate Fields',
      fields: [
        {
          field: 'Common Name (CN)',
          description: 'Primary domain name the certificate is issued for',
        },
        {
          field: 'Subject Alternative Names (SANs)',
          description: 'Additional hostnames covered by the certificate, including wildcards',
        },
        {
          field: 'Issuer',
          description: "Certificate Authority that issued the certificate (e.g., Let's Encrypt, DigiCert)",
        },
        {
          field: 'Validity Period',
          description: 'Start (Not Before) and end (Not After) dates when the certificate is valid',
        },
        {
          field: 'Serial Number',
          description: 'Unique identifier assigned by the CA, used for revocation lookups',
        },
        {
          field: 'Entry Timestamp',
          description: 'When the certificate was logged to CT, which may differ from issuance date',
        },
      ],
    },
    security: {
      title: 'Security Considerations',
      points: [
        {
          point: 'CT Logs are Public',
          description:
            'All logged certificates are publicly visible. Avoid including sensitive hostnames in SANs if they should remain private.',
        },
        {
          point: 'Monitor for Unexpected Issuance',
          description:
            'Regularly check CT logs for your domains to detect phishing attempts or unauthorized certificates.',
        },
        {
          point: 'CAA Records',
          description: 'Use DNS CAA records to restrict which CAs can issue certificates for your domains.',
        },
        {
          point: 'Certificate Pinning',
          description: 'For high-security applications, consider certificate pinning to prevent MITM attacks.',
        },
      ],
    },
    bestPractices: {
      title: 'Best Practices',
      practices: [
        {
          practice: 'Regular Monitoring',
          description: 'Periodically search CT logs for your domains to detect anomalies',
        },
        {
          practice: 'Automate Alerts',
          description: 'Set up automated monitoring to alert on new certificate issuance',
        },
        {
          practice: 'Review SANs Carefully',
          description: 'Ensure certificates only include necessary hostnames to minimize exposure',
        },
        {
          practice: 'Track Expiration Dates',
          description: 'Monitor certificates expiring soon to prevent service disruptions',
        },
        {
          practice: 'Validate Issuers',
          description: 'Ensure only authorized CAs are issuing certificates for your domains',
        },
      ],
    },
  },
  quickTips: [
    'CT logs are append-only and cannot be modified or deleted',
    'Wildcard certificates (*.example.com) cover all subdomains',
    'Internal hostnames in SANs become publicly visible via CT logs',
    'Most browsers require CT compliance for certificates to be trusted',
    'crt.sh searches multiple CT log servers for comprehensive results',
    'Certificate issuance != activation - check validity dates carefully',
    'Use CAA records to specify which CAs can issue for your domain',
  ],
};
