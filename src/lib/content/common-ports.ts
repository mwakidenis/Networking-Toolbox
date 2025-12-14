export const commonPortsContent = {
  title: 'Common TCP/UDP Ports',
  description: 'Quick reference for the most frequently used TCP and UDP port numbers.',

  wellKnown: [
    { port: 20, protocol: 'TCP', service: 'FTP Data', description: 'File Transfer Protocol data channel' },
    { port: 21, protocol: 'TCP', service: 'FTP Control', description: 'File Transfer Protocol control channel' },
    { port: 22, protocol: 'TCP', service: 'SSH', description: 'Secure Shell remote login' },
    { port: 23, protocol: 'TCP', service: 'Telnet', description: 'Telnet remote login (insecure)' },
    { port: 25, protocol: 'TCP', service: 'SMTP', description: 'Simple Mail Transfer Protocol' },
    { port: 53, protocol: 'TCP/UDP', service: 'DNS', description: 'Domain Name System' },
    { port: 67, protocol: 'UDP', service: 'DHCP Server', description: 'Dynamic Host Configuration Protocol server' },
    { port: 68, protocol: 'UDP', service: 'DHCP Client', description: 'Dynamic Host Configuration Protocol client' },
    { port: 69, protocol: 'UDP', service: 'TFTP', description: 'Trivial File Transfer Protocol' },
    { port: 80, protocol: 'TCP', service: 'HTTP', description: 'Hypertext Transfer Protocol' },
    { port: 110, protocol: 'TCP', service: 'POP3', description: 'Post Office Protocol v3' },
    { port: 123, protocol: 'UDP', service: 'NTP', description: 'Network Time Protocol' },
    { port: 143, protocol: 'TCP', service: 'IMAP', description: 'Internet Message Access Protocol' },
    { port: 161, protocol: 'UDP', service: 'SNMP Agent', description: 'Simple Network Management Protocol' },
    { port: 162, protocol: 'UDP', service: 'SNMP Manager', description: 'SNMP trap messages' },
    { port: 443, protocol: 'TCP', service: 'HTTPS', description: 'HTTP over TLS/SSL' },
    { port: 993, protocol: 'TCP', service: 'IMAPS', description: 'IMAP over TLS/SSL' },
    { port: 995, protocol: 'TCP', service: 'POP3S', description: 'POP3 over TLS/SSL' },
  ],

  registered: [
    { port: 179, protocol: 'TCP', service: 'BGP', description: 'Border Gateway Protocol' },
    { port: 389, protocol: 'TCP', service: 'LDAP', description: 'Lightweight Directory Access Protocol' },
    { port: 636, protocol: 'TCP', service: 'LDAPS', description: 'LDAP over TLS/SSL' },
    { port: 989, protocol: 'TCP', service: 'FTPS Data', description: 'FTP over TLS/SSL data' },
    { port: 990, protocol: 'TCP', service: 'FTPS Control', description: 'FTP over TLS/SSL control' },
    { port: 1433, protocol: 'TCP', service: 'MS SQL Server', description: 'Microsoft SQL Server' },
    { port: 1521, protocol: 'TCP', service: 'Oracle DB', description: 'Oracle Database' },
    { port: 1723, protocol: 'TCP', service: 'PPTP', description: 'Point-to-Point Tunneling Protocol' },
    { port: 3306, protocol: 'TCP', service: 'MySQL', description: 'MySQL Database' },
    { port: 3389, protocol: 'TCP', service: 'RDP', description: 'Remote Desktop Protocol' },
    { port: 5432, protocol: 'TCP', service: 'PostgreSQL', description: 'PostgreSQL Database' },
    { port: 5900, protocol: 'TCP', service: 'VNC', description: 'Virtual Network Computing' },
  ],

  dynamic: [
    { port: 8080, protocol: 'TCP', service: 'HTTP Alt', description: 'Alternative HTTP port' },
    { port: 8443, protocol: 'TCP', service: 'HTTPS Alt', description: 'Alternative HTTPS port' },
    { port: 9090, protocol: 'TCP', service: 'Web Admin', description: 'Common web admin interface' },
  ],

  categories: {
    web: [
      { ports: '80, 8080', service: 'HTTP', secure: false },
      { ports: '443, 8443', service: 'HTTPS', secure: true },
    ],
    email: [
      { ports: '25', service: 'SMTP', secure: false },
      { ports: '587', service: 'SMTP (submission)', secure: true },
      { ports: '110', service: 'POP3', secure: false },
      { ports: '995', service: 'POP3S', secure: true },
      { ports: '143', service: 'IMAP', secure: false },
      { ports: '993', service: 'IMAPS', secure: true },
    ],
    remote: [
      { ports: '22', service: 'SSH', secure: true },
      { ports: '23', service: 'Telnet', secure: false },
      { ports: '3389', service: 'RDP', secure: false },
      { ports: '5900+', service: 'VNC', secure: false },
    ],
    database: [
      { ports: '1433', service: 'SQL Server', secure: false },
      { ports: '1521', service: 'Oracle', secure: false },
      { ports: '3306', service: 'MySQL', secure: false },
      { ports: '5432', service: 'PostgreSQL', secure: false },
    ],
  },

  ranges: [
    { range: '0-1023', name: 'Well-Known Ports', description: 'System/privileged services, require root' },
    { range: '1024-49151', name: 'Registered Ports', description: 'Registered with IANA for specific services' },
    { range: '49152-65535', name: 'Dynamic/Private', description: 'Ephemeral ports for client connections' },
  ],

  tips: [
    'Ports below 1024 typically require administrator privileges',
    'HTTPS is HTTP + TLS/SSL encryption (port 443)',
    'SSH (22) is the secure replacement for Telnet (23)',
    'Email uses multiple ports: 25 (SMTP), 110 (POP3), 143 (IMAP)',
    "Add 'S' suffix for secure versions: HTTPS, FTPS, IMAPS, POP3S",
    'Database ports are often targeted by attackers - secure them well',
  ],
};
