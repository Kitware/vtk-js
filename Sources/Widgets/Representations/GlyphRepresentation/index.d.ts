import vtkPolyData from '../../../Common/DataModel/PolyData';
import { vtkAlgorithm } from '../../../interfaces';
import vtkActor from '../../../Rendering/Core/Actor';
import vtkGlyph3DMapper from '../../../Rendering/Core/Glyph3DMapper';
import vtkWidgetState from '../../Core/WidgetState';
import { IWidgetPipeline } from '../WidgetRepresentation';
import vtkContextRepresentation, {
  IContextRepresentationInitialValues,
} from '../ContextRepresentation';
import vtkHandleRepresentation, {
  IHandleRepresentationInitialValues,
} from '../HandleRepresentation';

/**
 * Fills one glyph attribute of `polyData` from the given widget states.
 */
export type GlyphMixinFunction = (
  polyData: vtkPolyData,
  states: vtkWidgetState[]
) => void;

/**
 * The mixin functions the representation can apply, keyed by the name used in
 * `getMixins()`/`setXXX()`. Each one can be replaced through the matching
 * `set<Name>()` accessor.
 */
export interface IGlyphMixins {
  origin: GlyphMixinFunction;
  noPosition: GlyphMixinFunction;
  color3: GlyphMixinFunction;
  color: GlyphMixinFunction;
  noColor: GlyphMixinFunction;
  scale3: GlyphMixinFunction;
  scale1: GlyphMixinFunction;
  noScale: GlyphMixinFunction;
  direction: GlyphMixinFunction;
  noOrientation: GlyphMixinFunction;
}

/**
 * The mixin function selected for each glyph attribute, as returned by
 * `getMixins()`.
 */
export interface IGlyphProperties {
  position: GlyphMixinFunction;
  color: GlyphMixinFunction;
  scale: GlyphMixinFunction;
  orientation: GlyphMixinFunction;
}

export interface IGlyphRepresentationInitialValues
  extends
    IHandleRepresentationInitialValues,
    IContextRepresentationInitialValues {
  defaultScale?: number;
  /**
   * Applied on the actor property at `extend()` time only.
   */
  lighting?: boolean;
  _pipeline?: Partial<IWidgetPipeline>;
  applyMixin?: Partial<IGlyphMixins>;
}

export interface vtkGlyphRepresentation
  extends vtkHandleRepresentation, vtkContextRepresentation {
  /**
   * Pick, for each glyph attribute, the mixin function matching the mixins
   * carried by the given states.
   */
  getMixins(states: vtkWidgetState[]): IGlyphProperties;

  requestData(inData: any[], outData: any[]): void;

  /**
   * Scale applied to the glyphs of the states that do not provide a scale
   * mixin.
   */
  getDefaultScale(): number;
  setDefaultScale(defaultScale: number): boolean;

  /** The source producing the glyph geometry (a vtkSphereSource by default). */
  getGlyph(): vtkAlgorithm;
  getMapper(): vtkGlyph3DMapper;
  getActor(): vtkActor;

  getOrigin(): GlyphMixinFunction;
  setOrigin(origin: GlyphMixinFunction): boolean;

  getNoPosition(): GlyphMixinFunction;
  setNoPosition(noPosition: GlyphMixinFunction): boolean;

  getColor3(): GlyphMixinFunction;
  setColor3(color3: GlyphMixinFunction): boolean;

  getColor(): GlyphMixinFunction;
  setColor(color: GlyphMixinFunction): boolean;

  getNoColor(): GlyphMixinFunction;
  setNoColor(noColor: GlyphMixinFunction): boolean;

  getScale3(): GlyphMixinFunction;
  setScale3(scale3: GlyphMixinFunction): boolean;

  getScale1(): GlyphMixinFunction;
  setScale1(scale1: GlyphMixinFunction): boolean;

  getNoScale(): GlyphMixinFunction;
  setNoScale(noScale: GlyphMixinFunction): boolean;

  getDirection(): GlyphMixinFunction;
  setDirection(direction: GlyphMixinFunction): boolean;

  getNoOrientation(): GlyphMixinFunction;
  setNoOrientation(noOrientation: GlyphMixinFunction): boolean;
}

/** Writes the states origins into the polydata points. */
export function origin(publicAPI: object, model: object): GlyphMixinFunction;

/** Empties the polydata points, hiding every glyph. */
export function noPosition(
  publicAPI: object,
  model: object
): GlyphMixinFunction;

/** Writes the states RGB color and opacity into a 4-component `color` array. */
export function color3(publicAPI: object, model: object): GlyphMixinFunction;

/** Writes the states scalar color into a 1-component `color` array. */
export function color(publicAPI: object, model: object): GlyphMixinFunction;

/** Disables coloring by array on the mapper. */
export function noColor(publicAPI: object, model: object): GlyphMixinFunction;

/** Writes a per-component scale into a 3-component `scale` array. */
export function scale3(publicAPI: object, model: object): GlyphMixinFunction;

/** Writes a uniform scale into a 1-component `scale` array. */
export function scale1(publicAPI: object, model: object): GlyphMixinFunction;

/** Applies `defaultScale` on the mapper instead of a scale array. */
export function noScale(publicAPI: object, model: object): GlyphMixinFunction;

/** Writes the states right/up/direction vectors into a 9-component matrix array. */
export function direction(publicAPI: object, model: object): GlyphMixinFunction;

/** Disables orientation by array on the mapper. */
export function noOrientation(
  publicAPI: object,
  model: object
): GlyphMixinFunction;

/**
 * Method use to decorate a given object (publicAPI+model) with vtkGlyphRepresentation characteristics.
 *
 * Delegates to vtkContextRepresentation when `initialValues.behavior` is
 * `Behavior.CONTEXT`, and to vtkHandleRepresentation otherwise.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IGlyphRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IGlyphRepresentationInitialValues
): void;

export function newInstance(
  initialValues?: IGlyphRepresentationInitialValues
): vtkGlyphRepresentation;

/**
 * vtkGlyphRepresentation renders one glyph per widget state through a
 * vtkGlyph3DMapper. The position, color, scale and orientation of the glyphs
 * are filled by mixin functions selected from the mixins the states actually
 * carry.
 */
export declare const vtkGlyphRepresentation: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkGlyphRepresentation;
