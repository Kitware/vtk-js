export function extend(publicAPI: any, model: any, initialValues?: {}): void;
export const newInstance: any;
declare namespace _default {
    export { extend };
    export { newInstance };
    export { setDracoDecoder };
    export { setWasmBinary };
    export { getDracoDecoder };
}
export default _default;
declare function setDracoDecoder(createDracoModule: any): void;
/**
 * Load the WASM decoder from url and set the decoderModule
 * @param url
 * @param binaryName
 * @return {Promise<boolean>}
 */
declare function setWasmBinary(url: any, binaryName: any): Promise<boolean>;
declare function getDracoDecoder(): {};
