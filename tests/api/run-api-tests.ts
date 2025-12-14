#!/usr/bin/env tsx
/**
 * API Contract Test Runner
 * Runs comprehensive tests against the API endpoints based on the Swagger specification
 */

// fetch is built-in in Node.js 18+, no need to import

// Import all test files
import './api-overview.test';
import './subnetting.test';
import './cidr.test';
import './ip-address-convertor.test';
import './dns.test';

console.log('API Contract Tests completed successfully!');