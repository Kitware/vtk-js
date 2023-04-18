import vtkProp, { IPropInitialValues } from '../Prop';
import vtkCoordinate from '../Coordinate';
import vtkMapper from '../Mapper';
import vtkProperty2D, { IProperty2DInitialValues } from '../Property2D';
import vtkMapper2D from '../Mapper2D';
import { Bounds } from '../../../types';

/**
 * 
 */
export interface IActor2DInitialValues extends IPropInitialValues {
	mapper?: vtkMapper;
	property?: vtkProperty2D;
	layerNumber?: number;
	positionCoordinate?: vtkCoordinate;
	positionCoordinate2?: vtkCoordinate;
}

export interface vtkActor2D extends vtkProp {
	/**
	 * 
	 * @return  
	 */
	getActors2D(): any;

	/**
	 * 
	 * @return  
	 */
	getIsOpaque(): boolean;


	/**
	 * Return the property object that controls this actors surface
	 * properties. This should be an instance of a vtkProperty2D object. Every
	 * actor must have a property associated with it. If one isn’t specified,
	 * then one will be generated automatically. Multiple actors can share one
	 * property object.
	 */
	getProperty(): vtkProperty2D;

	/**
	 * Create a new property suitable for use with this type of Actor.
	 * @param {IProperty2DInitialValues} [initialValues] (default: {})
	 */
	 makeProperty(initialValues?: IProperty2DInitialValues): vtkProperty2D;

	/**
	 * Sets the 2D mapper.
	 */
	setMapper(mapper: vtkMapper2D): boolean;

	/**
	 * Gets the 2D mapper.
	 */
	getMapper(): vtkMapper2D;

	/**
	 * 
	 */
	hasTranslucentPolygonalGeometry(): boolean;

	/**
	 * Set the Prop2D's position in display coordinates.
	 * @param XPos 
	 * @param YPos 
	 */
	setDisplayPosition(XPos: any, YPos: any): void;

	/**
	 * 
	 * @param w 
	 */
	setWidth(w: number): void;

	/**
	 * 
	 * @param w 
	 */
	setHeight(h: number): void;

	/**
	 * 
	 */
	getWidth(): number;

	/**
	 * 
	 */
	getHeight(): number;

	/**
	 * Get the bounds as [xmin, xmax, ymin, ymax, zmin, zmax].
	 * @return {Bounds} The bounds for the mapper.
	 */
	getBounds(): Bounds;

	/**
	 * Return the actual vtkCoordinate reference that the mapper should use
	 * to position the actor. This is used internally by the mappers and should
	 * be overridden in specialized subclasses and otherwise ignored.
	 */
	getActualPositionCoordinate(): vtkCoordinate;

	/**
	 * 
	 */
	getActualPositionCoordinate2(): vtkCoordinate;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkActor2D characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IActor2DInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IActor2DInitialValues): void;

/**
 * Method use to create a new instance of vtkActor2D
 * @param {IActor2DInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IActor2DInitialValues): vtkActor2D;

/**
 * vtkActor2D is used to represent a 2D entity in a rendering scene. It inherits
 * functions related to the actors position, and orientation from
 * vtkProp. The actor also has scaling and maintains a reference to the
 * defining geometry (i.e., the mapper), rendering properties, and possibly a
 * texture map.
 * @see [vtkMapper2D](./Rendering_Core_Mapper2D.html)
 * @see [vtkProperty2D](./Rendering_Core_Property2D.html)
 */
export declare const vtkActor2D: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkActor2D;
