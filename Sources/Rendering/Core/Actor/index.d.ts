import { Bounds } from '../../../types';
import vtkMapper from '../Mapper';
import vtkProp3D, { IProp3DInitialValues } from '../Prop3D';
import vtkProperty from '../Property';

/**
 * 
 */
export interface IActorInitialValues extends IProp3DInitialValues {
	mapper?: vtkMapper;
	property?: vtkProperty;
	backfaceProperty?: vtkProperty;
	forceOpaque?: boolean;
	forceTranslucent?: boolean;
	bounds?: Bounds;
}

export interface vtkActor extends vtkProp3D {

	/**
	 * Return if the prop have some translucent polygonal geometry
	 */
	hasTranslucentPolygonalGeometry(): boolean;

	/**
	 * For some exporters and other other operations we must be
	 * able to collect all the actors or volumes. These methods
	 * are used in that process.
	 * @return {vtkActor[]} list of actors
	 */
	getActors(): vtkActor[];

	/**
	 * 
	 * @return {vtkProperty} the backface property.
	 */
	getBackfaceProperty(): vtkProperty;

	/**
	 * Get the bounds for this mapper as [xmin, xmax, ymin, ymax,zmin, zmax].
	 * @return {Bounds} The bounds for the mapper.
	 */
	getBounds(): Bounds;

	/**
	 * Check whether the opaque is forced or not.
	 */
	getForceOpaque(): boolean;

	/**
	 * Check whether the translucency is forced or not.
	 */
	getForceTranslucent(): boolean;

	/**
	 * Check if the actor is opaque or not
	 * @return true if the actor is opaque
	 */
	getIsOpaque(): boolean;

	/**
	 * 
	 */
	getMapper(): null | vtkMapper;

	/**
	 * Get the property object that controls this actors surface
	 * properties. This should be an instance of a vtkProperty object. Every
	 * actor must have a property associated with it. If one isn’t specified,
	 * then one will be generated automatically. Multiple actors can share one
	 * property object.
	 * @return {vtkProperty} The property object
	 */
	getProperty(): vtkProperty;

	/**
	 * Check whether if the actor supports selection
	 * @return {Boolean} true if the actor support selection.
	 */
	getSupportsSelection(): boolean;

	/**
	 * Create a new property suitable for use with this type of Actor.
	 */
	makeProperty(): vtkProperty;

	/**
	 * 
	 * @param backfaceProperty 
	 */
	setBackfaceProperty(backfaceProperty: vtkProperty): boolean;

	/**
	 * 
	 * @param forceOpaque 
	 */
	setForceOpaque(forceOpaque: vtkProperty): boolean;

	/**
	 * 
	 * @param forceTranslucent 
	 */
	setForceTranslucent(forceTranslucent: boolean): boolean;

	/**
	 * 
	 * @param mapper 
	 */
	setMapper(mapper: null | vtkMapper): boolean;

	/**
	 * 
	 * @param property 
	 */
	setProperty(property: vtkProperty): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkActor characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IActorInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IActorInitialValues): void;

/**
 * Method used to create a new instance of vtkActor with the following defaults:
 * 
 * * origin = [0, 0, 0]
 * * position = [0, 0, 0]
 * * scale = [1, 1, 1]
 * * visibility = 1
 * * pickable = 1
 * * dragable = 1
 * * orientation = [0, 0, 0]
 * 
 * No user defined matrix and no texture map.
 * @param {IActorInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IActorInitialValues): vtkActor;

/**
 * vtkActor is used to represent an entity in a rendering scene. It inherits
 * functions related to the actors position, and orientation from
 * vtkProp3D. The actor also has scaling and maintains a reference to the
 * defining geometry (i.e., the mapper), rendering properties, and possibly a
 * texture map. vtkActor combines these instance variables into one 4x4
 * transformation matrix as follows: [x y z 1] = [x y z 1] Translate(-origin)
 * Scale(scale) Rot(y) Rot(x) Rot (z) Trans(origin) Trans(position)
 * @see [vtkMapper](./Rendering_Core_Mapper.html)
 * @see [vtkProperty](./Rendering_Core_Property.html) 
 */
export declare const vtkActor: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkActor;
