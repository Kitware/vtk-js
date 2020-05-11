declare namespace _default {
    export { canSerialize };
    export { serialize };
    export { canDeserialize };
    export { deserialize };
}
export default _default;
declare function canSerialize(obj: any): any;
declare function serialize(obj: any, arrayHandler: any): {
    vtkClass: string;
};
declare function canDeserialize(obj: any): boolean;
declare function deserialize(obj: any, arrayHandler: any): any;
