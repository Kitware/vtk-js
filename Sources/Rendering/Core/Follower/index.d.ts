import vtkActor, { IActorInitialValues } from "../Actor";
import vtkCamera  from '../Camera';

/**
 * 
 */
export interface IFollowerInitialValues extends IActorInitialValues {
	viewUp?: number[],
	useViewUp?: boolean,
	camera?: vtkCamera,
}

/**
 * 
 */
export interface vtkFollower extends vtkActor {

	/**
	 * Generate the matrix based on ivars.
	 */
	computeMatrix(): void;

	/**
	 * Get the camera to follow.
	 */
	getCamera(): vtkCamera;

	/**
	 * Check whether the view up vector is used.
	 */
	getUseViewUp(): boolean;

	/**
	 * Get the view up vector.
	 */
	getViewUp(): number[];

	/**
	 * Get a reference to the view up vector.
	 */
	getViewUpByReference(): number[];

	/**
	 * Set the camera to follow.
	 * If this is not set, then the follower won't know what to follow.
	 * @param {vtkCamera} camera 
	 */
	setCamera(camera: vtkCamera): boolean;

	/**
	 * Set whether to use the view up vector.
	 * @param {Boolean} useViewUp 
	 */
	setUseViewUp(useViewUp: boolean): boolean;

	/**
	 * Set the viewUp vector.
	 * @param {Number[]} viewUp The view up vector.
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
 * @param {IFollowerInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IFollowerInitialValues): vtkFollower;

/**
 * vtkFollower is a subclass of Actor that always faces the camera.
 *
 * You must set the camera before use. This class will update the matrix such
 * that the follower always faces the camera. Sepcifically the y axis will up
 * up, the Z axes will point to the camera and the x axis will point to the
 * right. You may need to rotate, scale, position the follower to get your data
 * oriented propoerly for this convention.
 *
 * If useViewUp is set then instea dof using the camera's view up the follow's
 * viewUp will be used. This is usefull in cases where you want up to be locked
 * independent of the camera. This is typically the case for VR or AR
 * annotations where the headset may tilt but text should continue to be
 * relative to a constant view up vector.
 */
export declare const vtkFollower: {
    newInstance: typeof newInstance,
    extend: typeof extend,
};
export default vtkFollower;
