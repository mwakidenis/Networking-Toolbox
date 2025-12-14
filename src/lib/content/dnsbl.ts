export const dnsblContent = {
  title: 'DNS Blacklists (DNSBLs)',
  description:
    'Understanding DNS-based blacklists, how they work, what listings mean, and how to fix blacklist issues.',

  sections: {
    whatAreBlacklists: {
      title: 'What are DNS Blacklists?',
      content: `A DNS Blacklist (DNSBL) or Real-time Blackhole List (RBL) is a database of IP addresses and domains known for sending spam, hosting malware, or other malicious activity. Email servers check these lists before accepting messages.

When you send an email, the receiving server looks up your IP in multiple blacklists. If you're listed, your email might be rejected, delayed, or marked as spam. It's an automated defense against millions of spam messages sent daily.`,
    },

    howChecksWork: {
      title: 'How Blacklist Checks Work',
      content: `Blacklist checks use DNS queries to look up IPs in RBL zones. Here's what happens:

1. Your IP address gets reversed (e.g., 192.0.2.1 becomes 1.2.0.192)
2. The reversed IP is appended to the RBL zone (1.2.0.192.zen.spamhaus.org)
3. A DNS query checks if this hostname exists
4. If it returns an IP (usually in 127.0.0.0/8), you're listed
5. A TXT record might explain why you're listed

The beauty of this system is speed - DNS queries are fast and distributed worldwide.`,
    },

    whyListed: {
      title: 'Why You Might Be Listed',
      content: `There are several reasons an IP or domain ends up on a blacklist:`,
      reasons: [
        {
          reason: 'Sending Spam',
          description: 'Your server sent unsolicited bulk email',
          common: 'Most common cause',
        },
        {
          reason: 'Compromised Server',
          description: 'Your system was hacked and used to send spam',
          common: 'Increasingly common',
        },
        {
          reason: 'Open Relay',
          description: 'Your mail server allows anyone to send email through it',
          common: 'Configuration error',
        },
        {
          reason: 'Poor List Hygiene',
          description: 'Sending to old addresses that are now spam traps',
          common: 'Marketing lists',
        },
        {
          reason: 'Shared IP',
          description: 'Someone else on your shared hosting/VPS got listed',
          common: 'Shared hosting',
        },
        {
          reason: 'ISP Dynamic Range',
          description: "You're on a residential/dynamic IP range (PBL)",
          common: 'Home connections',
        },
        {
          reason: 'Malware Distribution',
          description: 'Hosting or serving malware, phishing sites',
          common: 'Domain blacklists',
        },
      ],
    },

    consequences: {
      title: 'Consequences of Being Listed',
      content: `Getting blacklisted can seriously impact your operations:`,
      impacts: [
        {
          severity: 'Critical',
          impact: 'Email Delivery Failure',
          description: 'Your emails bounce or never arrive. Many servers outright reject mail from listed IPs.',
        },
        {
          severity: 'High',
          impact: 'Spam Folder Delivery',
          description: 'Emails get delivered but go straight to spam folders, drastically reducing open rates.',
        },
        {
          severity: 'Medium',
          impact: 'Reputation Damage',
          description:
            'Being listed signals poor practices. Even after delisting, some damage to sender reputation remains.',
        },
        {
          severity: 'Medium',
          impact: 'Business Disruption',
          description: 'Lost sales, missed communications, customer complaints, and support costs add up quickly.',
        },
        {
          severity: 'Low',
          impact: 'Delayed Delivery',
          description: 'Some servers temporarily defer mail from listed IPs rather than rejecting it outright.',
        },
      ],
    },

    howToFix: {
      title: 'How to Fix a Blacklist',
      content: `Getting delisted requires fixing the root cause first, then requesting removal:`,
      steps: [
        {
          step: '1. Identify the Problem',
          actions: [
            'Check which blacklists have listed you',
            'Read the listing reason in TXT records',
            'Review server logs for spam activity',
            'Check for unauthorized access or compromised accounts',
          ],
        },
        {
          step: '2. Fix the Root Cause',
          actions: [
            'Remove malware and close security holes',
            'Disable open relay and fix mail server config',
            'Change passwords for compromised accounts',
            'Update contact database and remove invalid addresses',
            'Implement proper authentication (SPF, DKIM, DMARC)',
            'Set up monitoring to catch future issues',
          ],
        },
        {
          step: '3. Request Delisting',
          actions: [
            "Visit the blacklist's website (check results for URL)",
            'Submit your IP for removal',
            'Explain what you fixed (if required)',
            'Wait for automated or manual review',
            'Some lists auto-delist after a clean period (24-48 hours)',
          ],
        },
        {
          step: '4. Prevent Future Listings',
          actions: [
            'Monitor sending patterns and bounce rates',
            'Use email authentication (SPF, DKIM, DMARC)',
            'Maintain good list hygiene',
            'Implement rate limiting',
            'Set up alerts for blacklist additions',
            'Keep software updated and secure',
          ],
        },
      ],
    },

    queryWarnings: {
      title: 'Understanding Query Warnings',
      content: `Not all "errors" mean something's wrong with you:`,
      warnings: [
        {
          type: 'Query Timeout',
          meaning: 'The blacklist server took too long to respond (>1 second)',
          action: "Usually temporary. If consistent, the RBL might be having issues or your network can't reach it.",
        },
        {
          type: 'Access Denied / Query Refused',
          meaning: 'The blacklist requires registration or payment for queries',
          action: "Some commercial RBLs (like Barracuda) don't allow public queries. This doesn't mean you're listed.",
        },
        {
          type: 'Open Resolver Blocked',
          meaning: "You're querying from a public DNS resolver they don't allow",
          action: 'Some RBLs block queries from Google DNS, Cloudflare, etc. Query from your mail server instead.',
        },
        {
          type: 'Rate Limited',
          meaning: "You've made too many queries too quickly",
          action: 'Wait a few minutes and try again. Some lists limit free queries to prevent abuse.',
        },
      ],
    },

    majorBlacklists: {
      title: 'Major Blacklists Explained',
      lists: [
        {
          name: 'Spamhaus ZEN',
          type: 'Combined IP list',
          description: 'Combines SBL, XBL, and PBL. The most widely used blacklist by volume.',
          usage: 'Used by major email providers worldwide',
          autoRemoval: 'Usually after 24 hours clean',
          url: 'https://www.spamhaus.org/lookup/',
        },
        {
          name: 'Spamhaus DBL',
          type: 'Domain blacklist',
          description: 'Lists malicious domains used in spam, phishing, and malware.',
          usage: 'Checks domain names in message content and headers',
          autoRemoval: 'Requires manual review',
          url: 'https://www.spamhaus.org/lookup/',
        },
        {
          name: 'Spamhaus PBL',
          type: 'Policy block list',
          description: 'Dynamic/residential IPs that should not send direct mail.',
          usage: "ISP-submitted. You shouldn't be sending from these IPs anyway.",
          autoRemoval: "Requires proper mail setup via ISP's mail server",
          url: 'https://www.spamhaus.org/lookup/',
        },
        {
          name: 'SpamCop',
          type: 'User-reported spam',
          description: 'Based on spam reports from real users and spam traps.',
          usage: 'Automated listing from spam reports',
          autoRemoval: '24 hours after last report',
          url: 'https://www.spamcop.net/bl.shtml',
        },
        {
          name: 'SORBS',
          type: 'Multiple categories',
          description: 'Various lists for spam sources, dynamic IPs, open proxies, etc.',
          usage: 'Different zones for different types of threats',
          autoRemoval: 'Varies by list, some require payment',
          url: 'https://www.sorbs.net/lookup.shtml',
        },
        {
          name: 'UCEPROTECT',
          type: 'Tiered system',
          description: 'Level 1 (single IPs), Level 2 (ISP ranges), Level 3 (countries/ASNs).',
          usage: 'Aggressive listing, Level 2/3 can block innocent users',
          autoRemoval: 'Automatic after 7 days clean',
          url: 'https://www.uceprotect.net/en/rblcheck.php',
        },
        {
          name: 'Barracuda',
          type: 'Commercial reputation',
          description: 'IP reputation system with multiple categories.',
          usage: 'Common in enterprise email security appliances',
          autoRemoval: 'Automatic based on behavior improvement',
          url: 'https://barracudacentral.org/lookups',
        },
        {
          name: 'PSBL',
          type: 'IP blocklist',
          description: 'Passive Spam Block List - catches IPs sending to spam traps.',
          usage: 'Popular with smaller mail servers and ISPs',
          autoRemoval: 'Automatic after 2-4 weeks of inactivity',
          url: 'https://psbl.org/',
        },
        {
          name: 'DroneBL',
          type: 'IP blocklist',
          description: 'Tracks compromised machines, botnets, and proxy abuse.',
          usage: 'Originally for IRC, now used for email and web security',
          autoRemoval: 'Varies by listing type, typically 1-7 days',
          url: 'https://dronebl.org/lookup',
        },
      ],
    },

    bestPractices: {
      title: 'Email Sending Best Practices',
      practices: [
        {
          category: 'Authentication',
          items: [
            'Configure SPF records to authorize sending IPs',
            'Implement DKIM signing for message integrity',
            'Set up DMARC policy for domain protection',
            'Use valid reverse DNS (PTR) records',
          ],
        },
        {
          category: 'Infrastructure',
          items: [
            'Use dedicated IPs for bulk email',
            'Warm up new IPs gradually',
            "Don't send from shared hosting or dynamic IPs",
            'Implement proper retry logic for temporary failures',
          ],
        },
        {
          category: 'List Management',
          items: [
            'Only email people who opted in',
            'Remove bounces and unsubscribes immediately',
            'Avoid purchased or scraped email lists',
            'Monitor engagement and remove inactive subscribers',
          ],
        },
        {
          category: 'Monitoring',
          items: [
            'Check blacklists regularly',
            'Monitor bounce rates and spam complaints',
            'Set up alerts for unusual sending patterns',
            'Track sender reputation scores',
          ],
        },
      ],
    },

    technicalDetails: {
      title: 'Technical Implementation Details',
      details: [
        {
          aspect: 'DNS Query Format',
          explanation: 'IP 192.0.2.1 checked against zen.spamhaus.org becomes query: 1.2.0.192.zen.spamhaus.org',
        },
        {
          aspect: 'Response Codes',
          explanation:
            'Listed IPs typically return 127.0.0.2-127.0.0.255. Different codes indicate different listing reasons.',
        },
        {
          aspect: 'TXT Records',
          explanation: 'Provide human-readable listing reasons and links to delisting forms.',
        },
        {
          aspect: 'IPv6 Support',
          explanation: 'IPv6 addresses are reversed by nibble (hex digit), creating very long DNS names.',
        },
        {
          aspect: 'Caching',
          explanation:
            'DNS caching speeds up checks but can delay delisting visibility. TTLs are usually short (minutes).',
        },
      ],
    },

    myths: {
      title: 'Common Misconceptions',
      myths: [
        {
          myth: 'Being on one blacklist means being on all of them',
          reality: 'Each blacklist has different criteria. You can be listed on some and not others.',
        },
        {
          myth: 'Blacklists are permanent',
          reality: 'Most auto-remove after 24-48 hours of clean behavior. Some require manual delisting.',
        },
        {
          myth: 'Changing your IP fixes everything',
          reality: "If you don't fix the root cause, your new IP will get listed too. Plus it hurts reputation.",
        },
        {
          myth: 'Only spammers get blacklisted',
          reality: 'Legitimate senders get listed too - due to compromises, misconfigurations, or shared IPs.',
        },
        {
          myth: "Small senders don't need to worry",
          reality: 'Even sending a few emails from a blacklisted IP can cause delivery problems.',
        },
      ],
    },
  },

  quickTips: [
    'Check blacklists before they cause problems',
    'Fix the root cause before requesting delisting',
    'Most listings auto-clear within 24-48 hours',
    "Don't panic over query warnings - they're usually not about you",
    'Use authenticated email (SPF, DKIM, DMARC)',
    'Never send from residential/dynamic IPs',
    'Monitor your IPs regularly if you send bulk email',
  ],
};
