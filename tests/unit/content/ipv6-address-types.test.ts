import { describe, it, expect } from 'vitest';
import { ipv6AddressTypesContent } from '../../../src/lib/content/ipv6-address-types';

describe('IPv6 address types content', () => {
  it('has valid structure', () => {
    expect(ipv6AddressTypesContent).toBeDefined();
    expect(ipv6AddressTypesContent.title).toBe("IPv6 Address Types & Key Prefixes");
    expect(ipv6AddressTypesContent.description).toContain("IPv6 address types");
    expect(ipv6AddressTypesContent.sections).toBeDefined();
    expect(ipv6AddressTypesContent.unicastTypes).toBeInstanceOf(Array);
    expect(ipv6AddressTypesContent.specialAddresses).toBeInstanceOf(Array);
    expect(ipv6AddressTypesContent.multicastTypes).toBeInstanceOf(Array);
    expect(ipv6AddressTypesContent.anycast).toBeDefined();
    expect(ipv6AddressTypesContent.reservedRanges).toBeInstanceOf(Array);
    expect(ipv6AddressTypesContent.quickTips).toBeInstanceOf(Array);
  });

  it('explains IPv6 address categories', () => {
    const overview = ipv6AddressTypesContent.sections.overview;
    expect(overview.title).toBe("IPv6 Address Categories");
    expect(overview.content).toContain("Unicast");
    expect(overview.content).toContain("Multicast");
    expect(overview.content).toContain("Anycast");
    expect(overview.content).toContain("One-to-one communication");
    expect(overview.content).toContain("One-to-many communication");
    expect(overview.content).toContain("One-to-nearest communication");
    expect(overview.content).toContain("no broadcast addresses");
  });

  it('defines unicast address types correctly', () => {
    expect(ipv6AddressTypesContent.unicastTypes).toHaveLength(3);
    
    const globalUnicast = ipv6AddressTypesContent.unicastTypes[0];
    expect(globalUnicast.type).toBe("Global Unicast");
    expect(globalUnicast.prefix).toBe("2000::/3");
    expect(globalUnicast.range).toContain("2000::");
    expect(globalUnicast.range).toContain("3fff:ffff:ffff:ffff:ffff:ffff:ffff:ffff");
    expect(globalUnicast.description).toContain("Internet-routable");
    expect(globalUnicast.example).toContain("2001:db8:");
    
    const uniqueLocal = ipv6AddressTypesContent.unicastTypes[1];
    expect(uniqueLocal.type).toBe("Unique Local (ULA)");
    expect(uniqueLocal.prefix).toBe("fc00::/7");
    expect(uniqueLocal.range).toContain("fc00::");
    expect(uniqueLocal.range).toContain("fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff");
    expect(uniqueLocal.description).toContain("Private addresses");
    expect(uniqueLocal.example).toContain("fd");
    
    const linkLocal = ipv6AddressTypesContent.unicastTypes[2];
    expect(linkLocal.type).toBe("Link-Local");
    expect(linkLocal.prefix).toBe("fe80::/10");
    expect(linkLocal.range).toContain("fe80::");
    expect(linkLocal.description).toContain("Auto-configured");
    expect(linkLocal.description).toContain("not routed beyond local link");
    expect(linkLocal.example).toContain("fe80::");
  });

  it('defines special IPv6 addresses', () => {
    expect(ipv6AddressTypesContent.specialAddresses).toHaveLength(4);
    
    const loopback = ipv6AddressTypesContent.specialAddresses.find(a => a.name === "Loopback");
    expect(loopback?.address).toBe("::1/128");
    expect(loopback?.description).toContain("127.0.0.1");
    
    const unspecified = ipv6AddressTypesContent.specialAddresses.find(a => a.name === "Unspecified");
    expect(unspecified?.address).toBe("::/128");
    expect(unspecified?.description).toContain("0.0.0.0");
    
    const defaultRoute = ipv6AddressTypesContent.specialAddresses.find(a => a.name === "Default Route");
    expect(defaultRoute?.address).toBe("::/0");
    expect(defaultRoute?.description).toContain("Matches all addresses");
    
    const ipv4Mapped = ipv6AddressTypesContent.specialAddresses.find(a => a.name === "IPv4-Mapped");
    expect(ipv4Mapped?.address).toBe("::ffff:0:0/96");
    expect(ipv4Mapped?.description).toContain("IPv4 addresses mapped");
    expect(ipv4Mapped?.usage).toContain("Dual-stack");
  });

  it('covers multicast scopes correctly', () => {
    expect(ipv6AddressTypesContent.multicastTypes).toHaveLength(5);
    
    const allMulticast = ipv6AddressTypesContent.multicastTypes.find(m => m.scope === "All");
    expect(allMulticast?.prefix).toBe("ff00::/8");
    expect(allMulticast?.description).toContain("All multicast addresses start with ff");
    
    const interfaceLocal = ipv6AddressTypesContent.multicastTypes.find(m => m.scope === "Interface-Local");
    expect(interfaceLocal?.prefix).toBe("ff01::/16");
    expect(interfaceLocal?.examples).toContain("ff01::1 - All nodes (interface-local)");
    
    const linkLocal = ipv6AddressTypesContent.multicastTypes.find(m => m.scope === "Link-Local");
    expect(linkLocal?.prefix).toBe("ff02::/16");
    expect(linkLocal?.examples).toContain("ff02::1 - All nodes (link-local)");
    expect(linkLocal?.examples).toContain("ff02::2 - All routers (link-local)");
    expect(linkLocal?.examples).toContain("ff02::5 - OSPFv3 routers");
    
    const siteLocal = ipv6AddressTypesContent.multicastTypes.find(m => m.scope === "Site-Local");
    expect(siteLocal?.prefix).toBe("ff05::/16");
    
    const global = ipv6AddressTypesContent.multicastTypes.find(m => m.scope === "Global");
    expect(global?.prefix).toBe("ff0e::/16");
    expect(global?.description).toContain("Internet-wide");
  });

  it('explains anycast addresses', () => {
    const anycast = ipv6AddressTypesContent.anycast;
    expect(anycast.title).toBe("Anycast Addresses");
    expect(anycast.description).toContain("look identical to unicast addresses");
    expect(anycast.description).toContain("assigned to multiple devices");
    expect(anycast.description).toContain("nearest");
    expect(anycast.description).toContain("no special prefix");
    
    expect(anycast.commonUses).toHaveLength(4);
    expect(anycast.commonUses).toContain("DNS root servers (multiple servers, same IP)");
    expect(anycast.commonUses).toContain("Content delivery networks (CDNs)");
    expect(anycast.commonUses).toContain("Load balancing across geographic locations");
    expect(anycast.commonUses).toContain("Subnet router anycast (all routers on a subnet)");
    
    expect(anycast.example).toContain("2001:db8::1");
    expect(anycast.example).toContain("anycast if assigned to multiple servers");
  });

  it('includes comprehensive reserved ranges', () => {
    expect(ipv6AddressTypesContent.reservedRanges.length).toBeGreaterThan(15);
    
    const reservedPrefix0000 = ipv6AddressTypesContent.reservedRanges.find(r => r.prefix === "0000::/8");
    expect(reservedPrefix0000?.purpose).toContain("Reserved");
    expect(reservedPrefix0000?.purpose).toContain("::1");
    
    const uniqueLocal = ipv6AddressTypesContent.reservedRanges.find(r => r.prefix === "fc00::/7");
    expect(uniqueLocal?.purpose).toBe("Unique Local Addresses");
    
    const linkLocal = ipv6AddressTypesContent.reservedRanges.find(r => r.prefix === "fe80::/10");
    expect(linkLocal?.purpose).toBe("Link-Local Addresses");
    
    const multicast = ipv6AddressTypesContent.reservedRanges.find(r => r.prefix === "ff00::/8");
    expect(multicast?.purpose).toBe("Multicast");
    
    const deprecatedSiteLocal = ipv6AddressTypesContent.reservedRanges.find(r => r.prefix === "fec0::/10");
    expect(deprecatedSiteLocal?.purpose).toContain("deprecated site-local");
  });

  it('provides practical quick tips', () => {
    expect(ipv6AddressTypesContent.quickTips).toHaveLength(6);
    expect(ipv6AddressTypesContent.quickTips).toContain("Most public IPv6 addresses start with 2 or 3");
    expect(ipv6AddressTypesContent.quickTips).toContain("If you see fe80::, it's link-local (not routed)");
    expect(ipv6AddressTypesContent.quickTips).toContain("If you see fd or fc, it's unique local (private)");
    expect(ipv6AddressTypesContent.quickTips).toContain("If you see ff, it's multicast");
    expect(ipv6AddressTypesContent.quickTips).toContain("::1 is IPv6 loopback (like 127.0.0.1)");
    expect(ipv6AddressTypesContent.quickTips).toContain(":: means all zeros (like 0.0.0.0)");
  });

  it('validates data structure consistency', () => {
    ipv6AddressTypesContent.unicastTypes.forEach(type => {
      expect(type).toHaveProperty('type');
      expect(type).toHaveProperty('prefix');
      expect(type).toHaveProperty('range');
      expect(type).toHaveProperty('description');
      expect(type).toHaveProperty('usage');
      expect(type).toHaveProperty('example');
      expect(type.prefix).toMatch(/^[0-9a-f:]+\/\d+$/i);
      expect(type.example).toMatch(/^[0-9a-f:]+/i);
    });

    ipv6AddressTypesContent.specialAddresses.forEach(addr => {
      expect(addr).toHaveProperty('address');
      expect(addr).toHaveProperty('name');
      expect(addr).toHaveProperty('description');
      expect(addr).toHaveProperty('usage');
      expect(addr.address).toMatch(/^[0-9a-f:]+/i);
    });

    ipv6AddressTypesContent.multicastTypes.forEach(multicast => {
      expect(multicast).toHaveProperty('prefix');
      expect(multicast).toHaveProperty('scope');
      expect(multicast).toHaveProperty('description');
      expect(multicast).toHaveProperty('examples');
      expect(multicast.prefix).toMatch(/^ff[0-9a-f:]+\/\d+$/i);
      expect(multicast.examples).toBeInstanceOf(Array);
    });
  });

  it('uses correct IPv6 notation', () => {
    const allExamples = [
      ...ipv6AddressTypesContent.unicastTypes.map(u => u.example),
      ...ipv6AddressTypesContent.specialAddresses.map(s => s.address),
      "2001:db8:85a3::8a2e:370:7334", // From global unicast example
      "fd12:3456:789a::1", // From ULA example
      "fe80::1%eth0" // From link-local example
    ];

    allExamples.forEach(example => {
      // Should contain valid IPv6 characters and structure (including interface names like eth0)
      expect(example).toMatch(/^[0-9a-f:%.\\/]+[a-z0-9]*$/i);
    });

    // Check that prefixes use proper CIDR notation
    const allPrefixes = [
      ...ipv6AddressTypesContent.unicastTypes.map(u => u.prefix),
      ...ipv6AddressTypesContent.multicastTypes.map(m => m.prefix),
      ...ipv6AddressTypesContent.reservedRanges.map(r => r.prefix)
    ];

    allPrefixes.forEach(prefix => {
      expect(prefix).toMatch(/^[0-9a-f:]+\/\d+$/i);
    });
  });

  it('covers standard IPv6 scoping correctly', () => {
    // Verify multicast scope hierarchy
    const scopes = ipv6AddressTypesContent.multicastTypes.map(m => m.scope);
    expect(scopes).toContain("Interface-Local");
    expect(scopes).toContain("Link-Local");
    expect(scopes).toContain("Site-Local");
    expect(scopes).toContain("Global");
    
    // Verify well-known multicast addresses
    const linkLocalMulticast = ipv6AddressTypesContent.multicastTypes.find(m => m.scope === "Link-Local");
    expect(linkLocalMulticast?.examples).toContain("ff02::1 - All nodes (link-local)");
    expect(linkLocalMulticast?.examples).toContain("ff02::2 - All routers (link-local)");
  });

  it('properly distinguishes address ranges', () => {
    // Global Unicast should start with 2xxx or 3xxx
    const globalUnicast = ipv6AddressTypesContent.unicastTypes.find(t => t.type === "Global Unicast");
    expect(globalUnicast?.range).toContain("2000::");
    expect(globalUnicast?.range).toContain("3fff:");
    
    // ULA should be fc00::/7 (fc00:: to fdff::)
    const ula = ipv6AddressTypesContent.unicastTypes.find(t => t.type === "Unique Local (ULA)");
    expect(ula?.range).toContain("fc00::");
    expect(ula?.range).toContain("fdff:");
    
    // Link-local should be fe80::/10
    const linkLocal = ipv6AddressTypesContent.unicastTypes.find(t => t.type === "Link-Local");
    expect(linkLocal?.range).toContain("fe80::");
    expect(linkLocal?.range).toContain("febf:");
  });

  it('emphasizes practical usage', () => {
    const content = JSON.stringify(ipv6AddressTypesContent);
    expect(content).toContain("routable");
    expect(content).toContain("private");
    expect(content).toContain("local");
    expect(content).toContain("internet");
    expect(content).toContain("network");
    expect(content).toContain("communication");
    expect(content).not.toContain("password");
    expect(content).not.toContain("malicious");
  });
});