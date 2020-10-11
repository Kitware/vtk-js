declare function applyDefinitions(definitions: any, cubeActor: any): void;
declare function applyPreset(name: any, cubeActor: any): void;
declare function registerStylePreset(name: any, definitions: any): void;
export interface T100 {
  applyDefinitions: typeof applyDefinitions;
  applyPreset: typeof applyPreset;
  registerStylePreset: typeof registerStylePreset;
}
declare const T101: T100;
export default T101;
