import { describe, it, expect } from 'vitest';
import { linkLocalApipaContent } from '../../../src/lib/content/link-local-apipa';

describe('Link-Local & APIPA content', () => {
  it('has valid structure', () => {
    expect(linkLocalApipaContent).toBeDefined();
    expect(linkLocalApipaContent.title).toBe("Link-Local & APIPA Addresses");
    expect(linkLocalApipaContent.description).toContain("APIPA (169.254/16)");
    expect(linkLocalApipaContent.description).toContain("fe80::/10");
    expect(linkLocalApipaContent.sections).toBeDefined();
    expect(linkLocalApipaContent.apipa).toBeDefined();
    expect(linkLocalApipaContent.ipv6LinkLocal).toBeDefined();
  });

  it('explains link-local concept clearly', () => {
    const overview = linkLocalApipaContent.sections.overview;
    expect(overview.title).toBe("What are Link-Local Addresses?");
    expect(overview.content).toContain("local network segment");
    expect(overview.content).toContain("automatically assigned");
    expect(overview.content).toContain("DHCP servers are down");
  });

  it('provides comprehensive APIPA details', () => {
    const apipa = linkLocalApipaContent.apipa;
    expect(apipa.range).toBe("169.254.0.0/16");
    expect(apipa.fullRange).toBe("169.254.0.1 to 169.254.255.254");
    expect(apipa.description).toContain("automatically assigned");
    expect(apipa.description).toContain("DHCP fails");
  });

  it('explains when APIPA is used', () => {
    const whenUsed = linkLocalApipaContent.apipa.whenUsed;
    expect(whenUsed).toBeInstanceOf(Array);
    expect(whenUsed.length).toBeGreaterThan(4);
    expect(whenUsed).toContain("DHCP server is unreachable or down");
    expect(whenUsed).toContain("DHCP lease expires and can't be renewed");
  });

  it('details APIPA assignment process', () => {
    const howItWorks = linkLocalApipaContent.apipa.howItWorks;
    expect(howItWorks).toBeInstanceOf(Array);
    expect(howItWorks.length).toBeGreaterThan(5);
    expect(howItWorks).toContain("Device requests IP address from DHCP server");
    expect(howItWorks).toContain("Device sends ARP probe to check if address is already used");
  });

  it('covers APIPA troubleshooting scenarios', () => {
    const troubleshooting = linkLocalApipaContent.apipa.troubleshooting;
    expect(troubleshooting).toBeInstanceOf(Array);
    expect(troubleshooting.length).toBeGreaterThan(2);
    
    troubleshooting.forEach(item => {
      expect(item).toHaveProperty('symptom');
      expect(item).toHaveProperty('meaning');
      expect(item).toHaveProperty('solution');
    });
    
    const apipaSymptom = troubleshooting.find(t => t.symptom.includes("169.254"));
    expect(apipaSymptom).toBeDefined();
    expect(apipaSymptom?.meaning).toBe("DHCP assignment failed");
  });

  it('provides comprehensive IPv6 link-local details', () => {
    const linkLocal = linkLocalApipaContent.ipv6LinkLocal;
    expect(linkLocal.range).toBe("fe80::/10");
    expect(linkLocal.fullRange).toContain("fe80::");
    expect(linkLocal.description).toContain("automatically gets a link-local address");
  });

  it('explains IPv6 link-local formation', () => {
    const formation = linkLocalApipaContent.ipv6LinkLocal.formation;
    expect(formation).toBeInstanceOf(Array);
    expect(formation.length).toBeGreaterThan(3);
    expect(formation).toContain("Start with fe80::/64 prefix");
    expect(formation.some(f => f.includes("EUI-64"))).toBe(true);
    expect(formation.some(f => f.includes("fffe"))).toBe(true);
  });

  it('covers IPv6 link-local address types', () => {
    const types = linkLocalApipaContent.ipv6LinkLocal.types;
    expect(types).toBeInstanceOf(Array);
    expect(types.length).toBe(3);
    
    const typeNames = types.map(t => t.type);
    expect(typeNames).toContain("EUI-64 Based");
    expect(typeNames).toContain("Random");
    expect(typeNames).toContain("Manual");
    
    const eui64Type = types.find(t => t.type === "EUI-64 Based");
    expect(eui64Type).toBeDefined();
    expect(eui64Type?.privacy).toContain("Reveals MAC address");
  });

  it('provides detailed IPv4 vs IPv6 comparison', () => {
    const comparison = linkLocalApipaContent.comparison;
    expect(comparison).toBeInstanceOf(Array);
    expect(comparison.length).toBeGreaterThan(5);
    
    comparison.forEach(item => {
      expect(item).toHaveProperty('aspect');
      expect(item).toHaveProperty('ipv4');
      expect(item).toHaveProperty('ipv6');
    });
    
    const rangeComparison = comparison.find(c => c.aspect === "Address Range");
    expect(rangeComparison).toBeDefined();
    expect(rangeComparison?.ipv4).toBe("169.254.0.0/16");
    expect(rangeComparison?.ipv6).toContain("fe80::/10");
  });

  it('includes practical examples', () => {
    const examples = linkLocalApipaContent.practicalExamples;
    expect(examples).toBeInstanceOf(Array);
    expect(examples.length).toBeGreaterThan(2);
    
    examples.forEach(example => {
      expect(example).toHaveProperty('scenario');
      expect(example).toHaveProperty('ipv4Behavior');
      expect(example).toHaveProperty('ipv6Behavior');
      expect(example).toHaveProperty('impact');
    });
    
    const dhcpDown = examples.find(e => e.scenario === "DHCP Server Down");
    expect(dhcpDown).toBeDefined();
    expect(dhcpDown?.ipv4Behavior).toContain("169.254.x.x addresses");
  });

  it('provides troubleshooting commands', () => {
    const commands = linkLocalApipaContent.troubleshootingCommands;
    expect(commands).toBeInstanceOf(Array);
    expect(commands.length).toBeGreaterThan(3);
    
    commands.forEach(cmd => {
      expect(cmd).toHaveProperty('purpose');
      expect(cmd).toHaveProperty('windows');
      expect(cmd).toHaveProperty('linux');
      expect(cmd).toHaveProperty('macOS');
    });
    
    const viewAddresses = commands.find(c => c.purpose === "View APIPA/Link-Local Addresses");
    expect(viewAddresses).toBeDefined();
    expect(viewAddresses?.windows).toBe("ipconfig /all");
  });

  it('includes best practices and common mistakes', () => {
    expect(linkLocalApipaContent.bestPractices).toBeInstanceOf(Array);
    expect(linkLocalApipaContent.commonMistakes).toBeInstanceOf(Array);
    
    const practices = linkLocalApipaContent.bestPractices.join(' ');
    expect(practices).toContain("Don't block link-local addresses");
    expect(practices).toContain("Monitor for widespread APIPA");
    
    const mistakes = linkLocalApipaContent.commonMistakes.join(' ');
    expect(mistakes).toContain("APIPA addresses provide internet access");
    expect(mistakes).toContain("Blocking fe80::/10 addresses");
  });

  it('provides quick reference guide', () => {
    const quickRef = linkLocalApipaContent.quickReference;
    expect(quickRef.recognition).toBeInstanceOf(Array);
    expect(quickRef.troubleshooting).toBeInstanceOf(Array);
    
    expect(quickRef.recognition).toContain("169.254.x.x = IPv4 APIPA (DHCP failed)");
    expect(quickRef.recognition).toContain("fe80::x = IPv6 link-local (normal and required)");
  });

  it('includes concern levels for different situations', () => {
    expect(linkLocalApipaContent.whenToWorry).toBeInstanceOf(Array);
    expect(linkLocalApipaContent.whenToWorry.length).toBeGreaterThan(3);
    
    linkLocalApipaContent.whenToWorry.forEach(worry => {
      expect(worry).toHaveProperty('situation');
      expect(worry).toHaveProperty('concern');
      expect(worry).toHaveProperty('action');
    });
    
    const multipleApipa = linkLocalApipaContent.whenToWorry.find(w => w.situation.includes("Multiple devices have APIPA"));
    expect(multipleApipa).toBeDefined();
    expect(multipleApipa?.concern).toBe("High - DHCP server or network problem");
  });

  it('validates data structure consistency', () => {
    // Check APIPA structure
    expect(linkLocalApipaContent.apipa).toHaveProperty('title');
    expect(linkLocalApipaContent.apipa).toHaveProperty('range');
    expect(linkLocalApipaContent.apipa).toHaveProperty('reservedAddresses');
    expect(linkLocalApipaContent.apipa.reservedAddresses).toBeInstanceOf(Array);
    
    // Check IPv6 link-local structure
    expect(linkLocalApipaContent.ipv6LinkLocal).toHaveProperty('title');
    expect(linkLocalApipaContent.ipv6LinkLocal).toHaveProperty('range');
    expect(linkLocalApipaContent.ipv6LinkLocal.types).toBeInstanceOf(Array);
    
    // Check practical examples structure
    linkLocalApipaContent.practicalExamples.forEach(example => {
      expect(typeof example.scenario).toBe('string');
      expect(typeof example.ipv4Behavior).toBe('string');
      expect(typeof example.ipv6Behavior).toBe('string');
      expect(typeof example.impact).toBe('string');
    });
  });

  it('emphasizes practical network troubleshooting', () => {
    const content = JSON.stringify(linkLocalApipaContent);
    expect(content).toContain("169.254");
    expect(content).toContain("fe80::");
    expect(content).toContain("DHCP");
    expect(content).toContain("link-local");
    expect(content).toContain("APIPA");
    expect(content).toContain("troubleshooting");
    expect(content).not.toContain("password");
    expect(content).not.toContain("malicious");
  });

  it('covers IPv6 link-local usage scenarios', () => {
    const whenUsed = linkLocalApipaContent.ipv6LinkLocal.whenUsed;
    expect(whenUsed).toBeInstanceOf(Array);
    expect(whenUsed).toContain("Neighbor Discovery Protocol (NDP)");
    expect(whenUsed).toContain("Always present on IPv6 interfaces");
    expect(whenUsed).toContain("Network troubleshooting and diagnostics");
  });

  it('explains APIPA characteristics correctly', () => {
    const characteristics = linkLocalApipaContent.apipa.characteristics;
    expect(characteristics).toBeInstanceOf(Array);
    expect(characteristics).toContain("Only works on local network segment (not routed)");
    expect(characteristics).toContain("Subnet mask is always 255.255.0.0 (/16)");
    expect(characteristics).toContain("No default gateway assigned");
  });
});