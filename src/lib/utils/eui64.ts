/* EUI-64 Conversion Utilities */

export interface EUI64Conversion {
  input: string;
  inputType: 'mac' | 'eui64';
  isValid: boolean;
  macAddress: string;
  eui64Address: string;
  ipv6LinkLocal: string;
  ipv6Global: string;
  details: {
    ouiPart: string;
    devicePart: string;
    modifiedOUI: string;
    universalLocal: 'universal' | 'local';
    unicastMulticast: 'unicast' | 'multicast';
  };
  error?: string;
}

export interface EUI64Result {
  conversions: EUI64Conversion[];
  summary: {
    totalInputs: number;
    validInputs: number;
    invalidInputs: number;
    macToEUI64: number;
    eui64ToMAC: number;
  };
  errors: string[];
}

/* Validate MAC address format */
function isValidMACAddress(mac: string): boolean {
  // Remove common separators and check various formats
  const cleanMAC = mac.replace(/[:-]/g, '').toUpperCase();

  // Must be exactly 12 hex characters
  if (cleanMAC.length !== 12) return false;

  // Must be all hex characters
  return /^[0-9A-F]{12}$/.test(cleanMAC);
}

/* Validate EUI-64 address format */
function isValidEUI64(eui64: string): boolean {
  // Remove common separators and check various formats
  const cleanEUI64 = eui64.replace(/[:-]/g, '').toUpperCase();

  // Must be exactly 16 hex characters
  if (cleanEUI64.length !== 16) return false;

  // Must be all hex characters
  return /^[0-9A-F]{16}$/.test(cleanEUI64);
}

/* Normalize MAC address to standard format */
function normalizeMACAddress(mac: string): string {
  const cleanMAC = mac.replace(/[:-]/g, '').toUpperCase();
  return cleanMAC.match(/.{2}/g)?.join(':') || '';
}

/* Normalize EUI-64 address to standard format */
function normalizeEUI64(eui64: string): string {
  const cleanEUI64 = eui64.replace(/[:-]/g, '').toUpperCase();
  return cleanEUI64.match(/.{2}/g)?.join(':') || '';
}

/* Convert MAC address to EUI-64 */
function macToEUI64(mac: string): string {
  const cleanMAC = mac.replace(/[:-]/g, '').toUpperCase();

  // Split into OUI (first 6 chars) and device (last 6 chars)
  const oui = cleanMAC.substring(0, 6);
  const device = cleanMAC.substring(6, 12);

  // Insert FFFE in the middle and flip the U/L bit
  const ouiBytes = oui.match(/.{2}/g) || [];
  const firstByte = parseInt(ouiBytes[0] || '00', 16);

  // Flip the Universal/Local bit (bit 1, which is 0x02)
  const modifiedFirstByte = (firstByte ^ 0x02).toString(16).padStart(2, '0').toUpperCase();

  // Construct EUI-64
  const eui64 = modifiedFirstByte + ouiBytes[1] + ouiBytes[2] + 'FFFE' + device;
  return eui64.match(/.{2}/g)?.join(':') || '';
}

/* Convert EUI-64 to MAC address */
function eui64ToMAC(eui64: string): string {
  const cleanEUI64 = eui64.replace(/[:-]/g, '').toUpperCase();

  // Check if it's a valid EUI-64 derived from MAC (should have FFFE in positions 6-7)
  const middleBytes = cleanEUI64.substring(6, 10);
  if (middleBytes !== 'FFFE') {
    throw new Error('Not a valid EUI-64 derived from MAC address (missing FFFE)');
  }

  // Extract OUI and device parts
  const modifiedOUI = cleanEUI64.substring(0, 6);
  const device = cleanEUI64.substring(10, 16);

  // Flip back the U/L bit
  const firstByte = parseInt(modifiedOUI.substring(0, 2), 16);
  const originalFirstByte = (firstByte ^ 0x02).toString(16).padStart(2, '0').toUpperCase();

  // Reconstruct MAC
  const mac = originalFirstByte + modifiedOUI.substring(2, 6) + device;
  return mac.match(/.{2}/g)?.join(':') || '';
}

/* Generate IPv6 addresses from EUI-64 */
function generateIPv6FromEUI64(eui64: string, prefix?: string): { linkLocal: string; global: string } {
  const cleanEUI64 = eui64.replace(/[:-]/g, '').toLowerCase();
  const interfaceID = cleanEUI64.match(/.{4}/g)?.join(':') || '';

  // Link-local address (fe80::/64)
  const linkLocal = `fe80::${interfaceID}`;

  // Global address (if prefix provided, otherwise use example prefix)
  const globalPrefix = prefix || '2001:db8::/64';
  const prefixPart = globalPrefix.split('/')[0].replace(/::$/, '');
  const global = `${prefixPart}:${interfaceID}`;

  return { linkLocal, global };
}

/* Analyze MAC address properties */
function analyzeMAC(mac: string): {
  ouiPart: string;
  devicePart: string;
  modifiedOUI: string;
  universalLocal: 'universal' | 'local';
  unicastMulticast: 'unicast' | 'multicast';
} {
  const cleanMAC = mac.replace(/[:-]/g, '').toUpperCase();
  const ouiPart = cleanMAC.substring(0, 6);
  const devicePart = cleanMAC.substring(6, 12);

  const firstByte = parseInt(cleanMAC.substring(0, 2), 16);

  // Flip U/L bit for modified OUI
  const modifiedFirstByte = (firstByte ^ 0x02).toString(16).padStart(2, '0').toUpperCase();
  const modifiedOUI = modifiedFirstByte + ouiPart.substring(2);

  // Check U/L bit (bit 1 = 0x02)
  const universalLocal = firstByte & 0x02 ? 'local' : 'universal';

  // Check I/G bit (bit 0 = 0x01)
  const unicastMulticast = firstByte & 0x01 ? 'multicast' : 'unicast';

  return {
    ouiPart,
    devicePart,
    modifiedOUI,
    universalLocal,
    unicastMulticast,
  };
}

/* Convert between MAC and EUI-64 */
function convertEUI64(input: string, globalPrefix?: string): EUI64Conversion {
  try {
    const trimmedInput = input.trim();

    // Determine input type
    let inputType: 'mac' | 'eui64';
    let macAddress: string;
    let eui64Address: string;

    if (isValidMACAddress(trimmedInput)) {
      inputType = 'mac';
      macAddress = normalizeMACAddress(trimmedInput);
      eui64Address = macToEUI64(trimmedInput);
    } else if (isValidEUI64(trimmedInput)) {
      inputType = 'eui64';
      eui64Address = normalizeEUI64(trimmedInput);
      macAddress = eui64ToMAC(trimmedInput);
    } else {
      return {
        input: trimmedInput,
        inputType: 'mac',
        isValid: false,
        macAddress: '',
        eui64Address: '',
        ipv6LinkLocal: '',
        ipv6Global: '',
        details: {
          ouiPart: '',
          devicePart: '',
          modifiedOUI: '',
          universalLocal: 'universal',
          unicastMulticast: 'unicast',
        },
        error: 'Invalid MAC address or EUI-64 format',
      };
    }

    // Generate IPv6 addresses
    const ipv6Addresses = generateIPv6FromEUI64(eui64Address, globalPrefix);

    // Analyze MAC properties
    const details = analyzeMAC(macAddress);

    return {
      input: trimmedInput,
      inputType,
      isValid: true,
      macAddress,
      eui64Address,
      ipv6LinkLocal: ipv6Addresses.linkLocal,
      ipv6Global: ipv6Addresses.global,
      details,
    };
  } catch (error) {
    return {
      input: input.trim(),
      inputType: 'mac',
      isValid: false,
      macAddress: '',
      eui64Address: '',
      ipv6LinkLocal: '',
      ipv6Global: '',
      details: {
        ouiPart: '',
        devicePart: '',
        modifiedOUI: '',
        universalLocal: 'universal',
        unicastMulticast: 'unicast',
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/* Convert multiple MAC addresses and EUI-64 identifiers */
export function convertEUI64Addresses(inputs: string[], globalPrefix?: string): EUI64Result {
  const conversions: EUI64Conversion[] = [];
  const errors: string[] = [];

  for (const input of inputs) {
    if (!input.trim()) continue;

    const conversion = convertEUI64(input, globalPrefix);
    conversions.push(conversion);

    if (!conversion.isValid && conversion.error) {
      errors.push(`"${input}": ${conversion.error}`);
    }
  }

  const validConversions = conversions.filter((c) => c.isValid);
  const macToEUI64Count = validConversions.filter((c) => c.inputType === 'mac').length;
  const eui64ToMACCount = validConversions.filter((c) => c.inputType === 'eui64').length;

  return {
    conversions,
    summary: {
      totalInputs: conversions.length,
      validInputs: validConversions.length,
      invalidInputs: conversions.length - validConversions.length,
      macToEUI64: macToEUI64Count,
      eui64ToMAC: eui64ToMACCount,
    },
    errors,
  };
}
