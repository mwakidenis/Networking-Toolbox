import { describe, it, expect } from 'vitest';
import { arpVsNdpContent } from '../../../src/lib/content/arp-vs-ndp';

describe('ARP vs NDP content', () => {
  it('has valid structure', () => {
    expect(arpVsNdpContent).toBeDefined();
    expect(arpVsNdpContent.title).toBe("ARP vs NDP");
    expect(arpVsNdpContent.description).toContain("Side-by-side comparison");
    expect(arpVsNdpContent.sections).toBeDefined();
    expect(arpVsNdpContent.comparison).toBeDefined();
    expect(arpVsNdpContent.arpDetails).toBeDefined();
    expect(arpVsNdpContent.ndpDetails).toBeDefined();
  });

  it('explains the fundamental purpose', () => {
    const overview = arpVsNdpContent.sections.overview;
    expect(overview.title).toBe("Purpose and Function");
    expect(overview.content).toContain("Address Resolution Protocol");
    expect(overview.content).toContain("Neighbor Discovery Protocol");
    expect(overview.content).toContain("MAC address");
    expect(overview.content).toContain("IP address");
  });

  it('provides comprehensive comparison', () => {
    expect(arpVsNdpContent.comparison.basic).toBeInstanceOf(Array);
    expect(arpVsNdpContent.comparison.basic.length).toBeGreaterThan(4);
    
    const aspects = arpVsNdpContent.comparison.basic.map(item => item.aspect);
    expect(aspects).toContain("Primary Purpose");
    expect(aspects).toContain("Protocol Layer");
    expect(aspects).toContain("Security");
  });

  it('details ARP characteristics correctly', () => {
    const arp = arpVsNdpContent.arpDetails;
    expect(arp.title).toBe("ARP (Address Resolution Protocol)");
    expect(arp.messageTypes).toBeInstanceOf(Array);
    expect(arp.messageTypes).toHaveLength(4);
    
    const requestType = arp.messageTypes.find(m => m.type === "ARP Request");
    expect(requestType).toBeDefined();
    expect(requestType?.description).toContain("Who has IP address");
    
    const replyType = arp.messageTypes.find(m => m.type === "ARP Reply");
    expect(replyType).toBeDefined();
  });

  it('details NDP characteristics correctly', () => {
    const ndp = arpVsNdpContent.ndpDetails;
    expect(ndp.title).toBe("NDP (Neighbor Discovery Protocol)");
    expect(ndp.messageTypes).toBeInstanceOf(Array);
    expect(ndp.messageTypes.length).toBeGreaterThanOrEqual(5);
    
    const nsType = ndp.messageTypes.find(m => m.type === "Neighbor Solicitation (NS)");
    expect(nsType).toBeDefined();
    expect(nsType?.description).toContain("IPv6 equivalent of ARP Request");
    
    const naType = ndp.messageTypes.find(m => m.type === "Neighbor Advertisement (NA)");
    expect(naType).toBeDefined();
  });

  it('covers router discovery functionality', () => {
    const ndp = arpVsNdpContent.ndpDetails;
    const rsType = ndp.messageTypes.find(m => m.type === "Router Solicitation (RS)");
    const raType = ndp.messageTypes.find(m => m.type === "Router Advertisement (RA)");
    
    expect(rsType).toBeDefined();
    expect(raType).toBeDefined();
    expect(raType?.description).toContain("Router announces its presence and configuration");
  });

  it('includes practical examples', () => {
    expect(arpVsNdpContent.practicalDifferences).toBeDefined();
    expect(arpVsNdpContent.practicalDifferences).toBeInstanceOf(Array);
    expect(arpVsNdpContent.practicalDifferences.length).toBeGreaterThan(2);
    
    const scenarios = arpVsNdpContent.practicalDifferences.map(d => d.scenario);
    expect(scenarios).toContain("Network Discovery");
  });

  it('provides troubleshooting information', () => {
    expect(arpVsNdpContent.troubleshootingCommands).toBeDefined();
    expect(arpVsNdpContent.troubleshootingCommands).toBeInstanceOf(Array);
    expect(arpVsNdpContent.commonIssues).toBeInstanceOf(Array);
    
    const issues = arpVsNdpContent.commonIssues;
    expect(issues.some(issue => issue.issue.includes("Spoofing"))).toBe(true);
  });

  it('validates data structure consistency', () => {
    // Check comparison structure
    arpVsNdpContent.comparison.basic.forEach(item => {
      expect(item).toHaveProperty('aspect');
      expect(item).toHaveProperty('arp');
      expect(item).toHaveProperty('ndp');
      expect(typeof item.aspect).toBe('string');
      expect(typeof item.arp).toBe('string');
      expect(typeof item.ndp).toBe('string');
    });

    // Check message types structure
    [...arpVsNdpContent.arpDetails.messageTypes, ...arpVsNdpContent.ndpDetails.messageTypes].forEach(msg => {
      expect(msg).toHaveProperty('type');
      expect(msg).toHaveProperty('description');
      expect(typeof msg.type).toBe('string');
      expect(typeof msg.description).toBe('string');
    });
  });

  it('emphasizes practical networking concepts', () => {
    const content = JSON.stringify(arpVsNdpContent);
    expect(content).toContain("MAC address");
    expect(content).toContain("broadcast");
    expect(content).toContain("multicast");
    expect(content).toContain("neighbor");
    expect(content).toContain("router");
    expect(content).toContain("discovery");
    expect(content).not.toContain("password");
    expect(content).not.toContain("malicious");
  });

  it('correctly contrasts IPv4 vs IPv6 approaches', () => {
    const basic = arpVsNdpContent.comparison.basic;
    const broadcastItem = basic.find(item => item.aspect.includes("Broadcast"));
    
    expect(broadcastItem).toBeDefined();
    expect(broadcastItem?.arp).toContain("broadcast");
    expect(broadcastItem?.ndp).toContain("multicast");
    
    const securityItem = basic.find(item => item.aspect === "Security");
    expect(securityItem).toBeDefined();
    expect(securityItem?.arp).toContain("No built-in security");
    expect(securityItem?.ndp).toContain("IPSec");
  });
});
