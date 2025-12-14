import { describe, it, expect } from 'vitest';
import { validateIPv4, validateCIDR, validateSubnetMask } from '../../../src/lib/utils/ip-validation';

describe('validateIPv4', () => {
  it('validates correct IPv4 addresses', () => {
    expect(validateIPv4('192.168.1.1')).toEqual({ valid: true });
    expect(validateIPv4('0.0.0.0')).toEqual({ valid: true });
    expect(validateIPv4('255.255.255.255')).toEqual({ valid: true });
  });

  it('rejects invalid inputs', () => {
    expect(validateIPv4('')).toEqual({ valid: false, error: 'IP address is required' });
    expect(validateIPv4(null as any)).toEqual({ valid: false, error: 'IP address is required' });
    expect(validateIPv4(undefined as any)).toEqual({ valid: false, error: 'IP address is required' });
  });

  it('rejects incorrect octet count', () => {
    expect(validateIPv4('192.168.1')).toEqual({ valid: false, error: 'IPv4 address must have 4 octets' });
    expect(validateIPv4('192.168.1.1.1')).toEqual({ valid: false, error: 'IPv4 address must have 4 octets' });
  });

  it('rejects non-numeric octets', () => {
    expect(validateIPv4('192.168.1.a')).toEqual({ valid: false, error: 'Octet 4 contains non-numeric characters' });
    expect(validateIPv4('abc.168.1.1')).toEqual({ valid: false, error: 'Octet 1 contains non-numeric characters' });
  });

  it('rejects out-of-range octets', () => {
    expect(validateIPv4('256.168.1.1')).toEqual({ valid: false, error: 'Octet 1 must be between 0-255' });
    expect(validateIPv4('192.168.1.-1')).toEqual({ valid: false, error: 'Octet 4 contains non-numeric characters' });
    expect(validateIPv4('192.168.300.1')).toEqual({ valid: false, error: 'Octet 3 must be between 0-255' });
  });

  it('rejects leading zeros', () => {
    expect(validateIPv4('192.168.01.1')).toEqual({ valid: false, error: 'Octet 3 has leading zeros' });
    expect(validateIPv4('001.168.1.1')).toEqual({ valid: false, error: 'Octet 1 has leading zeros' });
  });

  it('allows single zero', () => {
    expect(validateIPv4('192.168.0.1')).toEqual({ valid: true });
  });
});

describe('validateCIDR', () => {
  it('validates correct CIDR notation', () => {
    expect(validateCIDR('192.168.1.0/24')).toEqual({ valid: true });
    expect(validateCIDR('10.0.0.0/8')).toEqual({ valid: true });
    expect(validateCIDR('172.16.0.0/12')).toEqual({ valid: true });
    expect(validateCIDR('0.0.0.0/0')).toEqual({ valid: true });
    expect(validateCIDR('255.255.255.255/32')).toEqual({ valid: true });
  });

  it('rejects invalid format', () => {
    expect(validateCIDR('')).toEqual({ valid: false, error: 'CIDR notation is required' });
    expect(validateCIDR('192.168.1.1')).toEqual({ valid: false, error: 'CIDR must be in format IP/prefix' });
    expect(validateCIDR('192.168.1.1/24/8')).toEqual({ valid: false, error: 'CIDR must be in format IP/prefix' });
  });

  it('rejects invalid IP portion', () => {
    expect(validateCIDR('256.168.1.1/24')).toEqual({ valid: false, error: 'Octet 1 must be between 0-255' });
    expect(validateCIDR('192.168.1/24')).toEqual({ valid: false, error: 'IPv4 address must have 4 octets' });
  });

  it('rejects invalid prefix', () => {
    expect(validateCIDR('192.168.1.0/33')).toEqual({ valid: false, error: 'CIDR prefix must be between 0-32' });
    expect(validateCIDR('192.168.1.0/-1')).toEqual({ valid: false, error: 'CIDR prefix must be between 0-32' });
    expect(validateCIDR('192.168.1.0/abc')).toEqual({ valid: false, error: 'CIDR prefix must be between 0-32' });
  });
});

describe('validateSubnetMask', () => {
  it('validates correct subnet masks', () => {
    expect(validateSubnetMask('255.255.255.0')).toEqual({ valid: true });
    expect(validateSubnetMask('255.255.0.0')).toEqual({ valid: true });
    expect(validateSubnetMask('255.0.0.0')).toEqual({ valid: true });
    expect(validateSubnetMask('0.0.0.0')).toEqual({ valid: true });
    expect(validateSubnetMask('255.255.255.255')).toEqual({ valid: true });
  });

  it('rejects invalid IP format', () => {
    expect(validateSubnetMask('256.255.255.0')).toEqual({ valid: false, error: 'Octet 1 must be between 0-255' });
    expect(validateSubnetMask('255.255.255')).toEqual({ valid: false, error: 'IPv4 address must have 4 octets' });
  });

  it('rejects non-contiguous masks', () => {
    expect(validateSubnetMask('255.255.255.1')).toEqual({ valid: false, error: 'Subnet mask must be contiguous' });
    expect(validateSubnetMask('255.0.255.0')).toEqual({ valid: false, error: 'Subnet mask must be contiguous' });
    expect(validateSubnetMask('128.128.0.0')).toEqual({ valid: false, error: 'Subnet mask must be contiguous' });
  });

  it('accepts contiguous masks with complex patterns', () => {
    expect(validateSubnetMask('255.255.252.0')).toEqual({ valid: true }); // /22
    expect(validateSubnetMask('255.255.240.0')).toEqual({ valid: true }); // /20
    expect(validateSubnetMask('255.128.0.0')).toEqual({ valid: true }); // /9
  });
});