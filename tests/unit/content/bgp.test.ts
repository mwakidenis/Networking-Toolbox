import { describe, it, expect } from 'vitest';
import { bgpContent } from '$lib/content/bgp';

describe('BGP Content', () => {
	it('should have valid structure', () => {
		expect(bgpContent).toBeDefined();
		expect(bgpContent.title).toBeDefined();
		expect(bgpContent.description).toBeDefined();
		expect(bgpContent.sections).toBeDefined();
	});

	it('should have all required sections', () => {
		expect(bgpContent.sections.whatIsBGP).toBeDefined();
		expect(bgpContent.sections.howItWorks).toBeDefined();
		expect(bgpContent.sections.asNumbers).toBeDefined();
		expect(bgpContent.sections.asPath).toBeDefined();
		expect(bgpContent.sections.routeTypes).toBeDefined();
		expect(bgpContent.sections.useCases).toBeDefined();
		expect(bgpContent.sections.interpretingResults).toBeDefined();
		expect(bgpContent.sections.commonIssues).toBeDefined();
		expect(bgpContent.sections.bestPractices).toBeDefined();
		expect(bgpContent.sections.dataSource).toBeDefined();
	});

	it('should have AS number ranges with required fields', () => {
		expect(bgpContent.sections.asNumbers.ranges).toBeInstanceOf(Array);
		expect(bgpContent.sections.asNumbers.ranges.length).toBeGreaterThan(0);

		bgpContent.sections.asNumbers.ranges.forEach((range) => {
			expect(range.range).toBeDefined();
			expect(range.type).toBeDefined();
			expect(range.description).toBeDefined();
		});
	});

	it('should have AS path attributes', () => {
		expect(bgpContent.sections.asPath.attributes).toBeInstanceOf(Array);
		expect(bgpContent.sections.asPath.attributes.length).toBeGreaterThan(0);

		bgpContent.sections.asPath.attributes.forEach((attr) => {
			expect(attr.name).toBeDefined();
			expect(attr.description).toBeDefined();
		});
	});

	it('should have route types with all fields', () => {
		expect(bgpContent.sections.routeTypes.types).toBeInstanceOf(Array);
		expect(bgpContent.sections.routeTypes.types.length).toBeGreaterThan(0);

		bgpContent.sections.routeTypes.types.forEach((type) => {
			expect(type.type).toBeDefined();
			expect(type.description).toBeDefined();
			expect(type.indicator).toBeDefined();
		});
	});

	it('should have use cases', () => {
		expect(bgpContent.sections.useCases.cases).toBeInstanceOf(Array);
		expect(bgpContent.sections.useCases.cases.length).toBeGreaterThan(0);

		bgpContent.sections.useCases.cases.forEach((useCase) => {
			expect(useCase.scenario).toBeDefined();
			expect(useCase.use).toBeDefined();
			expect(useCase.action).toBeDefined();
		});
	});

	it('should have interpreting results elements', () => {
		expect(bgpContent.sections.interpretingResults.elements).toBeInstanceOf(Array);
		expect(bgpContent.sections.interpretingResults.elements.length).toBeGreaterThan(0);

		bgpContent.sections.interpretingResults.elements.forEach((element) => {
			expect(element.element).toBeDefined();
			expect(element.description).toBeDefined();
			expect(element.example).toBeDefined();
		});
	});

	it('should have common issues with impact and detection', () => {
		expect(bgpContent.sections.commonIssues.issues).toBeInstanceOf(Array);
		expect(bgpContent.sections.commonIssues.issues.length).toBeGreaterThan(0);

		bgpContent.sections.commonIssues.issues.forEach((issue) => {
			expect(issue.issue).toBeDefined();
			expect(issue.description).toBeDefined();
			expect(issue.impact).toBeDefined();
			expect(issue.detection).toBeDefined();
		});
	});

	it('should have best practices', () => {
		expect(bgpContent.sections.bestPractices.practices).toBeInstanceOf(Array);
		expect(bgpContent.sections.bestPractices.practices.length).toBeGreaterThan(0);

		bgpContent.sections.bestPractices.practices.forEach((practice) => {
			expect(practice.practice).toBeDefined();
			expect(practice.description).toBeDefined();
			expect(practice.reason).toBeDefined();
		});
	});

	it('should have data source features', () => {
		expect(bgpContent.sections.dataSource.features).toBeInstanceOf(Array);
		expect(bgpContent.sections.dataSource.features.length).toBeGreaterThan(0);

		bgpContent.sections.dataSource.features.forEach((feature) => {
			expect(typeof feature).toBe('string');
			expect(feature.length).toBeGreaterThan(0);
		});
	});

	it('should have quick tips array', () => {
		expect(bgpContent.quickTips).toBeInstanceOf(Array);
		expect(bgpContent.quickTips.length).toBeGreaterThan(0);

		bgpContent.quickTips.forEach((tip) => {
			expect(typeof tip).toBe('string');
			expect(tip.length).toBeGreaterThan(0);
		});
	});

	it('should have howItWorks steps', () => {
		expect(bgpContent.sections.howItWorks.steps).toBeInstanceOf(Array);
		expect(bgpContent.sections.howItWorks.steps.length).toBeGreaterThan(0);

		bgpContent.sections.howItWorks.steps.forEach((step) => {
			expect(typeof step).toBe('string');
			expect(step.length).toBeGreaterThan(0);
		});
	});
});
