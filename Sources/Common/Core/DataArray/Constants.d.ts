export namespace DataTypeByteSize {
    export const Int8Array: number;
    export const Uint8Array: number;
    export const Uint8ClampedArray: number;
    export const Int16Array: number;
    export const Uint16Array: number;
    export const Int32Array: number;
    export const Uint32Array: number;
    export const Float32Array: number;
    export const Float64Array: number;
}
export namespace VtkDataTypes {
    export const VOID: string;
    export const CHAR: string;
    export const SIGNED_CHAR: string;
    export const UNSIGNED_CHAR: string;
    export const SHORT: string;
    export const UNSIGNED_SHORT: string;
    export const INT: string;
    export const UNSIGNED_INT: string;
    export const FLOAT: string;
    export const DOUBLE: string;
}
export const DefaultDataType: string;
declare namespace _default {
    export { DefaultDataType };
    export { DataTypeByteSize };
    export { VtkDataTypes };
}
export default _default;
