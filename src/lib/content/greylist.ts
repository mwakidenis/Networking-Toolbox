export const greylistContent = {
  title: 'Email Greylisting Tester',
  description:
    'Test if a mail server implements greylisting by performing multiple connection attempts and analyzing rejection patterns',
  sections: {
    whatIsGreylisting: {
      title: 'What is Greylisting?',
      content:
        'Greylisting is an anti-spam technique where a mail server temporarily rejects emails from unknown senders. The sending server is expected to retry delivery after a delay (typically 1-15 minutes). Legitimate mail servers will retry, while many spam sources will not, effectively reducing spam without blocking legitimate mail.',
    },
    howItWorks: {
      title: 'How Greylisting Works',
      steps: [
        {
          step: 'Initial Connection',
          desc: 'First email delivery attempt from unknown sender (triplet: sender IP, sender address, recipient address)',
        },
        {
          step: 'Temporary Rejection',
          desc: 'Server responds with 4xx temporary error code (usually 450 or 451) asking sender to try again later',
        },
        {
          step: 'Retry Period',
          desc: 'Legitimate mail servers wait a specified period (usually 1-15 minutes) before retrying',
        },
        {
          step: 'Acceptance',
          desc: 'After retry delay, server accepts the email and adds triplet to whitelist for future deliveries',
        },
      ],
    },
    smtpCodes: {
      title: 'SMTP Response Codes',
      codes: [
        {
          code: '220',
          name: 'Service Ready',
          desc: 'Server is ready to accept mail - no greylisting active',
        },
        {
          code: '421',
          name: 'Service Not Available',
          desc: 'Server is temporarily unavailable - may indicate greylisting',
        },
        {
          code: '450',
          name: 'Mailbox Unavailable',
          desc: 'Temporary failure - common greylisting response code',
        },
        {
          code: '451',
          name: 'Local Error',
          desc: 'Temporary error processing request - another greylisting indicator',
        },
      ],
    },
    testingStrategy: {
      title: 'Testing Strategy',
      content:
        'This tool performs multiple SMTP connection attempts separated by configurable delays. It analyzes response codes and messages to determine if greylisting is implemented. A typical greylisting pattern shows initial rejection (4xx codes) followed by acceptance (220) after a delay.',
    },
    confidenceLevels: {
      title: 'Confidence Levels',
      levels: [
        {
          level: 'High',
          desc: 'Explicit greylisting keywords in response + subsequent acceptance after delay',
        },
        {
          level: 'Medium',
          desc: 'Temporary rejection codes (450/451) + subsequent acceptance',
        },
        {
          level: 'Low',
          desc: 'Inconsistent behavior or unclear rejection pattern',
        },
        {
          level: 'None',
          desc: 'No greylisting detected - consistent acceptance or rejection',
        },
      ],
    },
    benefits: {
      title: 'Benefits of Greylisting',
      points: [
        {
          point: 'Spam Reduction',
          desc: 'Blocks 50-90% of spam without false positives, as most spam sources do not retry',
        },
        {
          point: 'Resource Efficient',
          desc: 'Minimal server resources required compared to content filtering',
        },
        {
          point: 'No False Positives',
          desc: 'Legitimate mail is always delivered, just with a slight delay',
        },
        {
          point: 'Compliant',
          desc: 'Works within SMTP RFC standards - temporary rejection is expected behavior',
        },
      ],
    },
    drawbacks: {
      title: 'Drawbacks of Greylisting',
      points: [
        {
          point: 'Delivery Delay',
          desc: 'Initial emails from new senders are delayed by 1-15 minutes',
        },
        {
          point: 'Time-Sensitive Issues',
          desc: 'Can cause problems with password resets, verification codes, and urgent communications',
        },
        {
          point: 'Legitimate Failures',
          desc: 'Some legitimate mail servers or services may not retry properly',
        },
        {
          point: 'Resource Usage',
          desc: 'Requires database to track triplets and manage whitelist',
        },
      ],
    },
    bestPractices: {
      title: 'Best Practices',
      practices: [
        'Use shorter retry delays (1-5 minutes) to minimize user impact',
        'Implement automatic whitelisting of known good servers',
        'Provide bypass mechanisms for time-sensitive emails',
        'Combine with SPF, DKIM, and DMARC for better protection',
        'Monitor false positive rates and adjust policies accordingly',
        'Whitelist common email services (Gmail, Outlook, etc.) to reduce delays',
      ],
    },
  },
  quickTips: [
    'Greylisting typically delays first-time emails by 1-15 minutes',
    'Look for SMTP codes 450 or 451 as indicators of greylisting',
    'Most greylisting implementations whitelist senders after successful retry',
    'Greylisting is most effective when combined with other anti-spam measures',
    'Some mail servers use adaptive greylisting that adjusts based on sender reputation',
  ],
};
