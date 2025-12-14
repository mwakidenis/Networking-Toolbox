export const mailTLSContent = {
  title: 'SMTP TLS/STARTTLS Checker',
  description: 'Check if your mail server supports TLS encryption and validate its certificate security',

  sections: {
    whatIsTLS: {
      title: 'What is SMTP TLS?',
      content:
        'Transport Layer Security (TLS) for SMTP encrypts email communications between mail servers and clients, protecting sensitive information from interception. STARTTLS is a command that upgrades a plain text connection to an encrypted one.',
    },

    portInfo: {
      title: 'Common SMTP Ports',
      ports: [
        { port: 25, name: 'SMTP', desc: 'Standard SMTP port, supports STARTTLS', security: 'Optional TLS' },
        { port: 587, name: 'Submission', desc: 'Modern email submission port', security: 'STARTTLS required' },
        { port: 465, name: 'SMTPS', desc: 'Direct TLS/SSL (legacy)', security: 'Implicit TLS' },
      ],
    },

    tlsTypes: {
      title: 'TLS Connection Types',
      types: [
        { name: 'STARTTLS', desc: 'Starts as plaintext, upgrades to TLS', ports: '25, 587' },
        { name: 'Direct TLS (SMTPS)', desc: 'TLS from the start of connection', ports: '465' },
      ],
    },

    certificateFields: {
      title: 'Certificate Information',
      fields: [
        { field: 'Common Name', desc: 'Domain name the certificate is issued for' },
        { field: 'Alternative Names', desc: 'Additional domains covered by this certificate' },
        { field: 'Issuer', desc: 'Certificate Authority that issued the certificate' },
        { field: 'Valid Period', desc: 'Date range when the certificate is valid' },
        { field: 'Fingerprint', desc: 'Unique identifier for this certificate' },
        { field: 'Serial Number', desc: 'Unique serial number assigned by the CA' },
      ],
    },

    security: {
      title: 'Security Considerations',
      points: [
        { point: 'Always Use TLS', desc: 'Unencrypted email can be intercepted and read by attackers' },
        { point: 'Certificate Validation', desc: 'Verify certificates are issued by trusted authorities' },
        { point: 'Check Expiry Dates', desc: 'Expired certificates will cause connection failures' },
        { point: 'Use Modern Ports', desc: 'Port 587 with STARTTLS is the recommended standard' },
      ],
    },

    troubleshooting: {
      title: 'Common Issues',
      issues: [
        { issue: 'No STARTTLS Support', solution: 'Server may not support encryption or firewall blocking' },
        { issue: 'Certificate Mismatch', solution: "Certificate domain doesn't match server hostname" },
        { issue: 'Expired Certificate', solution: 'Certificate needs to be renewed' },
        { issue: 'Connection Timeout', solution: 'Port may be blocked by firewall or wrong port number' },
      ],
    },
  },

  quickTips: [
    'Port 587 with STARTTLS is the modern standard for email submission',
    'Port 465 uses direct TLS (no STARTTLS command needed)',
    'Port 25 is primarily for server-to-server communication',
    'Some ISPs block port 25 to prevent spam',
    'Certificate should match your mail server hostname',
    'Enable DANE/DNSSEC for additional security',
  ],
};
