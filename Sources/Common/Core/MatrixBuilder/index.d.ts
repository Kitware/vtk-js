declare class Transform {
  matrix: Float64Array;
  tmp: Float64Array;
  angleConv(v: any): any;
  constructor(useDegree?: boolean);
  rotateFromDirections(originDirection: any, targetDirection: any): this;
  rotate(angle: any, axis: any): this;
  rotateX(angle: any): this;
  rotateY(angle: any): this;
  rotateZ(angle: any): this;
  translate(x: any, y: any, z: any): this;
  scale(sx: any, sy: any, sz: any): this;
  identity(): this;
  apply(typedArray: any, offset?: number, nbIterations?: number): this;
  getMatrix(): Float64Array;
  setMatrix(mat4x4: any): this;
}
declare function buildFromDegree(): Transform;
declare function buildFromRadian(): Transform;
export interface T100 {
  buildFromDegree: typeof buildFromDegree;
  buildFromRadian: typeof buildFromRadian;
}
declare const T101: T100;
export default T101;
