import type { Writable } from 'svelte/store';

export const CIDR_CTX = Symbol('CIDR_CTX');

export type SubnetInfo = {
  cidr: number;
  mask: string;
  hosts: number;
};

export interface CidrContext {
  cidr: Writable<number>;
  mask: Writable<string>;
  handleMaskChange: (value: string) => void;
  getSubnetInfo: (cidr: number) => SubnetInfo;
  COMMON_SUBNETS: Array<{ cidr: number; mask: string; hosts: number }>;
}
