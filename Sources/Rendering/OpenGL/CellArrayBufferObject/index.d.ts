import {
  IBufferObjectInitialValues,
  vtkOpenGLBufferObject,
} from '../BufferObject';
import vtkCellArray from '../../../Common/Core/CellArray';
import vtkDataArray from '../../../Common/Core/DataArray';
import vtkPoints from '../../../Common/Core/Points';
import { Representation } from '../../Core/Property/Constants';
import { Nullable } from '../../../types';

/**
 * The input primitive kind a cell array holds.
 */
export type CellArrayInputRepresentation =
  | 'verts'
  | 'lines'
  | 'polys'
  | 'strips';

/**
 * One extra vertex attribute packed into the interleaved VBO.
 */
export interface ICustomAttributeInfo {
  data: ArrayLike<number>;
  offset: number;
  components: number;
  name: string;
}

/**
 * The arrays and flags describing what to pack into the VBO.
 */
export interface ICreateVBOOptions {
  points: vtkPoints;
  normals?: Nullable<vtkDataArray>;
  tcoords?: Nullable<vtkDataArray>;
  colors?: Nullable<vtkDataArray>;
  customAttributes?: Nullable<vtkDataArray>[];

  /**
   * Id of the first cell of this primitive across all the primitives of a
   * mapper.
   */
  cellOffset?: number;

  /**
   * Id of the first vertex of this primitive across all the primitives of a
   * mapper.
   */
  vertexOffset?: number;
  haveCellScalars?: boolean;
  haveCellNormals?: boolean;
  useTCoordsPerCell?: boolean;

  /**
   * Force the flattened layout, in which every cell vertex is expanded. Needed
   * for per cell attributes and for cell accurate hardware selection.
   */
  forceFlatten?: boolean;
}

/**
 * Per vertex maps filled while packing a flattened VBO, used to recover the
 * point and cell a rendered vertex came from.
 */
export interface ISelectionMaps {
  points: Nullable<Int32Array>;
  cells: Nullable<Int32Array>;
}

/**
 * Initial values for creating a new instance of vtkOpenGLCellArrayBufferObject.
 */
export interface ICellArrayBufferObjectInitialValues extends IBufferObjectInitialValues {
  elementCount?: number;
  indexed?: boolean;
  indexBO?: Nullable<vtkOpenGLBufferObject>;
  indexElementType?: Nullable<number>;
  stride?: number;
  colorBOStride?: number;
  vertexOffset?: number;
  normalOffset?: number;
  tCoordOffset?: number;
  tCoordComponents?: number;
  colorOffset?: number;
  colorComponents?: number;
  customData?: ICustomAttributeInfo[];
  coordShift?: Nullable<Float64Array>;
  coordScale?: Nullable<Float64Array>;
  coordShiftAndScaleEnabled?: boolean;
  inverseShiftAndScaleMatrix?: Nullable<Float64Array>;
}

export interface vtkOpenGLCellArrayBufferObject extends vtkOpenGLBufferObject {
  /**
   * Pack the given cells into an interleaved vertex buffer and upload it.
   *
   * When the options allow it the cells are uploaded indexed, sharing the input
   * points; otherwise every cell vertex is expanded.
   *
   * @param cellArray The cells to pack.
   * @param inRep The primitive kind the cell array holds.
   * @param outRep The representation to draw the cells with.
   * @param {ICreateVBOOptions} options The attributes to pack.
   * @param {ISelectionMaps} [selectionMaps] (default: null) Filled with the point and cell id of every packed vertex.
   * @returns {number} The number of cells packed.
   */
  createVBO(
    cellArray: vtkCellArray,
    inRep: CellArrayInputRepresentation,
    outRep: Representation,
    options: ICreateVBOOptions,
    selectionMaps?: Nullable<ISelectionMaps>
  ): number;

  /**
   * Set the shift and the scale applied to the points before packing them, and
   * recompute the inverse matrix. Both must be a `Float64Array` of three
   * values, or both null to disable shift and scale.
   *
   * @param coordShift The shift.
   * @param coordScale The scale.
   */
  setCoordShiftAndScale(
    coordShift: Nullable<Float64Array>,
    coordScale: Nullable<Float64Array>
  ): void;

  /**
   * Get the buffer holding the packed colors, when the colors are uploaded
   * separately.
   */
  getColorBO(): Nullable<vtkOpenGLBufferObject>;

  /**
   * Set the buffer holding the packed colors.
   * @param colorBO The buffer.
   */
  setColorBO(colorBO: Nullable<vtkOpenGLBufferObject>): boolean;

  /**
   * Get the number of vertices, or of indices when indexed, to draw.
   */
  getElementCount(): number;

  /**
   * Set the number of vertices to draw.
   * @param elementCount The number of vertices.
   */
  setElementCount(elementCount: number): boolean;

  /**
   * Get the size in bytes of one interleaved vertex block.
   */
  getStride(): number;

  /**
   * Set the size in bytes of one interleaved vertex block.
   * @param stride The block size in bytes.
   */
  setStride(stride: number): boolean;

  /**
   * Get the size in bytes of one block of the color buffer.
   */
  getColorBOStride(): number;

  /**
   * Set the size in bytes of one block of the color buffer.
   * @param colorBOStride The block size in bytes.
   */
  setColorBOStride(colorBOStride: number): boolean;

  /**
   * Get the offset in bytes of the position inside a block.
   */
  getVertexOffset(): number;

  /**
   * Set the offset in bytes of the position inside a block.
   * @param vertexOffset The offset in bytes.
   */
  setVertexOffset(vertexOffset: number): boolean;

  /**
   * Get the offset in bytes of the normal inside a block.
   */
  getNormalOffset(): number;

  /**
   * Set the offset in bytes of the normal inside a block.
   * @param normalOffset The offset in bytes.
   */
  setNormalOffset(normalOffset: number): boolean;

  /**
   * Get the offset in bytes of the texture coordinate inside a block.
   */
  getTCoordOffset(): number;

  /**
   * Set the offset in bytes of the texture coordinate inside a block.
   * @param tCoordOffset The offset in bytes.
   */
  setTCoordOffset(tCoordOffset: number): boolean;

  /**
   * Get the number of components of the texture coordinate.
   */
  getTCoordComponents(): number;

  /**
   * Set the number of components of the texture coordinate.
   * @param tCoordComponents The number of components.
   */
  setTCoordComponents(tCoordComponents: number): boolean;

  /**
   * Get the offset in bytes of the color inside a color buffer block.
   */
  getColorOffset(): number;

  /**
   * Set the offset in bytes of the color inside a color buffer block.
   * @param colorOffset The offset in bytes.
   */
  setColorOffset(colorOffset: number): boolean;

  /**
   * Get the number of components of the color.
   */
  getColorComponents(): number;

  /**
   * Set the number of components of the color.
   * @param colorComponents The number of components.
   */
  setColorComponents(colorComponents: number): boolean;

  /**
   * Get the description of the extra attributes packed into the VBO.
   */
  getCustomData(): ICustomAttributeInfo[];

  /**
   * Set the description of the extra attributes packed into the VBO.
   * @param customData The attribute descriptions.
   */
  setCustomData(customData: ICustomAttributeInfo[]): boolean;

  /**
   * Whether the VBO shares its points and is drawn through an index buffer.
   */
  getIndexed(): boolean;

  /**
   * Set whether the VBO is drawn through an index buffer.
   * @param indexed The indexed flag.
   */
  setIndexed(indexed: boolean): boolean;

  /**
   * Get the index buffer, when the VBO is indexed.
   */
  getIndexBO(): Nullable<vtkOpenGLBufferObject>;

  /**
   * Set the index buffer.
   * @param indexBO The index buffer.
   */
  setIndexBO(indexBO: Nullable<vtkOpenGLBufferObject>): boolean;

  /**
   * Get the GL type of the indices, `UNSIGNED_SHORT` or `UNSIGNED_INT`.
   */
  getIndexElementType(): Nullable<number>;

  /**
   * Set the GL type of the indices.
   * @param indexElementType The GL type.
   */
  setIndexElementType(indexElementType: Nullable<number>): boolean;

  /**
   * Get the shift applied to the points before packing them.
   */
  getCoordShift(): Nullable<Float64Array>;

  /**
   * Get the scale applied to the points before packing them.
   */
  getCoordScale(): Nullable<Float64Array>;

  /**
   * Whether the packed positions are shifted and scaled.
   */
  getCoordShiftAndScaleEnabled(): boolean;

  /**
   * Get the matrix undoing the shift and the scale, as 16 values.
   */
  getInverseShiftAndScaleMatrix(): Nullable<Float64Array>;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLCellArrayBufferObject characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICellArrayBufferObjectInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ICellArrayBufferObjectInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLCellArrayBufferObject.
 * @param {ICellArrayBufferObjectInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ICellArrayBufferObjectInitialValues
): vtkOpenGLCellArrayBufferObject;

export declare const vtkOpenGLCellArrayBufferObject: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkOpenGLCellArrayBufferObject;
