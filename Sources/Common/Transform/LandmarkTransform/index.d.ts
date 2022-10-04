import { mat4 } from 'gl-matrix';
import { vtkObject } from '../../../interfaces';
import vtkPoints from '../../Core/Points';

export enum Mode {
	RIGID_BODY,
	SIMILARITY,
	AFFINE,
}

export interface ILandmarkTransformInitialValues { 
	mode?: Mode;
}


export interface vtkLandmarkTransform extends vtkObject {

	/**
	 * Mat4 matrix, result of the landmark transform.
	 * If vtkLandmarkTransformed failed, default is identity.
	 */
	getMatrix(): mat4;

	/**
	 * Get the number of degrees of freedom to constrain the solution to.
	 */
	getMode(): Mode;

	/**
	 * Get list of 3D points which defines the source points.
	 */
	getSourceLandmark(): vtkPoints;

	/**
	 * Get list of 3D points which defines the target points.
	 */
	getTargetLandmark(): vtkPoints;

	/**
	 * Set the number of degrees of freedom to constrain the solution to:
	 * 
	 * - `Mode.RIGID_BODY` : Rotation and translation onlu
	 * - `Mode.SIMILARITY` : rotation, translation and isotropic scaling
	 * - `Mode.AFFINE` : collinearity is preserved. Ratios of distances along a line are preserved.
	 * 
	 * @param {Mode} mode The value of mode.
	 * @default SIMILARITY
	 */
	setMode(mode: Mode): boolean;

	/**
	 * Set list of 3D points which defines the source points.
	 * @param {vtkPoints} sourceLandmark 
	 */
	setSourceLandmark(sourceLandmark: vtkPoints): boolean;

	/**
	 * Set list of 3D points which defines the target points.
	 * @param {vtkPoints} targetLandmark 
	 */
	setTargetLandmark(targetLandmark: vtkPoints): boolean;

	/**
	 * Launch the computation of the matrix according to target and source
	 * points.
	 */
	update(): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkLandmarkTransform characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ILandmarkTransformInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ILandmarkTransformInitialValues): void;

/**
 * Method used to create a new instance of vtkLandmarkTransform.
 * @param {ILandmarkTransformInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ILandmarkTransformInitialValues): vtkLandmarkTransform;


/**
 * vtkLandmarkTransform is a cell which representant a triangle. It contains static
 * method to make some computations directly link to triangle.
 * 
 * @example
 * '''js
 * import vtkLandmarkTransform from '@kitware/vtk.js/Common/Transform/LandmarkTransform';
 * 
 * const transform = LandmarkTransform.New();
 * transform.setMode(Mode.RIGID_BODY);
 * transform.setSourceLandmark(...); // vtkPoints
 * transform.setTargetLandmark(...); // vtkPoints
 * transform.update();
 * const transformMatrix = transform.getMatrix();
 * '''
 */
export declare const vtkLandmarkTransform: {
	newInstance: typeof newInstance,
	extend: typeof extend;
};
export default vtkLandmarkTransform;
