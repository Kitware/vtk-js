declare namespace _default {
    export { build };
    export { update };
    export { genericUpdater };
    export { oneTimeGenericUpdater };
    export { setTypeMapping };
    export { clearTypeMapping };
    export { getSupportedTypes };
    export { clearOneTimeUpdaters };
    export { updateRenderWindow };
    export { excludeInstance };
    export { setDefaultMapping };
    export { applyDefaultAliases };
    export { alwaysUpdateCamera };
}
export default _default;
declare function build(type: any, initialProps?: {}): any;
declare function update(type: any, instance: any, props: any, context: any): void;
declare function genericUpdater(instance: any, state: any, context: any): void;
declare function oneTimeGenericUpdater(instance: any, state: any, context: any): void;
declare function setTypeMapping(type: any, buildFn?: any, updateFn?: typeof genericUpdater): void;
declare function clearTypeMapping(): void;
declare function getSupportedTypes(): string[];
declare function clearOneTimeUpdaters(...ids: any[]): void | any[];
declare function updateRenderWindow(instance: any, props: any, context: any): void;
declare function excludeInstance(type: any, propertyName: any, propertyValue: any): void;
declare function setDefaultMapping(reset?: boolean): void;
declare function applyDefaultAliases(): void;
declare function alwaysUpdateCamera(): void;
