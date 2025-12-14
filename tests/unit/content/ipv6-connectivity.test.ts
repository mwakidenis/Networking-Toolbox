import { describe, it, expect } from 'vitest';
import { ipv6ConnectivityContent } from '$lib/content/ipv6-connectivity';

describe('IPv6 Connectivity Content', () => {
	it('should have a valid structure', () => {
		expect(ipv6ConnectivityContent).toBeDefined();
		expect(ipv6ConnectivityContent.title).toBe('IPv6 Connectivity Checker');
		expect(ipv6ConnectivityContent.description).toBeTruthy();
		expect(ipv6ConnectivityContent.sections).toBeDefined();
		expect(ipv6ConnectivityContent.quickTips).toBeDefined();
	});

	it('should have all required sections', () => {
		const sections = ipv6ConnectivityContent.sections;
		expect(sections.whatIsIPv6).toBeDefined();
		expect(sections.dualStack).toBeDefined();
		expect(sections.ipv6Advantages).toBeDefined();
		expect(sections.connectivityTests).toBeDefined();
		expect(sections.adoptionStatus).toBeDefined();
		expect(sections.transitionMechanisms).toBeDefined();
		expect(sections.commonIssues).toBeDefined();
		expect(sections.bestPractices).toBeDefined();
	});

	it('should have dual-stack benefits', () => {
		const benefits = ipv6ConnectivityContent.sections.dualStack.benefits;
		expect(Array.isArray(benefits)).toBe(true);
		expect(benefits.length).toBeGreaterThan(0);
		benefits.forEach((benefit) => {
			expect(benefit.benefit).toBeTruthy();
			expect(benefit.description).toBeTruthy();
		});
	});

	it('should have IPv6 advantages', () => {
		const advantages = ipv6ConnectivityContent.sections.ipv6Advantages.advantages;
		expect(Array.isArray(advantages)).toBe(true);
		expect(advantages.length).toBeGreaterThan(0);
		advantages.forEach((advantage) => {
			expect(advantage.advantage).toBeTruthy();
			expect(advantage.description).toBeTruthy();
		});
	});

	it('should have connectivity tests', () => {
		const tests = ipv6ConnectivityContent.sections.connectivityTests.tests;
		expect(Array.isArray(tests)).toBe(true);
		expect(tests.length).toBe(4);
		tests.forEach((test) => {
			expect(test.test).toBeTruthy();
			expect(test.description).toBeTruthy();
		});
	});

	it('should have adoption status with regions', () => {
		const regions = ipv6ConnectivityContent.sections.adoptionStatus.regions;
		expect(Array.isArray(regions)).toBe(true);
		expect(regions.length).toBeGreaterThan(0);
		regions.forEach((region) => {
			expect(region.region).toBeTruthy();
			expect(region.adoption).toBeTruthy();
			expect(region.note).toBeTruthy();
		});
	});

	it('should have transition mechanisms', () => {
		const mechanisms = ipv6ConnectivityContent.sections.transitionMechanisms.mechanisms;
		expect(Array.isArray(mechanisms)).toBe(true);
		expect(mechanisms.length).toBeGreaterThan(0);
		mechanisms.forEach((mechanism) => {
			expect(mechanism.mechanism).toBeTruthy();
			expect(mechanism.description).toBeTruthy();
			expect(mechanism.status).toBeTruthy();
		});
	});

	it('should have common issues', () => {
		const issues = ipv6ConnectivityContent.sections.commonIssues.issues;
		expect(Array.isArray(issues)).toBe(true);
		expect(issues.length).toBeGreaterThan(0);
		issues.forEach((issue) => {
			expect(issue.issue).toBeTruthy();
			expect(Array.isArray(issue.causes)).toBe(true);
			expect(issue.causes.length).toBeGreaterThan(0);
			expect(issue.solution).toBeTruthy();
		});
	});

	it('should have best practices', () => {
		const practices = ipv6ConnectivityContent.sections.bestPractices.practices;
		expect(Array.isArray(practices)).toBe(true);
		expect(practices.length).toBeGreaterThan(0);
		practices.forEach((practice) => {
			expect(practice.practice).toBeTruthy();
			expect(practice.description).toBeTruthy();
		});
	});

	it('should have quick tips', () => {
		const tips = ipv6ConnectivityContent.quickTips;
		expect(Array.isArray(tips)).toBe(true);
		expect(tips.length).toBeGreaterThan(0);
		tips.forEach((tip) => {
			expect(typeof tip).toBe('string');
			expect(tip.length).toBeGreaterThan(0);
		});
	});
});
