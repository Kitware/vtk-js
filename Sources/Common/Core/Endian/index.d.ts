export function getEndianness(): "LittleEndian" | "BigEndian";
export function swapBytes(buffer: any, wordSize: any): void;
export const ENDIANNESS: "LittleEndian" | "BigEndian";
declare namespace _default {
    export { ENDIANNESS };
    export { getEndianness };
    export { swapBytes };
}
export default _default;
