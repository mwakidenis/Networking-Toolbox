import { describe, it, expect } from 'vitest';
import { mtuMssContent } from '../../../src/lib/content/mtu-mss';

describe('MTU/MSS content', () => {
  it('has valid structure', () => {
    expect(mtuMssContent).toBeDefined();
    expect(mtuMssContent.title).toBe("Common MTU/MSS Values");
    expect(mtuMssContent.description).toContain("Maximum Transmission Unit");
    expect(mtuMssContent.description).toContain("Maximum Segment Size");
    expect(mtuMssContent.sections).toBeDefined();
    expect(mtuMssContent.commonValues).toBeDefined();
    expect(mtuMssContent.calculations).toBeDefined();
  });

  it('explains MTU vs MSS relationship', () => {
    const overview = mtuMssContent.sections.overview;
    expect(overview.title).toBe("MTU vs MSS");
    expect(overview.content).toContain("without fragmentation");
    expect(overview.content).toContain("MSS = MTU - IP Header - TCP Header");
    expect(overview.content).toContain("= MTU - 40 bytes");
  });

  it('provides comprehensive common values', () => {
    const values = mtuMssContent.commonValues;
    expect(values).toBeInstanceOf(Array);
    expect(values.length).toBeGreaterThan(7);
    
    values.forEach(value => {
      expect(value).toHaveProperty('medium');
      expect(value).toHaveProperty('mtu');
      expect(value).toHaveProperty('mss');
      expect(value).toHaveProperty('notes');
      expect(value).toHaveProperty('usage');
      expect(typeof value.mtu).toBe('number');
      expect(typeof value.mss).toBe('number');
    });
  });

  it('includes standard Ethernet values', () => {
    const ethernet = mtuMssContent.commonValues.find(v => v.medium === "Ethernet");
    expect(ethernet).toBeDefined();
    expect(ethernet?.mtu).toBe(1500);
    expect(ethernet?.mss).toBe(1460);
    expect(ethernet?.notes).toBe("Standard Ethernet II frame size");
    expect(ethernet?.usage).toContain("Most common");
  });

  it('covers PPPoE DSL configuration', () => {
    const pppoe = mtuMssContent.commonValues.find(v => v.medium === "PPPoE (DSL)");
    expect(pppoe).toBeDefined();
    expect(pppoe?.mtu).toBe(1492);
    expect(pppoe?.mss).toBe(1452);
    expect(pppoe?.notes).toContain("8 bytes overhead");
  });

  it('includes jumbo frames information', () => {
    const jumbo = mtuMssContent.commonValues.find(v => v.medium === "Jumbo Frames");
    expect(jumbo).toBeDefined();
    expect(jumbo?.mtu).toBe(9000);
    expect(jumbo?.mss).toBe(8960);
    expect(jumbo?.usage).toContain("Data centers");
  });

  it('provides calculation examples', () => {
    const examples = mtuMssContent.calculations.examples;
    expect(examples).toBeInstanceOf(Array);
    expect(examples.length).toBeGreaterThan(2);
    
    examples.forEach(example => {
      expect(example).toHaveProperty('scenario');
      expect(example).toHaveProperty('mtu');
      expect(example).toHaveProperty('ipHeader');
      expect(example).toHaveProperty('tcpHeader');
      expect(example).toHaveProperty('mss');
      expect(example).toHaveProperty('calculation');
    });
    
    const ethernetCalc = examples.find(e => e.scenario === "Standard Ethernet");
    expect(ethernetCalc).toBeDefined();
    expect(ethernetCalc?.mtu).toBe(1500);
    expect(ethernetCalc?.mss).toBe(1460);
  });

  it('covers IPv6 MTU calculations', () => {
    const ipv6Example = mtuMssContent.calculations.examples.find(e => e.scenario === "IPv6 Ethernet");
    expect(ipv6Example).toBeDefined();
    expect(ipv6Example?.ipHeader).toBe(40);
    expect(ipv6Example?.mss).toBe(1440);
    expect(ipv6Example?.calculation).toBe("1500 - 40 (IPv6) - 20 (TCP) = 1440");
  });

  it('details protocol overheads', () => {
    const overheads = mtuMssContent.overheads;
    expect(overheads).toBeInstanceOf(Array);
    expect(overheads.length).toBeGreaterThan(8);
    
    overheads.forEach(overhead => {
      expect(overhead).toHaveProperty('protocol');
      expect(overhead).toHaveProperty('overhead');
      expect(overhead).toHaveProperty('notes');
    });
    
    const ethernetOverhead = overheads.find(o => o.protocol === "Ethernet Header");
    expect(ethernetOverhead).toBeDefined();
    expect(ethernetOverhead?.overhead).toBe(14);
    
    const ipv4Overhead = overheads.find(o => o.protocol === "IPv4 Header");
    expect(ipv4Overhead).toBeDefined();
    expect(ipv4Overhead?.overhead).toBe(20);
    
    const ipv6Overhead = overheads.find(o => o.protocol === "IPv6 Header");
    expect(ipv6Overhead).toBeDefined();
    expect(ipv6Overhead?.overhead).toBe(40);
  });

  it('explains Path MTU Discovery', () => {
    const discovery = mtuMssContent.discovery;
    expect(discovery.title).toBe("Path MTU Discovery");
    expect(discovery.description).toContain("largest MTU along a network path");
    expect(discovery.process).toBeInstanceOf(Array);
    expect(discovery.issues).toBeInstanceOf(Array);
    
    expect(discovery.process.some(p => p.includes("Don't Fragment"))).toBe(true);
    expect(discovery.issues.some(i => i.includes("black hole"))).toBe(true);
  });

  it('provides troubleshooting scenarios', () => {
    const troubleshooting = mtuMssContent.troubleshooting;
    expect(troubleshooting).toBeInstanceOf(Array);
    expect(troubleshooting.length).toBeGreaterThan(2);
    
    troubleshooting.forEach(issue => {
      expect(issue).toHaveProperty('issue');
      expect(issue).toHaveProperty('cause');
      expect(issue).toHaveProperty('solution');
    });
    
    const vpnIssue = troubleshooting.find(t => t.issue.includes("Slow file transfers over VPN"));
    expect(vpnIssue).toBeDefined();
    expect(vpnIssue?.cause).toContain("fragmented");
    expect(vpnIssue?.solution).toContain("MSS clamping");
  });

  it('includes platform-specific commands', () => {
    const commands = mtuMssContent.commands;
    expect(commands).toBeInstanceOf(Array);
    expect(commands.length).toBeGreaterThan(3);
    
    commands.forEach(cmd => {
      expect(cmd).toHaveProperty('platform');
      expect(cmd).toHaveProperty('command');
      expect(cmd).toHaveProperty('purpose');
    });
    
    const windowsCmd = commands.find(c => c.platform === "Windows");
    expect(windowsCmd).toBeDefined();
    expect(windowsCmd?.command).toContain("netsh");
    
    const linuxCmd = commands.find(c => c.platform === "Linux");
    expect(linuxCmd).toBeDefined();
    expect(linuxCmd?.command).toBe("ip link show");
  });

  it('provides test commands for MTU discovery', () => {
    const testCommands = mtuMssContent.testCommands;
    expect(testCommands).toBeInstanceOf(Array);
    expect(testCommands.length).toBeGreaterThan(2);
    
    testCommands.forEach(cmd => {
      expect(cmd).toHaveProperty('platform');
      expect(cmd).toHaveProperty('command');
      expect(cmd).toHaveProperty('purpose');
    });
    
    const windowsPing = testCommands.find(c => c.platform === "Windows");
    expect(windowsPing).toBeDefined();
    expect(windowsPing?.command).toContain("ping -f -l 1472");
    expect(windowsPing?.purpose).toContain("1500 MTU");
  });

  it('includes best practices', () => {
    expect(mtuMssContent.bestPractices).toBeInstanceOf(Array);
    expect(mtuMssContent.bestPractices.length).toBeGreaterThan(5);
    
    const practices = mtuMssContent.bestPractices.join(' ');
    expect(practices).toContain("consistent MTU sizes");
    expect(practices).toContain("MSS clamping");
    expect(practices).toContain("jumbo frames");
    expect(practices).toContain("fragmentation");
  });

  it('provides quick reference values', () => {
    expect(mtuMssContent.quickReference).toBeInstanceOf(Array);
    expect(mtuMssContent.quickReference.length).toBeGreaterThan(3);
    
    expect(mtuMssContent.quickReference).toContain("Standard Ethernet: 1500 MTU / 1460 MSS");
    expect(mtuMssContent.quickReference).toContain("PPPoE/DSL: 1492 MTU / 1452 MSS");
    expect(mtuMssContent.quickReference).toContain("Jumbo Frames: 9000 MTU / 8960 MSS");
  });

  it('validates MTU/MSS calculations are correct', () => {
    // Verify that MSS calculations in commonValues are correct
    mtuMssContent.commonValues.forEach(value => {
      // For IPv4: MSS should be MTU - 40 (20 IP + 20 TCP)
      // This is a general check, some protocols may have additional overhead
      if (value.medium === "Ethernet" || value.medium === "802.11 WiFi") {
        expect(value.mss).toBe(value.mtu - 40);
      }
    });
    
    // Verify calculation examples
    mtuMssContent.calculations.examples.forEach(example => {
      const calculatedMss = example.mtu - example.ipHeader - example.tcpHeader;
      expect(example.mss).toBe(calculatedMss);
    });
  });

  it('validates data structure consistency', () => {
    // Check common values structure
    mtuMssContent.commonValues.forEach(value => {
      expect(value.mtu).toBeGreaterThan(0);
      expect(value.mss).toBeGreaterThan(0);
      expect(value.mss).toBeLessThan(value.mtu);
      expect(typeof value.medium).toBe('string');
      expect(typeof value.notes).toBe('string');
      expect(typeof value.usage).toBe('string');
    });

    // Check overheads structure
    mtuMssContent.overheads.forEach(overhead => {
      expect(typeof overhead.protocol).toBe('string');
      expect(typeof overhead.notes).toBe('string');
      // Overhead can be number or string (for ranges like "24-32")
      expect(['number', 'string']).toContain(typeof overhead.overhead);
    });
  });

  it('emphasizes practical network performance concepts', () => {
    const content = JSON.stringify(mtuMssContent);
    expect(content).toContain("MTU");
    expect(content).toContain("MSS");
    expect(content).toContain("fragmentation");
    expect(content).toContain("Ethernet");
    expect(content).toContain("jumbo frames");
    expect(content).toContain("Path MTU Discovery");
    expect(content).not.toContain("password");
    expect(content).not.toContain("malicious");
  });

  it('covers VPN and tunneling scenarios', () => {
    const vpn = mtuMssContent.commonValues.find(v => v.medium === "VPN (typical)");
    expect(vpn).toBeDefined();
    expect(vpn?.mtu).toBe(1436);
    expect(vpn?.notes).toContain("encryption");
    
    const gre = mtuMssContent.commonValues.find(v => v.medium === "GRE Tunnel");
    expect(gre).toBeDefined();
    expect(gre?.mtu).toBe(1476);
    expect(gre?.notes).toContain("24 bytes of overhead");
  });
});