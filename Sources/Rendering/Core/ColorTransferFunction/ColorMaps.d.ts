declare function addPreset(preset: any): void;
declare function removePresetByName(name: any): void;
declare function getPresetByName(name: any): any;
export interface T100 {
  addPreset: typeof addPreset;
  removePresetByName: typeof removePresetByName;
  getPresetByName: typeof getPresetByName;
  rgbPresetNames: string[];
}
declare const T101: T100;
export default T101;
