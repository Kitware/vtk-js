import vtkPoints from '../../../Common/Core/Points';
import vtkPolyData from '../../../Common/DataModel/PolyData';
import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';

/**
 *
 */
export interface IWindowedSincPolyDataFilterInitialValues {
  numberOfIterations?: number;
  passBand?: number;
  featureAngle?: number;
  edgeAngle?: number;
  featureEdgeSmoothing?: number;
  boundarySmoothing?: number;
  nonManifoldSmoothing?: number;
  generateErrorScalars?: number;
  generateErrorVectors?: number;
  normalizeCoordinates?: number;
}

type vtkWindowedSincPolyDataFilterBase = vtkObject & vtkAlgorithm;

export interface vtkWindowedSincPolyDataFilter extends vtkWindowedSincPolyDataFilterBase {
  /**
   * Get whether points on the boundary of the mesh are smoothed.
   */
  getBoundarySmoothing(): number;

  /**
   * Get the angle, in degrees, above which an edge between two adjacent
   * boundary or feature edges is considered sharp and its vertex is fixed.
   */
  getEdgeAngle(): number;

  /**
   * Get the angle, in degrees, above which the edge between two adjacent
   * polygons is a feature edge.
   */
  getFeatureAngle(): number;

  /**
   * Get whether feature edges are smoothed.
   */
  getFeatureEdgeSmoothing(): number;

  /**
   * Get whether a scalar array holding the distance each point moved is added
   * to the output.
   */
  getGenerateErrorScalars(): number;

  /**
   * Get whether a vector array holding the displacement of each point is added
   * to the output.
   */
  getGenerateErrorVectors(): number;

  /**
   * Get whether the coordinates are normalized to the unit cube before
   * smoothing and restored afterwards.
   */
  getNormalizeCoordinates(): number;

  /**
   * Get whether non-manifold vertices are smoothed.
   */
  getNonManifoldSmoothing(): number;

  /**
   * Get the degree of the Chebyshev polynomial approximating the filter.
   */
  getNumberOfIterations(): number;

  /**
   * Get the pass band of the windowed sinc filter, in [0, 2].
   */
  getPassBand(): number;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set whether points on the boundary of the mesh are smoothed.
   * @param {Number} boundarySmoothing
   */
  setBoundarySmoothing(boundarySmoothing: number): boolean;

  /**
   * Set the angle, in degrees, above which an edge between two adjacent
   * boundary or feature edges is considered sharp and its vertex is fixed.
   * @param {Number} edgeAngle
   */
  setEdgeAngle(edgeAngle: number): boolean;

  /**
   * Set the angle, in degrees, above which the edge between two adjacent
   * polygons is a feature edge.
   * @param {Number} featureAngle
   */
  setFeatureAngle(featureAngle: number): boolean;

  /**
   * Set whether feature edges are smoothed.
   * @param {Number} featureEdgeSmoothing
   */
  setFeatureEdgeSmoothing(featureEdgeSmoothing: number): boolean;

  /**
   * Set whether a scalar array holding the distance each point moved is added
   * to the output.
   * @param {Number} generateErrorScalars
   */
  setGenerateErrorScalars(generateErrorScalars: number): boolean;

  /**
   * Set whether a vector array holding the displacement of each point is added
   * to the output.
   * @param {Number} generateErrorVectors
   */
  setGenerateErrorVectors(generateErrorVectors: number): boolean;

  /**
   * Set whether the coordinates are normalized to the unit cube before
   * smoothing and restored afterwards.
   * @param {Number} normalizeCoordinates
   */
  setNormalizeCoordinates(normalizeCoordinates: number): boolean;

  /**
   * Set whether non-manifold vertices are smoothed.
   * @param {Number} nonManifoldSmoothing
   */
  setNonManifoldSmoothing(nonManifoldSmoothing: number): boolean;

  /**
   * Set the degree of the Chebyshev polynomial approximating the filter.
   * @param {Number} numberOfIterations
   */
  setNumberOfIterations(numberOfIterations: number): boolean;

  /**
   * Set the pass band of the windowed sinc filter, in [0, 2].
   * @param {Number} passBand
   */
  setPassBand(passBand: number): boolean;

  /**
   * Smooth `inPts` using the topology of `inputPolyData` and return the new
   * point set. The error scalars and vectors, when requested, are added to
   * `output`. Returns `inPts` unchanged when there is nothing to smooth.
   * @param {vtkPoints} inPts
   * @param {vtkPolyData} inputPolyData
   * @param {vtkPolyData} output
   */
  vtkWindowedSincPolyDataFilterExecute(
    inPts: Nullable<vtkPoints>,
    inputPolyData: vtkPolyData,
    output: vtkPolyData
  ): Nullable<vtkPoints>;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWindowedSincPolyDataFilter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWindowedSincPolyDataFilterInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWindowedSincPolyDataFilterInitialValues
): void;

/**
 * Method used to create a new instance of vtkWindowedSincPolyDataFilter
 * @param {IWindowedSincPolyDataFilterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWindowedSincPolyDataFilterInitialValues
): vtkWindowedSincPolyDataFilter;

/**
 * vtkWindowedSincPolyDataFilter - adjust point positions using a windowed sinc
 * function interpolation kernel
 *
 * vtkWindowedSincPolyDataFilter adjusts point coordinates using a windowed sinc
 * function interpolation kernel. The effect is to "relax" the mesh, making the
 * cells better shaped and the vertices more evenly distributed. Note that this
 * filter operates on the lines, polygons, and triangle strips composing an
 * instance of vtkPolyData. Vertex or poly-vertex cells are never modified.
 *
 * The algorithm is described in "Optimal Surface Smoothing as Filter Design",
 * G. Taubin, T. Zhang and G. Golub, IBM tech report RC-20404.
 */
export declare const vtkWindowedSincPolyDataFilter: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWindowedSincPolyDataFilter;
