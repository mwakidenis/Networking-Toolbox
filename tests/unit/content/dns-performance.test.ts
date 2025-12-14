import { describe, it, expect } from 'vitest';
import { dnsPerformanceContent } from '$lib/content/dns-performance';

describe('DNS Performance Content', () => {
  it('should have valid structure', () => {
    expect(dnsPerformanceContent).toBeDefined();
    expect(dnsPerformanceContent.title).toBeDefined();
    expect(dnsPerformanceContent.description).toBeDefined();
    expect(dnsPerformanceContent.sections).toBeDefined();
  });

  it('should have all required sections', () => {
    expect(dnsPerformanceContent.sections.whatIsDnsPerformance).toBeDefined();
    expect(dnsPerformanceContent.sections.howItWorks).toBeDefined();
    expect(dnsPerformanceContent.sections.recordTypes).toBeDefined();
    expect(dnsPerformanceContent.sections.interpretingResults).toBeDefined();
    expect(dnsPerformanceContent.sections.optimization).toBeDefined();
    expect(dnsPerformanceContent.sections.bestPractices).toBeDefined();
  });

  it('should have record types', () => {
    expect(dnsPerformanceContent.sections.recordTypes.types).toBeInstanceOf(Array);
    expect(dnsPerformanceContent.sections.recordTypes.types.length).toBeGreaterThan(0);

    dnsPerformanceContent.sections.recordTypes.types.forEach((type) => {
      expect(type.type).toBeDefined();
      expect(type.description).toBeDefined();
    });
  });

  it('should have interpretation ranges', () => {
    expect(dnsPerformanceContent.sections.interpretingResults.ranges).toBeInstanceOf(Array);
    expect(dnsPerformanceContent.sections.interpretingResults.ranges.length).toBeGreaterThan(0);

    dnsPerformanceContent.sections.interpretingResults.ranges.forEach((range) => {
      expect(range.range).toBeDefined();
      expect(range.performance).toBeDefined();
      expect(range.description).toBeDefined();
    });
  });

  it('should have optimization tips', () => {
    expect(dnsPerformanceContent.sections.optimization.tips).toBeInstanceOf(Array);
    expect(dnsPerformanceContent.sections.optimization.tips.length).toBeGreaterThan(0);

    dnsPerformanceContent.sections.optimization.tips.forEach((tip) => {
      expect(tip.tip).toBeDefined();
      expect(tip.description).toBeDefined();
    });
  });

  it('should have best practices', () => {
    expect(dnsPerformanceContent.sections.bestPractices.practices).toBeInstanceOf(Array);
    expect(dnsPerformanceContent.sections.bestPractices.practices.length).toBeGreaterThan(0);

    dnsPerformanceContent.sections.bestPractices.practices.forEach((practice) => {
      expect(typeof practice).toBe('string');
    });
  });
});
