import vtkMapper from "vtk.js/Sources/Rendering/Core/Mapper";
import vtkProp3D from "vtk.js/Sources/Rendering/Core/Prop3D";
import vtkProperty from "vtk.js/Sources/Rendering/Core/Property";

interface IVolumeInitialValues {
    /**
     * 
     */
    mapper: any;

    /**
     * 
     */
    property: any;

    /**
     * 
     */
    bounds: number[];
}

/**
 * 
 */
export interface vtkVolume extends vtkProp3D {
	
    /**
	 * 
	 */
     getVolumes(): any;
		
     /**
      * 
      */
     getProperty(): vtkProperty;
         
     /**
      * 
      */
     getBounds(): number[];

     /**
      * 
      */
     getBoundsByReference(): number[];
         
     /**
      * 
      */
     getMTime(): number;
         
     /**
      * 
      */
     getRedrawMTime(): number;

     /**
      * 
      */
     makeProperty(): void;

    /**
      * 
      */
    setMapper(mapper: vtkMapper): boolean;

    /**
      * 
      */
    setProperty(property: vtkProperty): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkVolume characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
 export function extend(publicAPI: object, model: object, initialValues?: IVolumeInitialValues): void;

 /**
  * Method use to create a new instance of vtkVolume 
  */
 export function newInstance(initialValues?: IVolumeInitialValues): vtkVolume;
 
 /** 
  * vtkVolume inherits from vtkMapper.
  */
 export declare const vtkVolume: {
     newInstance: typeof newInstance,
     extend: typeof extend,
 };
 export default vtkVolume;
 