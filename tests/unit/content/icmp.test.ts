import { describe, it, expect } from 'vitest';
import { icmpContent } from '../../../src/lib/content/icmp';

describe('ICMP content', () => {
  it('has valid structure', () => {
    expect(icmpContent).toBeDefined();
    expect(icmpContent.title).toBe("ICMP & ICMPv6: Common Types");
    expect(icmpContent.description).toContain("ICMP and ICMPv6 message types");
    expect(icmpContent.sections).toBeDefined();
    expect(icmpContent.icmpv4Types).toBeInstanceOf(Array);
    expect(icmpContent.icmpv6Types).toBeInstanceOf(Array);
    expect(icmpContent.practicalExamples).toBeInstanceOf(Array);
    expect(icmpContent.filteringIssues).toBeInstanceOf(Array);
    expect(icmpContent.bestPractices).toBeInstanceOf(Array);
    expect(icmpContent.troubleshootingCommands).toBeInstanceOf(Array);
    expect(icmpContent.quickReference).toBeDefined();
    expect(icmpContent.commonMistakes).toBeInstanceOf(Array);
  });

  it('explains ICMP fundamentals', () => {
    const overview = icmpContent.sections.overview;
    expect(overview.title).toBe("What is ICMP?");
    expect(overview.content).toContain("Internet Control Message Protocol");
    expect(overview.content).toContain("error messages");
    expect(overview.content).toContain("not used for data transfer");
    expect(overview.content).toContain("ICMPv6");
    expect(overview.content).toContain("Neighbor Discovery");
  });

  it('defines essential ICMPv4 types', () => {
    expect(icmpContent.icmpv4Types).toHaveLength(6);
    
    const echoReply = icmpContent.icmpv4Types.find(t => t.type === 0);
    expect(echoReply?.name).toBe("Echo Reply");
    expect(echoReply?.description).toContain("ping request");
    expect(echoReply?.commonUse).toContain("Ping response");
    
    const echoRequest = icmpContent.icmpv4Types.find(t => t.type === 8);
    expect(echoRequest?.name).toBe("Echo Request");
    expect(echoRequest?.commonUse).toContain("ping command");
    
    const destUnreach = icmpContent.icmpv4Types.find(t => t.type === 3);
    expect(destUnreach?.name).toBe("Destination Unreachable");
    expect(destUnreach?.codes).toBeDefined();
    expect(destUnreach?.codes).toHaveLength(6);
    
    const timeExceeded = icmpContent.icmpv4Types.find(t => t.type === 11);
    expect(timeExceeded?.name).toBe("Time Exceeded");
    expect(timeExceeded?.commonUse).toContain("Traceroute");
    expect(timeExceeded?.codes).toHaveLength(2);
  });

  it('defines essential ICMPv6 types', () => {
    expect(icmpContent.icmpv6Types).toHaveLength(9);
    
    const echoRequest = icmpContent.icmpv6Types.find(t => t.type === 128);
    expect(echoRequest?.name).toBe("Echo Request");
    expect(echoRequest?.example).toContain("ping6");
    
    const echoReply = icmpContent.icmpv6Types.find(t => t.type === 129);
    expect(echoReply?.name).toBe("Echo Reply");
    
    const neighborSolicitation = icmpContent.icmpv6Types.find(t => t.type === 135);
    expect(neighborSolicitation?.name).toBe("Neighbor Solicitation (NS)");
    expect(neighborSolicitation?.description).toContain("ARP request");
    
    const neighborAdvertisement = icmpContent.icmpv6Types.find(t => t.type === 136);
    expect(neighborAdvertisement?.name).toBe("Neighbor Advertisement (NA)");
    expect(neighborAdvertisement?.description).toContain("ARP reply");
    
    const routerSolicitation = icmpContent.icmpv6Types.find(t => t.type === 133);
    expect(routerSolicitation?.name).toBe("Router Solicitation (RS)");
    
    const routerAdvertisement = icmpContent.icmpv6Types.find(t => t.type === 134);
    expect(routerAdvertisement?.name).toBe("Router Advertisement (RA)");
  });

  it('provides practical troubleshooting scenarios', () => {
    expect(icmpContent.practicalExamples).toHaveLength(4);
    
    const pingIssue = icmpContent.practicalExamples.find(e => e.scenario === "Ping Not Working");
    expect(pingIssue?.icmpTypes).toContain("Type 8 (Echo Request)");
    expect(pingIssue?.icmpTypes).toContain("Type 0 (Echo Reply)");
    expect(pingIssue?.commonCauses).toContain("Firewall blocking ICMP");
    
    const tracerouteIssue = icmpContent.practicalExamples.find(e => e.scenario === "Traceroute Shows * * *");
    expect(tracerouteIssue?.icmpTypes).toContain("Type 11 (Time Exceeded)");
    
    const mtuIssue = icmpContent.practicalExamples.find(e => e.scenario === "Large Files Won't Transfer");
    expect(mtuIssue?.icmpTypes).toContain("Type 3 Code 4 (Fragmentation Needed)");
    expect(mtuIssue?.icmpTypes).toContain("ICMPv6 Type 2 (Packet Too Big)");
    
    const ipv6Issue = icmpContent.practicalExamples.find(e => e.scenario === "IPv6 Address Not Working");
    expect(ipv6Issue?.icmpTypes).toContain("Type 135/136 (Neighbor Discovery)");
    expect(ipv6Issue?.icmpTypes).toContain("Type 133/134 (Router Discovery)");
  });

  it('addresses common filtering issues', () => {
    expect(icmpContent.filteringIssues).toHaveLength(3);
    
    const blockAll = icmpContent.filteringIssues.find(i => i.issue === "Firewall Blocks All ICMP");
    expect(blockAll?.problem).toContain("Breaks ping, traceroute");
    expect(blockAll?.solution).toContain("Allow specific ICMP types");
    expect(blockAll?.recommendation).toContain("Never block ICMP types 3 and 11");
    
    const rateLimiting = icmpContent.filteringIssues.find(i => i.issue === "Router Drops ICMP Due to Rate Limiting");
    expect(rateLimiting?.problem).toContain("Intermittent");
    
    const ndpFiltering = icmpContent.filteringIssues.find(i => i.issue === "IPv6 NDP Messages Filtered");
    expect(ndpFiltering?.problem).toContain("IPv6 connectivity completely broken");
    expect(ndpFiltering?.solution).toContain("Allow ICMPv6 types 133-137");
  });

  it('includes troubleshooting commands', () => {
    expect(icmpContent.troubleshootingCommands).toHaveLength(6);
    
    const ping = icmpContent.troubleshootingCommands.find(c => c.command === "ping 8.8.8.8");
    expect(ping?.purpose).toContain("IPv4 connectivity");
    expect(ping?.icmpType).toContain("Type 8");
    expect(ping?.icmpType).toContain("Type 0");
    
    const ping6 = icmpContent.troubleshootingCommands.find(c => c.command === "ping6 2001:db8::1");
    expect(ping6?.purpose).toContain("IPv6 connectivity");
    expect(ping6?.icmpType).toContain("Type 128");
    
    const traceroute = icmpContent.troubleshootingCommands.find(c => c.command === "traceroute 8.8.8.8");
    expect(traceroute?.purpose).toContain("path");
    expect(traceroute?.icmpType).toContain("Type 11");
    
    const tcpdump = icmpContent.troubleshootingCommands.find(c => c.command === "tcpdump -i eth0 icmp");
    expect(tcpdump?.purpose).toContain("Capture ICMP traffic");
  });

  it('provides quick reference for must-allow types', () => {
    const quickRef = icmpContent.quickReference;
    expect(quickRef.mustAllow).toHaveLength(8);
    expect(quickRef.neverFilter).toHaveLength(3);
    
    expect(quickRef.mustAllow).toContain("ICMP Type 0 - Echo Reply (ping responses)");
    expect(quickRef.mustAllow).toContain("ICMP Type 3 - Destination Unreachable");
    expect(quickRef.mustAllow).toContain("ICMP Type 8 - Echo Request (ping)");
    expect(quickRef.mustAllow).toContain("ICMP Type 11 - Time Exceeded (traceroute)");
    expect(quickRef.mustAllow).toContain("ICMPv6 Type 133-137 - Neighbor Discovery");
    
    expect(quickRef.neverFilter).toContain("ICMP Type 3 Code 4 (Fragmentation Needed)");
    expect(quickRef.neverFilter).toContain("ICMPv6 Type 2 (Packet Too Big)");
  });

  it('lists best practices', () => {
    expect(icmpContent.bestPractices).toHaveLength(6);
    expect(icmpContent.bestPractices).toContain("Allow ICMP types 0, 3, 8, 11 through firewalls");
    expect(icmpContent.bestPractices).toContain("For IPv6, allow ICMPv6 types 1, 2, 3, 128, 129, 133-137");
    expect(icmpContent.bestPractices).toContain("Use ICMP rate limiting instead of complete blocking");
    expect(icmpContent.bestPractices).toContain("Don't filter ICMP on internal networks");
  });

  it('identifies common mistakes', () => {
    expect(icmpContent.commonMistakes).toHaveLength(5);
    expect(icmpContent.commonMistakes).toContain("Blocking all ICMP types (breaks PMTU discovery)");
    expect(icmpContent.commonMistakes).toContain("Filtering ICMPv6 Neighbor Discovery on LANs");
    expect(icmpContent.commonMistakes).toContain("Not understanding the difference between ICMP filtering and rate limiting");
  });

  it('validates data structure consistency', () => {
    icmpContent.icmpv4Types.forEach(type => {
      expect(type).toHaveProperty('type');
      expect(type).toHaveProperty('name');
      expect(type).toHaveProperty('description');
      expect(type).toHaveProperty('commonUse');
      expect(type).toHaveProperty('example');
      expect(type).toHaveProperty('troubleshooting');
      expect(typeof type.type).toBe('number');
      expect(type.type).toBeGreaterThanOrEqual(0);
      expect(type.type).toBeLessThanOrEqual(255);
    });

    icmpContent.icmpv6Types.forEach(type => {
      expect(type).toHaveProperty('type');
      expect(type).toHaveProperty('name');
      expect(type).toHaveProperty('description');
      expect(type).toHaveProperty('commonUse');
      expect(type).toHaveProperty('example');
      expect(type).toHaveProperty('troubleshooting');
      expect(typeof type.type).toBe('number');
      expect(type.type).toBeGreaterThanOrEqual(0);
      expect(type.type).toBeLessThanOrEqual(255);
    });

    icmpContent.practicalExamples.forEach(example => {
      expect(example).toHaveProperty('scenario');
      expect(example).toHaveProperty('icmpTypes');
      expect(example).toHaveProperty('whatToCheck');
      expect(example).toHaveProperty('commonCauses');
      expect(example.icmpTypes).toBeInstanceOf(Array);
      expect(example.whatToCheck).toBeInstanceOf(Array);
      expect(example.commonCauses).toBeInstanceOf(Array);
    });
  });

  it('covers critical ICMP codes', () => {
    const destUnreach = icmpContent.icmpv4Types.find(t => t.type === 3);
    const codes = destUnreach?.codes || [];
    
    const networkUnreach = codes.find(c => c.code === 0);
    expect(networkUnreach?.meaning).toBe("Network Unreachable");
    
    const hostUnreach = codes.find(c => c.code === 1);
    expect(hostUnreach?.meaning).toBe("Host Unreachable");
    
    const fragmentationNeeded = codes.find(c => c.code === 4);
    expect(fragmentationNeeded?.meaning).toBe("Fragmentation Needed (MTU)");
    
    const firewallProhibited = codes.find(c => c.code === 13);
    expect(firewallProhibited?.meaning).toBe("Communication Prohibited (Firewall)");
  });

  it('distinguishes IPv4 and IPv6 ICMP correctly', () => {
    // IPv4 ICMP uses lower type numbers  
    const ipv4Types = icmpContent.icmpv4Types.map(t => t.type);
    expect(Math.max(...ipv4Types)).toBeLessThan(20);
    
    // ICMPv6 uses higher type numbers (128+)
    const ipv6EchoTypes = icmpContent.icmpv6Types.filter(t => t.name.includes("Echo")).map(t => t.type);
    expect(ipv6EchoTypes).toContain(128); // Echo Request
    expect(ipv6EchoTypes).toContain(129); // Echo Reply
    
    // ICMPv6 Neighbor Discovery uses 133-137
    const neighborDiscoveryTypes = icmpContent.icmpv6Types.filter(t => 
      t.name.includes("Router") || t.name.includes("Neighbor")
    ).map(t => t.type);
    expect(neighborDiscoveryTypes).toEqual([133, 134, 135, 136]);
  });

  it('emphasizes operational importance', () => {
    const content = JSON.stringify(icmpContent);
    expect(content).toContain("troubleshooting");
    expect(content).toContain("connectivity");
    expect(content).toContain("firewall");
    expect(content).toContain("network");
    expect(content).toContain("ping");
    expect(content).toContain("traceroute");
    expect(content).toContain("MTU");
    expect(content).not.toContain("password");
    expect(content).not.toContain("malicious");
  });
});