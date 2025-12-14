import { describe, it, expect } from 'vitest';
import { greylistContent } from '$lib/content/greylist';

describe('Greylist Content', () => {
	it('should have title and description', () => {
		expect(greylistContent.title).toBe('Email Greylisting Tester');
		expect(greylistContent.description).toBeTruthy();
		expect(typeof greylistContent.description).toBe('string');
	});

	it('should have whatIsGreylisting section', () => {
		expect(greylistContent.sections.whatIsGreylisting).toBeDefined();
		expect(greylistContent.sections.whatIsGreylisting.title).toBeTruthy();
		expect(greylistContent.sections.whatIsGreylisting.content).toBeTruthy();
	});

	it('should have howItWorks section with steps', () => {
		expect(greylistContent.sections.howItWorks).toBeDefined();
		expect(greylistContent.sections.howItWorks.title).toBeTruthy();
		expect(Array.isArray(greylistContent.sections.howItWorks.steps)).toBe(true);
		expect(greylistContent.sections.howItWorks.steps.length).toBeGreaterThan(0);
		greylistContent.sections.howItWorks.steps.forEach((item) => {
			expect(item.step).toBeTruthy();
			expect(item.desc).toBeTruthy();
		});
	});

	it('should have smtpCodes section with codes', () => {
		expect(greylistContent.sections.smtpCodes).toBeDefined();
		expect(greylistContent.sections.smtpCodes.title).toBeTruthy();
		expect(Array.isArray(greylistContent.sections.smtpCodes.codes)).toBe(true);
		expect(greylistContent.sections.smtpCodes.codes.length).toBeGreaterThan(0);
		greylistContent.sections.smtpCodes.codes.forEach((item) => {
			expect(item.code).toBeTruthy();
			expect(item.name).toBeTruthy();
			expect(item.desc).toBeTruthy();
		});
	});

	it('should have confidenceLevels section with levels', () => {
		expect(greylistContent.sections.confidenceLevels).toBeDefined();
		expect(greylistContent.sections.confidenceLevels.title).toBeTruthy();
		expect(Array.isArray(greylistContent.sections.confidenceLevels.levels)).toBe(true);
		expect(greylistContent.sections.confidenceLevels.levels.length).toBeGreaterThan(0);
		greylistContent.sections.confidenceLevels.levels.forEach((item) => {
			expect(item.level).toBeTruthy();
			expect(item.desc).toBeTruthy();
		});
	});

	it('should have benefits section with points', () => {
		expect(greylistContent.sections.benefits).toBeDefined();
		expect(greylistContent.sections.benefits.title).toBeTruthy();
		expect(Array.isArray(greylistContent.sections.benefits.points)).toBe(true);
		expect(greylistContent.sections.benefits.points.length).toBeGreaterThan(0);
		greylistContent.sections.benefits.points.forEach((item) => {
			expect(item.point).toBeTruthy();
			expect(item.desc).toBeTruthy();
		});
	});

	it('should have drawbacks section with points', () => {
		expect(greylistContent.sections.drawbacks).toBeDefined();
		expect(greylistContent.sections.drawbacks.title).toBeTruthy();
		expect(Array.isArray(greylistContent.sections.drawbacks.points)).toBe(true);
		expect(greylistContent.sections.drawbacks.points.length).toBeGreaterThan(0);
		greylistContent.sections.drawbacks.points.forEach((item) => {
			expect(item.point).toBeTruthy();
			expect(item.desc).toBeTruthy();
		});
	});

	it('should have bestPractices section with practices', () => {
		expect(greylistContent.sections.bestPractices).toBeDefined();
		expect(greylistContent.sections.bestPractices.title).toBeTruthy();
		expect(Array.isArray(greylistContent.sections.bestPractices.practices)).toBe(true);
		expect(greylistContent.sections.bestPractices.practices.length).toBeGreaterThan(0);
		greylistContent.sections.bestPractices.practices.forEach((practice) => {
			expect(typeof practice).toBe('string');
			expect(practice.length).toBeGreaterThan(0);
		});
	});

	it('should have quickTips array', () => {
		expect(Array.isArray(greylistContent.quickTips)).toBe(true);
		expect(greylistContent.quickTips.length).toBeGreaterThan(0);
		greylistContent.quickTips.forEach((tip) => {
			expect(typeof tip).toBe('string');
			expect(tip.length).toBeGreaterThan(0);
		});
	});
});
