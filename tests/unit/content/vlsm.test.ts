import { describe, it, expect } from 'vitest';
import { vlsmContent } from '../../../src/lib/content/vlsm';

describe('VLSM content', () => {
  it('has valid structure', () => {
    expect(vlsmContent).toBeDefined();
    expect(vlsmContent.title).toBe("VLSM in Plain English");
    expect(vlsmContent.description).toContain("Variable Length Subnet Masking");
    expect(vlsmContent.sections).toBeDefined();
    expect(vlsmContent.example).toBeDefined();
    expect(vlsmContent.pitfalls).toBeInstanceOf(Array);
    expect(vlsmContent.bestPractices).toBeInstanceOf(Array);
    expect(vlsmContent.tips).toBeInstanceOf(Array);
  });

  it('explains core concepts clearly', () => {
    const sections = vlsmContent.sections;
    expect(sections.whatIs).toBeDefined();
    expect(sections.whenWhy).toBeDefined();
    expect(sections.howItWorks).toBeDefined();
    
    expect(sections.whatIs.title).toBe("What is VLSM?");
    expect(sections.whatIs.content).toContain("Variable Length Subnet Masking");
    expect(sections.whatIs.content).toContain("pizza");
    
    expect(sections.whenWhy.content).toContain("different numbers of hosts");
    expect(sections.whenWhy.content).toContain("waste many addresses");
    
    expect(sections.howItWorks.content).toContain("step by step");
    expect(sections.howItWorks.content).toContain("largest subnet needs first");
  });

  it('provides comprehensive worked example', () => {
    const example = vlsmContent.example;
    expect(example.title).toBe("Worked Example");
    expect(example.scenario).toContain("192.168.1.0/24");
    expect(example.requirements).toBeInstanceOf(Array);
    expect(example.solution).toBeInstanceOf(Array);
    
    expect(example.requirements).toHaveLength(4);
    expect(example.solution).toHaveLength(6);
    
    const salesReq = example.requirements[0];
    expect(salesReq.name).toBe("Sales Department");
    expect(salesReq.hosts).toBe(100);
    expect(salesReq.needsPrefix).toBe("/25");
    
    const routerReq = example.requirements[3];
    expect(routerReq.name).toBe("Router Links");
    expect(routerReq.hosts).toBe(2);
    expect(routerReq.needsPrefix).toBe("/30");
  });

  it('validates example solution correctness', () => {
    const solution = vlsmContent.example.solution;
    
    // Sales department gets largest allocation first
    const sales = solution[0];
    expect(sales.subnet).toBe("192.168.1.0/25");
    expect(sales.hosts).toBe("126 hosts");
    expect(sales.use).toBe("Sales Department");
    
    // IT department gets second largest
    const it = solution[1];
    expect(it.subnet).toBe("192.168.1.128/26");
    expect(it.hosts).toBe("62 hosts");
    expect(it.use).toBe("IT Department");
    
    // Guest WiFi gets third largest
    const guest = solution[2];
    expect(guest.subnet).toBe("192.168.1.192/27");
    expect(guest.hosts).toBe("30 hosts");
    expect(guest.use).toBe("Guest WiFi");
    
    // Router links get /30s
    const routerLinks = solution.slice(3);
    expect(routerLinks).toHaveLength(3);
    routerLinks.forEach((link, index) => {
      expect(link.subnet).toContain("/30");
      expect(link.hosts).toBe("2 hosts");
      expect(link.use).toContain("Router Link");
    });
  });

  it('covers common pitfalls', () => {
    expect(vlsmContent.pitfalls).toHaveLength(4);
    
    const fragmentation = vlsmContent.pitfalls.find(p => p.title === "Address Fragmentation");
    expect(fragmentation).toBeDefined();
    expect(fragmentation?.problem).toContain("wrong order");
    expect(fragmentation?.solution).toContain("largest subnets first");
    
    const planning = vlsmContent.pitfalls.find(p => p.title === "Poor Planning");
    expect(planning).toBeDefined();
    expect(planning?.problem).toContain("room for growth");
    expect(planning?.solution).toContain("25-50% growth");
    
    const alignment = vlsmContent.pitfalls.find(p => p.title === "Alignment Issues");
    expect(alignment).toBeDefined();
    expect(alignment?.solution).toContain("calculators");
    
    const routing = vlsmContent.pitfalls.find(p => p.title === "Routing Complexity");
    expect(routing).toBeDefined();
    expect(routing?.solution).toContain("route summarization");
  });

  it('provides best practices', () => {
    expect(vlsmContent.bestPractices).toHaveLength(6);
    expect(vlsmContent.bestPractices).toContain("Document your subnetting plan before implementing");
    expect(vlsmContent.bestPractices).toContain("Leave room for growth in each subnet");
    expect(vlsmContent.bestPractices).toContain("Use consistent naming conventions");
    expect(vlsmContent.bestPractices).toContain("Start with largest subnets and work down");
    expect(vlsmContent.bestPractices).toContain("Reserve some address space for future expansion");
    expect(vlsmContent.bestPractices).toContain("Test your design in a lab before production");
  });

  it('includes practical tips', () => {
    expect(vlsmContent.tips).toHaveLength(5);
    expect(vlsmContent.tips[0]).toContain("/25 gives you 126 hosts");
    expect(vlsmContent.tips[0]).toContain("/26 gives 62");
    expect(vlsmContent.tips[0]).toContain("/27 gives 30");
    expect(vlsmContent.tips[0]).toContain("/28 gives 14");
    
    expect(vlsmContent.tips[1]).toContain("Point-to-point links");
    expect(vlsmContent.tips[1]).toContain("/30 (2 hosts)");
    
    expect(vlsmContent.tips[2]).toContain("Loopback interfaces");
    expect(vlsmContent.tips[2]).toContain("/32 (1 host)");
    
    expect(vlsmContent.tips[3]).toContain("verify your subnets don't overlap");
    expect(vlsmContent.tips[4]).toContain("VLSM calculators");
  });

  it('maintains data structure consistency', () => {
    vlsmContent.example.requirements.forEach(req => {
      expect(req).toHaveProperty('name');
      expect(req).toHaveProperty('hosts');
      expect(req).toHaveProperty('needsPrefix');
      expect(typeof req.name).toBe('string');
      expect(typeof req.hosts).toBe('number');
      expect(typeof req.needsPrefix).toBe('string');
      expect(req.needsPrefix).toMatch(/^\/\d+$/);
    });

    vlsmContent.example.solution.forEach(sol => {
      expect(sol).toHaveProperty('subnet');
      expect(sol).toHaveProperty('hosts');
      expect(sol).toHaveProperty('use');
      expect(sol.subnet).toMatch(/^\d+\.\d+\.\d+\.\d+\/\d+$/);
      expect(sol.hosts).toContain('hosts');
    });

    vlsmContent.pitfalls.forEach(pitfall => {
      expect(pitfall).toHaveProperty('title');
      expect(pitfall).toHaveProperty('problem');
      expect(pitfall).toHaveProperty('solution');
      expect(typeof pitfall.title).toBe('string');
      expect(typeof pitfall.problem).toBe('string');
      expect(typeof pitfall.solution).toBe('string');
    });
  });

  it('demonstrates correct subnet sizing', () => {
    const example = vlsmContent.example;
    
    // Requirements should be sorted by size (largest first)
    const salesHosts = example.requirements[0].hosts;
    const itHosts = example.requirements[1].hosts;  
    const guestHosts = example.requirements[2].hosts;
    const routerHosts = example.requirements[3].hosts;
    
    expect(salesHosts).toBeGreaterThan(itHosts);
    expect(itHosts).toBeGreaterThan(guestHosts);
    expect(guestHosts).toBeGreaterThan(routerHosts);
    
    // Solution should allocate appropriate prefix lengths
    const solution = example.solution;
    expect(solution[0].subnet).toContain("/25"); // Largest gets /25
    expect(solution[1].subnet).toContain("/26"); // Second largest gets /26
    expect(solution[2].subnet).toContain("/27"); // Third largest gets /27
    expect(solution[3].subnet).toContain("/30"); // Point-to-point gets /30
  });

  it('uses proper networking terminology', () => {
    const content = JSON.stringify(vlsmContent);
    expect(content).toContain("subnet");
    expect(content).toContain("hosts");
    expect(content).toContain("needsPrefix"); // "prefix" is in the needsPrefix field
    expect(content).toContain("router");
    expect(content).toContain("network");
    expect(content).not.toContain("passwords"); // Should be networking focused
    expect(content).not.toContain("malicious"); // Should be educational
  });

  it('provides realistic scenarios', () => {
    const requirements = vlsmContent.example.requirements;
    
    // Department sizes are realistic
    expect(requirements[0].hosts).toBe(100); // Sales - reasonable office size
    expect(requirements[1].hosts).toBe(50);  // IT - smaller tech team
    expect(requirements[2].hosts).toBe(30);  // Guest WiFi - reasonable for visitors
    expect(requirements[3].hosts).toBe(2);   // Router links - exactly what's needed
    
    // Uses standard private IP range
    expect(vlsmContent.example.scenario).toContain("192.168.1.0/24");
  });
});