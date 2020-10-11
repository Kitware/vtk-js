declare function arrayEquals(a: any, b: any): boolean;
declare function compareImages(image: any, baselines: any, testName: any, tapeContext: any, threshold?: number, nextCallback?: any): void;
export interface T100 {
  registerResource: (vtkObj: any, priority?: number) => any;
  registerDOMElement: (el: any) => any;
  releaseResources: () => void;
}
declare function createGarbageCollector(testContext: any): T100;
declare function keepDOM(): void;
declare function objEquals(a: any, b: any): boolean;
declare function removeDOM(): void;
export interface T101 {
  arrayEquals: typeof arrayEquals;
  compareImages: typeof compareImages;
  createGarbageCollector: typeof createGarbageCollector;
  keepDOM: typeof keepDOM;
  objEquals: typeof objEquals;
  removeDOM: typeof removeDOM;
}
declare const T102: T101;
export default T102;
