export const mtuMssContent = {
  title: 'Common MTU/MSS Values',
  description:
    'Reference for Maximum Transmission Unit (MTU) and Maximum Segment Size (MSS) values across different network types.',

  sections: {
    overview: {
      title: 'MTU vs MSS',
      content: `MTU (Maximum Transmission Unit) is the largest packet size that can be transmitted over a network link without fragmentation. MSS (Maximum Segment Size) is the largest amount of TCP data that can be sent in a single segment.

The relationship is: MSS = MTU - IP Header - TCP Header
For IPv4: MSS = MTU - 20 - 20 = MTU - 40 bytes`,
    },
  },

  commonValues: [
    {
      medium: 'Ethernet',
      mtu: 1500,
      mss: 1460,
      notes: 'Standard Ethernet II frame size',
      usage: 'Most common in LANs and internet',
    },
    {
      medium: 'PPPoE (DSL)',
      mtu: 1492,
      mss: 1452,
      notes: 'PPP over Ethernet adds 8 bytes overhead',
      usage: 'Common for DSL broadband connections',
    },
    {
      medium: 'Jumbo Frames',
      mtu: 9000,
      mss: 8960,
      notes: 'Larger frames for high-performance networks',
      usage: 'Data centers, storage networks',
    },
    {
      medium: '802.11 WiFi',
      mtu: 1500,
      mss: 1460,
      notes: 'Same as Ethernet for compatibility',
      usage: 'Wireless LANs',
    },
    {
      medium: 'VPN (typical)',
      mtu: 1436,
      mss: 1396,
      notes: 'Varies by VPN protocol and encryption',
      usage: 'IPSec, OpenVPN, WireGuard tunnels',
    },
    {
      medium: 'GRE Tunnel',
      mtu: 1476,
      mss: 1436,
      notes: 'GRE adds 24 bytes of overhead',
      usage: 'Generic routing encapsulation',
    },
    {
      medium: 'IPv6 over IPv4',
      mtu: 1480,
      mss: 1440,
      notes: '6in4 tunneling overhead',
      usage: 'IPv6 transition mechanisms',
    },
    {
      medium: 'MPLS',
      mtu: 1496,
      mss: 1456,
      notes: 'MPLS label adds 4 bytes per label',
      usage: 'Service provider networks',
    },
  ],

  calculations: {
    title: 'MTU/MSS Calculation Examples',
    examples: [
      {
        scenario: 'Standard Ethernet',
        mtu: 1500,
        ipHeader: 20,
        tcpHeader: 20,
        mss: 1460,
        calculation: '1500 - 20 (IP) - 20 (TCP) = 1460',
      },
      {
        scenario: 'IPv6 Ethernet',
        mtu: 1500,
        ipHeader: 40,
        tcpHeader: 20,
        mss: 1440,
        calculation: '1500 - 40 (IPv6) - 20 (TCP) = 1440',
      },
      {
        scenario: 'PPPoE Connection',
        mtu: 1492,
        ipHeader: 20,
        tcpHeader: 20,
        mss: 1452,
        calculation: '1492 - 20 (IP) - 20 (TCP) = 1452',
      },
    ],
  },

  overheads: [
    { protocol: 'Ethernet Header', overhead: 14, notes: 'Destination MAC, Source MAC, EtherType' },
    { protocol: 'IPv4 Header', overhead: 20, notes: 'Minimum size, can be larger with options' },
    { protocol: 'IPv6 Header', overhead: 40, notes: 'Fixed size header' },
    { protocol: 'TCP Header', overhead: 20, notes: 'Minimum size, can be larger with options' },
    { protocol: 'UDP Header', overhead: 8, notes: 'Fixed size header' },
    { protocol: 'PPPoE', overhead: 8, notes: 'PPP over Ethernet encapsulation' },
    { protocol: 'GRE', overhead: 24, notes: 'Generic Routing Encapsulation' },
    { protocol: 'IPSec ESP', overhead: '24-32', notes: 'Varies by encryption and authentication' },
    { protocol: 'MPLS Label', overhead: 4, notes: 'Per MPLS label in stack' },
  ],

  discovery: {
    title: 'Path MTU Discovery',
    description: 'Mechanism to find the largest MTU along a network path',
    process: [
      "Send packets with Don't Fragment (DF) bit set",
      'If packet is too large, router sends ICMP Fragmentation Needed',
      'Sender reduces packet size and tries again',
      'Continue until packet goes through successfully',
      'Cache the discovered MTU for the destination',
    ],
    issues: [
      'Firewalls blocking ICMP can break PMTU discovery',
      "Results in 'black hole' where large packets are silently dropped",
      'TCP MSS clamping can work around this issue',
    ],
  },

  troubleshooting: [
    {
      issue: 'Slow file transfers over VPN',
      cause: 'Large packets being fragmented due to VPN overhead',
      solution: 'Reduce MTU on VPN interface or enable MSS clamping',
    },
    {
      issue: 'Web pages not loading completely',
      cause: 'PMTU discovery failing, large packets dropped',
      solution: 'Check firewall ICMP rules or reduce interface MTU',
    },
    {
      issue: 'Poor performance on jumbo frame network',
      cause: 'One device not supporting jumbo frames',
      solution: 'Ensure all devices in path support same MTU size',
    },
  ],

  bestPractices: [
    'Use consistent MTU sizes across network segments',
    'Test MTU discovery with ping -f -l [size] (Windows) or ping -M do -s [size] (Linux)',
    'Configure MSS clamping on routers for VPN/tunneled traffic',
    'Monitor for fragmentation in network statistics',
    'Document MTU requirements for different network segments',
    'Consider jumbo frames for high-throughput applications',
  ],

  commands: [
    {
      platform: 'Windows',
      command: 'netsh interface ipv4 show subinterfaces',
      purpose: 'Show MTU for all interfaces',
    },
    {
      platform: 'Linux',
      command: 'ip link show',
      purpose: 'Display interface MTU settings',
    },
    {
      platform: 'macOS',
      command: 'ifconfig',
      purpose: 'Show interface configuration including MTU',
    },
    {
      platform: 'Cisco IOS',
      command: 'show interfaces',
      purpose: 'Display interface MTU values',
    },
  ],

  testCommands: [
    {
      platform: 'Windows',
      command: 'ping -f -l 1472 8.8.8.8',
      purpose: 'Test maximum packet size (1472 + 28 headers = 1500 MTU)',
    },
    {
      platform: 'Linux',
      command: 'ping -M do -s 1472 8.8.8.8',
      purpose: "Test with Don't Fragment bit set",
    },
    {
      platform: 'Any',
      command: 'tracepath destination',
      purpose: 'Discover path MTU to destination',
    },
  ],

  quickReference: [
    'Standard Ethernet: 1500 MTU / 1460 MSS',
    'PPPoE/DSL: 1492 MTU / 1452 MSS',
    'Jumbo Frames: 9000 MTU / 8960 MSS',
    'VPN (typical): 1436 MTU / 1396 MSS',
  ],
};
