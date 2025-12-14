// Core IP address types and interfaces
export interface IPAddress {
  octets: number[];
  binary: string;
  decimal: number;
  hex: string;
  valid: boolean;
}

export interface SubnetInfo {
  network: IPAddress;
  broadcast: IPAddress;
  subnet: IPAddress;
  cidr: number;
  hostCount: number;
  usableHosts: number;
  firstHost: IPAddress;
  lastHost: IPAddress;
  wildcardMask: IPAddress;
}

export interface NetworkRange {
  start: IPAddress;
  end: IPAddress;
  count: number;
}

export type IPVersion = 'v4' | 'v6';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ConversionFormats {
  binary: string;
  decimal: string;
  hex: string;
  octal: string;
}
