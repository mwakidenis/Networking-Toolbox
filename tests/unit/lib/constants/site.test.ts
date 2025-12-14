import { describe, it, expect } from 'vitest';
import { site, about, license, author } from '../../../../src/lib/constants/site';

describe('site constants', () => {
  describe('site', () => {
    it('has required properties', () => {
      expect(site).toHaveProperty('name');
      expect(site).toHaveProperty('title');
      expect(site).toHaveProperty('description');
      expect(site).toHaveProperty('url');
    });

    it('has valid string values', () => {
      expect(typeof site.name).toBe('string');
      expect(typeof site.title).toBe('string');
      expect(typeof site.description).toBe('string');
      expect(typeof site.url).toBe('string');

      expect(site.name.length).toBeGreaterThan(0);
      expect(site.title.length).toBeGreaterThan(0);
      expect(site.description.length).toBeGreaterThan(0);
    });

    it('has valid URLs', () => {
      expect(site.url).toMatch(/^https?:\/\//);
      expect(site.image).toMatch(/^https?:\/\//);
      expect(site.repo).toMatch(/^https?:\/\//);
      expect(site.mirror).toMatch(/^https?:\/\//);
      expect(site.docker).toMatch(/^https?:\/\//);
    });

    it('uses customizable settings or defaults', () => {
      expect(site.name).toBeTruthy();
      expect(site.title).toBeTruthy();
      expect(site.heroDescription).toBeTruthy();
    });
  });

  describe('about', () => {
    it('has description lines', () => {
      expect(about).toHaveProperty('line1');
      expect(about).toHaveProperty('line2');

      expect(typeof about.line1).toBe('string');
      expect(typeof about.line2).toBe('string');

      expect(about.line1.length).toBeGreaterThan(0);
      expect(about.line2.length).toBeGreaterThan(0);
    });
  });

  describe('license', () => {
    it('has required license info', () => {
      expect(license).toHaveProperty('name');
      expect(license).toHaveProperty('date');
      expect(license).toHaveProperty('holder');
      expect(license).toHaveProperty('url');
    });

    it('has valid license values', () => {
      expect(license.name).toBe('MIT');
      expect(typeof license.date).toBe('string');
      expect(typeof license.holder).toBe('string');

      expect(license.url).toMatch(/^https?:\/\//);
      expect(license.ref).toMatch(/^https?:\/\//);
      expect(license.tldr).toMatch(/^https?:\/\//);
    });

    it('has valid license year', () => {
      expect(parseInt(license.date)).toBeGreaterThan(2020);
      expect(parseInt(license.date)).toBeLessThan(2100);
    });
  });

  describe('author', () => {
    it('has required author info', () => {
      expect(author).toHaveProperty('name');
      expect(author).toHaveProperty('github');
      expect(author).toHaveProperty('githubUrl');
      expect(author).toHaveProperty('url');
    });

    it('has valid author values', () => {
      expect(typeof author.name).toBe('string');
      expect(author.name.length).toBeGreaterThan(0);

      expect(typeof author.github).toBe('string');
      expect(author.github.length).toBeGreaterThan(0);
    });

    it('has valid author URLs', () => {
      expect(author.githubUrl).toMatch(/^https?:\/\//);
      expect(author.url).toMatch(/^https?:\/\//);
      expect(author.portfolio).toMatch(/^https?:\/\//);
      expect(author.sponsor).toMatch(/^https?:\/\//);
      expect(author.avatar).toMatch(/^https?:\/\//);
    });

    it('has consistent GitHub username', () => {
      expect(author.githubUrl).toContain(author.github);
      expect(author.sponsor).toContain(author.github);
    });
  });
});
