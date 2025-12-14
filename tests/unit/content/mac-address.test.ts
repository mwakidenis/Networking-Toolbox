import { describe, it, expect } from 'vitest';
import { macAddressContent } from '../../../src/lib/content/mac-address.js';

describe('MAC Address Content', () => {
  it('should have title and description', () => {
    expect(macAddressContent.title).toBeDefined();
    expect(macAddressContent.title).toContain('MAC Address');
    expect(macAddressContent.description).toBeDefined();
  });

  describe('What is MAC section', () => {
    it('should exist and have required fields', () => {
      expect(macAddressContent.sections.whatIsMAC).toBeDefined();
      expect(macAddressContent.sections.whatIsMAC.title).toBeDefined();
      expect(macAddressContent.sections.whatIsMAC.content).toBeDefined();
    });

    it('should explain MAC addresses', () => {
      expect(macAddressContent.sections.whatIsMAC.content).toContain('Media Access Control');
      expect(macAddressContent.sections.whatIsMAC.content).toContain('48-bit');
    });
  });

  describe('Structure section', () => {
    it('should exist and have required fields', () => {
      expect(macAddressContent.sections.structure).toBeDefined();
      expect(macAddressContent.sections.structure.title).toBeDefined();
      expect(macAddressContent.sections.structure.components).toBeDefined();
      expect(macAddressContent.sections.structure.example).toBeDefined();
    });

    it('should have at least 4 components', () => {
      expect(macAddressContent.sections.structure.components.length).toBeGreaterThanOrEqual(4);
    });

    it('should include OUI component', () => {
      const ouiComponent = macAddressContent.sections.structure.components.find(
        (c) => c.component.includes('OUI')
      );
      expect(ouiComponent).toBeDefined();
      expect(ouiComponent?.description).toContain('24 bits');
    });

    it('should include I/G bit component', () => {
      const igComponent = macAddressContent.sections.structure.components.find(
        (c) => c.component.includes('I/G')
      );
      expect(igComponent).toBeDefined();
      expect(igComponent?.description).toContain('Bit 0');
    });

    it('should include U/L bit component', () => {
      const ulComponent = macAddressContent.sections.structure.components.find(
        (c) => c.component.includes('U/L')
      );
      expect(ulComponent).toBeDefined();
      expect(ulComponent?.description).toContain('Bit 1');
    });

    it('should have valid example', () => {
      expect(macAddressContent.sections.structure.example.address).toMatch(
        /^[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}$/
      );
      expect(macAddressContent.sections.structure.example.breakdown).toBeInstanceOf(Array);
      expect(macAddressContent.sections.structure.example.breakdown.length).toBeGreaterThan(0);
    });
  });

  describe('Address Types section', () => {
    it('should exist and have required fields', () => {
      expect(macAddressContent.sections.addressTypes).toBeDefined();
      expect(macAddressContent.sections.addressTypes.title).toBeDefined();
      expect(macAddressContent.sections.addressTypes.types).toBeDefined();
    });

    it('should have at least 4 address types', () => {
      expect(macAddressContent.sections.addressTypes.types.length).toBeGreaterThanOrEqual(4);
    });

    it('should include Universal Unicast type', () => {
      const universalUnicast = macAddressContent.sections.addressTypes.types.find(
        (t) => t.type.includes('Universal Unicast')
      );
      expect(universalUnicast).toBeDefined();
    });

    it('should include Locally Administered type', () => {
      const locallyAdmin = macAddressContent.sections.addressTypes.types.find(
        (t) => t.type.includes('Locally Administered')
      );
      expect(locallyAdmin).toBeDefined();
    });

    it('should include Multicast type', () => {
      const multicast = macAddressContent.sections.addressTypes.types.find(
        (t) => t.type === 'Multicast'
      );
      expect(multicast).toBeDefined();
    });

    it('should include Broadcast type', () => {
      const broadcast = macAddressContent.sections.addressTypes.types.find(
        (t) => t.type === 'Broadcast'
      );
      expect(broadcast).toBeDefined();
      expect(broadcast?.description).toContain('FF:FF:FF:FF:FF:FF');
    });
  });

  describe('Formats section', () => {
    it('should exist and have required fields', () => {
      expect(macAddressContent.sections.formats).toBeDefined();
      expect(macAddressContent.sections.formats.title).toBeDefined();
      expect(macAddressContent.sections.formats.formats).toBeDefined();
    });

    it('should have at least 5 format types', () => {
      expect(macAddressContent.sections.formats.formats.length).toBeGreaterThanOrEqual(5);
    });

    it('should include colon notation', () => {
      const colonFormat = macAddressContent.sections.formats.formats.find(
        (f) => f.format.toLowerCase().includes('colon')
      );
      expect(colonFormat).toBeDefined();
      expect(colonFormat?.example).toContain(':');
    });

    it('should include hyphen notation', () => {
      const hyphenFormat = macAddressContent.sections.formats.formats.find(
        (f) => f.format.toLowerCase().includes('hyphen')
      );
      expect(hyphenFormat).toBeDefined();
      expect(hyphenFormat?.example).toContain('-');
    });

    it('should include Cisco/Dot notation', () => {
      const ciscoFormat = macAddressContent.sections.formats.formats.find(
        (f) => f.format.toLowerCase().includes('cisco') || f.format.toLowerCase().includes('dot')
      );
      expect(ciscoFormat).toBeDefined();
      expect(ciscoFormat?.example).toContain('.');
    });

    it('should include bare format', () => {
      const bareFormat = macAddressContent.sections.formats.formats.find(
        (f) => f.format.toLowerCase().includes('bare')
      );
      expect(bareFormat).toBeDefined();
      expect(bareFormat?.example).not.toContain(':');
      expect(bareFormat?.example).not.toContain('-');
      expect(bareFormat?.example).not.toContain('.');
    });

    it('should include EUI-64 format', () => {
      const eui64Format = macAddressContent.sections.formats.formats.find(
        (f) => f.format.includes('EUI-64')
      );
      expect(eui64Format).toBeDefined();
      expect(eui64Format?.example).toContain('FF:FE');
    });
  });

  describe('OUI Lookup section', () => {
    it('should exist and have required fields', () => {
      expect(macAddressContent.sections.ouiLookup).toBeDefined();
      expect(macAddressContent.sections.ouiLookup.title).toBeDefined();
      expect(macAddressContent.sections.ouiLookup.content).toBeDefined();
      expect(macAddressContent.sections.ouiLookup.blockTypes).toBeDefined();
      expect(macAddressContent.sections.ouiLookup.lookupInfo).toBeDefined();
    });

    it('should have block types', () => {
      expect(macAddressContent.sections.ouiLookup.blockTypes.length).toBeGreaterThanOrEqual(3);
    });

    it('should include MA-L block type', () => {
      const maL = macAddressContent.sections.ouiLookup.blockTypes.find(
        (b) => b.type.includes('MA-L')
      );
      expect(maL).toBeDefined();
      expect(maL?.description).toContain('24-bit');
    });

    it('should include MA-M block type', () => {
      const maM = macAddressContent.sections.ouiLookup.blockTypes.find(
        (b) => b.type.includes('MA-M')
      );
      expect(maM).toBeDefined();
      expect(maM?.description).toContain('28-bit');
    });

    it('should include MA-S block type', () => {
      const maS = macAddressContent.sections.ouiLookup.blockTypes.find(
        (b) => b.type.includes('MA-S')
      );
      expect(maS).toBeDefined();
      expect(maS?.description).toContain('36-bit');
    });
  });

  describe('Special Addresses section', () => {
    it('should exist and have required fields', () => {
      expect(macAddressContent.sections.specialAddresses).toBeDefined();
      expect(macAddressContent.sections.specialAddresses.title).toBeDefined();
      expect(macAddressContent.sections.specialAddresses.addresses).toBeDefined();
    });

    it('should have at least 4 special addresses', () => {
      expect(macAddressContent.sections.specialAddresses.addresses.length).toBeGreaterThanOrEqual(4);
    });

    it('should include broadcast address', () => {
      const broadcast = macAddressContent.sections.specialAddresses.addresses.find(
        (a) => a.type === 'Broadcast'
      );
      expect(broadcast).toBeDefined();
      expect(broadcast?.address).toBe('FF:FF:FF:FF:FF:FF');
    });

    it('should include IPv4 multicast', () => {
      const ipv4Multicast = macAddressContent.sections.specialAddresses.addresses.find(
        (a) => a.type.includes('IPv4') && a.type.includes('Multicast')
      );
      expect(ipv4Multicast).toBeDefined();
      expect(ipv4Multicast?.address).toContain('01:00:5E');
    });

    it('should include IPv6 multicast', () => {
      const ipv6Multicast = macAddressContent.sections.specialAddresses.addresses.find(
        (a) => a.type.includes('IPv6') && a.type.includes('Multicast')
      );
      expect(ipv6Multicast).toBeDefined();
      expect(ipv6Multicast?.address).toContain('33:33');
    });
  });

  describe('Use Cases section', () => {
    it('should exist and have required fields', () => {
      expect(macAddressContent.sections.useCases).toBeDefined();
      expect(macAddressContent.sections.useCases.title).toBeDefined();
      expect(macAddressContent.sections.useCases.cases).toBeDefined();
    });

    it('should have at least 4 use cases', () => {
      expect(macAddressContent.sections.useCases.cases.length).toBeGreaterThanOrEqual(4);
    });

    it('should include network troubleshooting', () => {
      const troubleshooting = macAddressContent.sections.useCases.cases.find(
        (c) => c.useCase.toLowerCase().includes('troubleshooting')
      );
      expect(troubleshooting).toBeDefined();
    });

    it('should include security use case', () => {
      const security = macAddressContent.sections.useCases.cases.find(
        (c) => c.useCase.toLowerCase().includes('security')
      );
      expect(security).toBeDefined();
    });

    it('all use cases should have useCase and description', () => {
      macAddressContent.sections.useCases.cases.forEach((useCase) => {
        expect(useCase.useCase).toBeDefined();
        expect(useCase.useCase.length).toBeGreaterThan(0);
        expect(useCase.description).toBeDefined();
        expect(useCase.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Quick Tips', () => {
    it('should exist and be an array', () => {
      expect(macAddressContent.quickTips).toBeDefined();
      expect(macAddressContent.quickTips).toBeInstanceOf(Array);
    });

    it('should have at least 3 tips', () => {
      expect(macAddressContent.quickTips.length).toBeGreaterThanOrEqual(3);
    });

    it('all tips should be non-empty strings', () => {
      macAddressContent.quickTips.forEach((tip) => {
        expect(typeof tip).toBe('string');
        expect(tip.length).toBeGreaterThan(0);
      });
    });

    it('should include information about local network scope', () => {
      const localScopeTip = macAddressContent.quickTips.find(
        (tip) => tip.toLowerCase().includes('local network') || tip.toLowerCase().includes('routing')
      );
      expect(localScopeTip).toBeDefined();
    });
  });

  describe('Data structure integrity', () => {
    it('all components should have component and description fields', () => {
      macAddressContent.sections.structure.components.forEach((comp) => {
        expect(comp.component).toBeDefined();
        expect(comp.component.length).toBeGreaterThan(0);
        expect(comp.description).toBeDefined();
        expect(comp.description.length).toBeGreaterThan(0);
      });
    });

    it('all address types should have type and description fields', () => {
      macAddressContent.sections.addressTypes.types.forEach((type) => {
        expect(type.type).toBeDefined();
        expect(type.type.length).toBeGreaterThan(0);
        expect(type.description).toBeDefined();
        expect(type.description.length).toBeGreaterThan(0);
      });
    });

    it('all formats should have format, example, and usage fields', () => {
      macAddressContent.sections.formats.formats.forEach((fmt) => {
        expect(fmt.format).toBeDefined();
        expect(fmt.format.length).toBeGreaterThan(0);
        expect(fmt.example).toBeDefined();
        expect(fmt.example.length).toBeGreaterThan(0);
        expect(fmt.usage).toBeDefined();
        expect(fmt.usage.length).toBeGreaterThan(0);
      });
    });

    it('all block types should have type and description fields', () => {
      macAddressContent.sections.ouiLookup.blockTypes.forEach((block) => {
        expect(block.type).toBeDefined();
        expect(block.type.length).toBeGreaterThan(0);
        expect(block.description).toBeDefined();
        expect(block.description.length).toBeGreaterThan(0);
      });
    });

    it('all special addresses should have address, type, and description fields', () => {
      macAddressContent.sections.specialAddresses.addresses.forEach((addr) => {
        expect(addr.address).toBeDefined();
        expect(addr.address.length).toBeGreaterThan(0);
        expect(addr.type).toBeDefined();
        expect(addr.type.length).toBeGreaterThan(0);
        expect(addr.description).toBeDefined();
        expect(addr.description.length).toBeGreaterThan(0);
      });
    });
  });
});
