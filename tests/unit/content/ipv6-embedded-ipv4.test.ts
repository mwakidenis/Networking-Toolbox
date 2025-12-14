import { describe, it, expect } from 'vitest';
import { ipv6EmbeddedIPv4Content } from '../../../src/lib/content/ipv6-embedded-ipv4';

describe('IPv6 Embedded IPv4 content', () => {
  it('has valid structure', () => {
    expect(ipv6EmbeddedIPv4Content).toBeDefined();
    expect(ipv6EmbeddedIPv4Content.title).toBe("IPv4 in IPv6");
    expect(ipv6EmbeddedIPv4Content.description).toContain("IPv4-mapped addresses");
    expect(ipv6EmbeddedIPv4Content.sections).toBeDefined();
    expect(ipv6EmbeddedIPv4Content.mechanisms).toBeDefined();
    expect(ipv6EmbeddedIPv4Content.recognition).toBeDefined();
    expect(ipv6EmbeddedIPv4Content.conversion).toBeDefined();
  });

  it('explains the transition context', () => {
    const overview = ipv6EmbeddedIPv4Content.sections.overview;
    expect(overview.title).toBe("Why IPv4-in-IPv6?");
    expect(overview.content).toContain("transition from IPv4 to IPv6");
    expect(overview.content).toContain("embed or reference IPv4 addresses");
    expect(overview.content).toContain("compatibility");
  });

  it('covers all major transition mechanisms', () => {
    const mechanisms = ipv6EmbeddedIPv4Content.mechanisms;
    expect(mechanisms).toBeInstanceOf(Array);
    expect(mechanisms.length).toBeGreaterThanOrEqual(6);
    
    const names = mechanisms.map(m => m.name);
    expect(names).toContain("IPv4-Mapped IPv6 Addresses");
    expect(names).toContain("6to4");
    expect(names).toContain("Teredo");
    expect(names).toContain("ISATAP");
    expect(names).toContain("6rd (IPv6 Rapid Deployment)");
  });

  it('provides correct IPv4-mapped address details', () => {
    const ipv4Mapped = ipv6EmbeddedIPv4Content.mechanisms.find(m => m.name === "IPv4-Mapped IPv6 Addresses");
    expect(ipv4Mapped).toBeDefined();
    expect(ipv4Mapped?.prefix).toBe("::ffff:0:0/96");
    expect(ipv4Mapped?.status).toBe("Active");
    expect(ipv4Mapped?.examples).toContain("::ffff:192.0.2.1 (maps 192.0.2.1)");
    expect(ipv4Mapped?.examples).toContain("::ffff:c000:201 (same as above in hex)");
  });

  it('correctly identifies deprecated mechanisms', () => {
    const deprecated = ipv6EmbeddedIPv4Content.mechanisms.filter(m => 
      m.status === "Deprecated" || m.status === "Legacy"
    );
    expect(deprecated.length).toBeGreaterThan(2);
    
    const ipv4Compatible = ipv6EmbeddedIPv4Content.mechanisms.find(m => m.name.includes("IPv4-Compatible"));
    expect(ipv4Compatible).toBeDefined();
    expect(ipv4Compatible?.status).toBe("Deprecated");
    expect(ipv4Compatible?.prefix).toBe("::/96");
  });

  it('provides 6to4 mechanism details', () => {
    const sixto4 = ipv6EmbeddedIPv4Content.mechanisms.find(m => m.name === "6to4");
    expect(sixto4).toBeDefined();
    expect(sixto4?.prefix).toBe("2002::/16");
    expect(sixto4?.examples).toContain("2002:c000:201::/48 (for 192.0.2.1)");
    expect(sixto4?.status).toBe("Deprecated");
  });

  it('covers Teredo mechanism comprehensively', () => {
    const teredo = ipv6EmbeddedIPv4Content.mechanisms.find(m => m.name === "Teredo");
    expect(teredo).toBeDefined();
    expect(teredo?.prefix).toBe("2001:0::/32");
    expect(teredo?.purpose).toContain("NAT devices");
    expect(teredo?.usage).toContain("Microsoft Windows IPv6 connectivity");
  });

  it('includes ISATAP details', () => {
    const isatap = ipv6EmbeddedIPv4Content.mechanisms.find(m => m.name === "ISATAP");
    expect(isatap).toBeDefined();
    expect(isatap?.format).toContain(":5efe:");
    expect(isatap?.examples).toContain("fe80::5efe:192.0.2.1");
    expect(isatap?.usage).toContain("Enterprise intranet IPv6 deployment");
  });

  it('provides recognition patterns', () => {
    const patterns = ipv6EmbeddedIPv4Content.recognition.patterns;
    expect(patterns).toBeInstanceOf(Array);
    expect(patterns.length).toBeGreaterThan(4);
    
    patterns.forEach(pattern => {
      expect(pattern).toHaveProperty('pattern');
      expect(pattern).toHaveProperty('meaning');
      expect(pattern).toHaveProperty('action');
    });
    
    const mappedPattern = patterns.find(p => p.pattern === "::ffff:x.x.x.x");
    expect(mappedPattern).toBeDefined();
    expect(mappedPattern?.meaning).toBe("IPv4-mapped address");
  });

  it('includes IPv4 to hex conversion examples', () => {
    const examples = ipv6EmbeddedIPv4Content.conversion.examples;
    expect(examples).toBeInstanceOf(Array);
    expect(examples.length).toBeGreaterThan(3);
    
    examples.forEach(example => {
      expect(example).toHaveProperty('ipv4');
      expect(example).toHaveProperty('hex');
      expect(example).toHaveProperty('breakdown');
      expect(example.ipv4).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      expect(example.hex).toMatch(/^[a-f0-9]{4}:[a-f0-9]{4}$/);
    });
    
    const example192 = examples.find(e => e.ipv4 === "192.0.2.1");
    expect(example192).toBeDefined();
    expect(example192?.hex).toBe("c000:0201");
  });

  it('covers modern usage guidance', () => {
    expect(ipv6EmbeddedIPv4Content.modernUsage).toBeInstanceOf(Array);
    expect(ipv6EmbeddedIPv4Content.modernUsage.length).toBeGreaterThan(3);
    
    const guidance = ipv6EmbeddedIPv4Content.modernUsage.join(' ');
    expect(guidance).toContain("IPv4-mapped addresses are still used");
    expect(guidance).toContain("6to4 and Teredo are mostly disabled");
    expect(guidance).toContain("native IPv6");
  });

  it('provides troubleshooting information', () => {
    expect(ipv6EmbeddedIPv4Content.troubleshooting).toBeInstanceOf(Array);
    expect(ipv6EmbeddedIPv4Content.troubleshooting.length).toBeGreaterThan(3);
    
    ipv6EmbeddedIPv4Content.troubleshooting.forEach(item => {
      expect(item).toHaveProperty('issue');
      expect(item).toHaveProperty('cause');
      expect(item).toHaveProperty('solution');
    });
    
    const ffff = ipv6EmbeddedIPv4Content.troubleshooting.find(t => t.issue.includes("::ffff:"));
    expect(ffff).toBeDefined();
    expect(ffff?.solution).toContain("Normal behavior");
  });

  it('includes security considerations', () => {
    expect(ipv6EmbeddedIPv4Content.securityNotes).toBeInstanceOf(Array);
    expect(ipv6EmbeddedIPv4Content.securityNotes.length).toBeGreaterThan(3);
    
    const security = ipv6EmbeddedIPv4Content.securityNotes.join(' ');
    expect(security).toContain("deprecated due to security issues");
    expect(security).toContain("traffic injection attacks");
    expect(security).toContain("bypass firewall rules");
  });

  it('validates data structure consistency', () => {
    // Check mechanisms structure
    ipv6EmbeddedIPv4Content.mechanisms.forEach(mechanism => {
      expect(mechanism).toHaveProperty('name');
      expect(mechanism).toHaveProperty('prefix');
      expect(mechanism).toHaveProperty('status');
      expect(mechanism).toHaveProperty('purpose');
      expect(mechanism).toHaveProperty('examples');
      expect(mechanism).toHaveProperty('usage');
      expect(mechanism.examples).toBeInstanceOf(Array);
      expect(mechanism.usage).toBeInstanceOf(Array);
      expect(['Active', 'Deprecated', 'Legacy', 'Limited Use']).toContain(mechanism.status);
    });

    // Check recognition patterns structure
    ipv6EmbeddedIPv4Content.recognition.patterns.forEach(pattern => {
      expect(typeof pattern.pattern).toBe('string');
      expect(typeof pattern.meaning).toBe('string');
      expect(typeof pattern.action).toBe('string');
    });
  });

  it('emphasizes practical IPv6 transition concepts', () => {
    const content = JSON.stringify(ipv6EmbeddedIPv4Content);
    expect(content).toContain("IPv4");
    expect(content).toContain("IPv6");
    expect(content).toContain("transition");
    expect(content).toContain("tunneling");
    expect(content).toContain("dual-stack");
    expect(content).toContain("::ffff:");
    expect(content).toContain("2002::");
    expect(content).not.toContain("password");
    expect(content).not.toContain("malicious");
  });

  it('covers all major prefixes correctly', () => {
    const prefixes = ipv6EmbeddedIPv4Content.mechanisms.map(m => m.prefix);
    expect(prefixes).toContain("::ffff:0:0/96");
    expect(prefixes).toContain("::/96");
    expect(prefixes).toContain("2002::/16");
    expect(prefixes).toContain("2001:0::/32");
    
    // Check that all prefixes are valid IPv6 prefix notation (excluding special cases)
    prefixes.forEach(prefix => {
      if (prefix !== "Variable" && !prefix.includes(" or ")) {
        expect(prefix).toMatch(/^[a-f0-9:]+\/\d+$/);
      }
    });
  });
});