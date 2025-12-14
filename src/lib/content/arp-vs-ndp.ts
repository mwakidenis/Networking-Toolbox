export const arpVsNdpContent = {
  title: 'ARP vs NDP',
  description: 'Side-by-side comparison of ARP (IPv4) and NDP (IPv6) for address resolution and neighbor discovery.',

  sections: {
    overview: {
      title: 'Purpose and Function',
      content: `Both ARP (Address Resolution Protocol) and NDP (Neighbor Discovery Protocol) solve the same fundamental problem: how to find the MAC address (link-layer address) when you only know the IP address.

However, NDP is much more capable than ARP, handling not just address resolution but also router discovery, address autoconfiguration, and duplicate address detection.`,
    },
  },

  comparison: {
    basic: [
      {
        aspect: 'Primary Purpose',
        arp: 'Find MAC address from IPv4 address',
        ndp: 'Find MAC address from IPv6 address + much more',
      },
      {
        aspect: 'Protocol Layer',
        arp: 'Separate protocol (EtherType 0x0806)',
        ndp: 'Uses ICMPv6 (part of IPv6)',
      },
      {
        aspect: 'Broadcast/Multicast',
        arp: 'Uses broadcast (ff:ff:ff:ff:ff:ff)',
        ndp: 'Uses specific multicast addresses',
      },
      {
        aspect: 'Security',
        arp: 'No built-in security (vulnerable to spoofing)',
        ndp: 'Can use IPSec for security',
      },
      {
        aspect: 'Address Space Efficiency',
        arp: 'Broadcasts to all hosts on subnet',
        ndp: 'Multicasts only to likely neighbors',
      },
    ],
  },

  arpDetails: {
    title: 'ARP (Address Resolution Protocol)',

    messageTypes: [
      {
        type: 'ARP Request',
        description: 'Who has IP address X.X.X.X? Tell MAC address Y:Y:Y:Y:Y:Y',
        destination: 'Broadcast (ff:ff:ff:ff:ff:ff)',
        response: 'Target host responds if it owns that IP',
      },
      {
        type: 'ARP Reply',
        description: 'I have IP address X.X.X.X at MAC address Z:Z:Z:Z:Z:Z',
        destination: 'Unicast to requesting host',
        response: 'Requesting host updates its ARP table',
      },
      {
        type: 'Gratuitous ARP',
        description: 'Unsolicited announcement of IP/MAC binding',
        destination: 'Broadcast',
        response: 'Hosts update their ARP tables',
      },
      {
        type: 'ARP Probe',
        description: 'Check if IP address is already in use',
        destination: 'Broadcast with sender IP as 0.0.0.0',
        response: 'Conflict if someone responds',
      },
    ],

    process: [
      'Host A wants to send packet to Host B (knows IP, needs MAC)',
      'Host A checks its ARP table for cached entry',
      'If no entry, Host A broadcasts ARP Request',
      'Host B (owner of target IP) sends ARP Reply with its MAC',
      'Host A caches the IP/MAC mapping in ARP table',
      'Host A can now send packets to Host B',
    ],

    limitations: [
      'No built-in security (ARP spoofing attacks)',
      'Broadcasts create network noise',
      'No duplicate address detection',
      'No router discovery mechanism',
      'Cache entries can become stale',
    ],
  },

  ndpDetails: {
    title: 'NDP (Neighbor Discovery Protocol)',

    messageTypes: [
      {
        type: 'Neighbor Solicitation (NS)',
        icmpType: 'ICMPv6 Type 135',
        description: 'IPv6 equivalent of ARP Request',
        destination: 'Solicited-node multicast address',
        purpose: 'Find MAC address for IPv6 address',
      },
      {
        type: 'Neighbor Advertisement (NA)',
        icmpType: 'ICMPv6 Type 136',
        description: 'IPv6 equivalent of ARP Reply',
        destination: 'Unicast or all-nodes multicast',
        purpose: 'Provide MAC address for IPv6 address',
      },
      {
        type: 'Router Solicitation (RS)',
        icmpType: 'ICMPv6 Type 133',
        description: 'Find routers on network',
        destination: 'All-routers multicast (ff02::2)',
        purpose: 'Discover available routers',
      },
      {
        type: 'Router Advertisement (RA)',
        icmpType: 'ICMPv6 Type 134',
        description: 'Router announces its presence and configuration',
        destination: 'All-nodes multicast (ff02::1)',
        purpose: 'Provide network configuration info',
      },
      {
        type: 'Redirect',
        icmpType: 'ICMPv6 Type 137',
        description: 'Better path to destination',
        destination: 'Unicast to original sender',
        purpose: 'Optimize routing path',
      },
    ],

    process: [
      'Host A wants to communicate with Host B (IPv6 address known)',
      'Host A checks its neighbor cache for cached entry',
      'If no entry, Host A sends Neighbor Solicitation to solicited-node multicast',
      'Only hosts with matching addresses process the NS',
      'Host B sends Neighbor Advertisement with its MAC address',
      'Host A caches the IPv6/MAC mapping in neighbor cache',
      'Periodic reachability confirmation keeps entries fresh',
    ],

    advantages: [
      'More efficient (multicast vs broadcast)',
      'Built-in duplicate address detection',
      'Router discovery and autoconfiguration',
      'Neighbor unreachability detection',
      'Can use IPSec for security',
      'Supports mobile IPv6',
    ],
  },

  practicalDifferences: [
    {
      scenario: 'Network Discovery',
      arp: 'No router discovery - must be manually configured',
      ndp: 'Automatic router discovery via Router Advertisements',
      impact: 'IPv6 hosts can automatically find default gateway',
    },
    {
      scenario: 'Address Conflicts',
      arp: 'No built-in conflict detection',
      ndp: 'Duplicate Address Detection (DAD) prevents conflicts',
      impact: 'IPv6 is more robust against address conflicts',
    },
    {
      scenario: 'Network Efficiency',
      arp: 'Broadcasts disturb all hosts on subnet',
      ndp: 'Multicasts only to likely targets',
      impact: 'IPv6 creates less network noise',
    },
    {
      scenario: 'Security',
      arp: 'Vulnerable to spoofing attacks',
      ndp: 'Can use IPSec, harder to spoof multicast',
      impact: 'IPv6 can be more secure with proper configuration',
    },
    {
      scenario: 'Mobility Support',
      arp: 'No mobility support',
      ndp: 'Built-in support for mobile devices',
      impact: 'IPv6 better for mobile and wireless networks',
    },
  ],

  troubleshootingCommands: [
    {
      purpose: 'View ARP Table',
      ipv4: 'arp -a',
      ipv6: 'ip -6 neighbor show',
      windows: 'netsh interface ipv6 show neighbors',
    },
    {
      purpose: 'Clear Cache',
      ipv4: 'arp -d [ip]',
      ipv6: 'ip -6 neighbor del [ipv6] dev [interface]',
      windows: 'netsh interface ipv6 delete neighbors',
    },
    {
      purpose: 'Send Manual Request',
      ipv4: 'arping [ip]',
      ipv6: 'ndisc6 [ipv6] [interface]',
      windows: 'ping [address] (triggers resolution)',
    },
    {
      purpose: 'Monitor Traffic',
      ipv4: 'tcpdump arp',
      ipv6: 'tcpdump icmp6 and ip6[40] >= 133 and ip6[40] <= 137',
      windows: 'Wireshark filter: arp or (icmpv6.type >= 133 and icmpv6.type <= 137)',
    },
  ],

  commonIssues: [
    {
      issue: 'ARP Spoofing Attack',
      protocol: 'ARP',
      description: 'Attacker sends fake ARP replies to redirect traffic',
      detection: 'Monitor for duplicate MAC addresses or unusual ARP traffic',
      mitigation: 'Use ARP inspection, static ARP entries, or 802.1X',
    },
    {
      issue: 'ARP Table Full',
      protocol: 'ARP',
      description: 'Too many entries cause legitimate entries to be dropped',
      detection: 'Intermittent connectivity to some hosts',
      mitigation: 'Increase ARP table size or implement rate limiting',
    },
    {
      issue: 'Duplicate Address Detection Failure',
      protocol: 'NDP',
      description: 'IPv6 address conflicts not properly detected',
      detection: 'Intermittent IPv6 connectivity',
      mitigation: 'Check DAD configuration and timing',
    },
    {
      issue: 'Router Advertisement Flooding',
      protocol: 'NDP',
      description: 'Rogue RAs cause network disruption',
      detection: 'Hosts getting wrong IPv6 configuration',
      mitigation: 'Use RA Guard on switches, monitor for rogue RAs',
    },
  ],

  bestPractices: [
    {
      protocol: 'ARP',
      practices: [
        'Monitor for ARP spoofing attacks',
        'Use static ARP entries for critical servers',
        'Implement Dynamic ARP Inspection on switches',
        'Set appropriate ARP cache timeouts',
        'Monitor ARP table sizes on routers',
      ],
    },
    {
      protocol: 'NDP',
      practices: [
        'Enable RA Guard on access switches',
        'Monitor for rogue Router Advertisements',
        'Configure proper DAD timing',
        'Use IPSec for NDP security in sensitive environments',
        'Monitor neighbor cache sizes',
      ],
    },
  ],

  quickReference: {
    arp: [
      'Broadcasts to ff:ff:ff:ff:ff:ff',
      'EtherType 0x0806',
      'Request/Reply model',
      'No security',
      'Cache timeout typically 60-240 seconds',
    ],
    ndp: [
      'Uses solicited-node multicast (ff02::1:ffXX:XXXX)',
      'ICMPv6 types 133-137',
      'Request/Advertisement + Router Discovery',
      'Can use IPSec',
      'Neighbor Unreachability Detection',
    ],
  },

  migrationTips: [
    'IPv6 NDP is more complex but more capable than ARP',
    'Security tools need updating for NDP monitoring',
    'NDP multicast addresses must be properly handled by switches',
    'Router Advertisement security becomes critical in IPv6',
    'Neighbor cache management differs from ARP table management',
  ],
};
