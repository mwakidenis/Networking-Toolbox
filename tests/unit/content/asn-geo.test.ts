import { describe, it, expect } from 'vitest';
import { asnGeoContent } from '$lib/content/asn-geo';

describe('ASN Geo Content', () => {
	it('should have valid structure', () => {
		expect(asnGeoContent).toBeDefined();
		expect(asnGeoContent.title).toBe('ASN & Geolocation Lookup');
		expect(asnGeoContent.description).toBeTruthy();
		expect(asnGeoContent.sections).toBeDefined();
	});

	it('should have all required sections', () => {
		const sections = asnGeoContent.sections;
		expect(sections.whatIsGeoIP).toBeDefined();
		expect(sections.howItWorks).toBeDefined();
		expect(sections.dataProvided).toBeDefined();
		expect(sections.accuracy).toBeDefined();
		expect(sections.useCases).toBeDefined();
		expect(sections.limitations).toBeDefined();
		expect(sections.asnExplained).toBeDefined();
		expect(sections.bestPractices).toBeDefined();
		expect(sections.dataSource).toBeDefined();
	});

	it('should have data provided categories', () => {
		const categories = asnGeoContent.sections.dataProvided.categories;
		expect(categories).toHaveLength(3);
		expect(categories[0].category).toBe('Network Information');
		expect(categories[1].category).toBe('Geographic Location');
		expect(categories[2].category).toBe('Connection Type');
		categories.forEach((cat) => {
			expect(cat.fields).toBeDefined();
			expect(cat.fields.length).toBeGreaterThan(0);
		});
	});

	it('should have accuracy levels', () => {
		const levels = asnGeoContent.sections.accuracy.levels;
		expect(levels).toHaveLength(4);
		expect(levels[0].level).toBe('Country');
		expect(levels[1].level).toBe('Region/State');
		expect(levels[2].level).toBe('City');
		expect(levels[3].level).toBe('Coordinates');
		levels.forEach((level) => {
			expect(level.accuracy).toBeTruthy();
			expect(level.description).toBeTruthy();
		});
	});

	it('should have use cases', () => {
		const cases = asnGeoContent.sections.useCases.cases;
		expect(cases.length).toBeGreaterThan(0);
		cases.forEach((useCase) => {
			expect(useCase.scenario).toBeTruthy();
			expect(useCase.use).toBeTruthy();
			expect(useCase.action).toBeTruthy();
		});
	});

	it('should have limitations', () => {
		const limitations = asnGeoContent.sections.limitations.points;
		expect(limitations.length).toBeGreaterThan(0);
		limitations.forEach((limit) => {
			expect(limit.limitation).toBeTruthy();
			expect(limit.description).toBeTruthy();
		});
	});

	it('should have ASN explained aspects', () => {
		const aspects = asnGeoContent.sections.asnExplained.aspects;
		expect(aspects).toHaveLength(4);
		aspects.forEach((aspect) => {
			expect(aspect.aspect).toBeTruthy();
			expect(aspect.description).toBeTruthy();
			expect(aspect.example).toBeTruthy();
		});
	});

	it('should have best practices', () => {
		const practices = asnGeoContent.sections.bestPractices.practices;
		expect(practices.length).toBeGreaterThan(0);
		practices.forEach((practice) => {
			expect(practice.practice).toBeTruthy();
			expect(practice.description).toBeTruthy();
			expect(practice.reason).toBeTruthy();
		});
	});

	it('should have data source features', () => {
		const features = asnGeoContent.sections.dataSource.features;
		expect(features.length).toBeGreaterThan(0);
		features.forEach((feature) => {
			expect(feature).toBeTruthy();
		});
	});

	it('should have quick tips', () => {
		const tips = asnGeoContent.quickTips;
		expect(tips.length).toBeGreaterThan(0);
		tips.forEach((tip) => {
			expect(tip).toBeTruthy();
		});
	});

	it('should have how it works steps', () => {
		const steps = asnGeoContent.sections.howItWorks.steps;
		expect(steps).toHaveLength(5);
		steps.forEach((step) => {
			expect(step).toBeTruthy();
		});
	});
});
