import { mat4 } from "gl-matrix";
import { vtkObject } from "../../../interfaces";
import { RGBColor, Vector3 } from "../../../types";

export enum LIGHT_TYPES {
	'HeadLight',
	'CameraLight',
	'SceneLight'
}

export interface ILightInitialValues {
	switch?: boolean;
	intensity?: number;
	color?: RGBColor;
	position?: Vector3;
	focalPoint?: Vector3;
	positional?: boolean;
	exponent?: number;
	coneAngle?: number;
	attenuationValues?: number[];
	lightType?: LIGHT_TYPES;
	shadowAttenuation?: number;
	direction?: Vector3;
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
	 * Get the color of the light.
	 */
	getColor(): RGBColor;

	/**
	 * Get the color of the light.
	 */
	getColorByReference(): RGBColor;

	/**
	 * Get the lighting cone angle of a positional light in degrees.
	 * This is the angle between the axis of the cone and a ray along the edge
	 * of the cone. A value of 90 (or more) indicates that you want no spot
	 * lighting effects just a positional light.
	 */
	getConeAngle(): number;

	/**
	 * Set the position and focal point of a light based on elevation and azimuth.
	 * The light is moved so it is shining from the given angle. Angles are
	 * given in degrees. If the light is a positional light, it is made
	 * directional instead.
	 */
	getDirection(): Vector3;

	/**
	 * Get the exponent of the cosine used in positional lighting.
	 */
	getExponent(): number;
	
	/**
	 * Get the focal point.
	 */
	getFocalPoint(): Vector3;

	/**
	 * Get the focal point.
	 */
	getFocalPointByReference(): Vector3;

	/**
	 * Get the brightness of the light
	 */
	getIntensity(): number
	
	/**
	 * Get the type of the light.
	 */
	getLightType(): string

	/**
	 * Get the position of the light.
	 */
	getPosition(): Vector3;
	
	/**
	 * Get the position of the light.
	 */
	getPositionByReference(): Vector3;
	
	/**
	 * Get if positional lighting is on or off.
	 */
	getPositional(): boolean
	
	/**
	 * Get the position of the light, modified by the transformation matrix (if
	 * it exists).
	 */
	getTransformedPosition(): Vector3;

	/**
	 * Get the focal point of the light, modified by the transformation matrix
	 * (if it exists).
	 */
	getTransformedFocalPoint(): Vector3;
	
	/**
	 * Set the quadratic attenuation constants.
	 * @param {Number} a 
	 * @param {Number} b 
	 * @param {Number} c 
	 */
	setAttenuationValues(a: number, b: number, c: number): boolean;

	/**
	 * Set the quadratic attenuation constants from an array.
	 * @param {Number[]} attenuationValues The quadratic attenuation.
	 */
	setAttenuationValuesFrom(attenuationValues: number[]): boolean;

	/**
	 * Set the color of the object. Has the side effect of setting the
	 * ambient diffuse and specular colors as well. This is basically
	 * a quick overall color setting method.
	 * @param {Number} r Defines the red component (between 0 and 1).
	 * @param {Number} g Defines the green component (between 0 and 1).
	 * @param {Number} b Defines the blue component (between 0 and 1).
	 */
	setColor(r: number, g: number, b: number): boolean;

	/**
	 * Set the color of the object. Has the side effect of setting the
	 * ambient diffuse and specular colors as well. This is basically
	 * a quick overall color setting method.
	 * @param {RGBColor} color Defines the RGB color array..
	 */
	setColor(color: RGBColor): boolean;

	/**
	 * Set the color of the object. Has the side effect of setting the
	 * ambient diffuse and specular colors as well. This is basically
	 * a quick overall color setting method.
	 * @param {Number} r Defines the red component (between 0 and 1).
	 * @param {Number} g Defines the green component (between 0 and 1).
	 * @param {Number} b Defines the blue component (between 0 and 1).
	 */
	setColorFrom(r: number, g: number, b: number): boolean;

	/**
	 * Set the color of the object. Has the side effect of setting the
	 * ambient diffuse and specular colors as well. This is basically
	 * a quick overall color setting method.
	 * @param {RGBColor} color Defines the RGB color array..
	 */
	setColorFrom(color: RGBColor): boolean;

	/**
	 * Set the lighting cone angle of a positional light in degrees.
	 * This is the angle between the axis of the cone and a ray along the edge
	 * of the cone. 
	 * A value of 90 (or more) indicates that you want no spot lighting effects
	 * just a positional light.
	 * @param {Number} coneAngle The cone angle.
	 */
	setConeAngle(coneAngle: number): boolean;

	/**
	 * Set the position and focal point of a light based on elevation and
	 * azimuth. The light is moved so it is shining from the given angle. Angles
	 * are given in degrees. If the light is a positional light, it is made
	 * directional instead.
	 * @param {Number} elevation 
	 * @param {Number} azimuth 
	 */
	setDirectionAngle(elevation: number, azimuth: number): boolean;

	/**
	 * Set the exponent of the cosine used in positional lighting.
	 * @param {Number} exponent The exponent of the cosine.
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
	 * @param {Vector3} focalPoint The focal point array.
	 */
	setFocalPointFrom(focalPoint: Vector3): boolean;

	/**
	 * Set the brightness of the light (from one to zero).
	 * @param {Number} intensity 
	 */
	setIntensity(intensity: number): boolean;

	/**
	 * Set the type of the light to lightType
	 * @param {LIGHT_TYPES} lightType The light type.
	 */
	setLightType(lightType: LIGHT_TYPES): boolean;

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
	 * Set the position of the light.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setPosition(x: number, y: number, z: number): boolean;

	/**
	 * Set the position of the light.
	 * @param {Vector3} position The position coordinate of the light.
	 */
	setPositionFrom(position: Vector3): boolean;

	/**
	 * Turn positional lighting on or off.
	 * @param {Boolean} positional The positional value.
	 */
	setPositional(positional: boolean): boolean;

	/**
	 * Set the shadow intensity By default a light will be completely blocked
	 * when in shadow by setting this value to less than 1.0 you can control how
	 * much light is attenuated when in shadow.
	 * @param {Number} shadowAttenuation The shadow attenuation value.
	 */
	setShadowAttenuation(shadowAttenuation: number): boolean;

	/**
	 * Turn the light on or off.
	 * @param {Boolean} switchValue The switch value.
	 */
	setSwitch(switchValue: boolean): boolean;

	/**
	 * Set the light's transformation matrix.
	 * @param {mat4} transformMatrix The transform matrix.
	 */
	setTransformMatrix(transformMatrix: mat4): boolean;
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
	LIGHT_TYPES: LIGHT_TYPES;
};
export default vtkLight;
