export function extend(publicAPI: any, model: any, initialValues?: {}): void;
declare namespace _default {
    export { extend };
    export { createSvgElement };
    export { createSvgDomElement };
}
export default _default;
declare function createSvgElement(tag: any): {
    name: any;
    attrs: {};
    textContent: any;
    children: any[];
    setAttribute(attr: any, val: any): void;
    removeAttribute(attr: any): void;
    appendChild(n: any): void;
};
declare function createSvgDomElement(tag: any): any;
