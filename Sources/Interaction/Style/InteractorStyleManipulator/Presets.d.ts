declare function applyDefinitions(definitions: any, manipulatorStyle: any): boolean;
declare function applyPreset(name: any, manipulatorStyle: any): boolean;
declare function registerManipulatorType(type: any, classDef: any): void;
declare function registerStylePreset(name: any, definitions: any): void;
export interface T100 {
  applyDefinitions: typeof applyDefinitions;
  applyPreset: typeof applyPreset;
  registerManipulatorType: typeof registerManipulatorType;
  registerStylePreset: typeof registerStylePreset;
}
declare const T101: T100;
export default T101;
