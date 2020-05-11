declare namespace _default {
    export { addPreset };
    export { removePresetByName };
    export { getPresetByName };
    export { rgbPresetNames };
}
export default _default;
declare function addPreset(preset: any): void;
declare function removePresetByName(name: any): void;
declare function getPresetByName(name: any): any;
declare const rgbPresetNames: string[];
