import { describe, it, expect } from 'vitest';
import { mailTLSContent } from '$lib/content/mail-tls';

describe('Mail TLS Content', () => {
	it('should have title and description', () => {
		expect(mailTLSContent.title).toBe('SMTP TLS/STARTTLS Checker');
		expect(mailTLSContent.description).toBeTruthy();
		expect(typeof mailTLSContent.description).toBe('string');
	});

	it('should have whatIsTLS section', () => {
		expect(mailTLSContent.sections.whatIsTLS).toBeDefined();
		expect(mailTLSContent.sections.whatIsTLS.title).toBeTruthy();
		expect(mailTLSContent.sections.whatIsTLS.content).toBeTruthy();
	});

	it('should have portInfo section with array', () => {
		expect(mailTLSContent.sections.portInfo).toBeDefined();
		expect(mailTLSContent.sections.portInfo.title).toBeTruthy();
		expect(Array.isArray(mailTLSContent.sections.portInfo.ports)).toBe(true);
		expect(mailTLSContent.sections.portInfo.ports.length).toBeGreaterThan(0);
		mailTLSContent.sections.portInfo.ports.forEach((item) => {
			expect(item.port).toBeTruthy();
			expect(item.name).toBeTruthy();
			expect(item.desc).toBeTruthy();
			expect(item.security).toBeTruthy();
		});
	});

	it('should have tlsTypes section with array', () => {
		expect(mailTLSContent.sections.tlsTypes).toBeDefined();
		expect(mailTLSContent.sections.tlsTypes.title).toBeTruthy();
		expect(Array.isArray(mailTLSContent.sections.tlsTypes.types)).toBe(true);
		expect(mailTLSContent.sections.tlsTypes.types.length).toBeGreaterThan(0);
		mailTLSContent.sections.tlsTypes.types.forEach((item) => {
			expect(item.name).toBeTruthy();
			expect(item.desc).toBeTruthy();
			expect(item.ports).toBeTruthy();
		});
	});

	it('should have certificateFields section with array', () => {
		expect(mailTLSContent.sections.certificateFields).toBeDefined();
		expect(mailTLSContent.sections.certificateFields.title).toBeTruthy();
		expect(Array.isArray(mailTLSContent.sections.certificateFields.fields)).toBe(true);
		expect(mailTLSContent.sections.certificateFields.fields.length).toBeGreaterThan(0);
		mailTLSContent.sections.certificateFields.fields.forEach((item) => {
			expect(item.field).toBeTruthy();
			expect(item.desc).toBeTruthy();
		});
	});

	it('should have security section with array', () => {
		expect(mailTLSContent.sections.security).toBeDefined();
		expect(mailTLSContent.sections.security.title).toBeTruthy();
		expect(Array.isArray(mailTLSContent.sections.security.points)).toBe(true);
		expect(mailTLSContent.sections.security.points.length).toBeGreaterThan(0);
		mailTLSContent.sections.security.points.forEach((item) => {
			expect(item.point).toBeTruthy();
			expect(item.desc).toBeTruthy();
		});
	});

	it('should have troubleshooting section with array', () => {
		expect(mailTLSContent.sections.troubleshooting).toBeDefined();
		expect(mailTLSContent.sections.troubleshooting.title).toBeTruthy();
		expect(Array.isArray(mailTLSContent.sections.troubleshooting.issues)).toBe(true);
		expect(mailTLSContent.sections.troubleshooting.issues.length).toBeGreaterThan(0);
		mailTLSContent.sections.troubleshooting.issues.forEach((item) => {
			expect(item.issue).toBeTruthy();
			expect(item.solution).toBeTruthy();
		});
	});

	it('should have quickTips array', () => {
		expect(Array.isArray(mailTLSContent.quickTips)).toBe(true);
		expect(mailTLSContent.quickTips.length).toBeGreaterThan(0);
		mailTLSContent.quickTips.forEach((tip) => {
			expect(typeof tip).toBe('string');
			expect(tip.length).toBeGreaterThan(0);
		});
	});
});
