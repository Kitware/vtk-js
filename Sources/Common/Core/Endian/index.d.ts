import { Nullable } from "../../../types";

/**
 * Get the endianness
 */
export function getEndianness(): Nullable<string>;

export const ENDIANNESS : string;

/**
 * 
 * @param {ArrayBuffer} buffer 
 * @param {Number} wordSize 
 */
export function swapBytes(buffer : ArrayBuffer, wordSize : number): void;
