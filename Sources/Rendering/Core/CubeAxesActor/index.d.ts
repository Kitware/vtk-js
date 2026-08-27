import { mat4 } from 'gl-matrix';
import { vtkObject } from '../../../interfaces';
import { Bounds, Nullable, Vector2 } from '../../../types';
import vtkPolyData from '../../../Common/DataModel/PolyData';
import vtkActor, { IActorInitialValues } from '../Actor';
import vtkCamera from '../Camera';
import vtkTexture from '../Texture';

/**
 * Styling of the text drawn into the label texture atlas.
 */
export interface ICubeAxesTextStyle {
  fontColor?: string;
  fontStyle?: string;
  fontSize?: number;
  fontFamily?: string;
  strokeColor?: string;
  strokeSize?: number;
}

/**
 * Tick positions and their formatted labels, one entry per axis.
 */
export interface IGeneratedTicks {
  ticks: number[][];
  tickStrings: string[][];
}

/**
 * Placement of one string inside the label texture atlas.
 */
export interface ITextAtlasEntry {
  width: number;
  height: number;
  startingHeight: number;
  textStyle: ICubeAxesTextStyle;
  /**
   * The four (u, v) pairs of the label quad, set once the atlas dimensions
   * are known.
   */
  tcoords?: number[];
}

/**
 * Accumulator filled while building the label quads.
 */
export interface ILabelPolyDataResults {
  ptIdx: number;
  cellIdx: number;
  points: Float64Array;
  polys: Uint16Array;
  tcoords: Float32Array;
}

export interface ICubeAxesActorInitialValues extends IActorInitialValues {
  /**
   * Factor by which the grid bounds are expanded to account for the labels.
   */
  boundsScaleFactor?: number;
  camera?: Nullable<vtkCamera>;
  dataBounds?: Bounds;
  /**
   * Angle in degrees under which a face is considered too edge-on to draw.
   */
  faceVisibilityAngle?: number;
  gridLines?: boolean;
  axisLabels?: [string, string, string];
  axisTitlePixelOffset?: number;
  tickLabelPixelOffset?: number;
  generateTicks?: (dataBounds: Bounds) => IGeneratedTicks;
  axisTextStyle?: ICubeAxesTextStyle;
  tickTextStyle?: ICubeAxesTextStyle;
}

export interface vtkCubeAxesActor extends vtkActor {
  getAxisTitlePixelOffset(): number;
  setAxisTitlePixelOffset(axisTitlePixelOffset: number): boolean;

  getBoundsScaleFactor(): number;
  setBoundsScaleFactor(boundsScaleFactor: number): boolean;

  getFaceVisibilityAngle(): number;
  setFaceVisibilityAngle(faceVisibilityAngle: number): boolean;

  getGridLines(): boolean;
  setGridLines(gridLines: boolean): boolean;

  getTickLabelPixelOffset(): number;
  setTickLabelPixelOffset(tickLabelPixelOffset: number): boolean;

  getGenerateTicks(): (dataBounds: Bounds) => IGeneratedTicks;
  setGenerateTicks(
    generateTicks: (dataBounds: Bounds) => IGeneratedTicks
  ): boolean;

  getDataBounds(): Bounds;
  getDataBoundsByReference(): Bounds;
  setDataBounds(dataBounds: Bounds): boolean;
  setDataBounds(
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    zMin: number,
    zMax: number
  ): boolean;
  setDataBoundsFrom(dataBounds: Bounds): void;

  getAxisLabels(): [string, string, string];
  getAxisLabelsByReference(): [string, string, string];
  setAxisLabels(axisLabels: [string, string, string]): boolean;
  setAxisLabels(x: string, y: string, z: string): boolean;
  setAxisLabelsFrom(axisLabels: [string, string, string]): void;

  getAxisTextStyle(): ICubeAxesTextStyle;

  /**
   * Merge the given properties into the axis title text style.
   * @param {ICubeAxesTextStyle} axisStyle
   */
  setAxisTextStyle(axisStyle: ICubeAxesTextStyle): void;

  getTickTextStyle(): ICubeAxesTextStyle;

  /**
   * Merge the given properties into the tick label text style.
   * @param {ICubeAxesTextStyle} tickStyle
   */
  setTickTextStyle(tickStyle: ICubeAxesTextStyle): void;

  getCamera(): Nullable<vtkCamera>;

  /**
   * Set the camera used to decide which faces are visible. The actor is
   * updated on every camera modification.
   * @param camera
   */
  setCamera(camera: Nullable<vtkCamera>): void;

  /**
   * Texture atlas holding the rendering of every label string.
   */
  getTmTexture(): vtkTexture;

  /**
   * The label strings, in the order the label quads are built.
   */
  getTextValues(): string[];

  /**
   * Polydata holding the world coordinates the labels are anchored to.
   */
  getTextPolyData(): vtkPolyData;

  /**
   * Number of tick labels per drawn axis.
   */
  getTickCounts(): number[];

  /**
   * The actor drawing the bounding edges and the grid lines.
   */
  getGridActor(): vtkActor;

  /**
   * Placement of every label string inside the texture atlas.
   */
  get_tmAtlas(): Map<string, ITextAtlasEntry>;

  /**
   * Recompute which of the six faces face the camera.
   * @return true when the set of visible faces changed
   */
  computeFacesToDraw(): boolean;

  /**
   * Rebuild the polydata holding the bounding edges and the grid lines.
   * @param {Boolean[]} facesToDraw one entry per face
   * @param {Number[]} edgesToDraw number of drawn faces sharing each of the
   * twelve edges; an edge is labeled when exactly one face uses it
   * @param {Number[][]} ticks tick positions per axis
   */
  updatePolyData(
    facesToDraw: boolean[],
    edgesToDraw: number[],
    ticks: number[][]
  ): void;

  /**
   * Rebuild the world coordinates and the strings of the labels.
   * @param {Boolean[]} facesToDraw one entry per face
   * @param {Number[]} edgesToDraw number of drawn faces sharing each edge
   * @param {Number[][]} ticks tick positions per axis
   * @param {String[][]} tickStrings formatted tick labels per axis
   */
  updateTextData(
    facesToDraw: boolean[],
    edgesToDraw: number[],
    ticks: number[][],
    tickStrings: string[][]
  ): void;

  /**
   * Redraw the label texture atlas.
   * @param {String[][]} tickStrings formatted tick labels per axis
   */
  updateTextureAtlas(tickStrings: string[][]): void;

  /**
   * Rebuild whatever the current camera and data bounds invalidated. Called
   * on every camera modification and on every modification of the actor.
   */
  update(): void;
}

export interface vtkCubeAxesActorHelper extends vtkObject {
  getRenderable(): Nullable<vtkCubeAxesActor>;

  /**
   * Bind the helper to a cube axes actor and share its texture and property
   * with the internal label actor.
   * @param renderable
   */
  setRenderable(renderable: vtkCubeAxesActor): void;

  getLastSize(): Vector2;

  getLastAspectRatio(): number;

  getAxisTextStyle(): ICubeAxesTextStyle;

  getTickTextStyle(): ICubeAxesTextStyle;

  /**
   * The actor drawing the label quads.
   */
  getTmActor(): vtkActor;

  getTicks(): number[][] | undefined;

  /**
   * Append the two triangles and the texture coordinates of one label quad to
   * `results`.
   * @param {String} text the label string, looked up in the texture atlas
   * @param {Number} pos index of the anchor point in the text polydata
   * @param {mat4} cmat world to normalized device coordinates matrix
   * @param {mat4} imat inverse of `cmat`
   * @param {Vector2} dir screen space direction the label is pushed towards
   * @param {Number} offset distance in pixels the label is pushed by
   * @param {ILabelPolyDataResults} results accumulator, updated in place
   */
  createPolyDataForOneLabel(
    text: string,
    pos: number,
    cmat: mat4,
    imat: mat4,
    dir: Vector2,
    offset: number,
    results: ILabelPolyDataResults
  ): void;

  /**
   * Rebuild the label quads, which depend on the current camera.
   */
  updateTexturePolyData(): void;

  /**
   * Record the view resolution and camera, then rebuild the label quads.
   * @param {Vector2} size the view size in pixels
   * @param {vtkCamera} camera
   * @param renderWindow
   */
  updateAPISpecificData(
    size: Vector2,
    camera: vtkCamera,
    renderWindow: unknown
  ): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with
 * vtkCubeAxesActor characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICubeAxesActorInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ICubeAxesActorInitialValues
): void;

/**
 * Method used to create a new instance of vtkCubeAxesActor.
 * @param {ICubeAxesActorInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ICubeAxesActorInitialValues
): vtkCubeAxesActor;

/**
 * Create the view dependent companion of a cube axes actor. One helper is
 * instantiated per view, as the label sizes depend on the view resolution.
 * @param [initialValues] for pre-setting some of its content
 */
declare function newCubeAxesActorHelper(initialValues?: {
  renderable?: Nullable<vtkCubeAxesActor>;
}): vtkCubeAxesActorHelper;

/**
 * Default tick generator, producing about five d3 linear scale ticks per axis.
 * @param {Bounds} dataBounds
 */
declare function defaultGenerateTicks(dataBounds: Bounds): IGeneratedTicks;

/**
 * vtkCubeAxesActor draws a labeled bounding box with tick marks and optional
 * grid lines around a region of interest. Only the faces facing away from the
 * camera are drawn, so the axes never occlude the data.
 *
 * The class is split in two: this actor holds the view independent properties
 * while vtkCubeAxesActorHelper, created once per view, holds everything that
 * depends on the view resolution and aspect ratio.
 * @see [vtkAxesActor](./Rendering_Core_AxesActor.html)
 */
export declare const vtkCubeAxesActor: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  newCubeAxesActorHelper: typeof newCubeAxesActorHelper;
  defaultGenerateTicks: typeof defaultGenerateTicks;
};
export default vtkCubeAxesActor;
