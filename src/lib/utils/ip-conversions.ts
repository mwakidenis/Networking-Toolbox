import type { ConversionFormats } from '../types/ip.js';

/**
 * Converts IP address to various number formats
 */
export function convertIPFormats(ip: string): ConversionFormats {
  const octets = ip.split('.').map(Number);

  const binary = octets.map((octet) => octet.toString(2).padStart(8, '0')).join('.');

  const decimal = octets.reduce((acc, octet, i) => acc + octet * Math.pow(256, 3 - i), 0).toString();

  const hex = octets.map((octet) => '0x' + octet.toString(16).padStart(2, '0').toUpperCase()).join('.');

  const octal = octets
    .map((octet) => {
      const oct = octet.toString(8);
      return oct === '0' ? '00' : '0' + oct;
    })
    .join('.');

  return { binary, decimal, hex, octal };
}

/**
 * Converts decimal number to IP address
 */
export function decimalToIP(decimal: number): string {
  const octets = [(decimal >>> 24) & 0xff, (decimal >>> 16) & 0xff, (decimal >>> 8) & 0xff, decimal & 0xff];

  return octets.join('.');
}

/**
 * Converts binary string to IP address
 */
export function binaryToIP(binary: string): string {
  // Remove dots and spaces
  const cleanBinary = binary.replace(/[.\s]/g, '');

  if (cleanBinary.length !== 32) {
    throw new Error('Binary string must be 32 bits');
  }

  // Validate binary characters
  if (!/^[01]+$/.test(cleanBinary)) {
    throw new Error('Invalid binary character');
  }

  const octets = [];
  for (let i = 0; i < 32; i += 8) {
    const octetBinary = cleanBinary.slice(i, i + 8);
    octets.push(parseInt(octetBinary, 2));
  }

  return octets.join('.');
}

/**
 * Converts hex string to IP address
 */
export function hexToIP(hex: string): string {
  // Remove 0x prefix and dots
  const cleanHex = hex.replace(/0x/g, '').replace(/\./g, '');

  if (cleanHex.length !== 8) {
    throw new Error('Hex string must be 8 characters');
  }

  // Validate hex characters
  if (!/^[0-9A-Fa-f]+$/.test(cleanHex)) {
    throw new Error('Invalid hex character');
  }

  const octets = [];
  for (let i = 0; i < 8; i += 2) {
    const octetHex = cleanHex.slice(i, i + 2);
    octets.push(parseInt(octetHex, 16));
  }

  return octets.join('.');
}

/**
 * Converts octal string to IP address
 */
export function octalToIP(octal: string): string {
  // Remove dots if present
  let cleanOctal: string;

  if (octal.includes('.')) {
    // Handle dotted format like "0300.0250.001.001"
    const octalParts = octal.split('.');
    if (octalParts.length !== 4) {
      throw new Error('Octal string must have 4 parts when using dots');
    }

    const octets = octalParts.map((part) => {
      // Validate octal characters
      if (!/^0?[0-7]+$/.test(part)) {
        throw new Error('Invalid octal character');
      }
      return parseInt(part, 8);
    });

    return octets.join('.');
  } else {
    // Handle continuous format like "030025001001"
    cleanOctal = octal;

    if (cleanOctal.length !== 12) {
      throw new Error('Octal string must be 12 characters');
    }

    // Validate octal characters
    if (!/^[0-7]+$/.test(cleanOctal)) {
      throw new Error('Invalid octal character');
    }

    const octets = [];
    for (let i = 0; i < 12; i += 3) {
      const octetOctal = cleanOctal.slice(i, i + 3);
      // Parse as octal - this is key!
      octets.push(parseInt(octetOctal, 8));
    }

    return octets.join('.');
  }
}

/**
 * Gets IP class information
 */
export function getIPClass(ip: string): { class: string; type: string; description: string } {
  const firstOctet = parseInt(ip.split('.')[0]);

  if (firstOctet >= 1 && firstOctet <= 126) {
    return {
      class: 'A',
      type: 'Unicast',
      description: 'Large networks',
    };
  } else if (firstOctet >= 128 && firstOctet <= 191) {
    return {
      class: 'B',
      type: 'Unicast',
      description: 'Medium networks',
    };
  } else if (firstOctet >= 192 && firstOctet <= 223) {
    return {
      class: 'C',
      type: 'Unicast',
      description: 'Small networks',
    };
  } else if (firstOctet >= 224 && firstOctet <= 239) {
    return {
      class: 'D',
      type: 'Multicast',
      description: 'Multicast addresses',
    };
  } else if (firstOctet >= 240 && firstOctet <= 255) {
    return {
      class: 'E',
      type: 'Reserved',
      description: 'Experimental/Reserved',
    };
  }

  return {
    class: 'Invalid',
    type: 'Invalid',
    description: 'Invalid IP address',
  };
}
