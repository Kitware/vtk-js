import { vtkObject } from "../../../interfaces";
import { Color } from "../../../types";

export interface ILightInitialValues {
    switch?: boolean;
    intensity?: number;
    color?: Color;
    position?: number[];
    focalPoint?: number[];
    positional?: boolean;
    exponent?: number;
    coneAngle?: number;
    attenuationValues?: number[];
    lightType?: string;
    shadowAttenuation?: number;
    direction?: number[];
    directionMTime?: number;
}

export interface vtkLight extends vtkObject {

    /**
     * 
     */
    getAttenuationValues(): number[];

    /**
     * 
     */
    getAttenuationValuesByReference(): number[];
    
    /**
     * 
     */
    getColor(): Color;
    
    /**
     * 
     */
    getColorByReference(): Color;
    
    /**
     * 
     */
    getConeAngle(): number;

    /**
     * 
     */
    getDirection(): number[];

    /**
     * Get the exponent of the cosine used in positional lighting.
     */
    getExponent(): number;
    
    /**
     * Get the focal point.
     */
    getFocalPoint(): number[];
    
    /**
     * Get the focal point.
     */
    getFocalPointByReference(): number[];

    /**
     * Get the brightness of the light
     */
    getIntensity(): number
    
    /**
     * Get the type of the light.
     */
    getLightType(): string

    /**
     * 
     */
    getPosition(): number[];
    
    /**
     * 
     */
    getPositionByReference(): number[];
    
    /**
     * 
     */
    getPositional(): boolean
    
    /**
     * Get the position of the light, modified by the transformation matrix (if it exists).
     */
    getTransformedPosition(): any;

    /**
     * Get the focal point of the light, modified by the transformation matrix (if it exists).
     */
    getTransformedFocalPoint(): number[];
    
    /**
     * Set the quadratic attenuation constants.
     * @param a 
     * @param b 
     * @param c 
     */
    setAttenuationValues(a: number, b: number, c: number): boolean;
    
    /**
     * Set the quadratic attenuation constants from an array.
     * @param attenuationValues 
     */
    setAttenuationValuesFrom(attenuationValues: number[]): boolean;

    /**
     * Set the color of the object
     * @param {Number} r Defines the red component (between 0 and 1).
     * @param {Number} g Defines the green component (between 0 and 1).
     * @param {Number} b Defines the blue component (between 0 and 1).
     */
    setColor(r: number, g: number, b: number): boolean;

    /**
     * 
     * @param {Number[]} color 
     */
    setColorFrom(color: number[]): boolean;

    /**
     * Set the lighting cone angle of a positional light in degrees.
     * This is the angle between the axis of the cone and a ray along the edge of the cone. 
     * A value of 90 (or more) indicates that you want no spot lighting effects just a positional light.
     * @param coneAngle 
     */
    setConeAngle(coneAngle: number): boolean;

    /**
     * Set the position and focal point of a light based on elevation and azimuth.
     * The light is moved so it is shining from the given angle.
     * Angles are given in degrees. If the light is a positional light, it is made directional instead.
     * @param elevation 
     * @param azimuth 
     */
    setDirectionAngle(elevation: number, azimuth: number): boolean;

    /**
     * Set the exponent of the cosine used in positional lighting.
     * @param exponent 
     */
    setExponent(exponent: number): boolean;

    /**
     * Set the focal point.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
     */
    setFocalPoint(x: number, y: number, z: number): boolean;

    /**
     * Set the focal point from an array
     * @param focalPoint 
     */
    setFocalPointFrom(focalPoint: number[]): boolean;

    /**
     * Set the brightness of the light (from one to zero).
     * @param intensity 
     */
    setIntensity(intensity: number): boolean;

    /**
     * Set the type of the light to lightType
     * @param lightType 
     */
    setLightType(lightType: string): boolean;

    /**
     * Set the type of the light is CameraLight.
     */
    setLightTypeToCameraLight(): boolean;

    /**
     * Set the the type of the light is HeadLight.
     */
    setLightTypeToHeadLight(): boolean;

    /**
     * Set the the type of the light is SceneLight.
     */
    setLightTypeToSceneLight(): boolean;

    /**
     * Check if the type of the light is CameraLight.
     */
    lightTypeIsCameraLight(): boolean;

    /**
     * Check if the type of the light is HeadLight.
     */
    lightTypeIsHeadLight(): boolean;

    /**
     * Check if the type of the light is SceneLight.
     */
    lightTypeIsSceneLight(): boolean;

    /**
     * 
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
     */
    setPosition(x: number, y: number, z: number): boolean;

    /**
     * 
     * @param position 
     */
    setPositionFrom(position: number[]): boolean;

    /**
     * 
     * @param positional 
     */
    setPositional(positional: boolean): boolean;

    /**
     * 
     * @param shadowAttenuation 
     */
    setShadowAttenuation(shadowAttenuation: number): boolean;

    /**
     * 
     * @param switchValue 
     */
    setSwitch(switchValue: boolean): boolean;

    /**
     * 
     * @param transformMatrix 
     */
    setTransformMatrix(transformMatrix: any): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkLight characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ILightInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ILightInitialValues): void;

/**
 * Method use to create a new instance of vtkLight with the focal point at the origin and its position
 * set to [0, 0, 1]. The light is a SceneLight, its color is white, intensity=1, the light is turned on, 
 * positional lighting is off, coneAngle=30, AttenuationValues=[1, 0, 0], exponent=1 and the transformMatrix is null.
 * @param {ILightInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ILightInitialValues): vtkLight;

/**
 * vtkLight is a virtual light for 3D rendering. It provides methods to locate
 * and point the light, turn it on and off, and set its brightness and color.
 * In addition to the basic infinite distance point light source attributes,
 * you also can specify the light attenuation values and cone angle.
 * These attributes are only used if the light is a positional light.
 * The default is a directional light (e.g. infinite point light source).
 * 
 * Lights have a type that describes how the light should move with respect
 * to the camera. A Headlight is always located at the current camera position
 * and shines on the camera’s focal point. A CameraLight also moves with
 * the camera, but may not be coincident to it. CameraLights are defined
 * in a normalized coordinate space where the camera is located at (0, 0, 1),
 * the camera is looking at (0, 0, 0), and up is (0, 1, 0). Finally, a
 * SceneLight is part of the scene itself and does not move with the camera.
 * (Renderers are responsible for moving the light based on its type.)
 * 
 * Lights have a transformation matrix that describes the space in which
 * they are positioned. A light’s world space position and focal point
 * are defined by their local position and focal point, transformed by
 * their transformation matrix (if it exists).
 */
export declare const vtkLight: {
    newInstance: typeof newInstance,
    extend: typeof extend,
};
export default vtkLight;
