import vtkActor from "vtk.js/Sources/Rendering/Core/Actor";
import vtkCamera  from 'vtk.js/Sources/Rendering/Core/Camera';

/**
 * 
 */
interface IFollowerInitialValues {
	viewUp?: number[],
	useViewUp?: boolean,
	camera?: vtkCamera,
}

/**
 * 
 */
export interface vtkFollower extends vtkActor {
	/**
	 * 
	 */
	computeMatrix(): void;

	/**
	 * Get the camera to follow.
	 */
	getCamera(): vtkCamera;

	/**
	 * 
	 */
	getUseViewUp(): boolean;

	/**
	 * 
	 */
	getViewUp(): number[];

	/**
	 * 
	 */
	getViewUpByReference(): number[];

	/**
	 * Set the camera to follow.
	 * If this is not set, then the follower won't know who to follow.
	 * @param camera 
	 */
	setCamera(camera: vtkCamera): boolean;

	/**
	 * 
	 * @param useViewUp 
	 */
	setUseViewUp(useViewUp: boolean): boolean;

	/**
	 * 
	 * @param viewUp 
	 */
	setViewUp(viewUp: number[]): boolean;

}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkFollower characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IFollowerInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IFollowerInitialValues): void;

/**
 * Method use to create a new instance of vtkFollower
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues?: object): vtkFollower;

export declare const vtkFollower: {
    newInstance: typeof newInstance,
    extend: typeof extend,
};
export default vtkFollower;
