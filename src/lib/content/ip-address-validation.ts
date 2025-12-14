export const ipAddressValidationContent = {
  title: 'IP Address Format & RegEx Validation',
  description:
    'Understanding IPv4 and IPv6 address formats and how to validate them properly using regular expressions.',

  sections: {
    overview: {
      title: 'Understanding IP Address Formats',
      content: `IP addresses come in two versions: IPv4 (32-bit) and IPv6 (128-bit). Each has specific formatting rules that programmers need to understand for proper validation.

The key to validation is understanding the structure, not just pattern matching. RegEx can help with basic format checking, but proper IP validation often requires additional logic.`,
    },

    ipv4: {
      title: 'IPv4 Address Format',
      content: `IPv4 addresses consist of four decimal numbers (0-255) separated by dots.

**Structure:** X.X.X.X where each X is 0-255
**Examples:** 192.168.1.1, 10.0.0.1, 127.0.0.1

**Key Rules:**
• Each octet ranges from 0 to 255
• Leading zeros are typically not allowed (001.002.003.004)
• All four octets are required

**Common Validation Mistakes:**
• Allowing values > 255 (like 256.1.1.1)
• Missing boundary checks
• Not handling edge cases like 0.0.0.0`,
    },

    ipv6: {
      title: 'IPv6 Address Format',
      content: `IPv6 addresses are 128-bit addresses written as eight groups of four hexadecimal digits, separated by colons.

**Full Format:** 2001:0db8:85a3:0000:0000:8a2e:0370:7334
**Compressed:** 2001:db8:85a3::8a2e:370:7334 (:: replaces consecutive zeros)

**Key Rules:**
• Eight groups of 1-4 hex digits (0-9, a-f, A-F)
• Leading zeros can be omitted in each group
• Consecutive zero groups can be replaced with :: (only once per address)
• Case insensitive

**Special Cases:**
• :: (all zeros address)
• ::1 (loopback)
• IPv4-mapped: ::ffff:192.168.1.1`,
    },

    regexValidation: {
      title: 'RegEx Validation Approach',
      content: `Regular expressions can handle basic format validation, but IP validation has nuances that make pure RegEx challenging.

**IPv4 RegEx Challenges:**
• Simple patterns like \\d+\\.\\d+\\.\\d+\\.\\d+ don't check ranges
• Proper range validation (0-255) requires complex patterns
• Leading zero handling varies by use case

**IPv6 RegEx Challenges:**
• Multiple valid representations of the same address
• Compression rules (:: usage)
• Mixed IPv4/IPv6 notation support

**Best Practice:**
Use RegEx for initial format checking, then validate with programming logic for range checks and special cases. Most languages have built-in IP parsing functions that handle edge cases correctly.`,
    },

    practicalTips: {
      title: 'Practical Validation Tips',
      content: `**For Production Code:**
1. Use language built-ins (inet_aton, IPAddress.parse, etc.)
2. RegEx for quick format checks only
3. Always validate ranges programmatically
4. Consider your use case (strict vs lenient parsing)

**For Learning/Testing:**
1. Start with basic patterns
2. Add complexity gradually
3. Test edge cases thoroughly
4. Compare with known-good implementations

**Common Gotchas:**
• 192.168.1.01 (leading zeros)
• 192.168.1 (missing octets)
• 192.168.1.1.1 (extra octets)
• Case sensitivity in IPv6
• Multiple :: in IPv6`,
    },
  },

  examples: {
    ipv4Basic: {
      title: 'Basic IPv4 Pattern',
      pattern: '^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$',
      description: "Matches basic dot-decimal format, but doesn't validate ranges",
      matches: ['192.168.1.1', '10.0.0.1'],
      fails: ['192.168.1', '192.168.1.1.1'],
      limitation: 'Allows invalid ranges like 999.999.999.999',
    },

    ipv4Proper: {
      title: 'Range-Validated IPv4',
      pattern:
        '^(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$',
      description: 'Validates each octet is 0-255',
      matches: ['192.168.1.1', '255.255.255.255', '0.0.0.0'],
      fails: ['256.1.1.1', '192.168.1', '192.168.01.1'],
      limitation: 'Complex and hard to maintain',
    },

    ipv6Basic: {
      title: 'Basic IPv6 Pattern',
      pattern: '^[0-9a-fA-F:]+$',
      description: 'Very basic check for hex digits and colons',
      matches: ['2001:db8::1', '::1'],
      fails: ['192.168.1.1', 'hello'],
      limitation: "Doesn't validate structure or compression rules",
    },
  },

  recommendations: [
    {
      icon: 'code',
      title: 'Use Built-in Functions',
      description: 'Most languages have reliable IP parsing libraries. Use them instead of rolling your own RegEx.',
      color: 'var(--color-success)',
    },
    {
      icon: 'test',
      title: 'Test Edge Cases',
      description: 'Test boundary values, malformed inputs, and different valid representations.',
      color: 'var(--color-info)',
    },
    {
      icon: 'performance',
      title: 'Consider Performance',
      description: 'Complex RegEx patterns can be slow. Profile your validation code with realistic data.',
      color: 'var(--color-warning)',
    },
    {
      icon: 'security',
      title: 'Validate Context',
      description: "Consider what you're doing with the IP. Some contexts require stricter validation than others.",
      color: 'var(--color-primary)',
    },
  ],
};
