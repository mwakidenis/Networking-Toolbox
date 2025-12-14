import { describe, it, expect } from 'vitest';
import { dnsblContent } from '$lib/content/dnsbl';

describe('DNSBL Content', () => {
  it('should have valid structure', () => {
    expect(dnsblContent).toBeDefined();
    expect(dnsblContent.title).toBeDefined();
    expect(dnsblContent.description).toBeDefined();
    expect(dnsblContent.sections).toBeDefined();
  });

  it('should have all required sections', () => {
    expect(dnsblContent.sections.whatAreBlacklists).toBeDefined();
    expect(dnsblContent.sections.howChecksWork).toBeDefined();
    expect(dnsblContent.sections.whyListed).toBeDefined();
    expect(dnsblContent.sections.consequences).toBeDefined();
    expect(dnsblContent.sections.howToFix).toBeDefined();
    expect(dnsblContent.sections.bestPractices).toBeDefined();
  });

  it('should have listing reasons', () => {
    expect(dnsblContent.sections.whyListed.reasons).toBeInstanceOf(Array);
    expect(dnsblContent.sections.whyListed.reasons.length).toBeGreaterThan(0);

    dnsblContent.sections.whyListed.reasons.forEach((reason) => {
      expect(reason.reason).toBeDefined();
      expect(reason.description).toBeDefined();
    });
  });

  it('should have consequences', () => {
    expect(dnsblContent.sections.consequences.impacts).toBeInstanceOf(Array);
    expect(dnsblContent.sections.consequences.impacts.length).toBeGreaterThan(0);

    dnsblContent.sections.consequences.impacts.forEach((impact) => {
      expect(impact.severity).toBeDefined();
      expect(impact.impact).toBeDefined();
      expect(impact.description).toBeDefined();
    });
  });

  it('should have fix steps', () => {
    expect(dnsblContent.sections.howToFix.steps).toBeInstanceOf(Array);
    expect(dnsblContent.sections.howToFix.steps.length).toBeGreaterThan(0);

    dnsblContent.sections.howToFix.steps.forEach((step) => {
      expect(step.step).toBeDefined();
      expect(step.actions).toBeInstanceOf(Array);
    });
  });

  it('should have best practices', () => {
    expect(dnsblContent.sections.bestPractices.practices).toBeInstanceOf(Array);
    expect(dnsblContent.sections.bestPractices.practices.length).toBeGreaterThan(0);

    dnsblContent.sections.bestPractices.practices.forEach((practice) => {
      expect(practice.category).toBeDefined();
      expect(practice.items).toBeInstanceOf(Array);
    });
  });
});
