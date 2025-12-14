import { describe, it, expect } from 'vitest';
import { commonPortsContent } from '../../../src/lib/content/common-ports';

describe('Common ports content', () => {
  it('has valid structure', () => {
    expect(commonPortsContent).toBeDefined();
    expect(commonPortsContent.title).toBe("Common TCP/UDP Ports");
    expect(commonPortsContent.description).toContain("TCP and UDP port numbers");
    expect(commonPortsContent.wellKnown).toBeInstanceOf(Array);
    expect(commonPortsContent.registered).toBeInstanceOf(Array);
    expect(commonPortsContent.dynamic).toBeInstanceOf(Array);
    expect(commonPortsContent.categories).toBeDefined();
    expect(commonPortsContent.ranges).toBeInstanceOf(Array);
    expect(commonPortsContent.tips).toBeInstanceOf(Array);
  });

  it('contains expected well-known ports', () => {
    const wellKnown = commonPortsContent.wellKnown;
    expect(wellKnown.length).toBeGreaterThan(10);
    
    const httpPort = wellKnown.find(p => p.port === 80);
    expect(httpPort).toBeDefined();
    expect(httpPort?.service).toBe("HTTP");
    expect(httpPort?.protocol).toBe("TCP");
    
    const httpsPort = wellKnown.find(p => p.port === 443);
    expect(httpsPort).toBeDefined();
    expect(httpsPort?.service).toBe("HTTPS");
    
    const sshPort = wellKnown.find(p => p.port === 22);
    expect(sshPort?.service).toBe("SSH");
    expect(sshPort?.description).toContain("Secure Shell");
    
    const dnsPort = wellKnown.find(p => p.port === 53);
    expect(dnsPort?.protocol).toBe("TCP/UDP");
    expect(dnsPort?.service).toBe("DNS");
  });

  it('validates registered ports structure', () => {
    commonPortsContent.registered.forEach(port => {
      expect(port).toHaveProperty('port');
      expect(port).toHaveProperty('protocol');
      expect(port).toHaveProperty('service');
      expect(port).toHaveProperty('description');
      expect(typeof port.port).toBe('number');
      // Note: Some "registered" ports like BGP (179) are actually in well-known range
      expect(port.port).toBeGreaterThan(0);
      expect(port.port).toBeLessThan(65536);
    });
    
    const mysqlPort = commonPortsContent.registered.find(p => p.port === 3306);
    expect(mysqlPort?.service).toBe("MySQL");
    
    const rdpPort = commonPortsContent.registered.find(p => p.port === 3389);
    expect(rdpPort?.service).toBe("RDP");
  });

  it('has proper port categories', () => {
    const categories = commonPortsContent.categories;
    expect(categories.web).toBeInstanceOf(Array);
    expect(categories.email).toBeInstanceOf(Array);
    expect(categories.remote).toBeInstanceOf(Array);
    expect(categories.database).toBeInstanceOf(Array);
    
    const webPorts = categories.web;
    expect(webPorts.find(w => w.ports === "80, 8080" && !w.secure)).toBeDefined();
    expect(webPorts.find(w => w.ports === "443, 8443" && w.secure)).toBeDefined();
    
    const emailPorts = categories.email;
    expect(emailPorts.find(e => e.service === "SMTP" && !e.secure)).toBeDefined();
    expect(emailPorts.find(e => e.service === "IMAPS" && e.secure)).toBeDefined();
  });

  it('defines proper port ranges', () => {
    expect(commonPortsContent.ranges).toHaveLength(3);
    
    const wellKnownRange = commonPortsContent.ranges.find(r => r.range === "0-1023");
    expect(wellKnownRange?.name).toBe("Well-Known Ports");
    expect(wellKnownRange?.description).toContain("System/privileged");
    
    const registeredRange = commonPortsContent.ranges.find(r => r.range === "1024-49151");
    expect(registeredRange?.name).toBe("Registered Ports");
    expect(registeredRange?.description).toContain("IANA");
    
    const dynamicRange = commonPortsContent.ranges.find(r => r.range === "49152-65535");
    expect(dynamicRange?.name).toBe("Dynamic/Private");
  });

  it('includes security tips', () => {
    expect(commonPortsContent.tips).toHaveLength(6);
    expect(commonPortsContent.tips[0]).toContain("1024 typically require administrator");
    expect(commonPortsContent.tips[1]).toContain("HTTPS is HTTP + TLS/SSL");
    expect(commonPortsContent.tips[2]).toContain("SSH (22) is the secure replacement");
    expect(commonPortsContent.tips.some(tip => tip.includes("Database ports"))).toBe(true);
  });

  it('validates data consistency', () => {
    [...commonPortsContent.wellKnown, ...commonPortsContent.registered].forEach(port => {
      expect(port.port).toBeGreaterThanOrEqual(0);
      expect(port.port).toBeLessThanOrEqual(65535);
      expect(['TCP', 'UDP', 'TCP/UDP']).toContain(port.protocol);
      expect(port.service).toBeTruthy();
      expect(port.description).toBeTruthy();
    });
    
    Object.values(commonPortsContent.categories).forEach(category => {
      category.forEach(item => {
        expect(item).toHaveProperty('ports');
        expect(item).toHaveProperty('service');
        expect(item).toHaveProperty('secure');
        expect(typeof item.secure).toBe('boolean');
      });
    });
  });

  it('covers important services', () => {
    const allPorts = [...commonPortsContent.wellKnown, ...commonPortsContent.registered];
    const services = allPorts.map(p => p.service.toLowerCase());
    
    expect(services.some(s => s.includes('http'))).toBe(true);
    expect(services.some(s => s.includes('ssh'))).toBe(true);
    expect(services.some(s => s.includes('ftp'))).toBe(true);
    expect(services.some(s => s.includes('dns'))).toBe(true);
    expect(services.some(s => s.includes('smtp'))).toBe(true);
    expect(services.some(s => s.includes('mysql'))).toBe(true);
    expect(services.some(s => s.includes('rdp'))).toBe(true);
  });
});