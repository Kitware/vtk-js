declare namespace _default {
    export { buildFromDegree };
    export { buildFromRadian };
}
export default _default;
declare function buildFromDegree(): Transform;
declare function buildFromRadian(): Transform;
declare class Transform {
    constructor(useDegree?: boolean);
    matrix: Float64Array;
    tmp: Float64Array;
    angleConv: any;
    rotateFromDirections(originDirection: any, targetDirection: any): Transform;
    rotate(angle: any, axis: any): Transform;
    rotateX(angle: any): Transform;
    rotateY(angle: any): Transform;
    rotateZ(angle: any): Transform;
    translate(x: any, y: any, z: any): Transform;
    scale(sx: any, sy: any, sz: any): Transform;
    identity(): Transform;
    apply(typedArray: any, offset?: number, nbIterations?: number): Transform;
    getMatrix(): Float64Array;
    setMatrix(mat4x4: any): Transform;
}
