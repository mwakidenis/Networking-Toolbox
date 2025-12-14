export const tlsHandshakeContent = {
  title: 'TLS Handshake Analyzer',
  description: 'Analyze TLS/SSL handshake timing and certificate exchange details',
  sections: {
    whatIsHandshake: {
      title: 'What is a TLS Handshake?',
      content:
        'The TLS handshake is the process where a client and server establish a secure connection by negotiating encryption parameters, verifying identities, and exchanging keys. This process happens before any application data is transmitted.',
    },
    handshakePhases: {
      title: 'Handshake Phases',
      phases: [
        {
          phase: 'TCP Connection',
          description: 'Establishes the underlying TCP connection using a three-way handshake',
          typical: '10-50ms',
        },
        {
          phase: 'ClientHello',
          description: 'Client sends supported TLS versions, cipher suites, and extensions to the server',
          typical: '<1ms',
        },
        {
          phase: 'ServerHello',
          description: 'Server responds with chosen TLS version, cipher suite, and certificate',
          typical: '20-100ms',
        },
        {
          phase: 'Certificate Verification',
          description: 'Client validates server certificate chain and checks for revocation',
          typical: '10-50ms',
        },
        {
          phase: 'Key Exchange',
          description: 'Client and server exchange key material to derive session keys',
          typical: '10-30ms',
        },
        {
          phase: 'Finished',
          description: 'Both sides confirm the handshake completed successfully',
          typical: '<1ms',
        },
      ],
    },
    tlsVersions: {
      title: 'TLS Protocol Versions',
      versions: [
        {
          version: 'TLS 1.3',
          status: 'Current',
          description: 'Fastest and most secure, 1-RTT handshake',
          recommendation: 'Preferred',
        },
        {
          version: 'TLS 1.2',
          status: 'Legacy',
          description: 'Widely supported, 2-RTT handshake',
          recommendation: 'Acceptable',
        },
        {
          version: 'TLS 1.1 / 1.0',
          status: 'Deprecated',
          description: 'Outdated and vulnerable',
          recommendation: 'Avoid',
        },
        {
          version: 'SSLv3',
          status: 'Insecure',
          description: 'Severely compromised by POODLE',
          recommendation: 'Disable',
        },
      ],
    },
    cipherSuites: {
      title: 'Cipher Suites',
      content:
        'A cipher suite defines the algorithms used for key exchange, authentication, encryption, and message integrity. Modern suites use ECDHE for key exchange, RSA/ECDSA for authentication, and AES-GCM for encryption.',
      components: [
        { component: 'Key Exchange', example: 'ECDHE, DHE, RSA', purpose: 'Establish shared secret' },
        {
          component: 'Authentication',
          example: 'RSA, ECDSA, PSK',
          purpose: 'Verify server identity',
        },
        {
          component: 'Encryption',
          example: 'AES-128-GCM, AES-256-GCM, ChaCha20',
          purpose: 'Protect data confidentiality',
        },
        {
          component: 'Message Authentication',
          example: 'SHA256, SHA384, Poly1305',
          purpose: 'Ensure data integrity',
        },
      ],
    },
    performanceFactors: {
      title: 'Performance Factors',
      factors: [
        {
          factor: 'Network Latency',
          impact: 'High',
          description: 'Round-trip time (RTT) multiplied by number of handshake round trips',
        },
        {
          factor: 'Certificate Chain Length',
          impact: 'Medium',
          description: 'Longer chains require more validation and transfer time',
        },
        {
          factor: 'Key Exchange Algorithm',
          impact: 'Medium',
          description: 'ECDHE is faster than RSA key exchange',
        },
        {
          factor: 'TLS Version',
          impact: 'High',
          description: 'TLS 1.3 requires only 1 RTT vs 2 RTT for TLS 1.2',
        },
        {
          factor: 'Server Performance',
          impact: 'Low',
          description: 'Modern servers handle cryptographic operations efficiently',
        },
      ],
    },
    optimization: {
      title: 'Handshake Optimization',
      techniques: [
        {
          technique: 'TLS Session Resumption',
          description: 'Reuse previous session keys to skip full handshake',
          benefit: 'Reduces handshake to 0-RTT or 1-RTT',
        },
        {
          technique: 'OCSP Stapling',
          description: 'Server provides certificate revocation status',
          benefit: 'Eliminates client OCSP lookup latency',
        },
        {
          technique: 'Certificate Chain Optimization',
          description: 'Minimize certificate chain length',
          benefit: 'Reduces data transfer and validation time',
        },
        {
          technique: 'HTTP/2 or HTTP/3',
          description: 'Multiplexing over single TLS connection',
          benefit: 'Amortizes handshake cost across requests',
        },
        {
          technique: 'TLS 1.3 Adoption',
          description: 'Use latest TLS version',
          benefit: '50% faster handshake than TLS 1.2',
        },
      ],
    },
    commonIssues: {
      title: 'Common Issues',
      issues: [
        {
          issue: 'Slow Handshake Time',
          causes: ['High network latency', 'Old TLS version', 'Long certificate chain'],
          solution: 'Upgrade to TLS 1.3, optimize certificate chain, use CDN',
        },
        {
          issue: 'Handshake Failures',
          causes: ['Cipher suite mismatch', 'Expired certificate', 'Protocol version incompatibility'],
          solution: 'Check server configuration, renew certificate, support multiple TLS versions',
        },
        {
          issue: 'Certificate Errors',
          causes: ['Invalid chain', 'Hostname mismatch', 'Untrusted CA'],
          solution: 'Verify certificate chain, check SAN entries, use trusted CA',
        },
      ],
    },
    security: {
      title: 'Security Considerations',
      points: [
        {
          point: 'Forward Secrecy',
          description: 'Use ECDHE/DHE key exchange to protect past sessions if private key is compromised',
        },
        {
          point: 'Strong Cipher Suites',
          description: 'Disable weak ciphers like RC4, 3DES, and prefer AEAD ciphers like AES-GCM',
        },
        {
          point: 'Certificate Validation',
          description: 'Always validate server certificates including hostname, expiry, and chain of trust',
        },
        {
          point: 'Protocol Downgrade Protection',
          description: 'Prevent attackers from forcing use of older, vulnerable TLS versions',
        },
      ],
    },
  },
  quickTips: [
    'TLS 1.3 handshakes are roughly 50% faster than TLS 1.2',
    'Session resumption can eliminate handshake latency for repeat connections',
    'Network latency is the biggest factor in handshake time',
    'ECDHE key exchange provides forward secrecy and good performance',
    'Certificate chain should ideally be 2-3 certificates maximum',
    'OCSP stapling eliminates additional round trips for revocation checks',
    'Modern cipher suites like AES-GCM offer both speed and security',
  ],
};
