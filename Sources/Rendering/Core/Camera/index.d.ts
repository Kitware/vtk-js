import VtkObject from '../../../macro';

export interface vtkCamera extends VtkObject {
    /**
     * 
     */
    orthogonalizeViewUp(): void;

    /**
     * 
     * @param x 
     * @param y 
     * @param z 
     */
    setPosition(x: number, y: number, z: number): void;

    /**
     * 
     * @param x 
     * @param y 
     * @param z 
     */
    setFocalPoint(x: any, y: any, z: any): void;

    /**
     * 
     * @param d 
     */
    setDistance(d: number): void;

    /**
     * ----------------------------------------------------------------------------
     * This method must be called when the focal point or camera position changes
     */
    computeDistance(): void;

    /**
     * ----------------------------------------------------------------------------
     * Move the position of the camera along the view plane normal. Moving
     * towards the focal point (e.g., > 1) is a dolly-in, moving away
     * from the focal point (e.g., < 1) is a dolly-out.
     * @param amount 
     */
    dolly(amount: any): void;

    /**
     * 
     * @param angle 
     */
    roll(angle: any): void;

    /**
     * 
     * @param angle 
     */
    azimuth(angle: any): void;

    /**
     * 
     * @param angle 
     */
    yaw(angle: any): void;

    /**
     * 
     * @param angle 
     */
    elevation(angle: any): void;

    /**
     * 
     * @param angle 
     */
    pitch(angle: any): void;

    /**
     * 
     * @param factor 
     */
    zoom(factor: any): void;

    /**
     * 
     * @param x 
     * @param y 
     * @param z 
     */
    translate(x: any, y: any, z: any): void;

    /**
     * 
     * @param transformMat4 
     */
    applyTransform(transformMat4: any): void;

    /**
     * 
     * @return  
     */
    getThickness(): number;

    /**
     * 
     * @param thickness 
     */
    setThickness(thickness: any): void;

    /**
     * 
     * @param thickness 
     */
    setThicknessFromFocalPoint(thickness: any): void;

    /**
     * Unimplemented functions
     * @param angle 
     */
    setRoll(angle: any): void;

    /**
     * 
     */
    getRoll(): void;

    /**
     * 
     * @param alpha 
     * @param beta 
     */
    setObliqueAngles(alpha: any, beta: any): void;

    /**
     * 
     */
    getOrientation(): void;

    /**
     * 
     */
    getOrientationWXYZ(): void;

    /**
     * 
     * @param aspect 
     */
    getFrustumPlanes(aspect: any): void;

    /**
     * 
     */
    getCameraLightTransformMatrix(): void;

    /**
     * 
     * @param sourceCamera 
     */
    deepCopy(sourceCamera: any): void;

    /**
     * 
     * @param ori 
     * @return  
     */
    physicalOrientationToWorldDirection(ori: any): any;

    /**
     * 
     * @param result 
     */
    getPhysicalToWorldMatrix(result: any): void;

    /**
     * 
     * @param result 
     */
    getWorldToPhysicalMatrix(result: any): void;

    /**
     * 
     * @param vmat 
     */
    computeViewParametersFromViewMatrix(vmat: any): void;

    /**
     * the provided matrix should include
     * translation and orientation only
     * mat is physical to view
     * @param mat 
     */
    computeViewParametersFromPhysicalMatrix(mat: any): void;

    /**
     * 
     * @param mat 
     */
    setViewMatrix(mat: any): void;

    /**
     * 
     */
    getViewMatrix(): void;

    /**
     * 
     * @param mat 
     */
    setProjectionMatrix(mat: any): void;

    /**
     * 
     * @param aspect 
     * @param nearz 
     * @param farz 
     */
    getProjectionMatrix(aspect: any, nearz: any, farz: any): void;

    /**
     * 
     * @param aspect 
     * @param nearz 
     * @param farz 
     */
    getCompositeProjectionMatrix(aspect: any, nearz: any, farz: any): void;

    /**
     * 
     * @param x 
     * @param y 
     * @param z 
     */
    setDirectionOfProjection(x: any, y: any, z: any): void;

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
     * @param alpha 
     * @param beta 
     * @param gamma 
     * @param screen 
     */
    setDeviceAngles(alpha: any, beta: any, gamma: any, screen: any): void;

    /**
     * 
     * @param degrees 
     * @param x 
     * @param y 
     * @param z 
     */
    setOrientationWXYZ(degrees: any, x: any, y: any, z: any): void;

    /**
     * 
     * @param bounds 
     * @return  
     */
    computeClippingRange(bounds: any): any;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkRenderer characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues ? : {}): void;

/**
 * Method use to create a new instance of vtkCamera with its focal point at the origin, 
 * and position=(0,0,1). The view up is along the y-axis, view angle is 30 degrees, 
 * and the clipping range is (.1,1000).
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues ? : IValues): vtkCamera;

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
