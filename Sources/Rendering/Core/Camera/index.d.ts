/// <reference path='../../../types.ts' />

import { mat4 } from 'gl-matrix';
import { VtkObject } from 'vtk.js/Sources/macro';

/**
 * 
 */
interface ICameraInitialValues {
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

export interface vtkCamera extends VtkObject {

	/**
	 * Apply a transform to the camera.
	 * The camera position, focal-point, and view-up are re-calculated 
	 * using the transform's matrix to multiply the old points by the new transform.
	 * @param transformMat4 
	 */
	applyTransform(transformMat4: mat4): void;

	/**
	 * Rotate the camera about the view up vector centered at the focal point.
	 * @param {Number} angle 
	 */
	azimuth(angle: number): void;

	/**
	 * 
	 * @param {Number} bounds 
	 */
	computeClippingRange(bounds: number[]): number[];

	/**
	 * This method must be called when the focal point or camera position changes
	 */
	computeDistance(): void;

	/**
	 * the provided matrix should include
	 * translation and orientation only
	 * mat is physical to view
	 * @param {mat4} mat 
	 */
	computeViewParametersFromPhysicalMatrix(mat: mat4): void;

	/**
	 * 
	 * @param {mat4} vmat 
	 */
	computeViewParametersFromViewMatrix(vmat: mat4): void;

	/**
	 * Not implemented yet
	 * @param {vtkCamera} sourceCamera 
	 */
	deepCopy(sourceCamera: vtkCamera): void;

	/**
	 * Move the position of the camera along the view plane normal. Moving
	 * towards the focal point (e.g., > 1) is a dolly-in, moving away
	 * from the focal point (e.g., < 1) is a dolly-out.
	 * @param {Number} amount 
	 */
	dolly(amount: number): void;

	/**
	 * Rotate the camera about the cross product of the negative of the direction of projection and the view up vector, using the focal point as the center of rotation.
	 * @param {Number} angle 
	 */
	elevation(angle: number): void;

	/**
	 * Not implemented yet
	 */
	getCameraLightTransformMatrix(): void;

	/**
	 * 
	 * @default [0.01, 1000.01],
	 */
	getClippingRange(): number[];

	/**
	 * 
	 * @default [0.01, 1000.01],
	 */
	getClippingRangeByReference(): number[];

	/**
	 * 
	 * @param {Number} aspect Camera frustum aspect ratio.
	 * @param {Number} nearz Camera frustum near plane.
	 * @param {Number} farz Camera frustum far plane. 
	 */
	getCompositeProjectionMatrix(aspect: number, nearz: number, farz: number): mat4;

	/**
	 * Get the vector in the direction from the camera position to the focal point.
	 * @default [0, 0, -1],
	 */
	getDirectionOfProjection(): number[];

	/**
	 * 
	 * @default [0, 0, -1],
	 */
	getDirectionOfProjectionByReference(): number[];

	/**
	 * Get the distance from the camera position to the focal point.
	 */
	getDistance(): number;

	/**
	 * 
	 * @default [0, 0, 0]
	 */
	getFocalPoint(): number[];

	/**
	 * 
	 */
	getFocalPointByReference(): number[];

	/**
	 * 
	 * @default false
	 */
	getFreezeFocalPoint(): boolean;

	/**
	 * Not implemented yet
	 * @param {Number} aspect Camera frustum aspect ratio.
	 */
	getFrustumPlanes(aspect: number): void;

	/**
	 * Not implemented yet
	 */
	getOrientation(): void;

	/**
	 * Not implemented yet
	 */
	getOrientationWXYZ(): void;

	/**
	 *
	 * @default false
	 */
	getParallelProjection(): boolean;

	/**
	 * 
	 * @default 1
	 */
	getParallelScale(): number;

	/**
	 * 
	 * @default 1.0
	 */
	getPhysicalScale(): number;

	/**
	 * 
	 * @param {mat4} result 
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
	 * @default [0, 0, -1],
	 */
	getPhysicalViewNorth(): number[];

	/**
	 * 
	 */
	getPhysicalViewNorthByReference(): number[];

	/**
	 * 
	 * @default [0, 1, 0]
	 */
	getPhysicalViewUp(): number[];

	/**
	 * 
	 */
	getPhysicalViewUpByReference(): number[];

	/**
	 * Get the position of the camera in world coordinates. 
	 * @default [0, 0, 1]
	 */
	getPosition(): number[];

	/**
	 * 
	 */
	getPositionByReference(): number[];

	/**
	 * 
	 * @param {Number} aspect Camera frustum aspect ratio.
	 * @param {Number} nearz Camera frustum near plane.
	 * @param {Number} farz Camera frustum far plane. 
	 * @default null
	 */
	getProjectionMatrix(aspect: number, nearz: number, farz: number): null | mat4;

	/**
	 * Not implemented yet
	 * Get the roll angle of the camera about the direction of projection.
	 */
	getRoll(): void;

	/**
	 * Get top left corner point of the screen.
	 * @default [-0.5, -0.5, -0.5]
	 */
	getScreenBottomLeft(): number[];

	/**
	 * 
	 * @default [-0.5, -0.5, -0.5]
	 */
	getScreenBottomLeftByReference(): number[];

	/**
	 * Get bottom left corner point of the screen
	 * @default [0.5, -0.5, -0.5]
	 */
	getScreenBottomRight(): number[];

	/**
	 * 
	 * @default [0.5, -0.5, -0.5]
	 */
	getScreenBottomRightByReference(): number[];

	/**
	 * 
	 * @default [0.5, 0.5, -0.5]
	 */
	getScreenTopRight(): number[];

	/**
	 * 
	 * @default [0.5, 0.5, -0.5]
	 */
	getScreenTopRightByReference(): number[];

	/**
	 * Get the center of the window in viewport coordinates.
	 * @return  
	 */
	getThickness(): number;

	/**
	 * Get the value of the UseHorizontalViewAngle instance variable.
	 * @default false
	 */
	getUseHorizontalViewAngle(): boolean;

	/**
	 * Get use offaxis frustum.
	 * @default false
	 */
	getUseOffAxisProjection(): boolean;

	/**
	 * Get the camera view angle.
	 * @default 30
	 */
	getViewAngle(): number;

	/**
	 *
	 * @default null
	 */
	getViewMatrix(): null | mat4;

	/**
	 * Get the ViewPlaneNormal.
	 * This vector will point opposite to the direction of projection, 
	 * unless you have created a sheared output view using SetViewShear/SetObliqueAngles.
	 * @default [0, 0, 1]
	 */
	getViewPlaneNormal(): number[];

	/**
	 * Get the ViewPlaneNormal by reference.
	 */
	getViewPlaneNormalByReference(): number[];

	/**
	 * Get ViewUp vector.
	 * @default [0, 1, 0]
	 */
	getViewUp(): number[];

	/**
	 * Get ViewUp vector by reference.
	 * @default [0, 1, 0]
	 */
	getViewUpByReference(): number[];

	/**
	 * Get the center of the window in viewport coordinates.
	 * The viewport coordinate range is ([-1,+1],[-1,+1]). 
	 * @default [0, 0]
	 */
	getWindowCenter(): number[];

	/**
	 *
	 * @default [0, 0]
	 */
	getWindowCenterByReference(): number[];

	/**
	 * 
	 * @param {mat4} result 
	 */
	getWorldToPhysicalMatrix(result: mat4): void;

	/**
	 * Recompute the ViewUp vector to force it to be perpendicular to camera->focalpoint vector.
	 */
	orthogonalizeViewUp(): void;

	/**
	 * 
	 * @param {Number[]} ori 
	 */
	physicalOrientationToWorldDirection(ori: number[]): any;

	/**
	 * Rotate the focal point about the cross product of the view up vector and the direction of projection, using the camera's position as the center of rotation.
	 * @param {Number} angle 
	 */
	pitch(angle: number): void;

	/**
	 * Rotate the camera about the direction of projection.
	 * @param {Number} angle 
	 */
	roll(angle: number): void;

	/**
	 * Set the location of the near and far clipping planes along the direction
	 * of projection.
	 * @param {Number} near 
	 * @param {Number} far 
	 */
	setClippingRange(near: number, far: number): boolean;

	/**
	 * Set the location of the near and far clipping planes along the direction
	 * of projection.
	 * @param {Number[]} clippingRange 
	 */
	setClippingRange(clippingRange: number[]): boolean;

	/**
	 * 
	 * @param {Number[]} clippingRange 
	 */
	setClippingRangeFrom(clippingRange: number[]): boolean ;

	/**
	 * used to handle convert js device orientation angles
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
	 * @param {Number} alpha 
	 * @param {Number} beta 
	 * @param {Number} gamma 
	 * @param {Number} screen 
	 */
	setDeviceAngles(alpha: number, beta: number, gamma: number, screen: number): boolean;
	
	/**
	 * 
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setDirectionOfProjection(x: number, y: number, z: number): boolean;

	/**
	 * 
	 * @param {Number} distance 
	 */
	setDistance(distance: number): boolean;

	/**
	 * 
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setFocalPoint(x: number, y: number, z: number): boolean;

	/**
	 * 
	 * @param {Number[]} focalPoint 
	 */
	setFocalPointFrom(focalPoint: number[]): boolean;

	/**
	 * Not implement yet
	 * Set the oblique viewing angles.
	 * The first angle, alpha, is the angle (measured from the horizontal) that rays along 
	 * the direction of projection will follow once projected onto the 2D screen. 
	 * The second angle, beta, is the angle between the view plane and the direction of projection. 
	 * This creates a shear transform x' = x + dz*cos(alpha)/tan(beta), y' = dz*sin(alpha)/tan(beta) where dz is the distance of the point from the focal plane. 
	 * The angles are (45,90) by default. Oblique projections commonly use (30,63.435).
	 * 
	 * @param {Number} alpha 
	 * @param {Number} beta 
	 */
	setObliqueAngles(alpha: number, beta: number): boolean;

	/**
	 * 
	 * @param {Number} degrees 
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setOrientationWXYZ(degrees: number, x: number, y: number, z: number): boolean;

	/**
	 * 
	 * @param {Boolean} parallelProjection 
	 */
	setParallelProjection(parallelProjection: boolean): boolean;

	/**
	 * 
	 * @param {Number} parallelScale 
	 */
	setParallelScale(parallelScale: number): boolean;

	/**
	 * 
	 * @param {Number} physicalScale 
	 */
	setPhysicalScale(physicalScale: number): boolean;

	/**
	 * 
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setPhysicalTranslation(x: number, y: number, z: number): boolean;

	/**
	 * 
	 * @param {Number[]} physicalTranslation 
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
	 * @param {Number} angle 
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
	 * @param {Number[]} screenBottomLeft 
	 */
	setScreenBottomLeft(screenBottomLeft: number[]): boolean;

	/**
	 * 
	 * @param {Number[]} screenBottomLeft 
	 */
	setScreenBottomLeftFrom(screenBottomLeft: number[]): boolean;

	/**
	 * 
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setScreenBottomRight(x: number, y: number, z: number): boolean;

	/**
	 * 
	 * @param {Number[]} screenBottomRight 
	 */
	setScreenBottomRight(screenBottomRight: number[]): boolean;

	/**
	 * 
	 * @param {Number[]} screenBottomRight 
	 */
	setScreenBottomRightFrom(screenBottomRight: number[]): boolean;

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
	 * @param {Number[]} screenTopRight 
	 */
	setScreenTopRight(screenTopRight: number[]): boolean;

	/**
	 * 
	 * @param {Number[]} screenTopRight 
	 */
	setScreenTopRightFrom(screenTopRight: number[]): boolean;

	/**
	 * Set the distance between clipping planes.
	 * 
	 * This method adjusts the far clipping plane to be set a distance 'thickness' beyond the near clipping plane.
	 * @param {Number} thickness 
	 */
	setThickness(thickness: number): boolean;

	/**
	 * 
	 * @param {Number} thickness 
	 */
	setThicknessFromFocalPoint(thickness: number): boolean;

	/**
	 * 
	 * @param {Boolean} useHorizontalViewAngle 
	 */
	setUseHorizontalViewAngle(useHorizontalViewAngle: boolean): boolean;
	
	/**
	 * Set use offaxis frustum.
	 * 
	 * OffAxis frustum is used for off-axis frustum calculations specifically for
	 * stereo rendering. For reference see "High Resolution Virtual Reality", in
	 * Proc. SIGGRAPH '92, Computer Graphics, pages 195-202, 1992.
	 * @param {Boolean} useOffAxisProjection 
	 */
	setUseOffAxisProjection(useOffAxisProjection: boolean): boolean;

	/**
	 * Set the camera view angle, which is the angular height of the camera view measured in degrees.
	 * @param {Number} viewAngle 
	 */
	setViewAngle(viewAngle: number): boolean;

	/**
	 * 
	 * @param {mat4} mat 
	 */
	setViewMatrix(mat: mat4): boolean;

	/**
	 * 
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setViewUp(x: number, y: number, z: number): boolean;

	/**
	 * 
	 * @param {Number[]} viewUp
	 */
	setViewUp(viewUp: number[]): boolean;

	/**
	 * 
	 * @param {Number[]} viewUp 
	 */
	setViewUpFrom(viewUp: number[]): boolean;

	/**
	 * Set the center of the window in viewport coordinates.
	 * The viewport coordinate range is ([-1,+1],[-1,+1]). 
	 * This method is for if you have one window which consists of several viewports, or if you have several screens which you want to act together as one large screen
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 */
	setWindowCenter(x: number, y: number): boolean;

	/**
	 * Set the center of the window in viewport coordinates from an array.
	 * @param {Number[]} windowCenter 
	 */
	setWindowCenterFrom(windowCenter: number[]): boolean;

	/**
	 * 
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	translate(x: number, y: number, z: number): void;

	/**
	 * Rotate the focal point about the view up vector, using the camera's position as the center of rotation.
	 * @param {Number} angle 
	 */
	yaw(angle: number): void;

	/**
	 * In perspective mode, decrease the view angle by the specified factor.
	 * @param {Number} factor 
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
