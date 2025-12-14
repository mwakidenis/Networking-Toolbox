/**
 * JSON Serialization Utilities
 * Shared utilities for handling complex data types in JSON serialization
 */

/**
 * Recursively serialize BigInt values to strings for JSON compatibility
 * @param obj - The object to serialize
 * @returns The object with BigInt values converted to strings
 */
export const serializeBigInt = (obj: any): any => {
  if (typeof obj === 'bigint') {
    return obj.toString();
  } else if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  } else if (obj !== null && typeof obj === 'object') {
    const serialized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        serialized[key] = serializeBigInt(obj[key]);
      }
    }
    return serialized;
  }
  return obj;
};
