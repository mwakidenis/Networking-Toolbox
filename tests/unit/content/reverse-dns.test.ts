import { describe, it, expect } from 'vitest';
import { reverseDnsContent } from '../../../src/lib/content/reverse-dns';

describe('Reverse DNS content', () => {
  it('has valid structure', () => {
    expect(reverseDnsContent).toBeDefined();
    expect(reverseDnsContent.title).toBe("Reverse DNS (in-addr.arpa / ip6.arpa)");
    expect(reverseDnsContent.description).toContain("PTR record construction");
    expect(reverseDnsContent.sections).toBeDefined();
    expect(reverseDnsContent.ipv4Reverse).toBeDefined();
    expect(reverseDnsContent.ipv6Reverse).toBeDefined();
  });

  it('explains reverse DNS concept clearly', () => {
    const overview = reverseDnsContent.sections.overview;
    expect(overview.title).toBe("What is Reverse DNS?");
    expect(overview.content).toContain("IP addresses back to domain names");
    expect(overview.content).toContain("PTR records");
    expect(overview.content).toContain("mail servers");
    
    const howWorks = reverseDnsContent.sections.howWorks;
    expect(howWorks.content).toContain(".in-addr.arpa domain");
    expect(howWorks.content).toContain(".ip6.arpa domain");
  });

  it('provides comprehensive IPv4 reverse examples', () => {
    const ipv4 = reverseDnsContent.ipv4Reverse;
    expect(ipv4.process).toBeInstanceOf(Array);
    expect(ipv4.examples).toBeInstanceOf(Array);
    expect(ipv4.examples.length).toBeGreaterThan(3);
    
    ipv4.examples.forEach(example => {
      expect(example).toHaveProperty('ip');
      expect(example).toHaveProperty('reversed');
      expect(example).toHaveProperty('ptrRecord');
      expect(example).toHaveProperty('explanation');
      expect(example.reversed).toContain('.in-addr.arpa');
    });
    
    const googleExample = ipv4.examples.find(e => e.ip === "8.8.8.8");
    expect(googleExample).toBeDefined();
    expect(googleExample?.reversed).toBe("8.8.8.8.in-addr.arpa");
    expect(googleExample?.ptrRecord).toBe("dns.google");
  });

  it('covers IPv4 delegation scenarios', () => {
    const delegation = reverseDnsContent.ipv4Reverse.delegation;
    expect(delegation.title).toBe("Network Delegation");
    expect(delegation.examples).toBeInstanceOf(Array);
    
    delegation.examples.forEach(example => {
      expect(example).toHaveProperty('network');
      expect(example).toHaveProperty('zone');
      expect(example).toHaveProperty('description');
    });
    
    const classC = delegation.examples.find(e => e.network === "192.0.2.0/24");
    expect(classC).toBeDefined();
    expect(classC?.zone).toBe("2.0.192.in-addr.arpa");
  });

  it('provides comprehensive IPv6 reverse examples', () => {
    const ipv6 = reverseDnsContent.ipv6Reverse;
    expect(ipv6.process).toBeInstanceOf(Array);
    expect(ipv6.examples).toBeInstanceOf(Array);
    expect(ipv6.examples.length).toBeGreaterThan(2);
    
    ipv6.examples.forEach(example => {
      expect(example).toHaveProperty('ip');
      expect(example).toHaveProperty('expanded');
      expect(example).toHaveProperty('nibbles');
      expect(example).toHaveProperty('ptrRecord');
      expect(example).toHaveProperty('explanation');
      expect(example.nibbles).toContain('.ip6.arpa');
    });
    
    const simpleExample = ipv6.examples.find(e => e.ip === "2001:db8::1");
    expect(simpleExample).toBeDefined();
    expect(simpleExample?.expanded).toBe("2001:0db8:0000:0000:0000:0000:0000:0001");
    expect(simpleExample?.nibbles).toContain("1.0.0.0");
  });

  it('explains IPv6 nibble format correctly', () => {
    const ipv6 = reverseDnsContent.ipv6Reverse;
    const process = ipv6.process;
    expect(process.some(step => step.includes("expand to full form"))).toBe(true);
    expect(process.some(step => step.includes("reverse all hex digits"))).toBe(true);
    expect(process.some(step => step.includes("Insert dots between each hex digit"))).toBe(true);
    
    const complexExample = ipv6.examples.find(e => e.ip === "2001:db8:85a3::8a2e:370:7334");
    expect(complexExample).toBeDefined();
    expect(complexExample?.explanation).toContain("Full expansion required");
  });

  it('covers IPv6 delegation examples', () => {
    const delegation = reverseDnsContent.ipv6Reverse.delegation;
    expect(delegation.examples).toBeInstanceOf(Array);
    
    const rirExample = delegation.examples.find(e => e.network === "2001:db8::/32");
    expect(rirExample).toBeDefined();
    expect(rirExample?.zone).toBe("8.b.d.0.1.0.0.2.ip6.arpa");
    expect(rirExample?.description).toContain("RIR allocation");
  });

  it('provides practical examples and tools', () => {
    const practical = reverseDnsContent.practicalExamples;
    expect(practical.digExamples).toBeInstanceOf(Array);
    expect(practical.commonChecks).toBeInstanceOf(Array);
    
    practical.digExamples.forEach(example => {
      expect(example).toHaveProperty('command');
      expect(example).toHaveProperty('description');
      expect(example).toHaveProperty('expectedResult');
    });
    
    const digExample = practical.digExamples.find(e => e.command === "dig -x 8.8.8.8");
    expect(digExample).toBeDefined();
    expect(digExample?.expectedResult).toBe("dns.google.");
  });

  it('includes troubleshooting scenarios', () => {
    expect(reverseDnsContent.troubleshooting).toBeInstanceOf(Array);
    expect(reverseDnsContent.troubleshooting.length).toBeGreaterThan(2);
    
    reverseDnsContent.troubleshooting.forEach(issue => {
      expect(issue).toHaveProperty('issue');
      expect(issue).toHaveProperty('causes');
      expect(issue).toHaveProperty('solutions');
      expect(issue.causes).toBeInstanceOf(Array);
      expect(issue.solutions).toBeInstanceOf(Array);
    });
    
    const emailIssue = reverseDnsContent.troubleshooting.find(t => t.issue.includes("Email being rejected"));
    expect(emailIssue).toBeDefined();
    expect(emailIssue?.causes).toContain("Mail server missing PTR record");
  });

  it('provides best practices', () => {
    expect(reverseDnsContent.bestPractices).toBeInstanceOf(Array);
    expect(reverseDnsContent.bestPractices.length).toBeGreaterThan(5);
    
    const practices = reverseDnsContent.bestPractices.join(' ');
    expect(practices).toContain("configure reverse DNS for mail servers");
    expect(practices).toContain("forward and reverse DNS match");
    expect(practices).toContain("meaningful hostnames");
  });

  it('includes quick reference guide', () => {
    const quickRef = reverseDnsContent.quickReference;
    expect(quickRef.ipv4).toBeInstanceOf(Array);
    expect(quickRef.ipv6).toBeInstanceOf(Array);
    
    expect(quickRef.ipv4).toContain("192.0.2.1 → 1.2.0.192.in-addr.arpa");
    expect(quickRef.ipv6.some(ref => ref.includes("nibble format"))).toBe(true);
  });

  it('provides useful tools list', () => {
    expect(reverseDnsContent.tools).toBeInstanceOf(Array);
    expect(reverseDnsContent.tools.length).toBeGreaterThan(3);
    
    reverseDnsContent.tools.forEach(tool => {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
    });
    
    const digTool = reverseDnsContent.tools.find(t => t.name === "dig -x");
    expect(digTool).toBeDefined();
    expect(digTool?.description).toContain("reverse DNS lookup");
  });

  it('validates reverse DNS construction', () => {
    // Check that IPv4 reverse examples follow correct format
    reverseDnsContent.ipv4Reverse.examples.forEach(example => {
      const octets = example.ip.split('.');
      const reversedOctets = octets.reverse().join('.');
      expect(example.reversed).toBe(`${reversedOctets}.in-addr.arpa`);
    });
    
    // Verify IPv6 examples have correct structure
    reverseDnsContent.ipv6Reverse.examples.forEach(example => {
      expect(example.nibbles).toMatch(/^[0-9a-f.]+(\.ip6\.arpa)$/);
      expect(example.expanded).toMatch(/^[0-9a-f:]+$/);
    });
  });

  it('validates data structure consistency', () => {
    // Check IPv4 reverse structure
    expect(reverseDnsContent.ipv4Reverse.process.length).toBeGreaterThan(4);
    expect(reverseDnsContent.ipv4Reverse.delegation).toHaveProperty('title');
    expect(reverseDnsContent.ipv4Reverse.delegation).toHaveProperty('examples');
    
    // Check IPv6 reverse structure
    expect(reverseDnsContent.ipv6Reverse.process.length).toBeGreaterThan(4);
    expect(reverseDnsContent.ipv6Reverse.delegation).toHaveProperty('title');
    expect(reverseDnsContent.ipv6Reverse.delegation).toHaveProperty('examples');
    
    // Check practical examples structure
    reverseDnsContent.practicalExamples.digExamples.forEach(example => {
      expect(typeof example.command).toBe('string');
      expect(typeof example.description).toBe('string');
      expect(typeof example.expectedResult).toBe('string');
    });
  });

  it('emphasizes practical DNS troubleshooting', () => {
    const content = JSON.stringify(reverseDnsContent);
    expect(content).toContain("PTR");
    expect(content).toContain("in-addr.arpa");
    expect(content).toContain("ip6.arpa");
    expect(content).toContain("reverse DNS");
    expect(content).toContain("dig -x");
    expect(content).toContain("mail server");
    expect(content).not.toContain("password");
    expect(content).not.toContain("malicious");
  });

  it('covers both IPv4 and IPv6 thoroughly', () => {
    // IPv4 coverage
    expect(reverseDnsContent.ipv4Reverse.examples.length).toBeGreaterThan(3);
    expect(reverseDnsContent.ipv4Reverse.delegation.examples.length).toBeGreaterThan(1);
    
    // IPv6 coverage
    expect(reverseDnsContent.ipv6Reverse.examples.length).toBeGreaterThan(2);
    expect(reverseDnsContent.ipv6Reverse.delegation.examples.length).toBeGreaterThan(1);
    
    // Both protocols covered in tools and troubleshooting
    expect(reverseDnsContent.practicalExamples.digExamples.some(e => e.command.includes("2001:"))).toBe(true);
    expect(reverseDnsContent.quickReference.ipv4.length).toBeGreaterThan(0);
    expect(reverseDnsContent.quickReference.ipv6.length).toBeGreaterThan(0);
  });
});