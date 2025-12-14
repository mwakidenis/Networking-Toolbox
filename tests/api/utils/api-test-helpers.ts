/**
 * API Contract Test Utilities
 * Common helpers for testing API endpoints against Swagger specification
 */

// @ts-ignore-next
export const PORT = process.env.PORT || '4175';
export const HOST = 'localhost';
export const PROTO = 'http://';
export const API_BASE_URL = `${PROTO}${HOST}:${PORT}`;

/**
 * Convert IP object to dotted decimal notation
 */
export function ipObjectToString(ipObj: any): string {
  if (typeof ipObj === 'string') return ipObj;
  if (ipObj && ipObj.octets && Array.isArray(ipObj.octets)) {
    return ipObj.octets.join('.');
  }
  return '';
}

/**
 * Make API request with proper headers and error handling
 */
export async function makeApiRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  body?: any
): Promise<{ status: number; data: any }> {
  const url = `${API_BASE_URL}${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body && method === 'POST') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  return {
    status: response.status,
    data,
  };
}

/**
 * Validate response has required success structure
 */
export function validateSuccessResponse(data: any, tool: string) {
  if (!data.success) {
    throw new Error(`Expected success: true, got ${data.success}`);
  }
  if (data.tool !== tool) {
    throw new Error(`Expected tool: ${tool}, got ${data.tool}`);
  }
  if (!data.result) {
    throw new Error('Missing result in response');
  }
}

/**
 * Validate error response structure
 */
export function validateErrorResponse(data: any, expectedStatus: number) {
  if (data.success !== false) {
    throw new Error(`Expected success: false for error response, got ${data.success}`);
  }
  if (!data.error) {
    throw new Error('Missing error message in error response');
  }
  if (!data.tool) {
    throw new Error('Missing tool in error response');
  }
}

/**
 * Validate IPv4 address format
 */
export function isValidIPv4(ip: string): boolean {
  const pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!pattern.test(ip)) return false;

  const octets = ip.split('.');
  for (const octet of octets) {
    const num = parseInt(octet, 10);
    if (num < 0 || num > 255) return false;
  }
  return true;
}

/**
 * Validate IPv6 address format (simplified check)
 */
export function isValidIPv6(ip: string): boolean {
  // Basic check for IPv6 format
  const pattern = /^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$|^::$|^::1$/;
  return pattern.test(ip) || ip.includes('::');
}

/**
 * Validate CIDR notation
 */
export function isValidCIDR(cidr: string): boolean {
  const parts = cidr.split('/');
  if (parts.length !== 2) return false;

  const ip = parts[0];
  const prefix = parseInt(parts[1], 10);

  // Check if IPv4 or IPv6
  if (isValidIPv4(ip)) {
    return prefix >= 0 && prefix <= 32;
  } else if (isValidIPv6(ip)) {
    return prefix >= 0 && prefix <= 128;
  }

  return false;
}

/**
 * Test data generators
 */
export const testData = {
  ipv4: {
    valid: ['192.168.1.1', '10.0.0.1', '172.16.0.1', '8.8.8.8'],
    invalid: ['300.300.300.300', '192.168.1', 'not.an.ip.address', '192.168.1.256'],
    cidr: ['192.168.1.0/24', '10.0.0.0/8', '172.16.0.0/16', '192.168.1.0/30'],
  },
  ipv6: {
    valid: ['2001:db8::1', '::1', 'fe80::1', '2001:db8:0:0:0:0:0:1'],
    invalid: ['gggg::1', '2001:db8:', 'invalid::ipv6::address'],
    cidr: ['2001:db8::/64', '2001:db8::/48', '2001:db8::/32', '::1/128'],
  },
  masks: {
    valid: [
      { mask: '255.255.255.0', prefix: 24 },
      { mask: '255.255.0.0', prefix: 16 },
      { mask: '255.0.0.0', prefix: 8 },
      { mask: '255.255.255.252', prefix: 30 },
      { mask: '255.255.255.128', prefix: 25 },
    ],
    invalid: ['256.255.255.0', '255.256.255.0', '255.255.255'],
  },
};

/**
 * Assert helper for cleaner test code
 */
export function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Deep equality check for objects
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

/**
 * Test result reporter
 */
export class TestReporter {
  private passed = 0;
  private failed = 0;
  private errors: { test: string; error: string }[] = [];

  reportPass(testName: string) {
    this.passed++;
    console.log(`✓ ${testName}`);
  }

  reportFail(testName: string, error: any) {
    this.failed++;
    const errorMsg = error.message || String(error);
    this.errors.push({ test: testName, error: errorMsg });
    console.error(`✗ ${testName}: ${errorMsg}`);
  }

  getSummary() {
    return {
      passed: this.passed,
      failed: this.failed,
      total: this.passed + this.failed,
      errors: this.errors,
    };
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log(`Test Results: ${this.passed} passed, ${this.failed} failed out of ${this.passed + this.failed} total`);

    if (this.errors.length > 0) {
      console.log('\nFailed Tests:');
      this.errors.forEach(({ test, error }) => {
        console.log(`  - ${test}: ${error}`);
      });
    }

    return this.failed === 0;
  }
}
