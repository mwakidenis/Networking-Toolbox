export const setOperationsContent = {
  title: 'Set Operations Reference',
  description:
    'Mathematical set operations allow you to combine, analyze, and manipulate IP address ranges systematically. Each operation serves different network analysis and management purposes.',

  operations: [
    {
      symbol: 'A ∪ B',
      name: 'Union',
      description:
        'Combines all addresses from both sets. Results in addresses that are in A OR B. Useful for merging address allocations or creating comprehensive allow-lists.',
      example: '192.168.1.0/24 ∪ 192.168.2.0/24 = both networks',
    },
    {
      symbol: 'A ∩ B',
      name: 'Intersection',
      description:
        'Finds common addresses between sets. Results in addresses that are in BOTH A AND B. Essential for identifying conflicts or overlapping allocations.',
      example: '192.168.0.0/16 ∩ 192.168.1.0/24 = 192.168.1.0/24',
    },
    {
      symbol: 'A - B',
      name: 'Difference',
      description:
        "Removes B's addresses from A. Results in addresses that are in A but NOT in B. Critical for calculating remaining capacity or excluding reserved ranges.",
      example: '192.168.1.0/24 - 192.168.1.128/25 = 192.168.1.0/25',
    },
    {
      symbol: 'A ⊆ B',
      name: 'Containment',
      description:
        'Tests if A is completely contained within B. Returns boolean result plus coverage analysis. Valuable for validating subnet hierarchies and allocation compliance.',
      example: '192.168.1.0/25 ⊆ 192.168.1.0/24 = true',
    },
  ],

  patterns: [
    {
      icon: 'shield',
      title: 'Firewall Management',
      items: [
        { term: 'Allow Lists', description: 'Union of trusted networks' },
        { term: 'Conflicts', description: 'Intersection of allow/deny rules' },
        { term: 'Exceptions', description: 'Difference to exclude specific ranges' },
      ],
    },
    {
      icon: 'server',
      title: 'IP Allocation',
      items: [
        { term: 'Available Space', description: 'Difference from allocated ranges' },
        { term: 'Overlaps', description: 'Intersection of allocation requests' },
        { term: 'Validation', description: 'Containment within authorized blocks' },
      ],
    },
    {
      icon: 'supernet-calculator',
      title: 'Network Analysis',
      items: [
        { term: 'Coverage', description: 'Union of monitoring ranges' },
        { term: 'Gaps', description: 'Difference to find unmonitored areas' },
        { term: 'Redundancy', description: 'Intersection of backup networks' },
      ],
    },
    {
      icon: 'ip-validator',
      title: 'Cloud Networks',
      items: [
        { term: 'VPC Planning', description: 'Union of required address space' },
        { term: 'Peering', description: 'Intersection analysis for conflicts' },
        { term: 'Segmentation', description: 'Difference for isolation' },
      ],
    },
  ],

  notes: [
    {
      title: 'IPv4 vs IPv6',
      content:
        'All operations process IPv4 and IPv6 addresses separately. You cannot perform set operations between different IP versions - they operate in distinct address spaces.',
    },
    {
      title: 'CIDR Optimization',
      content:
        'Results are automatically optimized into minimal CIDR representations. Complex operations may require multiple CIDR blocks to exactly represent the result.',
    },
    {
      title: 'Range Normalization',
      content:
        'Input ranges are normalized and merged before operations. Overlapping inputs within the same set are automatically combined for accurate results.',
    },
    {
      title: 'Performance Considerations',
      content:
        'Operations are optimized for network-sized ranges. Very large address spaces or numerous small ranges may require additional processing time.',
    },
  ],

  bestPractices: [
    { term: 'Validate Inputs', description: 'Always verify CIDR notation and IP formats before operations' },
    { term: 'Document Operations', description: 'Export results and maintain records of set operations' },
    { term: 'Test in Stages', description: 'For complex operations, break into smaller steps for verification' },
    { term: 'Monitor Results', description: 'Use visualization to verify operations produce expected outcomes' },
  ],
};
