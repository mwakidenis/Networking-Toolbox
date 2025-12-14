import { describe, it, expect } from 'vitest';
import { axfrContent } from '$lib/content/axfr';

describe('AXFR Content', () => {
  it('should have valid structure', () => {
    expect(axfrContent).toBeDefined();
    expect(axfrContent.title).toBeDefined();
    expect(axfrContent.description).toBeDefined();
    expect(axfrContent.sections).toBeDefined();
  });

  it('should have all required sections', () => {
    expect(axfrContent.sections.whatIsAXFR).toBeDefined();
    expect(axfrContent.sections.security).toBeDefined();
    expect(axfrContent.sections.howItWorks).toBeDefined();
    expect(axfrContent.sections.interpretation).toBeDefined();
    expect(axfrContent.sections.properConfiguration).toBeDefined();
    expect(axfrContent.sections.remediation).toBeDefined();
    expect(axfrContent.sections.bestPractices).toBeDefined();
    expect(axfrContent.sections.commonMisconfigurations).toBeDefined();
    expect(axfrContent.sections.compliance).toBeDefined();
  });

  it('should have security risks', () => {
    expect(axfrContent.sections.security.risks).toBeInstanceOf(Array);
    expect(axfrContent.sections.security.risks.length).toBeGreaterThan(0);

    axfrContent.sections.security.risks.forEach((risk) => {
      expect(risk.risk).toBeDefined();
      expect(risk.severity).toBeDefined();
      expect(risk.description).toBeDefined();
      expect(risk.impact).toBeDefined();
    });
  });

  it('should have interpretation statuses', () => {
    expect(axfrContent.sections.interpretation.statuses).toBeInstanceOf(Array);
    expect(axfrContent.sections.interpretation.statuses.length).toBeGreaterThan(0);

    axfrContent.sections.interpretation.statuses.forEach((status) => {
      expect(status.status).toBeDefined();
      expect(status.color).toBeDefined();
      expect(status.meaning).toBeDefined();
      expect(status.description).toBeDefined();
      expect(status.action).toBeDefined();
    });
  });

  it('should have configuration examples', () => {
    expect(axfrContent.sections.properConfiguration.configurations).toBeInstanceOf(Array);
    expect(axfrContent.sections.properConfiguration.configurations.length).toBeGreaterThan(0);

    axfrContent.sections.properConfiguration.configurations.forEach((config) => {
      expect(config.server).toBeDefined();
      expect(config.syntax).toBeDefined();
      expect(config.description).toBeDefined();
    });
  });

  it('should have remediation steps', () => {
    expect(axfrContent.sections.remediation.steps).toBeInstanceOf(Array);
    expect(axfrContent.sections.remediation.steps.length).toBeGreaterThan(0);

    axfrContent.sections.remediation.steps.forEach((step) => {
      expect(step.step).toBeDefined();
      expect(step.details).toBeDefined();
    });
  });

  it('should have best practices', () => {
    expect(axfrContent.sections.bestPractices.practices).toBeInstanceOf(Array);
    expect(axfrContent.sections.bestPractices.practices.length).toBeGreaterThan(0);

    axfrContent.sections.bestPractices.practices.forEach((practice) => {
      expect(practice.practice).toBeDefined();
      expect(practice.description).toBeDefined();
    });
  });

  it('should have common misconfigurations', () => {
    expect(axfrContent.sections.commonMisconfigurations.misconfigurations).toBeInstanceOf(Array);
    expect(axfrContent.sections.commonMisconfigurations.misconfigurations.length).toBeGreaterThan(0);

    axfrContent.sections.commonMisconfigurations.misconfigurations.forEach((misconfig) => {
      expect(misconfig.issue).toBeDefined();
      expect(misconfig.problem).toBeDefined();
      expect(misconfig.fix).toBeDefined();
    });
  });

  it('should have compliance standards', () => {
    expect(axfrContent.sections.compliance.standards).toBeInstanceOf(Array);
    expect(axfrContent.sections.compliance.standards.length).toBeGreaterThan(0);

    axfrContent.sections.compliance.standards.forEach((standard) => {
      expect(standard.standard).toBeDefined();
      expect(standard.requirement).toBeDefined();
    });
  });
});
