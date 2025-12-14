import { describe, it, expect } from 'vitest';
import { 
  convertIPFormats, 
  decimalToIP, 
  binaryToIP, 
  hexToIP, 
  octalToIP 
} from '../../../src/lib/utils/ip-conversions';

describe('IP format conversions', () => {
  describe('convertIPFormats', () => {
    it('converts standard IP addresses correctly', () => {
      const result = convertIPFormats('192.168.1.1');
      
      expect(result.binary).toBe('11000000.10101000.00000001.00000001');
      expect(result.decimal).toBe('3232235777');
      expect(result.hex).toBe('0xC0.0xA8.0x01.0x01');
      expect(result.octal).toBe('0300.0250.01.01');
    });

    it('handles edge cases correctly', () => {
      const zero = convertIPFormats('0.0.0.0');
      expect(zero.binary).toBe('00000000.00000000.00000000.00000000');
      expect(zero.decimal).toBe('0');
      expect(zero.hex).toBe('0x00.0x00.0x00.0x00');
      expect(zero.octal).toBe('00.00.00.00');

      const max = convertIPFormats('255.255.255.255');
      expect(max.binary).toBe('11111111.11111111.11111111.11111111');
      expect(max.decimal).toBe('4294967295');
      expect(max.hex).toBe('0xFF.0xFF.0xFF.0xFF');
      expect(max.octal).toBe('0377.0377.0377.0377');
    });

    it('handles common network addresses', () => {
      const privateA = convertIPFormats('10.0.0.1');
      expect(privateA.decimal).toBe('167772161');
      
      const privateB = convertIPFormats('172.16.0.1');
      expect(privateB.decimal).toBe('2886729729');
      
      const privateC = convertIPFormats('192.168.0.1');
      expect(privateC.decimal).toBe('3232235521');
    });
  });

  describe('decimalToIP', () => {
    it('converts decimal numbers to IP addresses correctly', () => {
      expect(decimalToIP(3232235777)).toBe('192.168.1.1');
      expect(decimalToIP(167772161)).toBe('10.0.0.1');
      expect(decimalToIP(0)).toBe('0.0.0.0');
      expect(decimalToIP(4294967295)).toBe('255.255.255.255');
    });

    it('handles large decimal values', () => {
      expect(decimalToIP(3405803777)).toBe('203.0.113.1'); // RFC 5737 test address
      expect(decimalToIP(2130706433)).toBe('127.0.0.1');   // localhost
    });

    it('handles edge decimal values', () => {
      expect(decimalToIP(1)).toBe('0.0.0.1');
      expect(decimalToIP(256)).toBe('0.0.1.0');
      expect(decimalToIP(65536)).toBe('0.1.0.0');
      expect(decimalToIP(16777216)).toBe('1.0.0.0');
    });
  });

  describe('binaryToIP', () => {
    it('converts binary strings to IP addresses', () => {
      expect(binaryToIP('11000000101010000000000100000001')).toBe('192.168.1.1');
      expect(binaryToIP('00001010000000000000000000000001')).toBe('10.0.0.1');
      expect(binaryToIP('00000000000000000000000000000000')).toBe('0.0.0.0');
      expect(binaryToIP('11111111111111111111111111111111')).toBe('255.255.255.255');
    });

    it('handles binary with dots and spaces', () => {
      expect(binaryToIP('11000000.10101000.00000001.00000001')).toBe('192.168.1.1');
      expect(binaryToIP('1100 0000 1010 1000 0000 0001 0000 0001')).toBe('192.168.1.1');
      expect(binaryToIP('11000000 10101000 00000001 00000001')).toBe('192.168.1.1');
    });

    it('validates binary string length', () => {
      expect(() => binaryToIP('1010101')).toThrow('Binary string must be 32 bits');
      expect(() => binaryToIP('110000001010100000000001000000011')).toThrow('Binary string must be 32 bits');
    });

    it('validates binary characters', () => {
      expect(() => binaryToIP('1100000010101000000000010000000x')).toThrow('Invalid binary character');
      expect(() => binaryToIP('11000000101010000000000100000002')).toThrow('Invalid binary character');
    });
  });

  describe('hexToIP', () => {
    it('converts hex strings to IP addresses', () => {
      expect(hexToIP('C0A80101')).toBe('192.168.1.1');
      expect(hexToIP('0A000001')).toBe('10.0.0.1');
      expect(hexToIP('00000000')).toBe('0.0.0.0');
      expect(hexToIP('FFFFFFFF')).toBe('255.255.255.255');
    });

    it('handles hex with various formats', () => {
      expect(hexToIP('0xC0A80101')).toBe('192.168.1.1');
      expect(hexToIP('C0.A8.01.01')).toBe('192.168.1.1');
      expect(hexToIP('0xC0.0xA8.0x01.0x01')).toBe('192.168.1.1');
      expect(hexToIP('c0a80101')).toBe('192.168.1.1'); // lowercase
    });

    it('validates hex string length', () => {
      expect(() => hexToIP('C0A801')).toThrow('Hex string must be 8 characters');
      expect(() => hexToIP('C0A8010101')).toThrow('Hex string must be 8 characters');
    });

    it('validates hex characters', () => {
      expect(() => hexToIP('C0A8010G')).toThrow('Invalid hex character');
      expect(() => hexToIP('C0A8010Z')).toThrow('Invalid hex character');
    });
  });

  describe('octalToIP', () => {
    it('converts octal strings to IP addresses', () => {
      expect(octalToIP('300250001001')).toBe('192.168.1.1');
      expect(octalToIP('012000000001')).toBe('10.0.0.1');
      expect(octalToIP('000000000000')).toBe('0.0.0.0');
      expect(octalToIP('377377377377')).toBe('255.255.255.255');
    });

    it('handles octal with dots', () => {
      expect(octalToIP('0300.0250.01.01')).toBe('192.168.1.1');
      expect(octalToIP('012.0.0.01')).toBe('10.0.0.1');
    });

    it('validates octal characters', () => {
      expect(() => octalToIP('030025001008')).toThrow('Invalid octal character');
      expect(() => octalToIP('030025001009')).toThrow('Invalid octal character');
    });
  });

  describe('round-trip conversions', () => {
    const testIPs = [
      '192.168.1.1',
      '10.0.0.1', 
      '172.16.254.1',
      '203.0.113.1',
      '0.0.0.0',
      '255.255.255.255',
      '127.0.0.1',
      '169.254.1.1'
    ];

    it('maintains accuracy through decimal round-trip', () => {
      testIPs.forEach(ip => {
        const formats = convertIPFormats(ip);
        const backToIP = decimalToIP(parseInt(formats.decimal));
        expect(backToIP).toBe(ip);
      });
    });

    it('maintains accuracy through binary round-trip', () => {
      testIPs.forEach(ip => {
        const formats = convertIPFormats(ip);
        const backToIP = binaryToIP(formats.binary);
        expect(backToIP).toBe(ip);
      });
    });

    it('maintains accuracy through hex round-trip', () => {
      testIPs.forEach(ip => {
        const formats = convertIPFormats(ip);
        const cleanHex = formats.hex.replace(/0x/g, '').replace(/\./g, '');
        const backToIP = hexToIP(cleanHex);
        expect(backToIP).toBe(ip);
      });
    });
  });

  describe('format consistency', () => {
    it('produces consistent binary format', () => {
      const result = convertIPFormats('192.168.1.1');
      expect(result.binary.split('.').every(octet => octet.length === 8)).toBe(true);
      expect(result.binary.split('.').every(octet => /^[01]+$/.test(octet))).toBe(true);
    });

    it('produces consistent hex format', () => {
      const result = convertIPFormats('192.168.1.1');
      const hexParts = result.hex.split('.');
      expect(hexParts.length).toBe(4);
      expect(hexParts.every(part => part.startsWith('0x'))).toBe(true);
      expect(hexParts.every(part => part.length === 4)).toBe(true);
    });

    it('produces consistent octal format', () => {
      const result = convertIPFormats('192.168.1.1');
      const octalParts = result.octal.split('.');
      expect(octalParts.length).toBe(4);
      expect(octalParts.every(part => part.startsWith('0'))).toBe(true);
      expect(octalParts.every(part => /^0[0-7]+$/.test(part))).toBe(true);
    });
  });
});