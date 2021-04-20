/**
 * Get the endianness
 */
export function getEndianness(): string | null;

export const ENDIANNESS : string;

/**
 * 
 * @param {ArrayBuffer} buffer 
 * @param {Number} wordSize 
 */
export function swapBytes(buffer : ArrayBuffer, wordSize : number): void;
