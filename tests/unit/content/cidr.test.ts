import { describe, it, expect } from 'vitest';
import { cidrContent } from '../../../src/lib/content/cidr';

describe('CIDR content', () => {
  it('has valid structure', () => {
    expect(cidrContent).toBeDefined();
    expect(cidrContent.title).toBe("CIDR Notation Explained");
    expect(cidrContent.description).toContain("CIDR notation");
    expect(cidrContent.sections).toBeDefined();
    expect(cidrContent.examples).toBeInstanceOf(Array);
    expect(cidrContent.prefixTable).toBeInstanceOf(Array);
    expect(cidrContent.keyPoints).toBeInstanceOf(Array);
  });

  it('contains expected sections', () => {
    const sections = cidrContent.sections;
    expect(sections.whatIs).toBeDefined();
    expect(sections.whyReplaced).toBeDefined();
    expect(sections.howToRead).toBeDefined();
    
    expect(sections.whatIs.title).toBe("What is CIDR?");
    expect(sections.whatIs.content).toContain("Classless Inter-Domain Routing");
    
    expect(sections.whyReplaced.title).toBe("Why CIDR Replaced IP Classes");
    expect(sections.whyReplaced.content).toContain("Class A, B, C");
    
    expect(sections.howToRead.title).toBe("How to Read CIDR Notation");
    expect(sections.howToRead.content).toContain("prefix length");
  });

  it('has valid examples', () => {
    expect(cidrContent.examples).toHaveLength(4);
    
    const homeNetwork = cidrContent.examples[0];
    expect(homeNetwork.cidr).toBe("192.168.0.0/24");
    expect(homeNetwork.description).toContain("Home network");
    expect(homeNetwork.hosts).toBe("254 hosts");
    
    const largePrivate = cidrContent.examples[1];
    expect(largePrivate.cidr).toBe("10.0.0.0/8");
    expect(largePrivate.hosts).toBe("16,777,214 hosts");
    
    const ipv6Example = cidrContent.examples[3];
    expect(ipv6Example.cidr).toBe("2001:db8::/32");
    expect(ipv6Example.description).toContain("IPv6");
  });

  it('has complete prefix table', () => {
    expect(cidrContent.prefixTable).toHaveLength(8);
    
    const slash24 = cidrContent.prefixTable.find(p => p.prefix === "/24");
    expect(slash24).toBeDefined();
    expect(slash24?.mask).toBe("255.255.255.0");
    expect(slash24?.hosts).toBe("254");
    expect(slash24?.typical).toBe("Small office/home");
    
    const slash8 = cidrContent.prefixTable.find(p => p.prefix === "/8");
    expect(slash8?.hosts).toBe("16,777,214");
    
    const slash32 = cidrContent.prefixTable.find(p => p.prefix === "/32");
    expect(slash32?.hosts).toBe("1");
    expect(slash32?.typical).toBe("Single host");
  });

  it('has educational key points', () => {
    expect(cidrContent.keyPoints).toHaveLength(5);
    expect(cidrContent.keyPoints[0]).toContain("Smaller prefix numbers = bigger networks");
    expect(cidrContent.keyPoints[1]).toContain("Larger prefix numbers = smaller networks");
    expect(cidrContent.keyPoints[2]).toContain("/24 is the most common");
    expect(cidrContent.keyPoints[3]).toContain("IPv6 commonly uses /64");
    expect(cidrContent.keyPoints[4]).toContain("efficient use");
  });

  it('maintains consistent data structure', () => {
    cidrContent.examples.forEach(example => {
      expect(example).toHaveProperty('cidr');
      expect(example).toHaveProperty('description');
      expect(example).toHaveProperty('hosts');
      expect(typeof example.cidr).toBe('string');
      expect(typeof example.description).toBe('string');
      expect(typeof example.hosts).toBe('string');
    });

    cidrContent.prefixTable.forEach(entry => {
      expect(entry).toHaveProperty('prefix');
      expect(entry).toHaveProperty('mask');
      expect(entry).toHaveProperty('hosts');
      expect(entry).toHaveProperty('typical');
      expect(entry.prefix).toMatch(/^\/\d+$/);
      expect(entry.mask).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    });
  });
});