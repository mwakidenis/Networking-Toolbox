export const macAddressContent = {
  title: 'MAC Address Converter & OUI Lookup',
  description: 'Convert MAC addresses between formats and identify manufacturers',
  sections: {
    whatIsMAC: {
      title: 'What is a MAC Address?',
      content:
        'A MAC (Media Access Control) address is a unique 48-bit (6-byte) identifier assigned to network interface controllers (NICs) for communications on the physical network segment. It operates at Layer 2 (Data Link Layer) of the OSI model and is typically displayed as six groups of two hexadecimal digits (e.g., 00:1A:2B:3C:4D:5E).',
    },
    structure: {
      title: 'MAC Address Structure',
      components: [
        {
          component: 'OUI (Organizationally Unique Identifier)',
          description:
            'First 24 bits (3 bytes) assigned by IEEE to manufacturers. Identifies who made the network interface.',
        },
        {
          component: 'NIC Specific (Device ID)',
          description: 'Last 24 bits (3 bytes) assigned by the manufacturer to uniquely identify the specific device.',
        },
        {
          component: 'I/G bit (Individual/Group)',
          description:
            'Bit 0 of first octet: 0 = Unicast (single destination), 1 = Multicast/Broadcast (multiple destinations).',
        },
        {
          component: 'U/L bit (Universal/Local)',
          description:
            'Bit 1 of first octet: 0 = Universally administered (manufacturer-assigned), 1 = Locally administered (software-assigned).',
        },
      ],
      example: {
        address: '3C:22:FB:A1:B2:C3',
        breakdown: [
          'OUI: 3C:22:FB (Apple, Inc.)',
          'Device ID: A1:B2:C3',
          'First octet binary: 00111100 (I/G=0, U/L=0) → Universal Unicast',
        ],
      },
    },
    addressTypes: {
      title: 'MAC Address Types',
      types: [
        {
          type: 'Universal Unicast',
          description: 'Standard manufacturer-assigned addresses. Most common type for physical network cards.',
        },
        {
          type: 'Locally Administered Unicast',
          description:
            'Software-assigned addresses used in virtual machines, VPNs, and software-defined networking. Second hex digit is 2, 3, 6, 7, A, B, E, or F.',
        },
        {
          type: 'Multicast',
          description:
            'Used for one-to-many communication. First octet has LSB set to 1 (e.g., 01:00:5E:xx:xx:xx for IPv4 multicast).',
        },
        {
          type: 'Broadcast',
          description: 'FF:FF:FF:FF:FF:FF - Reaches all devices on the local network segment.',
        },
      ],
    },
    formats: {
      title: 'Common MAC Address Formats',
      formats: [
        {
          format: 'Colon notation',
          example: '00:1A:2B:3C:4D:5E',
          usage: 'Standard on Linux, BSD, macOS',
        },
        {
          format: 'Hyphen notation',
          example: '00-1A-2B-3C-4D-5E',
          usage: 'Common on Windows systems',
        },
        {
          format: 'Cisco/Dot notation',
          example: '001A.2B3C.4D5E',
          usage: 'Used in Cisco IOS and NX-OS',
        },
        {
          format: 'Bare format',
          example: '001A2B3C4D5E',
          usage: 'Common in databases and APIs',
        },
        {
          format: 'EUI-64',
          example: '02:1A:2B:FF:FE:3C:4D:5E',
          usage: 'Extended format used for IPv6 interface IDs (inserts FFFE and flips U/L bit)',
        },
      ],
    },
    ouiLookup: {
      title: 'OUI Lookup and Block Types',
      content: 'The IEEE Registration Authority manages OUI assignments. There are different block sizes:',
      blockTypes: [
        {
          type: 'MA-L (Large)',
          description: '24-bit prefix, provides 16,777,216 addresses. Standard OUI assignment for large manufacturers.',
        },
        {
          type: 'MA-M (Medium)',
          description: '28-bit prefix, provides 1,048,576 addresses. For medium-sized organizations.',
        },
        {
          type: 'MA-S (Small)',
          description: '36-bit prefix, provides 4,096 addresses. For smaller organizations or specific products.',
        },
        {
          type: 'CID (Company ID)',
          description: 'Special identifier for company-specific uses.',
        },
      ],
      lookupInfo:
        'OUI lookups query the IEEE database to identify the manufacturer and registration details associated with a given MAC address prefix.',
    },
    specialAddresses: {
      title: 'Special and Reserved MAC Addresses',
      addresses: [
        {
          address: 'FF:FF:FF:FF:FF:FF',
          type: 'Broadcast',
          description: 'All devices on local segment',
        },
        {
          address: '01:00:5E:xx:xx:xx',
          type: 'IPv4 Multicast',
          description: 'Maps to IPv4 multicast addresses (224.0.0.0/4)',
        },
        {
          address: '33:33:xx:xx:xx:xx',
          type: 'IPv6 Multicast',
          description: 'Maps to IPv6 multicast addresses (FF00::/8)',
        },
        {
          address: '00:00:5E:xx:xx:xx',
          type: 'IANA Reserved',
          description: 'IANA-managed reserved addresses',
        },
        {
          address: 'Various',
          type: 'Link-local',
          description: 'Vendor-specific link-local addresses for protocols like LLDP, STP, VRRP',
        },
        {
          address: 'xx:x2-F:xx:xx:xx:xx',
          type: 'Privacy MAC',
          description: 'Randomized addresses (U/L bit set) used by modern devices to prevent tracking',
        },
      ],
    },
    useCases: {
      title: 'Common Use Cases',
      cases: [
        {
          useCase: 'Network Troubleshooting',
          description: 'Identify devices on the network, track down rogue devices, or diagnose connectivity issues',
        },
        {
          useCase: 'Security and Access Control',
          description: 'MAC filtering for wireless networks, port security on switches, device whitelisting',
        },
        {
          useCase: 'Asset Management',
          description: 'Inventory network devices by manufacturer, track hardware deployments',
        },
        {
          useCase: 'Virtualization',
          description: 'Assign locally administered MACs to virtual machines and containers',
        },
        {
          useCase: 'Format Conversion',
          description: 'Convert between different notations for different systems and tools',
        },
        {
          useCase: 'Privacy Analysis',
          description: 'Identify if devices are using randomized MACs for privacy protection',
        },
      ],
    },
  },
  quickTips: [
    'MAC addresses are only unique within a local network segment; routing between networks uses IP addresses',
    'The second character of a MAC address reveals important info: Even = Universal, Odd = Multicast, 2/3/6/7/A/B/E/F = Locally administered',
    'Virtual machines and modern smartphones often use locally administered (randomized) MACs for privacy',
    'Not all 48-bit combinations are valid - some ranges are reserved for special purposes',
    "MAC spoofing can change a device's MAC address in software, but doesn't change the hardware address",
    'For IPv6 SLAAC, MAC addresses are converted to EUI-64 by inserting FFFE in the middle and flipping the U/L bit',
  ],
};
