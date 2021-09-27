import { mat4 } from 'gl-matrix';
import { vtkObject } from "../../../interfaces" ;
import { Bounds, Vector3, Range } from '../../../types';

/**
 * 
 */
export interface ICameraInitialValues {
	position?: number[];
	focalPoint?: number[];
	viewUp?: number[];
	directionOfProjection?: number[];
	parallelProjection?: boolean;
	useHorizontalViewAngle?: boolean;
	viewAngle?: number;
	parallelScale?: number;
	clippingRange?: number[];
	windowCenter?: number[];
	viewPlaneNormal?: number[];
	useOffAxisProjection?: boolean;
	screenBottomLeft?: number[];
	screenBottomRight?: number[];
	screenTopRight?: number[];
	freezeFocalPoint?: boolean;
	physicalTranslation?: number[];
	physicalScale?: number;
	physicalViewUp?: number[];
	physicalViewNorth?: number[];
}

export interface vtkCamera extends vtkObject {

	/**
	 * Apply a transform to the camera.
	 * The camera position, focal-point, and view-up are re-calculated 
	 * using the transform's matrix to multiply the old points by the new transform.
	 * @param {mat4} transformMat4 Transform matrix.
	 */
	applyTransform(transformMat4: mat4): void;

	/**
	 * Rotate the camera about the view up vector centered at the focal point.
	 * @param {Number} angle The angle value.
	 */
	azimuth(angle: number): void;

	/**
	 * 
	 * @param {Bounds} bounds The bounds value.
	 */
	computeClippingRange(bounds: Bounds): Range;

	/**
	 * This method must be called when the focal point or camera position changes
	 */
	computeDistance(): void;

	/**
	 * the provided matrix should include translation and orientation only mat
	 * is physical to view
	 * @param {mat4} mat The physical matrix.
	 */
	computeViewParametersFromPhysicalMatrix(mat: mat4): void;

	/**
	 * 
	 * @param {mat4} vmat The view matrix.
	 */
	computeViewParametersFromViewMatrix(vmat: mat4): void;

	/**
	 * Not implemented yet
	 * @param {vtkCamera} sourceCamera The camera source.
	 */
	deepCopy(sourceCamera: vtkCamera): void;

	/**
	 * Move the position of the camera along the view plane normal. Moving
	 * towards the focal point (e.g., > 1) is a dolly-in, moving away
	 * from the focal point (e.g., < 1) is a dolly-out.
	 * @param {Number} amount The amount value.
	 */
	dolly(amount: number): void;

	/**
	 * Rotate the camera about the cross product of the negative of the
	 * direction of projection and the view up vector, using the focal point as
	 * the center of rotation.
	 * @param {Number} angle The angle value.
	 */
	elevation(angle: number): void;

	/**
	 * Not implemented yet
	 */
	getCameraLightTransformMatrix(): void;

	/**
	 * Get the location of the near and far clipping planes along the direction
	 * of projection.
	 */
	getClippingRange(): Range;

	/**
	 * Get the location of the near and far clipping planes along the direction
	 * of projection.
	 */
	getClippingRangeByReference(): Range;

	/**
	 * 
	 * @param {Number} aspect Camera frustum aspect ratio.
	 * @param {Number} nearz Camera frustum near plane.
	 * @param {Number} farz Camera frustum far plane. 
	 */
	getCompositeProjectionMatrix(aspect: number, nearz: number, farz: number): mat4;

	/**
	 * Get the vector in the direction from the camera position to the focal
	 * point.
	 */
	getDirectionOfProjection(): Vector3;

	/**
	 * Get the vector in the direction from the camera position to the focal
	 * point.
	 */
	getDirectionOfProjectionByReference(): Vector3;

	/**
	 * Get the distance from the camera position to the focal point.
	 */
	getDistance(): number;

	/**
	 * Get the focal of the camera in world coordinates.
	 */
	getFocalPoint(): Vector3;

	/**
	 * Get the focal of the camera in world coordinates.
	 */
	getFocalPointByReference(): Vector3;

	/**
	 * Get the value of the FreezeDolly instance variable.
	 */
	getFreezeFocalPoint(): boolean;

	/**
	 * Not implemented yet
	 * Get the plane equations that bound the view frustum.
	 * @param {Number} aspect Camera frustum aspect ratio.
	 */
	getFrustumPlanes(aspect: number): void;

	/**
	 * Not implemented yet
	 * Get the orientation of the camera.
	 */
	getOrientation(): void;

	/**
	 * Not implemented yet
	 * Get the orientation of the camera.
	 */
	getOrientationWXYZ(): void;

	/**
	 * Get the value of the ParallelProjection instance variable.
	 * This determines if the camera should do a perspective or parallel projection.
	 */
	getParallelProjection(): boolean;

	/**
	 * Get the scaling used for a parallel projection.
	 */
	getParallelScale(): number;

	/**
	 * 
	 */
	getPhysicalScale(): number;

	/**
	 * 
	 * @param {mat4} result The world matrix.
	 */
	getPhysicalToWorldMatrix(result: mat4): void;

	/**
	 * 
	 */
	getPhysicalTranslation(): number[];

	/**
	 * 
	 */
	getPhysicalTranslationByReference(): number[];

	/**
	 * 
	 */
	getPhysicalViewNorth(): number[];

	/**
	 * 
	 */
	getPhysicalViewNorthByReference(): number[];

	/**
	 * 
	 */
	getPhysicalViewUp(): number[];

	/**
	 * 
	 */
	getPhysicalViewUpByReference(): number[];

	/**
	 * Get the position of the camera in world coordinates.
	 */
	getPosition(): Vector3;

	/**
	 * Get the position of the camera in world coordinates.
	 */
	getPositionByReference(): Vector3;

	/**
	 * Get the projection matrix.
	 * @param {Number} aspect Camera frustum aspect ratio.
	 * @param {Number} nearz Camera frustum near plane.
	 * @param {Number} farz Camera frustum far plane.
	 */
	getProjectionMatrix(aspect: number, nearz: number, farz: number): mat4;

	/**
	 * Not implemented yet
	 * Get the roll angle of the camera about the direction of projection.
	 */
	getRoll(): void;

	/**
	 * Get top left corner point of the screen.
	 */
	getScreenBottomLeft(): Vector3;

	/**
	 * 
	 */
	getScreenBottomLeftByReference(): Vector3;

	/**
	 * Get bottom left corner point of the screen
	 */
	getScreenBottomRight(): Vector3;

	/**
	 * 
	 */
	getScreenBottomRightByReference(): Vector3;

	/**
	 * 
	 */
	getScreenTopRight(): Vector3;

	/**
	 * 
	 */
	getScreenTopRightByReference(): Vector3;

	/**
	 * Get the center of the window in viewport coordinates.
	 */
	getThickness(): number;

	/**
	 * Get the value of the UseHorizontalViewAngle.
	 */
	getUseHorizontalViewAngle(): boolean;

	/**
	 * Get use offaxis frustum.
	 */
	getUseOffAxisProjection(): boolean;

	/**
	 * Get the camera view angle.
	 */
	getViewAngle(): number;

	/**
	 *
	 */
	getViewMatrix(): mat4;

	/**
	 * Get the ViewPlaneNormal.
	 * This vector will point opposite to the direction of projection, 
	 * unless you have created a sheared output view using SetViewShear/SetObliqueAngles.
	 */
	getViewPlaneNormal(): Vector3;

	/**
	 * Get the ViewPlaneNormal by reference.
	 */
	getViewPlaneNormalByReference(): Vector3;

	/**
	 * Get ViewUp vector.
	 */
	getViewUp(): Vector3;

	/**
	 * Get ViewUp vector by reference.
	 */
	getViewUpByReference(): Vector3;

	/**
	 * Get the center of the window in viewport coordinates.
	 * The viewport coordinate range is ([-1,+1],[-1,+1]). 
	 */
	getWindowCenter(): Range;

	/**
	 *
	 */
	getWindowCenterByReference(): Range;

	/**
	 * 
	 * @param {mat4} result 
	 */
	getWorldToPhysicalMatrix(result: mat4): void;

	/**
	 * Recompute the ViewUp vector to force it to be perpendicular to
	 * camera.focalpoint vector.
	 */
	orthogonalizeViewUp(): void;

	/**
	 * 
	 * @param {Number[]} ori 
	 */
	physicalOrientationToWorldDirection(ori: number[]): any;

	/**
	 * Rotate the focal point about the cross product of the view up vector and
	 * the direction of projection, using the camera's position as the center of
	 * rotation.
	 * @param {Number} angle The value of the angle.
	 */
	pitch(angle: number): void;

	/**
	 * Rotate the camera about the direction of projection.
	 * @param {Number} angle The value of the angle.
	 */
	roll(angle: number): void;

	/**
	 * Set the location of the near and far clipping planes along the direction
	 * of projection.
	 * @param {Number} near The near clipping planes.
	 * @param {Number} far The far clipping planes.
	 */
	setClippingRange(near: number, far: number): boolean;

	/**
	 * Set the location of the near and far clipping planes along the direction
	 * of projection.
	 * @param {Range} clippingRange 
	 */
	setClippingRange(clippingRange: Range): boolean;

	/**
	 * Set the location of the near and far clipping planes along the direction
	 * of projection.
	 * @param {Range} clippingRange 
	 */
	setClippingRangeFrom(clippingRange: Range): boolean;

	/**
	 * Used to handle convert js device orientation angles
	 * when you use this method the camera will adjust to the
	 * device orientation such that the physicalViewUp you set
	 * in world coordinates looks up, and the physicalViewNorth
	 * you set in world coorindates will (maybe) point north
	 * 
	 * NOTE WARNING - much of the documentation out there on how
	 * orientation works is seriously wrong. Even worse the Chrome
	 * device orientation simulator is completely wrong and should
	 * never be used. OMG it is so messed up.
	 * 
	 * how it seems to work on iOS is that the device orientation
	 * is specified in extrinsic angles with a alpha, beta, gamma
	 * convention with axes of Z, X, Y (the code below substitutes
	 * the physical coordinate system for these axes to get the right
	 * modified coordinate system.
	 * @param {Number} alpha The value of the alpha.
	 * @param {Number} beta The value of the beta.
	 * @param {Number} gamma The value of the gamma.
	 * @param {Number} screen The value of the screen.
	 */
	setDeviceAngles(alpha: number, beta: number, gamma: number, screen: number): boolean;

	/**
	 * Set the direction of projection.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setDirectionOfProjection(x: number, y: number, z: number): boolean;

	/**
	 * Move the focal point so that it is the specified distance from the camera
	 * position.
	 * 
	 * This distance must be positive.
	 * @param {Number} distance The value of the distance.
	 */
	setDistance(distance: number): boolean;

	/**
	 * Set the focal of the camera in world coordinates.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setFocalPoint(x: number, y: number, z: number): boolean;

	/**
	 * Set the focal of the camera in world coordinates.
	 * @param {Vector3} focalPoint 
	 */
	setFocalPointFrom(focalPoint: Vector3): boolean;

	/**
	 * Not implement yet
	 * Set the oblique viewing angles.
	 * The first angle, alpha, is the angle (measured from the horizontal) that
	 * rays along the direction of projection will follow once projected onto
	 * the 2D screen. The second angle, beta, is the angle between the view
	 * plane and the direction of projection. This creates a shear transform x'
	 * = x + dz*cos(alpha)/tan(beta), y' = dz*sin(alpha)/tan(beta) where dz is
	 * the distance of the point from the focal plane. The angles are (45,90) by
	 * default. Oblique projections commonly use (30,63.435).
	 * 
	 * @param {Number} alpha The aplha angle value.
	 * @param {Number} beta The beta angle value.
	 */
	setObliqueAngles(alpha: number, beta: number): boolean;

	/**
	 * Set the value of the OrientationWXYZ.
	 * @param {Number} degrees 
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setOrientationWXYZ(degrees: number, x: number, y: number, z: number): boolean;

	/**
	 * Set the value of the ParallelProjection.
	 * @param {Boolean} parallelProjection The value of the parallelProjection.
	 */
	setParallelProjection(parallelProjection: boolean): boolean;

	/**
	 * Set the value of the parallelScale.
	 * @param {Number} parallelScale The value of the parallelScale.
	 */
	setParallelScale(parallelScale: number): boolean;

	/**
	 * Set the value of the physicalScale.
	 * @param {Number} physicalScale The value of the the physicalScale.
	 */
	setPhysicalScale(physicalScale: number): boolean;

	/**
	 * Set the value of the physicalTranslation.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setPhysicalTranslation(x: number, y: number, z: number): boolean;

	/**
	 * Set the value of the physicalTranslation.
	 * @param {Number[]} physicalTranslation The value of the physicalTranslation.
	 */
	setPhysicalTranslationFrom(physicalTranslation: number[]): boolean;

	/**
	 * 
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setPhysicalViewNorth(x: number, y: number, z: number): boolean;

	/**
	 * 
	 * @param {Number[]} physicalViewNorth 
	 */
	setPhysicalViewNorthFrom(physicalViewNorth: number[]): boolean;

	/**
	 * 
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setPhysicalViewUp(x: number, y: number, z: number): boolean;

	/**
	 * 
	 * @param {Number[]} physicalViewUp 
	 */
	setPhysicalViewUpFrom(physicalViewUp: number[]): boolean;

	/**
	 * Set the position of the camera in world coordinates.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setPosition(x: number, y: number, z: number): boolean;

	/**
	 * 
	 * @param {mat4} mat 
	 */
	setProjectionMatrix(mat: mat4): boolean;

	/**
	 * Set the roll angle of the camera about the direction of projection.
	 * @todo Not implemented yet
	 * @param {Number} angle The value of the roll angle.
	 */
	setRoll(angle: number): boolean;

	/**
	 * Set top left corner point of the screen.
	 * 
	 * This will be used only for offaxis frustum calculation.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setScreenBottomLeft(x: number, y: number, z: number): boolean;

	/**
	 * Set top left corner point of the screen.
	 * 
	 * This will be used only for offaxis frustum calculation.
	 * @param {Vector3} screenBottomLeft The screenBottomLeft coordiante.
	 */
	setScreenBottomLeft(screenBottomLeft: Vector3): boolean;

	/**
	 * Set top left corner point of the screen.
	 * @param {Vector3} screenBottomLeft The screenBottomLeft coordiante.
	 */
	setScreenBottomLeftFrom(screenBottomLeft: Vector3): boolean;

	/**
	 * 
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setScreenBottomRight(x: number, y: number, z: number): boolean;

	/**
	 * Set bottom right corner point of the screen.
	 * @param {Vector3} screenBottomRight The screenBottomRight coordiante.
	 */
	setScreenBottomRight(screenBottomRight: Vector3): boolean;

	/**
	 * Set bottom right corner point of the screen.
	 * @param {Vector3} screenBottomRight The screenBottomRight coordiante.
	 */
	setScreenBottomRightFrom(screenBottomRight: Vector3): boolean;

	/**
	 * Set top right corner point of the screen.
	 * 
	 * This will be used only for offaxis frustum calculation.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setScreenTopRight(x: number, y: number, z: number): boolean;

	/**
	 * Set top right corner point of the screen.
	 * 
	 * This will be used only for offaxis frustum calculation.
	 * @param {Vector3} screenTopRight The screenTopRight coordiante.
	 */
	setScreenTopRight(screenTopRight: Vector3): boolean;

	/**
	 * Set top right corner point of the screen.
	 * @param {Vector3} screenTopRight The screenTopRight coordiante.
	 */
	setScreenTopRightFrom(screenTopRight: Vector3): boolean;

	/**
	 * Set the distance between clipping planes.
	 * 
	 * This method adjusts the far clipping plane to be set a distance
	 * 'thickness' beyond the near clipping plane.
	 * @param {Number} thickness 
	 */
	setThickness(thickness: number): boolean;

	/**
	 * 
	 * @param {Number} thickness The value of the thickness.
	 */
	setThicknessFromFocalPoint(thickness: number): boolean;

	/**
	 * Set the value of the useHorizontalViewAngle.
	 * @param {Boolean} useHorizontalViewAngle The value of the useHorizontalViewAngle.
	 */
	setUseHorizontalViewAngle(useHorizontalViewAngle: boolean): boolean;
	
	/**
	 * Set use offaxis frustum.
	 * 
	 * OffAxis frustum is used for off-axis frustum calculations specifically for
	 * stereo rendering. For reference see "High Resolution Virtual Reality", in
	 * Proc. SIGGRAPH '92, Computer Graphics, pages 195-202, 1992.
	 * @param {Boolean} useOffAxisProjection The value of the useOffAxisProjection.
	 */
	setUseOffAxisProjection(useOffAxisProjection: boolean): boolean;

	/**
	 * Set the camera view angle, which is the angular height of the camera view
	 * measured in degrees.
	 * @param {Number} viewAngle The value of the viewAngle.
	 */
	setViewAngle(viewAngle: number): boolean;

	/**
	 * Set the view matrix for the camera.
	 * @param {mat4} mat The value of the view matrix.
	 */
	setViewMatrix(mat: mat4): boolean;

	/**
	 * Set the view up direction for the camera.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setViewUp(x: number, y: number, z: number): boolean;

	/**
	 * Set the view up direction for the camera.
	 * @param {Vector3} viewUp The viewUp coordinate.
	 */
	setViewUp(viewUp: Vector3): boolean;

	/**
	 * Set the view up direction for the camera.
	 * @param {Vector3} viewUp The viewUp coordinate.
	 */
	setViewUpFrom(viewUp: Vector3): boolean;

	/**
	 * Set the center of the window in viewport coordinates.
	 * 
	 * The viewport coordinate range is ([-1,+1],[-1,+1]).
	 * 
	 * This method is for if you have one window which consists of several
	 * viewports, or if you have several screens which you want to act together
	 * as one large screen.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 */
	setWindowCenter(x: number, y: number): boolean;

	/**
	 * Set the center of the window in viewport coordinates from an array.
	 * @param {Range} windowCenter 
	 */
	setWindowCenterFrom(windowCenter: Range): boolean;

	/**
	 * 
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	translate(x: number, y: number, z: number): void;

	/**
	 * Rotate the focal point about the view up vector, using the camera's
	 * position as the center of rotation.
	 * @param {Number} angle The value of the angle.
	 */
	yaw(angle: number): void;

	/**
	 * In perspective mode, decrease the view angle by the specified factor.
	 * @param {Number} factor The value of the zoom factor.
	 */
	zoom(factor: number): void;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkRenderer characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICameraInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ICameraInitialValues): void;

/**
 * Method use to create a new instance of vtkCamera with its focal point at the origin, 
 * and position=(0,0,1). The view up is along the y-axis, view angle is 30 degrees, 
 * and the clipping range is (.1,1000).
 * @param {ICameraInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ICameraInitialValues): vtkCamera;

/** 
 * vtkCamera is a virtual camera for 3D rendering. It provides methods
 * to position and orient the view point and focal point. Convenience
 * methods for moving about the focal point also are provided. More
 * complex methods allow the manipulation of the computer graphics model 
 * including view up vector, clipping planes, and camera perspective.
 */
export declare const vtkCamera: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkCamera;
