import { vtkAlgorithm, vtkObject } from "vtk.js/Sources/interfaces";

interface IProperty2DInitialValues{
	color?: number[];
	opacity?: number;
	pointSize?: number;
	lineWidth?: number;
	displayLocation?: string;
}

export interface vtkProperty2D extends vtkObject {

	/**
     * Get the color of the object.
     * @return the color of the object
     */
    getColor(): number[];

	/**
     * Get the color of the object.
     */
    getColorByReference(): number[];

	/**
     * Get the display location of the object.
	 * @default 'Foreground'
     * @returns
     */
    getDisplayLocation(): string;

	/**
     * Get the width of a Line. The width is expressed in screen units.
	 * @return 
     */
    getLineWidth(): number;

    /**
     * Get the opacity of the object.
	 * @return 
     */
    getOpacity(): number;

    /**
     * Get the diameter of a point. The size is expressed in screen units.
	 * @return 
     */
    getPointSize(): number;
	
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
     * @param {Number} r Defines the red component (between 0 and 1).
     * @param {Number} g Defines the green component (between 0 and 1).
     * @param {Number} b Defines the blue component (between 0 and 1).
     */
    setColorFrom(color: number[]): boolean;

	/**
     * Set the display location of the object.
	 * @param displayLocation
     * @returns
     */
    setDisplayLocation(displayLocation: string): boolean;

	/**
	 * Set the width of a Line. The width is expressed in screen units.
	 * This is only implemented for OpenGL.
	 * @param {Number} lineWidth 
	 * @default 1.0
	 * @return 
	 */
    setLineWidth(lineWidth: number): boolean;

	/**
	 * Set/Get the object’s opacity. 1.0 is totally opaque and 0.0 is 
	 * completely transparent.
	 * @param {Number} opacity  
	 * @return 
	 */
    setOpacity(opacity: number): boolean;

	/**
	 * Set the diameter of a point. The size is expressed in screen units.
	 * This is only implemented for OpenGL.
	 * @param pointSize 
	 * @default 1.0
	 * @return 
	 */
    setPointSize(pointSize: number): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkProperty2D characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IProperty2DInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IProperty2DInitialValues): void;

/**
 * Method use to create a new instance of vtkProperty2D with object color, ambient color, diffuse color,
 * specular color, and edge color white; ambient coefficient=0; diffuse
 * coefficient=0; specular coefficient=0; specular power=1; Gouraud shading;
 * and surface representation. Backface and frontface culling are off.
 * @param {IProperty2DInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IProperty2DInitialValues): vtkProperty2D;

/** 
 * vtkProperty2D is an object that represents lighting and other surface
 * properties of a 2D geometric object. The primary properties that can be
 * set are colors (overall, ambient, diffuse, specular, and edge color);
 * specular power; opacity of the object; the representation of the
 * object (points, wireframe, or surface); and the shading method to be
 * used (flat, Gouraud, and Phong). Also, some special graphics features
 * like backface properties can be set and manipulated with this object.
 */
export declare const vtkProperty2D: {
    newInstance: typeof newInstance,
    extend: typeof extend,
};
export default vtkProperty2D;
