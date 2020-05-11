declare namespace _default {
    export { applyDefinitions };
    export { applyPreset };
    export { registerManipulatorType };
    export { registerStylePreset };
}
export default _default;
declare function applyDefinitions(definitions: any, manipulatorStyle: any): boolean;
declare function applyPreset(name: any, manipulatorStyle: any): boolean;
declare function registerManipulatorType(type: any, classDef: any): void;
declare function registerStylePreset(name: any, definitions: any): void;
