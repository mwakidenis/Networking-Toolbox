export const cgnatContent = {
  title: 'Carrier-Grade NAT Explained',
  description: 'Understanding CGNAT (100.64.0.0/10), how to identify it, and its impact on network services.',

  sections: {
    overview: {
      title: 'What is Carrier-Grade NAT?',
      content: `Carrier-Grade NAT (CGNAT) is a large-scale NAT implementation used by ISPs to share a single public IPv4 address among multiple customers. It's also called Large Scale NAT (LSN) or NAT444.

CGNAT became necessary due to IPv4 address exhaustion - there simply aren't enough public IPv4 addresses for every device to have its own.`,
    },

    why: {
      title: 'Why Do ISPs Use CGNAT?',
      content: `ISPs use CGNAT because:
- IPv4 addresses are expensive and scarce
- Customer demand for internet connectivity continues to grow
- Each customer may have multiple devices needing internet access
- Transitioning to IPv6 takes time and planning

CGNAT allows ISPs to serve more customers with fewer public IPv4 addresses.`,
    },
  },

  addressRange: {
    range: '100.64.0.0/10',
    fullRange: '100.64.0.0 to 100.127.255.255',
    totalAddresses: '4,194,304 addresses',
    rfc: 'RFC 6598',
    purpose: 'Shared Address Space for ISP CGNAT deployments',

    breakdown: [
      { network: '100.64.0.0/12', addresses: '1,048,576', use: 'Large ISP CGNAT pool' },
      { network: '100.80.0.0/12', addresses: '1,048,576', use: 'Large ISP CGNAT pool' },
      { network: '100.96.0.0/12', addresses: '1,048,576', use: 'Large ISP CGNAT pool' },
      { network: '100.112.0.0/12', addresses: '1,048,576', use: 'Large ISP CGNAT pool' },
    ],
  },

  howItWorks: {
    title: 'How CGNAT Works',
    description: 'CGNAT creates a two-layer NAT system',

    layers: [
      {
        layer: 'Customer NAT',
        location: 'Home router',
        inside: 'Private addresses (192.168.x.x, 10.x.x.x)',
        outside: 'CGNAT address (100.64.x.x)',
        purpose: 'Translate devices to CGNAT address',
      },
      {
        layer: 'Carrier NAT',
        location: 'ISP equipment',
        inside: 'CGNAT addresses (100.64.x.x)',
        outside: 'Public IPv4 addresses',
        purpose: 'Translate many customers to shared public IPs',
      },
    ],

    flow: [
      'Device (192.168.1.100) sends packet to internet',
      'Home router NATs to CGNAT address (100.64.50.200)',
      'ISP CGNAT translates to public IP (203.0.113.1) with unique port',
      'Internet sees traffic from 203.0.113.1:45678',
      'Return traffic follows reverse path with port mapping',
    ],
  },

  identification: {
    title: 'How to Spot CGNAT',

    methods: [
      {
        method: 'Check WAN IP on Router',
        description: "Look at your router's WAN/Internet IP address",
        cgnatIndicator: 'IP address in 100.64.0.0/10 range',
        normalIndicator: 'Public IP address not in private ranges',
      },
      {
        method: 'Compare Router IP vs Public IP',
        description: 'Check what the internet sees vs router WAN IP',
        cgnatIndicator: 'Different addresses (router shows 100.64.x.x, internet sees public IP)',
        normalIndicator: 'Same address (router and internet see same public IP)',
      },
      {
        method: 'Port Forwarding Behavior',
        description: 'Try to set up port forwarding',
        cgnatIndicator: "Port forwarding doesn't work from internet",
        normalIndicator: 'Port forwarding works normally',
      },
      {
        method: 'Online IP Detection',
        description: 'Use whatismyipaddress.com and compare',
        cgnatIndicator: 'Website shows different IP than router WAN IP',
        normalIndicator: 'Website shows same IP as router WAN IP',
      },
    ],
  },

  impacts: {
    negative: [
      {
        impact: 'No Inbound Connections',
        description: 'Cannot host servers or accept incoming connections',
        affectedServices: ['Web servers', 'Game servers', 'VPN servers', 'Remote access'],
        workaround: 'Use cloud services or VPN tunnels',
      },
      {
        impact: 'Port Forwarding Broken',
        description: "Router port forwarding rules don't work from internet",
        affectedServices: ['Gaming consoles', 'Security cameras', 'Home automation'],
        workaround: 'Use UPnP alternatives or cloud-based solutions',
      },
      {
        impact: 'Geolocation Issues',
        description: 'Your location may appear incorrect online',
        affectedServices: ['Streaming services', 'Local search', 'Weather'],
        workaround: 'Contact service providers or use location services',
      },
      {
        impact: 'Gaming Problems',
        description: 'Multiplayer gaming may have connectivity issues',
        affectedServices: ['Console gaming', 'P2P games', 'Voice chat'],
        workaround: 'Use gaming VPN or contact ISP for gaming package',
      },
      {
        impact: 'VPN Issues',
        description: 'Some VPN protocols may not work properly',
        affectedServices: ['PPTP', 'L2TP', 'Some OpenVPN configs'],
        workaround: 'Use VPN protocols that work through NAT',
      },
    ],

    positive: [
      'Extends IPv4 address availability',
      'Allows ISPs to serve more customers',
      'Provides some security through address hiding',
      'Reduces need for expensive IPv4 addresses',
      'Enables ISPs to offer affordable internet service',
    ],
  },

  workarounds: [
    {
      solution: 'Request Public IP from ISP',
      description: 'Ask ISP for dedicated public IP (usually costs extra)',
      effectiveness: 'Complete solution',
      cost: 'Usually $5-20/month additional',
    },
    {
      solution: 'Use IPv6',
      description: 'Enable IPv6 on router and devices',
      effectiveness: 'Works for IPv6-enabled services',
      cost: 'Free, but limited service support',
    },
    {
      solution: 'VPN with Port Forwarding',
      description: 'Use VPN service that provides port forwarding',
      effectiveness: 'Good for specific services',
      cost: 'VPN subscription fee',
    },
    {
      solution: 'Reverse Proxy Services',
      description: 'Use services like ngrok, Cloudflare Tunnel',
      effectiveness: 'Good for web services',
      cost: 'Varies, some free tiers available',
    },
    {
      solution: 'Cloud Hosting',
      description: 'Move services to cloud providers',
      effectiveness: 'Complete solution for hosting',
      cost: 'Ongoing cloud hosting fees',
    },
  ],

  troubleshooting: [
    {
      issue: 'Gaming Console NAT Type Strict',
      cause: 'CGNAT prevents direct peer-to-peer connections',
      diagnosis: 'Check console network settings for NAT type',
      solution: 'Enable UPnP on router, consider gaming VPN, or request public IP',
    },
    {
      issue: 'Security Cameras Not Accessible Remotely',
      cause: 'CGNAT blocks inbound connections to cameras',
      diagnosis: 'Port forwarding test fails from outside network',
      solution: 'Use cloud-based camera service or VPN access',
    },
    {
      issue: "VPN Server Won't Accept Connections",
      cause: 'CGNAT prevents inbound VPN connections',
      diagnosis: 'VPN connections timeout or fail to establish',
      solution: 'Use cloud VPN service or reverse VPN connection',
    },
    {
      issue: 'Peer-to-Peer Applications Fail',
      cause: 'Double NAT prevents P2P hole punching',
      diagnosis: 'Applications report connectivity issues',
      solution: 'Use relay servers or protocol-specific workarounds',
    },
  ],

  bestPractices: [
    "Test your setup to confirm if you're behind CGNAT",
    'Document affected services and plan workarounds',
    'Consider IPv6 deployment as long-term solution',
    'Evaluate cost of public IP vs workaround solutions',
    'Use cloud services for hosting needs',
    'Keep ISP contact info for escalating connectivity issues',
  ],

  ispPerspective: [
    'CGNAT allows serving more customers with limited IPv4 space',
    'Reduces IPv4 address costs for ISPs',
    'Enables competitive pricing for internet service',
    'Provides transition time for IPv6 deployment',
    'Adds complexity to network troubleshooting',
    'May require additional customer support for affected services',
  ],

  quickCheck: {
    steps: [
      "Check your router's WAN/Internet IP address",
      "If it starts with 100.64, you're behind CGNAT",
      'Compare with whatismyipaddress.com',
      'If different, confirms CGNAT deployment',
    ],

    whatToDo: [
      'Test affected services (gaming, port forwarding)',
      'Contact ISP about public IP availability and cost',
      'Research workarounds for your specific needs',
      'Consider IPv6 deployment if supported',
    ],
  },
};
