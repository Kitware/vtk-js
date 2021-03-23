import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkProp3D from 'vtk.js/Sources/Rendering/Core/Prop3D';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';

/**
 * 
 */
interface IActorInitialValues {
    /**
     * 
     */
    mapper?: vtkMapper;
    /**
     * 
     */

    property?: vtkProperty;

    /**
     * 
     */
    backfaceProperty?: vtkProperty;

    /**
     * 
     */
    forceOpaque?: boolean;

    /**
     * 
     */
    forceTranslucent?: boolean;

    /**
     * 
     */
    bounds?: number[];

}

export interface vtkActor extends vtkProp3D {

    /**
     * Return if the prop have some translucent polygonal geometry
     * @returns 
     */
    hasTranslucentPolygonalGeometry(): boolean;

    /**
     * For some exporters and other other operations we must be
     * able to collect all the actors or volumes. These methods
     * are used in that process.
     * @returns  
     */
    getActors(): vtkActor[];

    /**
     * 
     */
    getBackfaceProperty(): vtkProperty;

    /**
     * Get the bounds for this Actor as (Xmin,Xmax,Ymin,Ymax,Zmin,Zmax).
     * @returns 
     */
    getBounds(): number[];

    /**
     * 
     */
    getForceOpaque(): boolean;

    /**
     * 
     */
    getForceTranslucent(): boolean;

    /**
     * Return if the actor is opaque or not
     * @returns 
     */
    getIsOpaque(): boolean;

    /**
     * 
     */
    getMapper(): vtkMapper;

    /**
     * Get the property object that controls this actors surface
     * properties. This should be an instance of a vtkProperty object. Every
     * actor must have a property associated with it. If one isn’t specified,
     * then one will be generated automatically. Multiple actors can share one
     * property object.
     * @returns vtkProperty
     */
    getProperty(): vtkProperty;

    /**
     * Return if the actor supports selection
     * @returns 
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
    setMapper(mapper: vtkMapper): boolean;

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
 * @param initialValues (default: {})
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
 * @param initialValues for pre-setting some of its content
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
 * @see vtkMapper
 * @see vtkProperty 
 */
export declare const vtkActor: {
    newInstance: typeof newInstance,
    extend: typeof extend,
};
export default vtkActor;
