export interface SubnetMask {
  cidr: number;
  decimal: string;
  binary: string;
  hosts: number;
  networks: number;
}

export interface SubnettingConcept {
  title: string;
  description: string;
  example?: string;
  icon: string;
}

export interface SubnettingTechnique {
  name: string;
  description: string;
  useCase: string;
  icon: string;
  color: string;
}

export const commonSubnetMasks: SubnetMask[] = [
  { cidr: 8, decimal: '255.0.0.0', binary: '11111111.00000000.00000000.00000000', hosts: 16777214, networks: 1 },
  { cidr: 16, decimal: '255.255.0.0', binary: '11111111.11111111.00000000.00000000', hosts: 65534, networks: 256 },
  { cidr: 24, decimal: '255.255.255.0', binary: '11111111.11111111.11111111.00000000', hosts: 254, networks: 65536 },
  { cidr: 25, decimal: '255.255.255.128', binary: '11111111.11111111.11111111.10000000', hosts: 126, networks: 131072 },
  { cidr: 26, decimal: '255.255.255.192', binary: '11111111.11111111.11111111.11000000', hosts: 62, networks: 262144 },
  { cidr: 27, decimal: '255.255.255.224', binary: '11111111.11111111.11111111.11100000', hosts: 30, networks: 524288 },
  { cidr: 28, decimal: '255.255.255.240', binary: '11111111.11111111.11111111.11110000', hosts: 14, networks: 1048576 },
  { cidr: 29, decimal: '255.255.255.248', binary: '11111111.11111111.11111111.11111000', hosts: 6, networks: 2097152 },
  { cidr: 30, decimal: '255.255.255.252', binary: '11111111.11111111.11111111.11111100', hosts: 2, networks: 4194304 },
];

export const keyConcepts: SubnettingConcept[] = [
  {
    title: 'Network & Host Bits',
    description: 'The subnet mask determines which bits identify the network vs individual hosts',
    example: '/24 = 24 network bits, 8 host bits',
    icon: 'network',
  },
  {
    title: 'CIDR Notation',
    description: 'Shorthand for subnet masks using a slash and number of network bits',
    example: '192.168.1.0/24 instead of 255.255.255.0',
    icon: 'hash',
  },
  {
    title: 'Broadcast Domain',
    description: 'Each subnet creates its own broadcast domain, reducing network congestion',
    icon: 'radio',
  },
  {
    title: 'Subnet Zero & All-Ones',
    description: 'Modern networks can use all subnets including the first and last ones',
    icon: 'check-circle',
  },
];

export const subnettingTechniques: SubnettingTechnique[] = [
  {
    name: 'Fixed-Length Subnetting',
    description: 'All subnets use the same mask size. Simple but can waste addresses.',
    useCase: 'Equal-sized networks, simple designs',
    icon: 'grid',
    color: 'var(--color-primary)',
  },
  {
    name: 'VLSM',
    description: 'Variable-length masks optimize address usage for different subnet sizes.',
    useCase: 'Mixed requirements, address conservation',
    icon: 'layers',
    color: 'var(--color-success)',
  },
  {
    name: 'Supernetting',
    description: 'Combine multiple networks into larger blocks for route aggregation.',
    useCase: 'Route summarization, BGP optimization',
    icon: 'up',
    color: 'var(--color-warning)',
  },
];

export const practicalTips = [
  'Always plan for growth - allocate more addresses than immediately needed',
  'Use /30 networks for point-to-point links to conserve addresses',
  'Document your subnet allocation to prevent overlaps',
  'Consider using private address space (RFC 1918) for internal networks',
  'Plan hierarchically - use summary routes where possible',
];

export const commonMistakes = [
  'Forgetting to account for network and broadcast addresses',
  'Using overlapping subnet ranges',
  'Not planning for future growth',
  'Inconsistent subnet sizing without good reason',
];
