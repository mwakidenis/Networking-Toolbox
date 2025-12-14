import { describe, it, expect } from 'vitest';
import { supernetContent } from '../../../src/lib/content/supernetting';

describe('Supernetting content', () => {
  it('has valid structure', () => {
    expect(supernetContent).toBeDefined();
    expect(supernetContent.title).toBe("Route Summarization / Supernetting");
    expect(supernetContent.description).toContain("aggregate multiple networks");
    expect(supernetContent.sections).toBeDefined();
    expect(supernetContent.examples).toBeInstanceOf(Array);
    expect(supernetContent.stepByStep).toBeDefined();
    expect(supernetContent.binaryExample).toBeDefined();
    expect(supernetContent.benefits).toBeInstanceOf(Array);
    expect(supernetContent.pitfalls).toBeInstanceOf(Array);
    expect(supernetContent.quickReference).toBeInstanceOf(Array);
  });

  it('explains core concepts', () => {
    const sections = supernetContent.sections;
    expect(sections.whatIs).toBeDefined();
    expect(sections.howWorks).toBeDefined();
    expect(sections.requirements).toBeDefined();
    
    expect(sections.whatIs.title).toBe("What is Supernetting?");
    expect(sections.whatIs.content).toContain("route aggregation");
    expect(sections.whatIs.content).toContain("routing table size");
    
    expect(sections.requirements.content).toContain("Contiguous Address Space");
    expect(sections.requirements.content).toContain("Power of Two");
    expect(sections.requirements.content).toContain("2, 4, 8, 16");
  });

  it('provides practical examples', () => {
    expect(supernetContent.examples).toHaveLength(3);
    
    const basicExample = supernetContent.examples[0];
    expect(basicExample.title).toBe("Basic Example: Two /24s");
    expect(basicExample.networks).toEqual(["192.168.0.0/24", "192.168.1.0/24"]);
    expect(basicExample.summary).toBe("192.168.0.0/23");
    expect(basicExample.explanation).toContain("combine into one /23");
    expect(basicExample.addresses).toContain("512 total addresses");
    
    const fourNetworks = supernetContent.examples[1];
    expect(fourNetworks.networks).toHaveLength(4);
    expect(fourNetworks.summary).toBe("10.1.0.0/22");
    expect(fourNetworks.addresses).toContain("1,024 total addresses");
    
    const eightNetworks = supernetContent.examples[2];
    expect(eightNetworks.networks).toHaveLength(8);
    expect(eightNetworks.summary).toBe("172.16.0.0/24");
    expect(eightNetworks.explanation).toContain("Eight adjacent /27 networks");
  });

  it('includes step-by-step process', () => {
    const process = supernetContent.stepByStep;
    expect(process.title).toBe("Step-by-Step Process");
    expect(process.steps).toHaveLength(6);
    expect(process.steps[0]).toContain("List all networks");
    expect(process.steps[1]).toContain("Convert network addresses to binary");
    expect(process.steps[2]).toContain("Find the common bits");
    expect(process.steps[3]).toContain("Count the common bits");
    expect(process.steps[4]).toContain("Verify the summary covers");
    expect(process.steps[5]).toContain("Check if any unwanted networks");
  });

  it('provides binary example', () => {
    const binaryEx = supernetContent.binaryExample;
    expect(binaryEx.title).toBe("Binary Example");
    expect(binaryEx.scenario).toContain("192.168.0.0/24 and 192.168.1.0/24");
    expect(binaryEx.binary).toHaveLength(2);
    expect(binaryEx.analysis).toContain("First 23 bits are identical");
    expect(binaryEx.analysis).toContain("192.168.0.0/23");
    
    const firstNetwork = binaryEx.binary[0];
    expect(firstNetwork.network).toBe("192.168.0.0");
    expect(firstNetwork.binary).toBe("11000000.10101000.00000000.00000000");
    
    const secondNetwork = binaryEx.binary[1];  
    expect(secondNetwork.network).toBe("192.168.1.0");
    expect(secondNetwork.binary).toBe("11000000.10101000.00000001.00000000");
  });

  it('lists benefits correctly', () => {
    expect(supernetContent.benefits).toHaveLength(5);
    expect(supernetContent.benefits).toContain("Smaller routing tables mean faster lookups");
    expect(supernetContent.benefits).toContain("Reduced memory usage on routers");
    expect(supernetContent.benefits).toContain("Less routing protocol overhead");
    expect(supernetContent.benefits).toContain("Simpler network management");
    expect(supernetContent.benefits).toContain("Better network stability (fewer route changes)");
  });

  it('covers common pitfalls', () => {
    expect(supernetContent.pitfalls).toHaveLength(3);
    
    const unwantedNetworks = supernetContent.pitfalls.find(p => p.title === "Including Unwanted Networks");
    expect(unwantedNetworks).toBeDefined();
    expect(unwantedNetworks?.problem).toContain("networks you don't own");
    expect(unwantedNetworks?.example).toContain("192.168.0.0/22 also includes");
    
    const nonContiguous = supernetContent.pitfalls.find(p => p.title === "Non-Contiguous Networks");
    expect(nonContiguous).toBeDefined();
    expect(nonContiguous?.problem).toContain("aren't adjacent");
    
    const wrongPowers = supernetContent.pitfalls.find(p => p.title === "Wrong Powers of Two");
    expect(wrongPowers).toBeDefined();
    expect(wrongPowers?.problem).toContain("3, 5, 6, 7 networks");
    expect(wrongPowers?.example).toContain("Three /24s cannot be perfectly summarized");
  });

  it('provides quick reference table', () => {
    expect(supernetContent.quickReference).toHaveLength(6);
    
    const twoSlash24 = supernetContent.quickReference.find(q => q.networks === "2 × /24");
    expect(twoSlash24?.summary).toBe("/23");
    expect(twoSlash24?.saves).toBe("1 route");
    
    const fourSlash24 = supernetContent.quickReference.find(q => q.networks === "4 × /24");
    expect(fourSlash24?.summary).toBe("/22");
    expect(fourSlash24?.saves).toBe("3 routes");
    
    const sixteenSlash24 = supernetContent.quickReference.find(q => q.networks === "16 × /24");
    expect(sixteenSlash24?.summary).toBe("/20");
    expect(sixteenSlash24?.saves).toBe("15 routes");
    
    const twoSlash23 = supernetContent.quickReference.find(q => q.networks === "2 × /23");
    expect(twoSlash23?.summary).toBe("/22");
    expect(twoSlash23?.saves).toBe("1 route");
  });

  it('validates data structure consistency', () => {
    supernetContent.examples.forEach(example => {
      expect(example).toHaveProperty('title');
      expect(example).toHaveProperty('networks');
      expect(example).toHaveProperty('summary');
      expect(example).toHaveProperty('explanation');
      expect(example).toHaveProperty('addresses');
      expect(example.networks).toBeInstanceOf(Array);
      expect(example.networks.length).toBeGreaterThan(0);
      expect(example.summary).toMatch(/\/\d+$/);
    });

    supernetContent.pitfalls.forEach(pitfall => {
      expect(pitfall).toHaveProperty('title');
      expect(pitfall).toHaveProperty('problem');
      expect(pitfall).toHaveProperty('example');
      expect(typeof pitfall.title).toBe('string');
      expect(typeof pitfall.problem).toBe('string');
      expect(typeof pitfall.example).toBe('string');
    });

    supernetContent.quickReference.forEach(ref => {
      expect(ref).toHaveProperty('networks');
      expect(ref).toHaveProperty('summary');
      expect(ref).toHaveProperty('saves');
      expect(ref.summary).toMatch(/^\/\d+$/);
      expect(ref.saves).toContain('route');
    });
  });

  it('uses correct CIDR notation', () => {
    // Examples contain full CIDR notation (IP/prefix)
    supernetContent.examples.forEach(example => {
      expect(example.summary).toMatch(/^\d+\.\d+\.\d+\.\d+\/\d+$/);
      const prefixLength = parseInt(example.summary.split('/')[1]);
      expect(prefixLength).toBeGreaterThanOrEqual(8);
      expect(prefixLength).toBeLessThanOrEqual(30);
    });
    
    // Quick reference contains just prefix lengths
    supernetContent.quickReference.forEach(ref => {
      expect(ref.summary).toMatch(/^\/\d+$/);
      const prefixLength = parseInt(ref.summary.substring(1));
      expect(prefixLength).toBeGreaterThanOrEqual(8);
      expect(prefixLength).toBeLessThanOrEqual(30);
    });
    
    supernetContent.examples.forEach(example => {
      example.networks.forEach(network => {
        expect(network).toMatch(/^\d+\.\d+\.\d+\.\d+\/\d+$/);
      });
    });
  });

  it('demonstrates correct mathematical relationships', () => {
    // 2 × /24 = /23 (prefix length decreases by 1)
    const twoNetworks = supernetContent.examples[0];
    expect(twoNetworks.networks).toHaveLength(2);
    expect(twoNetworks.summary).toBe("192.168.0.0/23");
    
    // 4 × /24 = /22 (prefix length decreases by 2)  
    const fourNetworks = supernetContent.examples[1];
    expect(fourNetworks.networks).toHaveLength(4);
    expect(fourNetworks.summary).toBe("10.1.0.0/22");
    
    // 8 × /27 = /24 (prefix length decreases by 3)
    const eightNetworks = supernetContent.examples[2];
    expect(eightNetworks.networks).toHaveLength(8);
    expect(eightNetworks.summary).toBe("172.16.0.0/24");
  });
});