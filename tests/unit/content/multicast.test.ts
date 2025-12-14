import { describe, it, expect } from 'vitest';
import { multicastContent } from '../../../src/lib/content/multicast';

describe('Multicast content', () => {
  it('has valid structure', () => {
    expect(multicastContent).toBeDefined();
    expect(multicastContent.title).toBe("IPv4 & IPv6 Multicast Basics");
    expect(multicastContent.description).toContain("multicast addressing");
    expect(multicastContent.sections).toBeDefined();
    expect(multicastContent.ipv4Multicast).toBeDefined();
    expect(multicastContent.ipv6Multicast).toBeDefined();
    expect(multicastContent.limitations).toBeInstanceOf(Array);
    expect(multicastContent.commonProtocols).toBeInstanceOf(Array);
    expect(multicastContent.troubleshooting).toBeInstanceOf(Array);
    expect(multicastContent.bestPractices).toBeInstanceOf(Array);
    expect(multicastContent.quickReference).toBeDefined();
  });

  it('explains multicast fundamentals', () => {
    const overview = multicastContent.sections.overview;
    expect(overview.title).toBe("What is Multicast?");
    expect(overview.content).toContain("one sender to transmit data to multiple receivers");
    expect(overview.content).toContain("more efficient than sending individual unicast packets");
    expect(overview.content).toContain("broadcast (everyone)");
    expect(overview.content).toContain("unicast (one specific recipient)");
    expect(overview.content).toContain("streaming media");
  });

  it('defines IPv4 multicast correctly', () => {
    const ipv4 = multicastContent.ipv4Multicast;
    expect(ipv4.title).toBe("IPv4 Multicast");
    expect(ipv4.range).toBe("224.0.0.0/4 (224.0.0.0 to 239.255.255.255)");
    expect(ipv4.classes).toHaveLength(5);
    
    const localControl = ipv4.classes[0];
    expect(localControl.range).toBe("224.0.0.0/24");
    expect(localControl.name).toBe("Local Network Control Block");
    expect(localControl.scope).toBe("Local subnet only");
    expect(localControl.examples).toContain("224.0.0.1 - All Systems");
    expect(localControl.examples).toContain("224.0.0.2 - All Routers");
    expect(localControl.examples).toContain("224.0.0.251 - mDNS");
    
    const orgLocal = ipv4.classes[4];
    expect(orgLocal.range).toBe("239.0.0.0/8");
    expect(orgLocal.name).toBe("Organization Local Scope");
    expect(orgLocal.description).toContain("Private multicast addresses");
    expect(orgLocal.scope).toBe("Organization-wide");
  });

  it('defines IPv6 multicast structure', () => {
    const ipv6 = multicastContent.ipv6Multicast;
    expect(ipv6.title).toBe("IPv6 Multicast");
    expect(ipv6.range).toBe("ff00::/8 (all addresses starting with ff)");
    
    const structure = ipv6.structure;
    expect(structure.format).toBe("ff[flags][scope]::/16");
    expect(structure.flags).toHaveLength(4);
    expect(structure.scopes).toHaveLength(8);
    
    const linkLocal = structure.scopes.find(s => s.name === "Link-Local");
    expect(linkLocal?.code).toBe("2");
    
    const global = structure.scopes.find(s => s.name === "Global");
    expect(global?.code).toBe("e");
  });

  it('lists IPv6 well-known multicast addresses', () => {
    const wellKnown = multicastContent.ipv6Multicast.wellKnown;
    expect(wellKnown).toHaveLength(8);
    
    const allNodesInterface = wellKnown.find(w => w.address === "ff01::1");
    expect(allNodesInterface?.name).toBe("All Nodes (Interface-Local)");
    
    const allNodesLink = wellKnown.find(w => w.address === "ff02::1");
    expect(allNodesLink?.name).toBe("All Nodes (Link-Local)");
    expect(allNodesLink?.description).toContain("local network segment");
    
    const allRoutersLink = wellKnown.find(w => w.address === "ff02::2");
    expect(allRoutersLink?.name).toBe("All Routers (Link-Local)");
    
    const ospfRouters = wellKnown.find(w => w.address === "ff02::5");
    expect(ospfRouters?.name).toBe("OSPFv3 All SPF Routers");
    
    const mdns = wellKnown.find(w => w.address === "ff02::fb");
    expect(mdns?.name).toBe("mDNSv6");
    expect(mdns?.description).toContain("Multicast DNS over IPv6");
  });

  it('covers important limitations', () => {
    expect(multicastContent.limitations).toHaveLength(3);
    
    const localSubnet = multicastContent.limitations.find(l => l.title === "Local Subnet Only Caveat");
    expect(localSubnet?.description).toContain("local subnet use only");
    expect(localSubnet?.details).toBeInstanceOf(Array);
    expect(localSubnet?.details.length).toBeGreaterThan(0);
    
    const igmpMld = multicastContent.limitations.find(l => l.title === "IGMP/MLD Requirements");
    expect(igmpMld?.description).toContain("signal interest in multicast groups");
    expect(igmpMld?.details).toBeInstanceOf(Array);
    expect(igmpMld?.details.length).toBeGreaterThan(0);
    
    const firewall = multicastContent.limitations.find(l => l.title === "Firewall Considerations");
    expect(firewall?.description).toContain("block multicast by default");
    expect(firewall?.details).toBeInstanceOf(Array);
    expect(firewall?.details.length).toBeGreaterThan(0);
  });

  it('lists common multicast protocols', () => {
    expect(multicastContent.commonProtocols).toHaveLength(6);
    
    const ospf = multicastContent.commonProtocols.find(p => p.protocol === "OSPF");
    expect(ospf?.ipv4).toBe("224.0.0.5, 224.0.0.6");
    expect(ospf?.ipv6).toBe("ff02::5, ff02::6");
    expect(ospf?.purpose).toContain("Routing protocol");
    
    const mdns = multicastContent.commonProtocols.find(p => p.protocol === "mDNS");
    expect(mdns?.ipv4).toBe("224.0.0.251");
    expect(mdns?.ipv6).toBe("ff02::fb");
    expect(mdns?.purpose).toContain("Zero-configuration networking");
    
    const ssdp = multicastContent.commonProtocols.find(p => p.protocol === "SSDP");
    expect(ssdp?.ipv4).toBe("239.255.255.250");
    expect(ssdp?.purpose).toContain("UPnP device discovery");
  });

  it('provides troubleshooting guidance', () => {
    expect(multicastContent.troubleshooting).toHaveLength(3);
    
    const vlanIssue = multicastContent.troubleshooting.find(t => t.issue === "Multicast not working across VLANs");
    expect(vlanIssue?.causes).toContain("No multicast routing configured");
    expect(vlanIssue?.solutions).toContain("Enable PIM on routers");
    expect(vlanIssue?.solutions).toContain("Configure IGMP snooping");
    
    const floodingIssue = multicastContent.troubleshooting.find(t => t.issue === "High multicast traffic flooding network");
    expect(floodingIssue?.causes).toContain("No IGMP snooping");
    expect(floodingIssue?.solutions).toContain("Enable IGMP snooping on switches");
    
    const notReceiving = multicastContent.troubleshooting.find(t => t.issue === "Devices not receiving multicast");
    expect(notReceiving?.causes).toContain("Not joined to group");
    expect(notReceiving?.solutions).toContain("Verify group membership");
  });

  it('includes best practices', () => {
    expect(multicastContent.bestPractices).toHaveLength(7);
    expect(multicastContent.bestPractices).toContain("Use appropriate multicast scopes (link-local vs site-local vs global)");
    expect(multicastContent.bestPractices).toContain("Enable IGMP snooping on managed switches");
    expect(multicastContent.bestPractices).toContain("Configure multicast routing (PIM) only where needed");
    expect(multicastContent.bestPractices).toContain("Use organization-local ranges (239.x.x.x) for private applications");
    expect(multicastContent.bestPractices).toContain("Test multicast applications in isolated environments first");
  });

  it('provides quick reference', () => {
    const quickRef = multicastContent.quickReference;
    expect(quickRef.ipv4).toHaveLength(3);
    expect(quickRef.ipv6).toHaveLength(3);
    
    expect(quickRef.ipv4).toContain("224.0.0.1 - All systems on subnet");
    expect(quickRef.ipv4).toContain("224.0.0.2 - All routers on subnet");
    expect(quickRef.ipv4).toContain("239.x.x.x - Private/organization use");
    
    expect(quickRef.ipv6).toContain("ff02::1 - All nodes on link");
    expect(quickRef.ipv6).toContain("ff02::2 - All routers on link");
    expect(quickRef.ipv6).toContain("ff0x::... - Various scopes (x = scope)");
  });

  it('validates data structure consistency', () => {
    multicastContent.ipv4Multicast.classes.forEach(cls => {
      expect(cls).toHaveProperty('range');
      expect(cls).toHaveProperty('name');
      expect(cls).toHaveProperty('description');
      expect(cls).toHaveProperty('scope');
      expect(cls).toHaveProperty('examples');
      expect(cls.examples).toBeInstanceOf(Array);
    });

    multicastContent.ipv6Multicast.wellKnown.forEach(addr => {
      expect(addr).toHaveProperty('address');
      expect(addr).toHaveProperty('name');
      expect(addr).toHaveProperty('description');
      expect(addr.address).toMatch(/^ff[0-9a-f]{2}::/i);
    });

    multicastContent.commonProtocols.forEach(proto => {
      expect(proto).toHaveProperty('protocol');
      expect(proto).toHaveProperty('ipv4');
      expect(proto).toHaveProperty('purpose');
      // Some may not have IPv6 equivalent
    });

    multicastContent.troubleshooting.forEach(trouble => {
      expect(trouble).toHaveProperty('issue');
      expect(trouble).toHaveProperty('causes');
      expect(trouble).toHaveProperty('solutions');
      expect(trouble.causes).toBeInstanceOf(Array);
      expect(trouble.solutions).toBeInstanceOf(Array);
    });
  });

  it('uses correct multicast address ranges', () => {
    // IPv4 multicast should be in 224.0.0.0/4 range
    const ipv4Examples = multicastContent.ipv4Multicast.classes
      .flatMap(cls => cls.examples)
      .filter(ex => ex.match(/^\d+\.\d+\.\d+\.\d+/))
      .map(ex => ex.split(' ')[0]);
    
    ipv4Examples.forEach(addr => {
      expect(addr).toMatch(/^(224|239)\./);
    });
    
    // IPv6 multicast should start with ff
    const ipv6Examples = multicastContent.ipv6Multicast.wellKnown.map(w => w.address);
    ipv6Examples.forEach(addr => {
      expect(addr).toMatch(/^ff[0-9a-f]/i);
    });
  });

  it('covers essential multicast addresses', () => {
    const ipv4Classes = multicastContent.ipv4Multicast.classes;
    const localControl = ipv4Classes[0];
    
    // Must have All Systems and All Routers
    expect(localControl.examples.some(ex => ex.includes("224.0.0.1"))).toBe(true);
    expect(localControl.examples.some(ex => ex.includes("224.0.0.2"))).toBe(true);
    
    // Must have protocol-specific addresses
    expect(localControl.examples.some(ex => ex.includes("OSPF"))).toBe(true);
    expect(localControl.examples.some(ex => ex.includes("mDNS"))).toBe(true);
    
    // IPv6 equivalents
    const ipv6WellKnown = multicastContent.ipv6Multicast.wellKnown;
    expect(ipv6WellKnown.some(w => w.address === "ff02::1")).toBe(true);
    expect(ipv6WellKnown.some(w => w.address === "ff02::2")).toBe(true);
  });

  it('emphasizes practical networking concepts', () => {
    const content = JSON.stringify(multicastContent);
    expect(content).toContain("subnet");
    expect(content).toContain("router");
    expect(content).toContain("IGMP");
    expect(content).toContain("snooping");
    expect(content).toContain("protocol");
    expect(content).toContain("scope");
    expect(content).toContain("link-local");
    expect(content).not.toContain("password");
    expect(content).not.toContain("malicious");
  });
});