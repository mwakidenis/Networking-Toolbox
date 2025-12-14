import { describe, it, expect } from 'vitest';
import { ipv6PrefixLengthsContent } from '../../../src/lib/content/ipv6-prefix-lengths';

describe('IPv6 Prefix Lengths content', () => {
  it('has valid structure', () => {
    expect(ipv6PrefixLengthsContent).toBeDefined();
    expect(ipv6PrefixLengthsContent.title).toBe("Common IPv6 Prefix Lengths");
    expect(ipv6PrefixLengthsContent.description).toContain("IPv6 prefix lengths");
    expect(ipv6PrefixLengthsContent.sections).toBeDefined();
    expect(ipv6PrefixLengthsContent.commonPrefixes).toBeDefined();
    expect(ipv6PrefixLengthsContent.usageGuidelines).toBeDefined();
  });

  it('explains IPv6 prefix concept', () => {
    const overview = ipv6PrefixLengthsContent.sections.overview;
    expect(overview.title).toBe("IPv6 Prefix Length Overview");
    expect(overview.content).toContain("128-bit address space");
    expect(overview.content).toContain("/64 for end-user networks");
    expect(overview.content).toContain("different due to IPv6");
  });

  it('covers all major prefix lengths', () => {
    const prefixes = ipv6PrefixLengthsContent.commonPrefixes;
    expect(prefixes).toBeInstanceOf(Array);
    expect(prefixes.length).toBeGreaterThan(6);
    
    const prefixValues = prefixes.map(p => p.prefix);
    expect(prefixValues).toContain("/128");
    expect(prefixValues).toContain("/127");
    expect(prefixValues).toContain("/64");
    expect(prefixValues).toContain("/48");
    expect(prefixValues).toContain("/32");
  });

  it('provides correct /64 subnet details', () => {
    const subnet64 = ipv6PrefixLengthsContent.commonPrefixes.find(p => p.prefix === "/64");
    expect(subnet64).toBeDefined();
    expect(subnet64?.name).toBe("Standard Subnet");
    expect(subnet64?.typical).toContain("LAN segments");
    expect(subnet64?.description).toContain("SLAAC and EUI-64");
    expect(subnet64?.hosts).toContain("18,446,744,073,709,551,616");
  });

  it('explains point-to-point links correctly', () => {
    const ptp = ipv6PrefixLengthsContent.commonPrefixes.find(p => p.prefix === "/127");
    expect(ptp).toBeDefined();
    expect(ptp?.name).toBe("Point-to-Point Link");
    expect(ptp?.hosts).toBe("2 addresses");
    expect(ptp?.description).toContain("like IPv4 /30");
  });

  it('provides ISP allocation details', () => {
    const ispAlloc = ipv6PrefixLengthsContent.commonPrefixes.find(p => p.prefix === "/32");
    expect(ispAlloc).toBeDefined();
    expect(ispAlloc?.name).toBe("ISP/RIR Allocation");
    expect(ispAlloc?.typical).toContain("ISPs");
    expect(ispAlloc?.description).toContain("Regional Internet Registries");
  });

  it('includes comprehensive usage guidelines', () => {
    const guidelines = ipv6PrefixLengthsContent.usageGuidelines;
    expect(guidelines.residential).toBeDefined();
    expect(guidelines.enterprise).toBeDefined();
    expect(guidelines.subnets).toBeDefined();
    
    expect(guidelines.residential.allocations).toBeInstanceOf(Array);
    expect(guidelines.enterprise.allocations).toBeInstanceOf(Array);
    expect(guidelines.subnets.allocations).toBeInstanceOf(Array);
  });

  it('provides IPv4 vs IPv6 comparison', () => {
    const comparison = ipv6PrefixLengthsContent.comparison;
    expect(comparison.mappings).toBeInstanceOf(Array);
    expect(comparison.mappings.length).toBeGreaterThan(4);
    
    const mappings = comparison.mappings;
    const hostMapping = mappings.find(m => m.ipv4.includes("/32"));
    expect(hostMapping).toBeDefined();
    expect(hostMapping?.ipv6).toContain("/128");
    
    const lanMapping = mappings.find(m => m.ipv4.includes("/24"));
    expect(lanMapping).toBeDefined();
    expect(lanMapping?.ipv6).toContain("/64");
  });

  it('includes practical best practices', () => {
    expect(ipv6PrefixLengthsContent.bestPractices).toBeInstanceOf(Array);
    expect(ipv6PrefixLengthsContent.bestPractices.length).toBeGreaterThan(4);
    
    const practices = ipv6PrefixLengthsContent.bestPractices.join(' ');
    expect(practices).toContain("/64 for end-user networks");
    expect(practices).toContain("SLAAC");
    expect(practices).toContain("/127 for point-to-point");
  });

  it('provides quick reference table', () => {
    expect(ipv6PrefixLengthsContent.quickReference).toBeInstanceOf(Array);
    expect(ipv6PrefixLengthsContent.quickReference.length).toBeGreaterThan(6);
    
    ipv6PrefixLengthsContent.quickReference.forEach(ref => {
      expect(ref).toHaveProperty('prefix');
      expect(ref).toHaveProperty('subnets');
      expect(ref).toHaveProperty('note');
      expect(ref.prefix).toMatch(/^\/\d+$/);
    });
  });

  it('includes helpful tips', () => {
    expect(ipv6PrefixLengthsContent.tips).toBeInstanceOf(Array);
    expect(ipv6PrefixLengthsContent.tips.length).toBeGreaterThan(4);
    
    const tips = ipv6PrefixLengthsContent.tips.join(' ');
    expect(tips).toContain("address space");
    expect(tips).toContain("SLAAC");
    expect(tips).toContain("nibble boundaries");
  });

  it('validates data structure consistency', () => {
    // Check common prefixes structure
    ipv6PrefixLengthsContent.commonPrefixes.forEach(prefix => {
      expect(prefix).toHaveProperty('prefix');
      expect(prefix).toHaveProperty('name');
      expect(prefix).toHaveProperty('hosts');
      expect(prefix).toHaveProperty('typical');
      expect(prefix).toHaveProperty('examples');
      expect(prefix).toHaveProperty('description');
      expect(prefix.examples).toBeInstanceOf(Array);
      expect(prefix.prefix).toMatch(/^\/\d+$/);
    });

    // Check usage guidelines structure
    ['residential', 'enterprise', 'subnets'].forEach(category => {
      const section = ipv6PrefixLengthsContent.usageGuidelines[category as keyof typeof ipv6PrefixLengthsContent.usageGuidelines];
      expect(section).toHaveProperty('title');
      expect(section).toHaveProperty('allocations');
      expect((section as any).allocations).toBeInstanceOf(Array);

      (section as any).allocations.forEach((alloc: any) => {
        expect(alloc).toHaveProperty('size');
        expect(alloc).toHaveProperty('description');
      });
    });
  });

  it('emphasizes practical IPv6 network design', () => {
    const content = JSON.stringify(ipv6PrefixLengthsContent);
    expect(content).toContain("IPv6");
    expect(content).toContain("prefix");
    expect(content).toContain("subnet");
    expect(content).toContain("SLAAC");
    expect(content).toContain("/64");
    expect(content).toContain("network planning");
    expect(content).not.toContain("password");
    expect(content).not.toContain("malicious");
  });

  it('covers residential and enterprise scenarios', () => {
    const residential = ipv6PrefixLengthsContent.usageGuidelines.residential;
    expect(residential.title).toBe("Residential/Small Office");
    expect(residential.allocations.some(a => a.size === "/56")).toBe(true);
    
    const enterprise = ipv6PrefixLengthsContent.usageGuidelines.enterprise;
    expect(enterprise.title).toBe("Enterprise Networks");
    expect(enterprise.allocations.some(a => a.size === "/48")).toBe(true);
  });
});