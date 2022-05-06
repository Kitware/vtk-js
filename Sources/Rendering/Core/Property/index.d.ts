import { vtkObject } from "../../../interfaces";
import { RGBColor } from "../../../types";
import { Interpolation, Representation, Shading } from "./Constants";

export interface IPropertyInitialValues {
	color?: RGBColor;
	ambientColor?: RGBColor;
	diffuseColor?: RGBColor;
	specularColor?: RGBColor;
	edgeColor?: RGBColor;
	ambient?: number;
	diffuse?: number;
	specular?: number;
	specularPower?: number;
	opacity?: number;
	edgeVisibility?: boolean;
	backfaceCulling?: boolean;
	frontfaceCulling?: boolean;
	pointSize?: number;
	lineWidth?: number;
	lighting?: boolean;
	shading?: boolean;
}

export interface vtkProperty extends vtkObject {


	/**
	 * Not Implemented yet
	 */
	addShaderVariable(): any;

	/**
	 * Not Implemented yet
	 */
	computeCompositeColor(): any;

	/**
	 * Get the lighting coefficient.
	 * @default 0
	 */
	getAmbient(): number;

	/**
	 * Get the ambient surface color. Not all renderers support separate ambient
	 * and diffuse colors. From a physical standpoint it really doesn't make too
	 * much sense to have both. For the rendering libraries that don't support
	 * both, the diffuse color is used.
	 * @return {RGBColor} Array of RGB color.
	 */
	getAmbientColor(): RGBColor;

	/**
	 * Get the ambient surface color.
	 */
	getAmbientColorByReference(): RGBColor;

	/**
	 * 
	 */
	getBackfaceCulling(): boolean;

	/**
	 * Get the color of the object.the color of the object
	 */
	getColor(): RGBColor;

	/**
	 * Get the diffuse lighting coefficient.
	 * @default 1
	 */
	getDiffuse(): number;

	/**
	 * Get the diffuse surface color.
	 * @return {RGBColor} Array of RGB color.
	 */
	getDiffuseColor(): RGBColor;
	/**
	 * 
	 */
	getDiffuseColorByReference(): RGBColor;

	/**
	 * 
	 */
	getEdgeColor(): RGBColor;

	/**
	 * 
	 */
	getEdgeColorByReference(): RGBColor;

	/**
	 * 
	 */
	getEdgeVisibility(): boolean;

	/**
	 * Get the fast culling of polygons based on orientation of normal
	 * with respect to camera. If frontface culling is on, polygons facing
	 * towards camera are not drawn.
	 * @default false
	 */
	getFrontfaceCulling(): boolean;

	/**
	 * Get the shading interpolation method for an object.
	 */
	getInterpolation(): Interpolation;

	/**
	 * Map the interpolation integer to the corresponding ShadingModel.
	 */
	getInterpolationAsString(): string;

	/**
	 * Get lighting flag for an object. 
	 * @default true
	 */
	getLighting(): boolean;

	/**
	 * Get the width of a Line. The width is expressed in screen units.
	 * @default 1.0
	 */
	getLineWidth(): number;

	/**
	 * Get the opacity of the object. Set/Get the object's opacity. 
	 * 1.0 is totally opaque and 0.0 is completely transparent.
	 * @default 1
	 */
	getOpacity(): number;

	/**
	 * Get the diameter of a point. The size is expressed in screen units.
	 * @default 1.0
	 */
	getPointSize(): number;

	/**
	 * Get the surface geometry representation for the object.
	 */
	getRepresentation(): Representation;

	/**
	 * Get the surface geometry representation for the object as string.
	 * @return {String} Surface geometry representation for the object as string
	 */
	getRepresentationAsString(): string;

	/**
	 * Check if the shading is set.
	 */
	getShading(): boolean;

	/**
	 * Get the specular lighting coefficient.
	 * @default 0
	 */
	getSpecular(): number;

	/**
	 * Get the specular surface color.
	 * @return {RGBColor} Array of RGB color.
	 */
	getSpecularColor(): RGBColor;

	/**
	 * Get the specular surface color.
	 */
	getSpecularColorByReference(): RGBColor;

	/**
	 * Get the specular power.
	 * @default 1
	 */
	getSpecularPower(): number;

	/**
	 * Set the ambient lighting coefficient.
	 * @param {Number} ambient The ambient lighting coefficient.
	 */
	setAmbient(ambient: number): boolean;

	/**
	 * Set the ambient surface color. Not all renderers support separate
	 * ambient and diffuse colors. From a physical standpoint it really
	 * doesn't make too much sense to have both. For the rendering
	 * libraries that don’t support both, the diffuse color is used.
	 * 
	 * @param {Number} r Defines the red component (between 0 and 1)
	 * @param {Number} g Defines the green component (between 0 and 1)
	 * @param {Number} b Defines the blue component (between 0 and 1)
	 */
	setAmbientColor(r: number, g: number, b: number): boolean;

	/**
	 * Set the ambient surface color. Not all renderers support separate
	 * ambient and diffuse colors. From a physical standpoint it really
	 * doesn't make too much sense to have both. For the rendering
	 * libraries that don’t support both, the diffuse color is used.
	 * @param {RGBColor} ambientColor An Array of the RGB color.
	 */
	setAmbientColor(ambientColor: RGBColor): boolean;

	/**
	 * Set the ambient surface color from an RGB array
	 * @param {RGBColor} ambientColor An Array of the RGB color.
	 */
	setAmbientColorFrom(ambientColor: RGBColor): boolean;

	/**
	 * Turn on/off fast culling of polygons based on orientation of normal
	 * with respect to camera. If backface culling is on, polygons facing
	 * away from camera are not drawn.
	 * @param {Boolean} backfaceCulling 
	 */
	setBackfaceCulling(backfaceCulling: boolean): boolean;

	/**
	 * Set the color of the object. Has the side effect of setting the
	 * ambient diffuse and specular colors as well. This is basically
	 * a quick overall color setting method.
	 * @param {Number} r Defines the red component (between 0 and 1)
	 * @param {Number} g Defines the green component (between 0 and 1)
	 * @param {Number} b Defines the blue component (between 0 and 1)
	 */
	setColor(r: number, g: number, b: number): boolean;

	/**
	 * Set the color of the object. Has the side effect of setting the
	 * ambient diffuse and specular colors as well. This is basically
	 * a quick overall color setting method.
	 * @param {RGBColor} color An Array of the RGB color.
	 */
	setColor(color: RGBColor): boolean;

	/**
	 * Set the diffuse lighting coefficient.
	 * @param {Number} diffuse The diffuse lighting coefficient.
	 */
	setDiffuse(diffuse: number): boolean;

	/**
	 * Set the diffuse surface color.
	 * @param {Number} r Defines the red component (between 0 and 1)
	 * @param {Number} g Defines the green component (between 0 and 1)
	 * @param {Number} b Defines the blue component (between 0 and 1)
	 */
	setDiffuseColor(r: number, g: number, b: number): boolean;

	/**
	 * Set the diffuse surface color.
	 * @param {RGBColor} diffuseColor An Array of the RGB color.
	 */
	setDiffuseColor(diffuseColor: RGBColor): boolean;

	/**
	 * Set the diffuse surface color from an RGB array
	 * @param {RGBColor} diffuseColor An Array of the RGB color.
	 */
	setDiffuseColorFrom(diffuseColor: RGBColor): boolean;

	/**
	 * Set the color of primitive edges (if edge visibility is enabled).
	 * @param {Number} r Defines the red component (between 0 and 1)
	 * @param {Number} g Defines the green component (between 0 and 1)
	 * @param {Number} b Defines the blue component (between 0 and 1)
	 */
	setEdgeColor(r: number, g: number, b: number): boolean;

	/**
	 * Set the color of primitive edges (if edge visibility is enabled).
	 * @param {RGBColor} edgeColor An Array of the RGB color.
	 */
	setEdgeColor(edgeColor: RGBColor): boolean;

	/**
	 * Set the color of primitive edges from an RGB array.
	 * @param {RGBColor} edgeColor An Array of the RGB color.
	 */
	setEdgeColorFrom(edgeColor: RGBColor): boolean;

	/**
	 * Turn on/off the visibility of edges. On some renderers it is
	 * possible to render the edges of geometric primitives separately
	 * from the interior.
	 * @param {Boolean} edgeVisibility 
	 */
	setEdgeVisibility(edgeVisibility: boolean): boolean;

	/**
	 * Turn on/off fast culling of polygons based on orientation of normal
	 * with respect to camera. If frontface culling is on, polygons facing
	 * towards camera are not drawn.
	 * @param {Boolean} frontfaceCulling 
	 */
	setFrontfaceCulling(frontfaceCulling: boolean): boolean;

	/**
	 * Set the shading interpolation method for an object.
	 * @param {Interpolation} interpolation 
	 */
	setInterpolation(interpolation: Interpolation): boolean;

	/**
	 * Set interpolation to 0 means `FLAT`.
	 */
	setInterpolationToFlat(): boolean;

	/**
	 * Set interpolation to 1 means `GOURAUD`.
	 */
	setInterpolationToGouraud(): boolean;

	/**
	 * Set interpolation to 2 means `PHONG`.
	 */
	setInterpolationToPhong(): boolean;

	/**
	 * Set lighting flag for an object.
	 * @param {Boolean} lighting 
	 * @default true
	 */
	setLighting(lighting: boolean): boolean;

	/**
	 * Set the width of a Line. The width is expressed in screen units.
	 * !!! note
	 *     This is only implemented for OpenGL.
	 * @param {Number} lineWidth 
	 * @default 1.0
	 */
	setLineWidth(lineWidth: number): boolean;

	/**
	 * Set the object's opacity. 1.0 is totally opaque and 0.0 is 
	 * completely transparent.
	 * @param {Number} opacity The opacity of the object.
	 */
	setOpacity(opacity: number): boolean;

	/**
	 * Set the diameter of a point. The size is expressed in screen units.
	 * !!! note
	 *     This is only implemented for OpenGL.
	 * @param {Number} pointSize 
	 * @default 1.0
	 */
	setPointSize(pointSize: number): boolean;

	/**
	 * Control the surface geometry representation for the object.
	 * @param {Representation} representation 
	 */
	setRepresentation(representation: Representation): boolean;

	/**
	 * Set representation to 0 means `POINT`'
	 */
	setRepresentationToPoints(): boolean;

	/**
	 * Set representation to 2 means `SURFAC`'
	 */
	setRepresentationToSurface(): boolean;

	/**
	 * Set representation to 1 means `WIREFRAM`'
	 */
	setRepresentationToWireframe(): boolean;

	/**
	 * Enable/Disable shading.
	 * @param {Boolean} shading 
	 */
	setShading(shading: boolean): boolean;

	/**
	 * Set the specular lighting coefficient.
	 * @param {Boolean} specular 
	 */
	setSpecular(specular: number): boolean;

	/**
	 * Set the specular surface color.
	 * @param {Number} r Defines the red component (between 0 and 1)
	 * @param {Number} g Defines the green component (between 0 and 1)
	 * @param {Number} b Defines the blue component (between 0 and 1)
	 */
	setSpecularColor(r: number, g: number, b: number): boolean;

	/**
	 * Set the specular surface color from an RGB array
	 * @param {RGBColor} specularColor An Array of the RGB color.
	 */
	setSpecularColor(specularColor: RGBColor): boolean;

	/**
	 * Set the specular surface color from an RGB array
	 * @param {RGBColor} specularColor An Array of the RGB color.
	 */
	setSpecularColorFrom(specularColor: RGBColor): boolean;

	/**
	 * Set the specular power.
	 * @param {Number} specularPower 
	 */
	setSpecularPower(specularPower: number): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkProperty characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPropertyInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IPropertyInitialValues): void;

/**
 * Method use to create a new instance of vtkProperty with object color, ambient color, diffuse color,
 * specular color, and edge color white; ambient coefficient=0; diffuse
 * coefficient=0; specular coefficient=0; specular power=1; Gouraud shading;
 * and surface representation. Backface and frontface culling are off.
 * @param {IPropertyInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IPropertyInitialValues): vtkProperty;

/** 
 * vtkProperty is an object that represents lighting and other surface
 * properties of a geometric object. The primary properties that can be set are
 * colors (overall, ambient, diffuse, specular, and edge color); specular power;
 * opacity of the object; the representation of the object (points, wireframe,
 * or surface); and the shading method to be used (flat, Gouraud, and Phong).
 * Also, some special graphics features like backface properties can be set and
 * manipulated with this object.
 */
export declare const vtkProperty: {
	newInstance: typeof newInstance;
	extend: typeof extend;
	Shading: typeof Shading;
	Representation: typeof Representation;
	Interpolation: typeof Interpolation;
};
export default vtkProperty;
