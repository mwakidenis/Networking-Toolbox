import { describe, it, expect } from 'vitest';
import { ctLogContent } from '$lib/content/ct-log-search';

describe('CT Log Search Content', () => {
	it('should have title and description', () => {
		expect(ctLogContent.title).toBe('Certificate Transparency Log Search');
		expect(ctLogContent.description).toBeTruthy();
		expect(typeof ctLogContent.description).toBe('string');
	});

	it('should have whatIsCT section', () => {
		expect(ctLogContent.sections.whatIsCT).toBeDefined();
		expect(ctLogContent.sections.whatIsCT.title).toBeTruthy();
		expect(ctLogContent.sections.whatIsCT.content).toBeTruthy();
	});

	it('should have benefits section with array', () => {
		expect(ctLogContent.sections.benefits).toBeDefined();
		expect(ctLogContent.sections.benefits.title).toBeTruthy();
		expect(Array.isArray(ctLogContent.sections.benefits.benefits)).toBe(true);
		expect(ctLogContent.sections.benefits.benefits.length).toBeGreaterThan(0);
		ctLogContent.sections.benefits.benefits.forEach((item) => {
			expect(item.benefit).toBeTruthy();
			expect(item.description).toBeTruthy();
		});
	});

	it('should have useCases section with array', () => {
		expect(ctLogContent.sections.useCases).toBeDefined();
		expect(ctLogContent.sections.useCases.title).toBeTruthy();
		expect(Array.isArray(ctLogContent.sections.useCases.cases)).toBe(true);
		expect(ctLogContent.sections.useCases.cases.length).toBeGreaterThan(0);
		ctLogContent.sections.useCases.cases.forEach((item) => {
			expect(item.useCase).toBeTruthy();
			expect(item.description).toBeTruthy();
			expect(item.example).toBeTruthy();
		});
	});

	it('should have certificateFields section with array', () => {
		expect(ctLogContent.sections.certificateFields).toBeDefined();
		expect(ctLogContent.sections.certificateFields.title).toBeTruthy();
		expect(Array.isArray(ctLogContent.sections.certificateFields.fields)).toBe(true);
		expect(ctLogContent.sections.certificateFields.fields.length).toBeGreaterThan(0);
		ctLogContent.sections.certificateFields.fields.forEach((item) => {
			expect(item.field).toBeTruthy();
			expect(item.description).toBeTruthy();
		});
	});

	it('should have security section with array', () => {
		expect(ctLogContent.sections.security).toBeDefined();
		expect(ctLogContent.sections.security.title).toBeTruthy();
		expect(Array.isArray(ctLogContent.sections.security.points)).toBe(true);
		expect(ctLogContent.sections.security.points.length).toBeGreaterThan(0);
		ctLogContent.sections.security.points.forEach((item) => {
			expect(item.point).toBeTruthy();
			expect(item.description).toBeTruthy();
		});
	});

	it('should have bestPractices section with array', () => {
		expect(ctLogContent.sections.bestPractices).toBeDefined();
		expect(ctLogContent.sections.bestPractices.title).toBeTruthy();
		expect(Array.isArray(ctLogContent.sections.bestPractices.practices)).toBe(true);
		expect(ctLogContent.sections.bestPractices.practices.length).toBeGreaterThan(0);
		ctLogContent.sections.bestPractices.practices.forEach((item) => {
			expect(item.practice).toBeTruthy();
			expect(item.description).toBeTruthy();
		});
	});

	it('should have quickTips array', () => {
		expect(Array.isArray(ctLogContent.quickTips)).toBe(true);
		expect(ctLogContent.quickTips.length).toBeGreaterThan(0);
		ctLogContent.quickTips.forEach((tip) => {
			expect(typeof tip).toBe('string');
			expect(tip.length).toBeGreaterThan(0);
		});
	});
});
