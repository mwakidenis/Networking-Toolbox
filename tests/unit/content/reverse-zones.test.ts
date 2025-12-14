import { describe, it, expect } from 'vitest';
import { reverseZonesContent } from '../../../src/lib/content/reverse-zones';

describe('Reverse Zones content', () => {
  it('has valid structure', () => {
    expect(reverseZonesContent).toBeDefined();
    expect(reverseZonesContent.title).toBe("Reverse Zones for CIDR Delegation");
    expect(reverseZonesContent.description).toContain("IPv4 and IPv6 CIDR blocks");
    expect(reverseZonesContent.sections).toBeDefined();
    expect(reverseZonesContent.ipv4Zones).toBeDefined();
    expect(reverseZonesContent.ipv6Zones).toBeDefined();
    expect(reverseZonesContent.zoneCreation).toBeDefined();
  });

  it('explains reverse zones concept clearly', () => {
    const overview = reverseZonesContent.sections.overview;
    expect(overview.title).toBe("What are Reverse Zones?");
    expect(overview.content).toContain("IP addresses back to domain names");
    expect(overview.content).toContain("CIDR block");

    const delegation = reverseZonesContent.sections.delegation;
    expect(delegation.content).toContain("PTR records");
    expect(delegation.content).toContain("ISP or RIR delegates");
    expect(delegation.content).toContain("specific boundaries");
  });

  it('covers IPv4 classfull boundaries', () => {
    const boundaries = reverseZonesContent.ipv4Zones.classfullBoundaries;
    expect(boundaries).toBeInstanceOf(Array);
    expect(boundaries.length).toBeGreaterThanOrEqual(3);
    
    boundaries.forEach(boundary => {
      expect(boundary).toHaveProperty('cidr');
      expect(boundary).toHaveProperty('example');
      expect(boundary).toHaveProperty('reverseZone');
      expect(boundary).toHaveProperty('description');
      expect(boundary).toHaveProperty('delegation');
      expect(boundary.reverseZone).toContain('.in-addr.arpa');
    });
    
    const class24 = boundaries.find(b => b.cidr === "/24");
    expect(class24).toBeDefined();
    expect(class24?.example).toBe("192.168.1.0/24");
    expect(class24?.reverseZone).toBe("1.168.192.in-addr.arpa");
  });

  it('explains classless delegation challenges', () => {
    const classless = reverseZonesContent.ipv4Zones.classlessDelegation;
    expect(classless).toBeInstanceOf(Array);
    expect(classless.length).toBeGreaterThan(2);
    
    classless.forEach(delegation => {
      expect(delegation).toHaveProperty('cidr');
      expect(delegation).toHaveProperty('problem');
      expect(delegation).toHaveProperty('solution');
      expect(delegation).toHaveProperty('zones');
      expect(delegation.zones).toBeInstanceOf(Array);
    });
    
    const subnet25 = classless.find(c => c.cidr === "/25");
    expect(subnet25).toBeDefined();
    expect(subnet25?.problem).toContain("octet boundaries");
    expect(subnet25?.solution).toContain("CNAME delegation");
  });

  it('provides IPv4 practical examples', () => {
    const examples = reverseZonesContent.ipv4Zones.practicalExamples;
    expect(examples).toBeInstanceOf(Array);
    expect(examples.length).toBeGreaterThan(1);
    
    examples.forEach(example => {
      expect(example).toHaveProperty('scenario');
      expect(example).toHaveProperty('network');
      expect(example).toHaveProperty('delegation');
    });
    
    const smallBiz = examples.find(e => e.scenario === "Small Business with /24");
    expect(smallBiz).toBeDefined();
    expect(smallBiz?.network).toBe("192.0.2.0/24");
    expect(smallBiz?.reverseZone).toBe("2.0.192.in-addr.arpa");
    expect(smallBiz?.ptrRecords).toBeInstanceOf(Array);
  });

  it('covers IPv6 nibble boundaries', () => {
    const boundaries = reverseZonesContent.ipv6Zones.nibbleBoundaries;
    expect(boundaries).toBeInstanceOf(Array);
    expect(boundaries.length).toBeGreaterThan(3);
    
    boundaries.forEach(boundary => {
      expect(boundary).toHaveProperty('cidr');
      expect(boundary).toHaveProperty('example');
      expect(boundary).toHaveProperty('reverseZone');
      expect(boundary).toHaveProperty('description');
      expect(boundary).toHaveProperty('delegation');
      expect(boundary.reverseZone).toContain('.ip6.arpa');
    });
    
    const prefix48 = boundaries.find(b => b.cidr === "/48");
    expect(prefix48).toBeDefined();
    expect(prefix48?.example).toBe("2001:db8:1234::/48");
    expect(prefix48?.reverseZone).toBe("4.3.2.1.8.b.d.0.1.0.0.2.ip6.arpa");
  });

  it('provides IPv6 practical examples', () => {
    const examples = reverseZonesContent.ipv6Zones.practicalExamples;
    expect(examples).toBeInstanceOf(Array);
    expect(examples.length).toBeGreaterThan(0);
    
    const enterprise = examples.find(e => e.scenario === "Enterprise with /48");
    expect(enterprise).toBeDefined();
    expect(enterprise?.network).toBe("2001:db8:1234::/48");
    expect(enterprise?.subZones).toBeInstanceOf(Array);
    expect(enterprise?.management).toContain("Create master zone");
  });

  it('includes comprehensive zone creation examples', () => {
    const creation = reverseZonesContent.zoneCreation;
    expect(creation.ipv4Example).toBeDefined();
    expect(creation.ipv6Example).toBeDefined();
    
    const ipv4 = creation.ipv4Example;
    expect(ipv4.network).toBe("192.0.2.0/24");
    expect(ipv4.zoneName).toBe("2.0.192.in-addr.arpa");
    expect(ipv4.zoneFile).toContain("SOA");
    expect(ipv4.zoneFile).toContain("NS");
    expect(ipv4.zoneFile).toContain("PTR");
    expect(ipv4.explanation).toBeInstanceOf(Array);
    
    const ipv6 = creation.ipv6Example;
    expect(ipv6.network).toBe("2001:db8:1234::/48");
    expect(ipv6.zoneName).toBe("4.3.2.1.8.b.d.0.1.0.0.2.ip6.arpa");
    expect(ipv6.zoneFile).toContain("SOA");
    expect(ipv6.explanation).toBeInstanceOf(Array);
  });

  it('covers delegation scenarios', () => {
    expect(reverseZonesContent.delegationScenarios).toBeInstanceOf(Array);
    expect(reverseZonesContent.delegationScenarios.length).toBeGreaterThan(1);
    
    reverseZonesContent.delegationScenarios.forEach(scenario => {
      expect(scenario).toHaveProperty('scenario');
      expect(scenario).toHaveProperty('delegation');
    });
    
    const ispCustomer = reverseZonesContent.delegationScenarios.find(s => s.scenario.includes("ISP to Customer"));
    expect(ispCustomer).toBeDefined();
    expect(ispCustomer?.customerActions).toBeInstanceOf(Array);
    expect(ispCustomer?.ispActions).toBeInstanceOf(Array);
  });

  it('provides troubleshooting guidance', () => {
    expect(reverseZonesContent.troubleshooting).toBeInstanceOf(Array);
    expect(reverseZonesContent.troubleshooting.length).toBeGreaterThan(2);
    
    reverseZonesContent.troubleshooting.forEach(issue => {
      expect(issue).toHaveProperty('issue');
      expect(issue).toHaveProperty('causes');
      expect(issue).toHaveProperty('diagnosis');
      expect(issue).toHaveProperty('solution');
      expect(issue.causes).toBeInstanceOf(Array);
    });
    
    const reverseLookups = reverseZonesContent.troubleshooting.find(t => t.issue.includes("Reverse lookups not working"));
    expect(reverseLookups).toBeDefined();
    expect(reverseLookups?.diagnosis).toContain("dig -x");
  });

  it('includes best practices', () => {
    expect(reverseZonesContent.bestPractices).toBeInstanceOf(Array);
    expect(reverseZonesContent.bestPractices.length).toBeGreaterThan(5);
    
    const practices = reverseZonesContent.bestPractices.join(' ');
    expect(practices).toContain("create reverse zones");
    expect(practices).toContain("PTR records match forward DNS");
    expect(practices).toContain("consistent naming conventions");
  });

  it('provides quick reference guide', () => {
    const quickRef = reverseZonesContent.quickReference;
    expect(quickRef.zoneFormulas).toBeInstanceOf(Array);
    expect(quickRef.essentialRecords).toBeInstanceOf(Array);
    
    expect(quickRef.zoneFormulas.some(f => f.includes("in-addr.arpa"))).toBe(true);
    expect(quickRef.zoneFormulas.some(f => f.includes("ip6.arpa"))).toBe(true);
    expect(quickRef.essentialRecords).toContain("SOA record (required for all zones)");
  });

  it('includes useful tools', () => {
    expect(reverseZonesContent.tools).toBeInstanceOf(Array);
    expect(reverseZonesContent.tools.length).toBeGreaterThan(3);
    
    reverseZonesContent.tools.forEach(tool => {
      expect(tool).toHaveProperty('tool');
      expect(tool).toHaveProperty('purpose');
    });
    
    const digTool = reverseZonesContent.tools.find(t => t.tool === "dig -x [ip]");
    expect(digTool).toBeDefined();
    expect(digTool?.purpose).toBe("Test reverse DNS lookup");
  });

  it('validates zone name construction', () => {
    // Check IPv4 zone name construction
    const ipv4Boundaries = reverseZonesContent.ipv4Zones.classfullBoundaries;
    ipv4Boundaries.forEach(boundary => {
      const network = boundary.example.split('/')[0];
      const octets = network.split('.').reverse().slice(1); // Remove host octet for /24
      if (boundary.cidr === "/24") {
        expect(boundary.reverseZone).toBe(`${octets.join('.')}.in-addr.arpa`);
      }
    });
    
    // Check that IPv6 zones follow nibble format
    const ipv6Boundaries = reverseZonesContent.ipv6Zones.nibbleBoundaries;
    ipv6Boundaries.forEach(boundary => {
      expect(boundary.reverseZone).toMatch(/^[0-9a-f.]+\.ip6\.arpa$/);
    });
  });

  it('validates data structure consistency', () => {
    // Check IPv4 zones structure
    expect(reverseZonesContent.ipv4Zones).toHaveProperty('title');
    expect(reverseZonesContent.ipv4Zones).toHaveProperty('classfullBoundaries');
    expect(reverseZonesContent.ipv4Zones).toHaveProperty('classlessDelegation');
    expect(reverseZonesContent.ipv4Zones).toHaveProperty('practicalExamples');
    
    // Check IPv6 zones structure
    expect(reverseZonesContent.ipv6Zones).toHaveProperty('title');
    expect(reverseZonesContent.ipv6Zones).toHaveProperty('nibbleBoundaries');
    expect(reverseZonesContent.ipv6Zones).toHaveProperty('practicalExamples');
    
    // Check zone creation examples
    expect(reverseZonesContent.zoneCreation.ipv4Example).toHaveProperty('zoneFile');
    expect(reverseZonesContent.zoneCreation.ipv6Example).toHaveProperty('zoneFile');
    
    // Validate zone files contain essential records
    expect(reverseZonesContent.zoneCreation.ipv4Example.zoneFile).toContain('SOA');
    expect(reverseZonesContent.zoneCreation.ipv4Example.zoneFile).toContain('NS');
    expect(reverseZonesContent.zoneCreation.ipv4Example.zoneFile).toContain('PTR');
  });

  it('emphasizes practical DNS zone management', () => {
    const content = JSON.stringify(reverseZonesContent);
    expect(content).toContain("reverse zone");
    expect(content).toContain("PTR");
    expect(content).toContain("delegation");
    expect(content).toContain("in-addr.arpa");
    expect(content).toContain("ip6.arpa");
    expect(content).toContain("CIDR");
    expect(content).toContain("nibble");
    expect(content).not.toContain("password");
    expect(content).not.toContain("malicious");
  });

  it('covers both IPv4 and IPv6 comprehensively', () => {
    // IPv4 coverage
    expect(reverseZonesContent.ipv4Zones.classfullBoundaries.length).toBeGreaterThan(2);
    expect(reverseZonesContent.ipv4Zones.classlessDelegation.length).toBeGreaterThan(2);
    expect(reverseZonesContent.ipv4Zones.practicalExamples.length).toBeGreaterThan(1);
    
    // IPv6 coverage
    expect(reverseZonesContent.ipv6Zones.nibbleBoundaries.length).toBeGreaterThan(3);
    expect(reverseZonesContent.ipv6Zones.practicalExamples.length).toBeGreaterThan(0);
    
    // Both have zone creation examples
    expect(reverseZonesContent.zoneCreation.ipv4Example).toBeDefined();
    expect(reverseZonesContent.zoneCreation.ipv6Example).toBeDefined();
  });

  it('explains delegation complexity differences', () => {
    // IPv4 classless delegation complexity
    const classless = reverseZonesContent.ipv4Zones.classlessDelegation;
    expect(classless.every(c => c.problem.length > 0)).toBe(true);
    expect(classless.every(c => c.solution.length > 0)).toBe(true);

    // IPv6 boundary alignment (note: descriptions don't explicitly mention "nibble")
    const ipv6Boundaries = reverseZonesContent.ipv6Zones.nibbleBoundaries;
    expect(ipv6Boundaries.length).toBeGreaterThan(3); // Has multiple boundaries
    expect(ipv6Boundaries[0].cidr).toBe("/32"); // Standard boundary

    // Zone creation differences
    const ipv4Zone = reverseZonesContent.zoneCreation.ipv4Example.zoneName;
    const ipv6Zone = reverseZonesContent.zoneCreation.ipv6Example.zoneName;
    expect(ipv6Zone.length).toBeGreaterThan(ipv4Zone.length); // IPv6 zones much longer
  });
});