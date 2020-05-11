declare namespace _default {
    export { arrayEquals };
    export { compareImages };
    export { createGarbageCollector };
    export { keepDOM };
    export { objEquals };
    export { removeDOM };
}
export default _default;
declare function arrayEquals(a: any, b: any): boolean;
declare function compareImages(image: any, baselines: any, testName: any, tapeContext: any, threshold?: number, nextCallback?: any): void;
declare function createGarbageCollector(testContext: any): {
    registerResource: (vtkObj: any, priority?: number) => any;
    registerDOMElement: (el: any) => any;
    releaseResources: () => void;
};
declare function keepDOM(): void;
declare function objEquals(a: any, b: any): boolean;
declare function removeDOM(): void;
