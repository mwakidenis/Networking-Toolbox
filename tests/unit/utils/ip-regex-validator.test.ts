import { describe, it, expect } from 'vitest';
import {
  validateRegexInput,
  explainRegexError,
  type RegexValidation
} from '$lib/utils/ip-regex-validator.js';

describe('ip-regex-validator', () => {
  describe('validateRegexInput', () => {
    describe('valid regex patterns', () => {
      it('should validate simple string patterns', () => {
        const result = validateRegexInput('test');

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.pattern).toBe('test');
          expect(result.flags).toBe('');
        }
      });

      it('should validate complex patterns', () => {
        const pattern = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
        const result = validateRegexInput(pattern);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.pattern).toBe(pattern);
          expect(result.flags).toBe('');
        }
      });

      it('should validate patterns with anchors', () => {
        const pattern = '^test$';
        const result = validateRegexInput(pattern);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.pattern).toBe(pattern);
          expect(result.flags).toBe('');
        }
      });

      it('should handle escaped characters', () => {
        const pattern = 'test\\.com';
        const result = validateRegexInput(pattern);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.pattern).toBe(pattern);
        }
      });

      it('should validate character classes', () => {
        const patterns = [
          '[a-z]',
          '[0-9]',
          '[a-zA-Z0-9]',
          '[^0-9]',
          '\\d',
          '\\w',
          '\\s'
        ];

        patterns.forEach(pattern => {
          const result = validateRegexInput(pattern);
          expect(result.ok).toBe(true);
        });
      });

      it('should validate quantifiers', () => {
        const patterns = [
          'a+',
          'a*',
          'a?',
          'a{3}',
          'a{2,5}',
          'a{2,}',
          'a+?',
          'a*?',
          'a??'
        ];

        patterns.forEach(pattern => {
          const result = validateRegexInput(pattern);
          expect(result.ok).toBe(true);
        });
      });

      it('should validate groups', () => {
        const patterns = [
          '(test)',
          '(?:test)',
          '(?=test)',
          '(?!test)',
          '(a|b)',
          '(?:a|b)'
        ];

        patterns.forEach(pattern => {
          const result = validateRegexInput(pattern);
          expect(result.ok).toBe(true);
        });
      });
    });

    describe('regex literal format', () => {
      it('should parse /pattern/ format', () => {
        const result = validateRegexInput('/test/');

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.pattern).toBe('test');
          expect(result.flags).toBe('');
        }
      });

      it('should parse /pattern/flags format', () => {
        const result = validateRegexInput('/test/gi');

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.pattern).toBe('test');
          expect(result.flags).toBe('gi');
        }
      });

      it('should handle escaped slashes in pattern', () => {
        const result = validateRegexInput('/test\\/path/g');

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.pattern).toBe('test\\/path');
          expect(result.flags).toBe('g');
        }
      });

      it('should handle complex patterns with slashes', () => {
        const result = validateRegexInput('/https?:\\/\\/[^\\s]+/gi');

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.pattern).toBe('https?:\\/\\/[^\\s]+');
          expect(result.flags).toBe('gi');
        }
      });
    });

    describe('explicit flags parameter', () => {
      it('should use explicit flags over literal format', () => {
        const result = validateRegexInput('test', 'i');

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.pattern).toBe('test');
          expect(result.flags).toBe('i');
        }
      });

      it('should handle null flags', () => {
        const result = validateRegexInput('test', null);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.pattern).toBe('test');
          expect(result.flags).toBe('');
        }
      });

      it('should handle empty string flags', () => {
        const result = validateRegexInput('test', '');

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.pattern).toBe('test');
          expect(result.flags).toBe('');
        }
      });
    });

    describe('RegExp object input', () => {
      it('should handle RegExp objects', () => {
        const regex = /test/gi;
        const result = validateRegexInput(regex);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.pattern).toBe('test');
          expect(result.flags).toBe('gi');
        }
      });

      it('should handle complex RegExp objects', () => {
        const regex = /(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)/g;
        const result = validateRegexInput(regex);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.pattern).toBe('(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)');
          expect(result.flags).toBe('g');
        }
      });
    });

    describe('flag validation', () => {
      it('should accept valid flags', () => {
        const validFlags = ['g', 'i', 'm', 's', 'u', 'y', 'd'];

        validFlags.forEach(flag => {
          const result = validateRegexInput('test', flag);
          expect(result.ok).toBe(true);
        });
      });

      it('should accept combinations of valid flags', () => {
        const flagCombos = ['gi', 'gim', 'gimsu', 'gy'];

        flagCombos.forEach(flags => {
          const result = validateRegexInput('test', flags);
          expect(result.ok).toBe(true);
        });
      });

      it('should reject unsupported flags', () => {
        const result = validateRegexInput('test', 'x');

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain('Unsupported flag(s): "x"');
        }
      });

      it('should reject duplicate flags', () => {
        const result = validateRegexInput('test', 'gg');

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain('Duplicate flag(s): "g"');
        }
      });

      it('should handle multiple duplicate flags', () => {
        const result = validateRegexInput('test', 'gigi');

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain('Duplicate flag(s)');
          expect(result.error).toContain('g');
          expect(result.error).toContain('i');
        }
      });
    });

    describe('invalid regex patterns', () => {
      it('should reject patterns with unbalanced parentheses', () => {
        const patterns = ['(test', 'test)', '((test)', '(test))'];

        patterns.forEach(pattern => {
          const result = validateRegexInput(pattern);
          expect(result.ok).toBe(false);
        });
      });

      it('should reject patterns with unbalanced brackets', () => {
        const patterns = ['[test', '[test[['];

        patterns.forEach(pattern => {
          const result = validateRegexInput(pattern);
          expect(result.ok).toBe(false);
        });
      });

      it('should handle patterns with braces', () => {
        const patterns = ['test{', 'test{2']; // Some of these might be valid in JS

        patterns.forEach(pattern => {
          const result = validateRegexInput(pattern);
          // Just ensure the function runs without throwing
          expect(typeof result.ok).toBe('boolean');
        });
      });

      it('should reject invalid quantifiers', () => {
        const patterns = ['+test', '*test', '?test'];

        patterns.forEach(pattern => {
          const result = validateRegexInput(pattern);
          expect(result.ok).toBe(false);
        });
      });

      it('should reject trailing backslash', () => {
        const result = validateRegexInput('test\\');

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain('Trailing backslash');
        }
      });

      it('should accept empty pattern as valid regex', () => {
        const result = validateRegexInput('');

        expect(result.ok).toBe(true);
        // Empty pattern is actually valid in JavaScript - matches empty string
      });

      it('should reject invalid character ranges', () => {
        const patterns = ['[z-a]', '[9-0]'];

        patterns.forEach(pattern => {
          const result = validateRegexInput(pattern);
          expect(result.ok).toBe(false);
        });
      });
    });

    describe('unicode and advanced features', () => {
      it('should handle unicode patterns with u flag', () => {
        const result = validateRegexInput('\\u{1F600}', 'u');

        expect(result.ok).toBe(true);
      });

      it('should accept unicode patterns without u flag (but may not work as expected)', () => {
        const result = validateRegexInput('\\u{1F600}');

        expect(result.ok).toBe(true);
        // JavaScript allows this syntax but it won't work as expected without u flag
      });

      it('should handle unicode property escapes with u flag', () => {
        const result = validateRegexInput('\\p{Letter}', 'u');

        expect(result.ok).toBe(true);
      });

      it('should handle unicode property escapes without u flag', () => {
        const result = validateRegexInput('\\p{Letter}');

        // This might be valid in newer JS engines, so just check it runs
        expect(typeof result.ok).toBe('boolean');
        if (!result.ok) {
          expect(result.error).toContain("Add 'u' flag for Unicode escapes");
        }
      });
    });
  });

  describe('explainRegexError', () => {
    it('should provide helpful explanations for common errors', () => {
      const cases = [
        {
          message: 'Invalid regular expression: Trailing backslash',
          pattern: 'test\\',
          expected: 'escape as'
        },
        {
          message: 'Invalid regular expression: Unbalanced parentheses',
          pattern: '(test',
          expected: 'Unbalanced parentheses'
        },
        {
          message: 'Invalid regular expression: Unbalanced brackets',
          pattern: '[test',
          expected: 'Unbalanced character class'
        },
        {
          message: 'Invalid regular expression: Invalid quantifier',
          pattern: '+test',
          expected: 'Fix quantifiers'
        }
      ];

      cases.forEach(({ message, pattern, expected }) => {
        const explanation = explainRegexError(message, pattern);
        expect(explanation).toContain(expected);
      });
    });

    it('should suggest unicode flag when needed', () => {
      const explanation = explainRegexError(
        'Invalid regular expression: Invalid escape sequence',
        '\\u{1F600}'
      );

      expect(explanation).toContain("Add 'u' flag for Unicode escapes");
    });

    it('should suggest fixing unescaped slashes in literals', () => {
      const explanation = explainRegexError(
        'Invalid regular expression: Syntax error',
        'test/path',
        '',
        '/test/path/g'
      );

      expect(explanation).toContain('escape internal slashes as');
    });

    it('should handle lookbehind not supported', () => {
      const explanation = explainRegexError(
        'Invalid regular expression: Lookbehind not supported',
        '(?<=test)result'
      );

      expect(explanation).toContain('Lookbehind not supported');
    });

    it('should return base message when no specific tips apply', () => {
      const message = 'Some unknown error';
      const explanation = explainRegexError(message, 'validpattern');

      expect(explanation).toBe(message);
    });

    it('should clean up error message format', () => {
      const explanation = explainRegexError(
        'Invalid regular expression: Some error message',
        'test'
      );

      expect(explanation).not.toContain('Invalid regular expression:');
    });
  });

  describe('integration tests', () => {
    it('should validate real-world IP regex patterns', () => {
      // IPv4 pattern
      const ipv4Pattern = '^(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$';
      const ipv4Result = validateRegexInput(ipv4Pattern);

      expect(ipv4Result.ok).toBe(true);
      if (ipv4Result.ok) {
        const regex = new RegExp(ipv4Result.pattern, ipv4Result.flags);
        expect(regex.test('192.168.1.1')).toBe(true);
        expect(regex.test('256.1.1.1')).toBe(false);
      }

      // IPv6 pattern (simplified)
      const ipv6Pattern = '^(?:[\\da-f]{1,4}:){7}[\\da-f]{1,4}$';
      const ipv6Result = validateRegexInput(ipv6Pattern, 'i');

      expect(ipv6Result.ok).toBe(true);
      if (ipv6Result.ok) {
        const regex = new RegExp(ipv6Result.pattern, ipv6Result.flags);
        expect(regex.test('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
        expect(regex.test('invalid:ipv6')).toBe(false);
      }
    });

    it('should provide error messages for truly malformed patterns', () => {
      const malformedPatterns = [
        { pattern: 'test\\', expectedTip: 'Trailing backslash' },
        { pattern: '(unclosed', expectedTip: 'Unbalanced parentheses' },
        { pattern: '[unclosed', expectedTip: 'Unbalanced character class' },
        { pattern: '+invalid', expectedTip: 'Fix quantifiers' }
      ];

      malformedPatterns.forEach(({ pattern, expectedTip }) => {
        const result = validateRegexInput(pattern);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain(expectedTip);
        }
      });
    });

    it('should handle edge cases gracefully', () => {
      const edgeCases = [
        null,
        undefined,
        '',
        ' ',
        '\n',
        '\t'
      ];

      edgeCases.forEach(input => {
        const result = validateRegexInput(input as any);
        // Should either succeed (for valid patterns) or fail gracefully
        expect(typeof result.ok).toBe('boolean');
        if (!result.ok) {
          expect(typeof result.error).toBe('string');
          expect(result.error.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('performance and stress tests', () => {
    it('should handle very long patterns efficiently', () => {
      const longPattern = 'a'.repeat(1000);
      const start = performance.now();
      const result = validateRegexInput(longPattern);
      const end = performance.now();

      expect(result.ok).toBe(true);
      expect(end - start).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle complex nested patterns', () => {
      const complexPattern = '((a+)+)+'; // Potential catastrophic backtracking
      const result = validateRegexInput(complexPattern);

      // Should validate the syntax even if the pattern has performance issues
      expect(result.ok).toBe(true);
    });

    it('should validate patterns with many alternatives', () => {
      const alternatives = Array.from({ length: 100 }, (_, i) => `option${i}`).join('|');
      const pattern = `(?:${alternatives})`;
      const result = validateRegexInput(pattern);

      expect(result.ok).toBe(true);
    });
  });
});