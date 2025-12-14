import { describe, it, expect } from 'vitest';
import { wildcardMasksContent } from '../../../src/lib/content/wildcard-masks';

describe('Wildcard Masks content', () => {
  it('has valid structure', () => {
    expect(wildcardMasksContent).toBeDefined();
    expect(wildcardMasksContent.title).toBe("ACL Wildcard Masks");
    expect(wildcardMasksContent.description).toContain("wildcard masks for ACLs");
    expect(wildcardMasksContent.sections).toBeDefined();
    expect(wildcardMasksContent.conversionExamples).toBeDefined();
    expect(wildcardMasksContent.quickConversion).toBeDefined();
    expect(wildcardMasksContent.aclExamples).toBeDefined();
  });

  it('explains wildcard mask concept clearly', () => {
    const overview = wildcardMasksContent.sections.overview;
    expect(overview.title).toBe("What are Wildcard Masks?");
    expect(overview.content).toContain("Access Control Lists");
    expect(overview.content).toContain("0 means \"must match exactly\"");
    expect(overview.content).toContain("1 means \"don't care\"");
    
    const difference = wildcardMasksContent.sections.difference;
    expect(difference.content).toContain("bitwise NOT");
    expect(difference.content).toContain("Subnet Mask:");
    expect(difference.content).toContain("Wildcard Mask:");
  });

  it('provides comprehensive conversion examples', () => {
    const examples = wildcardMasksContent.conversionExamples;
    expect(examples).toBeInstanceOf(Array);
    expect(examples.length).toBeGreaterThan(3);
    
    examples.forEach(example => {
      expect(example).toHaveProperty('subnet');
      expect(example).toHaveProperty('subnetBinary');
      expect(example).toHaveProperty('wildcard');
      expect(example).toHaveProperty('wildcardBinary');
      expect(example).toHaveProperty('description');
      
      // Verify binary representations have correct format
      expect(example.subnetBinary).toMatch(/^[01]{8}\.[01]{8}\.[01]{8}\.[01]{8}$/);
      expect(example.wildcardBinary).toMatch(/^[01]{8}\.[01]{8}\.[01]{8}\.[01]{8}$/);
    });
    
    const example24 = examples.find(e => e.description.includes("/24"));
    expect(example24).toBeDefined();
    expect(example24?.subnet).toBe("255.255.255.0");
    expect(example24?.wildcard).toBe("0.0.0.255");
  });

  it('explains quick conversion method', () => {
    const conversion = wildcardMasksContent.quickConversion;
    expect(conversion.steps).toBeInstanceOf(Array);
    expect(conversion.steps.length).toBe(3);
    expect(conversion.formula).toBe("Wildcard = 255.255.255.255 - Subnet Mask");
    expect(conversion.examples).toBeInstanceOf(Array);
    
    conversion.examples.forEach(example => {
      expect(example).toHaveProperty('subnet');
      expect(example).toHaveProperty('calculation');
      expect(example).toHaveProperty('wildcard');
    });
    
    const example = conversion.examples.find(e => e.subnet === "255.255.255.0");
    expect(example).toBeDefined();
    expect(example?.wildcard).toBe("0.0.0.255");
  });

  it('provides practical ACL examples', () => {
    const aclExamples = wildcardMasksContent.aclExamples;
    expect(aclExamples).toBeInstanceOf(Array);
    expect(aclExamples.length).toBeGreaterThan(1);
    
    const ciscoExamples = aclExamples.find(a => a.title.includes("Cisco"));
    expect(ciscoExamples).toBeDefined();
    expect(ciscoExamples?.entries).toBeInstanceOf(Array);
    expect(ciscoExamples?.entries.length).toBeGreaterThan(3);
    
    ciscoExamples?.entries.forEach(entry => {
      expect(entry).toHaveProperty('acl');
      expect(entry).toHaveProperty('meaning');
      expect(entry).toHaveProperty('explanation');
      expect(entry.acl).toContain('access-list');
    });
    
    const hostExample = ciscoExamples?.entries.find(e => e.meaning.includes("only host"));
    expect(hostExample).toBeDefined();
    expect(hostExample?.acl).toContain("0.0.0.0");
  });

  it('covers special cases thoroughly', () => {
    const specialCases = wildcardMasksContent.specialCases;
    expect(specialCases).toBeInstanceOf(Array);
    expect(specialCases.length).toBeGreaterThan(3);
    
    specialCases.forEach(spec => {
      expect(spec).toHaveProperty('case');
      expect(spec).toHaveProperty('wildcard');
      expect(spec).toHaveProperty('meaning');
      expect(spec).toHaveProperty('usage');
    });
    
    const anyHost = specialCases.find(s => s.case.includes("Any Host"));
    expect(anyHost).toBeDefined();
    expect(anyHost?.wildcard).toBe("255.255.255.255");
    
    const specificHost = specialCases.find(s => s.case.includes("Specific Host"));
    expect(specificHost).toBeDefined();
    expect(specificHost?.wildcard).toBe("0.0.0.0");
  });

  it('identifies common mistakes', () => {
    expect(wildcardMasksContent.commonMistakes).toBeInstanceOf(Array);
    expect(wildcardMasksContent.commonMistakes.length).toBeGreaterThan(2);
    
    wildcardMasksContent.commonMistakes.forEach(mistake => {
      expect(mistake).toHaveProperty('mistake');
      expect(mistake).toHaveProperty('problem');
      expect(mistake).toHaveProperty('solution');
    });
    
    const subnetMaskMistake = wildcardMasksContent.commonMistakes.find(m => 
      m.mistake.includes("subnet mask instead of wildcard")
    );
    expect(subnetMaskMistake).toBeDefined();
    expect(subnetMaskMistake?.solution).toContain("invert the mask");
  });

  it('covers platform differences', () => {
    const platforms = wildcardMasksContent.platformDifferences;
    expect(platforms).toBeInstanceOf(Array);
    expect(platforms.length).toBeGreaterThan(3);
    
    platforms.forEach(platform => {
      expect(platform).toHaveProperty('platform');
      expect(platform).toHaveProperty('format');
      expect(platform).toHaveProperty('example');
      expect(platform).toHaveProperty('notes');
    });
    
    const cisco = platforms.find(p => p.platform === "Cisco IOS");
    expect(cisco).toBeDefined();
    expect(cisco?.format).toContain("access-list");
    expect(cisco?.notes).toContain("wildcard mask required");
    
    const juniper = platforms.find(p => p.platform === "Juniper");
    expect(juniper).toBeDefined();
    expect(juniper?.notes).toContain("CIDR notation");
  });

  it('provides comprehensive quick reference', () => {
    const quickRef = wildcardMasksContent.quickReference;
    expect(quickRef).toBeInstanceOf(Array);
    expect(quickRef.length).toBeGreaterThan(8);
    
    quickRef.forEach(ref => {
      expect(ref).toHaveProperty('prefix');
      expect(ref).toHaveProperty('subnet');
      expect(ref).toHaveProperty('wildcard');
      expect(ref).toHaveProperty('use');
      expect(ref.prefix).toMatch(/^\/\d+$/);
    });
    
    const slash24 = quickRef.find(r => r.prefix === "/24");
    expect(slash24).toBeDefined();
    expect(slash24?.subnet).toBe("255.255.255.0");
    expect(slash24?.wildcard).toBe("0.0.0.255");
    
    const slash32 = quickRef.find(r => r.prefix === "/32");
    expect(slash32).toBeDefined();
    expect(slash32?.wildcard).toBe("0.0.0.0");
    expect(slash32?.use).toBe("Single host");
  });

  it('includes helpful tips', () => {
    expect(wildcardMasksContent.tips).toBeInstanceOf(Array);
    expect(wildcardMasksContent.tips.length).toBeGreaterThan(5);
    
    const tips = wildcardMasksContent.tips.join(' ');
    expect(tips).toContain("wildcard 0 = must match");
    expect(tips).toContain("subtract subnet mask from 255.255.255.255");
    expect(tips).toContain("Test your ACLs");
  });

  it('validates conversion mathematics', () => {
    // Test the conversion formula on quick conversion examples
    wildcardMasksContent.quickConversion.examples.forEach(example => {
      const subnetOctets = example.subnet.split('.').map(Number);
      const wildcardOctets = example.wildcard.split('.').map(Number);
      
      subnetOctets.forEach((subnetOctet, index) => {
        const expectedWildcard = 255 - subnetOctet;
        expect(wildcardOctets[index]).toBe(expectedWildcard);
      });
    });
    
    // Test conversion examples
    wildcardMasksContent.conversionExamples.forEach(example => {
      const subnetOctets = example.subnet.split('.').map(Number);
      const wildcardOctets = example.wildcard.split('.').map(Number);
      
      subnetOctets.forEach((subnetOctet, index) => {
        const expectedWildcard = 255 - subnetOctet;
        expect(wildcardOctets[index]).toBe(expectedWildcard);
      });
    });
  });

  it('validates binary representations', () => {
    wildcardMasksContent.conversionExamples.forEach(example => {
      // Check that subnet and wildcard binary are inverses
      const subnetBits = example.subnetBinary.replace(/\./g, '');
      const wildcardBits = example.wildcardBinary.replace(/\./g, '');
      
      expect(subnetBits.length).toBe(32);
      expect(wildcardBits.length).toBe(32);
      
      // Each bit should be inverted
      for (let i = 0; i < 32; i++) {
        if (subnetBits[i] === '1') {
          expect(wildcardBits[i]).toBe('0');
        } else {
          expect(wildcardBits[i]).toBe('1');
        }
      }
    });
  });

  it('validates data structure consistency', () => {
    // Check conversion examples structure
    wildcardMasksContent.conversionExamples.forEach(example => {
      expect(typeof example.subnet).toBe('string');
      expect(typeof example.wildcard).toBe('string');
      expect(example.subnet).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      expect(example.wildcard).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    });

    // Check ACL examples structure
    wildcardMasksContent.aclExamples.forEach(aclGroup => {
      expect(aclGroup).toHaveProperty('title');
      expect(aclGroup).toHaveProperty('entries');
      expect(aclGroup.entries).toBeInstanceOf(Array);
      
      aclGroup.entries.forEach(entry => {
        expect(typeof entry.acl).toBe('string');
        expect(typeof entry.meaning).toBe('string');
        expect(typeof entry.explanation).toBe('string');
      });
    });

    // Check quick reference structure
    wildcardMasksContent.quickReference.forEach(ref => {
      expect(ref.prefix.startsWith('/')).toBe(true);
      expect(ref.subnet).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      expect(ref.wildcard).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    });
  });

  it('emphasizes practical ACL configuration', () => {
    const content = JSON.stringify(wildcardMasksContent);
    expect(content).toContain("wildcard");
    expect(content).toContain("ACL");
    expect(content).toContain("access-list");
    expect(content).toContain("subnet mask");
    expect(content).toContain("must match");
    expect(content).toContain("don't care");
    expect(content).not.toContain("password");
    expect(content).not.toContain("malicious");
  });

  it('covers multiple network equipment vendors', () => {
    const platforms = wildcardMasksContent.platformDifferences.map(p => p.platform);
    expect(platforms).toContain("Cisco IOS");
    expect(platforms).toContain("Cisco ASA");
    expect(platforms).toContain("Juniper");
    expect(platforms).toContain("Palo Alto");
    
    // Check that different approaches are covered
    const formatStrings = wildcardMasksContent.platformDifferences.map(p => p.format).join(' ');
    expect(formatStrings).toContain("wildcard");

    // Check notes mention CIDR (some platforms use CIDR instead of wildcard)
    const notesStrings = wildcardMasksContent.platformDifferences.map(p => p.notes).join(' ');
    expect(notesStrings).toContain("CIDR");
  });

  it('explains bit-level logic correctly', () => {
    const overview = wildcardMasksContent.sections.overview.content;
    expect(overview).toContain("0 means \"must match exactly\"");
    expect(overview).toContain("1 means \"don't care\"");
    expect(overview).toContain("opposite of subnet masks");
    
    const specialCases = wildcardMasksContent.specialCases;
    const oddEven = specialCases.find(s => s.case.includes("Odd/Even"));
    expect(oddEven).toBeDefined();
    expect(oddEven?.wildcard).toBe("0.0.0.1");
    expect(oddEven?.meaning).toContain("Last bit can vary");
  });
});