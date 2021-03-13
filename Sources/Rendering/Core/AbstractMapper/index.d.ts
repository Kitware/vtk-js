import { VtkAlgorithm } from 'vtk.js/Sources/macro';

/**
 * 
 */
interface IAbstractMapperInitialValues {
	/**
	 * 
	 */
	clippingPlanes : any[];
}

export interface vtkAbstractMapper extends VtkAlgorithm {

    /**
     * Added plane needs to be a vtkPlane object.
     * @param plane
     */
    addClippingPlane(plane: any): void;

    /**
     * Return number of clipping planes.
     * @returns  
     */
    getNumberOfClippingPlanes(): number;

    /**
     * Get all clipping planes.
     * @returns
     */
    getClippingPlanes(): Array<any>;

    /**
     * Remove all clipping planes.
     */
    removeAllClippingPlanes(): void;

    /**
     * Remove clipping plane at index i.
     * @param i 
     */
    removeClippingPlane(i: number): void;

    /**
     * Set clipping planes.
     * @param planes
     */
    setClippingPlanes(planes: vtkPlane[]): void;

    /**
     * 
     */
    update(): void;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkAbstractMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IAbstractMapperInitialValues): void;

/**
 * vtkAbstractMapper is an abstract class to specify interface between data and
 * graphics primitives or software rendering techniques. Subclasses of
 * vtkAbstractMapper can be used for rendering 2D data, geometry, or volumetric
 * data.
 */
export declare const vtkAbstractMapper: {
    extend: typeof extend,
};
export default vtkAbstractMapper;
