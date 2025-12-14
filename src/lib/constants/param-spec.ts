export type Field = (typeof fieldOptionsArray)[number]['type'];

export interface FieldOption {
  type: Field;
  label: string;
  regex?: RegExp;
  example: string;
  explanation: string;
}

export const fieldOptionsArray = [
  {
    type: 'ipv4',
    label: 'IPv4 Address',
    example: '3.33.130.190',
    explanation: 'A single IPv4 address (dotted decimal, 0-255 per octet)',
  },
  {
    type: 'ipv6',
    label: 'IPv6 Address',
    example: '2001:db8::1',
    explanation: 'A single IPv6 address (supports zero-compression like ::)',
  },
  {
    type: 'ipv4-cidr',
    label: 'IPv4 CIDR Notation',
    example: '192.168.1.0/24',
    explanation: 'IPv4 address followed by a slash and prefix length',
  },
  {
    type: 'ipv6-cidr',
    label: 'IPv6 CIDR Notation',
    example: '2001:db8::/64',
    explanation: 'IPv6 address followed by a slash and prefix length',
  },
  {
    type: 'ipv4-range',
    label: 'Continuous IPv4 range',
    example: '192.168.1.10-192.168.1.20',
    explanation: 'Inclusive start-end range of IPv4 addresses (same address family)',
  },
  {
    type: 'ipv6-range',
    label: 'Continuous IPv6 range',
    example: '2001:db8::10-2001:db8::20',
    explanation: 'Inclusive start-end range of IPv6 addresses (same address family)',
  },
  {
    type: 'ipv4-prefix',
    label: 'IPv4 Prefix',
    example: '24',
    explanation: 'Number of leading bits in the network portion (0-32). Larger value → smaller subnet',
  },
  {
    type: 'ipv6-prefix',
    label: 'IPv6 Prefix',
    example: '64',
    explanation: 'Number of leading bits in the network portion (0-128). Larger value → smaller subnet',
  },
  {
    type: 'ipv4-subnet',
    label: 'IPv4 Subnet',
    example: '192.168.1.0/26',
    explanation: 'An IPv4 CIDR used as a child network carved from a larger parent',
  },
  {
    type: 'ipv6-subnet',
    label: 'IPv6 Subnet',
    example: '2001:db8::/72',
    explanation: 'An IPv6 CIDR used as a child network carved from a larger parent',
  },
  {
    type: 'subnets',
    label: 'Subnets Count',
    example: '4',
    explanation: 'How many equal-sized subnets to create; typically a power of two (e.g., 1, 2, 4, 8)',
  },
] as const;

// build the map when you need it
export const fieldOptions: Record<Field, Omit<FieldOption, 'type'>> = Object.fromEntries(
  fieldOptionsArray.map(({ type, ...rest }) => [type, rest]),
) as Record<Field, Omit<FieldOption, 'type'>>;

interface PageSpec {
  path: string;
  params: Field[] | { optional: Field[] } | { either: Field[] };
}

export const pageSpec: PageSpec[] = [{ path: '/subnetting/ipv4-subnet-calculator', params: ['ipv4-cidr'] }];

// Page-param spec types:
// either-or
// list
// optional

// export const QUERY_SPEC = {
//   '/subnetting/ipv4-subnet-calculator': [ 'cidr' ],
//   '/subnetting/ipv6-subnet-calculator': ['ipv6', 'prefix-len'],
//   '/cidr/summarize': [],
// };
