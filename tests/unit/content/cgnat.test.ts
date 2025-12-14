import { describe, it, expect } from 'vitest';
import { cgnatContent } from '../../../src/lib/content/cgnat';

describe('CGNAT content', () => {
  it('has valid structure', () => {
    expect(cgnatContent).toBeDefined();
    expect(cgnatContent.title).toBe("Carrier-Grade NAT Explained");
    expect(cgnatContent.description).toContain("CGNAT");
    expect(cgnatContent.sections).toBeDefined();
    expect(cgnatContent.addressRange).toBeDefined();
    expect(cgnatContent.howItWorks).toBeDefined();
    expect(cgnatContent.identification).toBeDefined();
    expect(cgnatContent.impacts).toBeDefined();
  });

  it('explains CGNAT concept clearly', () => {
    const overview = cgnatContent.sections.overview;
    expect(overview.title).toBe("What is Carrier-Grade NAT?");
    expect(overview.content).toContain("large-scale NAT implementation");
    expect(overview.content).toContain("ISPs");
    expect(overview.content).toContain("IPv4 address exhaustion");
  });

  it('defines correct CGNAT address range', () => {
    const range = cgnatContent.addressRange;
    expect(range.range).toBe("100.64.0.0/10");
    expect(range.fullRange).toBe("100.64.0.0 to 100.127.255.255");
    expect(range.totalAddresses).toBe("4,194,304 addresses");
    expect(range.rfc).toBe("RFC 6598");
    expect(range.breakdown).toBeInstanceOf(Array);
    expect(range.breakdown).toHaveLength(4);
  });

  it('explains two-layer NAT system', () => {
    const layers = cgnatContent.howItWorks.layers;
    expect(layers).toBeInstanceOf(Array);
    expect(layers).toHaveLength(2);
    
    const customerNat = layers.find(l => l.layer === "Customer NAT");
    const carrierNat = layers.find(l => l.layer === "Carrier NAT");
    
    expect(customerNat).toBeDefined();
    expect(customerNat?.location).toBe("Home router");
    expect(customerNat?.inside).toContain("Private addresses");
    
    expect(carrierNat).toBeDefined();
    expect(carrierNat?.location).toBe("ISP equipment");
    expect(carrierNat?.outside).toBe("Public IPv4 addresses");
  });

  it('provides CGNAT identification methods', () => {
    const methods = cgnatContent.identification.methods;
    expect(methods).toBeInstanceOf(Array);
    expect(methods.length).toBeGreaterThan(3);
    
    const routerCheck = methods.find(m => m.method === "Check WAN IP on Router");
    expect(routerCheck).toBeDefined();
    expect(routerCheck?.cgnatIndicator).toContain("100.64.0.0/10");
    
    const portForwardingCheck = methods.find(m => m.method === "Port Forwarding Behavior");
    expect(portForwardingCheck).toBeDefined();
  });

  it('covers negative impacts comprehensively', () => {
    const negative = cgnatContent.impacts.negative;
    expect(negative).toBeInstanceOf(Array);
    expect(negative.length).toBeGreaterThan(4);
    
    const impacts = negative.map(impact => impact.impact);
    expect(impacts).toContain("No Inbound Connections");
    expect(impacts).toContain("Port Forwarding Broken");
    expect(impacts).toContain("Gaming Problems");
    
    negative.forEach(impact => {
      expect(impact).toHaveProperty('description');
      expect(impact).toHaveProperty('affectedServices');
      expect(impact).toHaveProperty('workaround');
      expect(impact.affectedServices).toBeInstanceOf(Array);
    });
  });

  it('includes practical workarounds', () => {
    expect(cgnatContent.workarounds).toBeInstanceOf(Array);
    expect(cgnatContent.workarounds.length).toBeGreaterThan(4);
    
    const publicIp = cgnatContent.workarounds.find(w => w.solution === "Request Public IP from ISP");
    expect(publicIp).toBeDefined();
    expect(publicIp?.effectiveness).toBe("Complete solution");
    expect(publicIp?.cost).toContain("$5-20/month");
    
    const ipv6 = cgnatContent.workarounds.find(w => w.solution === "Use IPv6");
    expect(ipv6).toBeDefined();
    expect(ipv6?.cost).toBe("Free, but limited service support");
  });

  it('provides troubleshooting guidance', () => {
    expect(cgnatContent.troubleshooting).toBeInstanceOf(Array);
    expect(cgnatContent.troubleshooting.length).toBeGreaterThan(3);
    
    const gamingIssue = cgnatContent.troubleshooting.find(t => t.issue.includes("Gaming Console"));
    expect(gamingIssue).toBeDefined();
    expect(gamingIssue?.cause).toContain("CGNAT");
    expect(gamingIssue?.solution).toContain("UPnP");
  });

  it('includes quick identification check', () => {
    const quickCheck = cgnatContent.quickCheck;
    expect(quickCheck.steps).toBeInstanceOf(Array);
    expect(quickCheck.whatToDo).toBeInstanceOf(Array);
    
    expect(quickCheck.steps.some(step => step.includes("100.64"))).toBe(true);
    expect(quickCheck.steps.some(step => step.includes("whatismyipaddress.com"))).toBe(true);
  });

  it('validates data structure consistency', () => {
    // Check address range breakdown
    cgnatContent.addressRange.breakdown.forEach(item => {
      expect(item).toHaveProperty('network');
      expect(item).toHaveProperty('addresses');
      expect(item).toHaveProperty('use');
      expect(item.network).toMatch(/100\.\d+\.0\.0\/\d+/);
    });

    // Check identification methods structure
    cgnatContent.identification.methods.forEach(method => {
      expect(method).toHaveProperty('method');
      expect(method).toHaveProperty('description');
      expect(method).toHaveProperty('cgnatIndicator');
      expect(method).toHaveProperty('normalIndicator');
    });

    // Check workarounds structure
    cgnatContent.workarounds.forEach(workaround => {
      expect(workaround).toHaveProperty('solution');
      expect(workaround).toHaveProperty('description');
      expect(workaround).toHaveProperty('effectiveness');
      expect(workaround).toHaveProperty('cost');
    });
  });

  it('emphasizes practical network troubleshooting', () => {
    const content = JSON.stringify(cgnatContent);
    expect(content).toContain("100.64.0.0/10");
    expect(content).toContain("port forwarding");
    expect(content).toContain("NAT");
    expect(content).toContain("ISP");
    expect(content).toContain("IPv4");
    expect(content).toContain("gaming");
    expect(content).not.toContain("password");
    expect(content).not.toContain("malicious");
  });

  it('covers ISP perspective and rationale', () => {
    expect(cgnatContent.ispPerspective).toBeInstanceOf(Array);
    expect(cgnatContent.ispPerspective.length).toBeGreaterThan(4);
    
    const perspectives = cgnatContent.ispPerspective.join(' ');
    expect(perspectives).toContain("more customers");
    expect(perspectives).toContain("IPv4 address costs");
    expect(perspectives).toContain("competitive pricing");
    expect(perspectives).toContain("IPv6 deployment");
  });

  it('provides comprehensive impact analysis', () => {
    expect(cgnatContent.impacts.positive).toBeInstanceOf(Array);
    expect(cgnatContent.impacts.negative).toBeInstanceOf(Array);
    
    // Check positive impacts
    const positive = cgnatContent.impacts.positive.join(' ');
    expect(positive).toContain("Extends IPv4");
    expect(positive).toContain("more customers");
    expect(positive).toContain("affordable");
    
    // Check negative impacts detail
    expect(cgnatContent.impacts.negative.length).toBeGreaterThanOrEqual(5);
  });
});