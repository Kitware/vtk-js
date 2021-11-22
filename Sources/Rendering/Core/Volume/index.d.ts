import { Bounds } from "../../../types";
import vtkProp3D, { IProp3DInitialValues } from "../Prop3D";
import vtkVolumeMapper from "../VolumeMapper";
import vtkVolumeProperty from "../VolumeProperty";

/**
 * 
 */
export interface IVolumeInitialValues extends IProp3DInitialValues {
	mapper?: vtkVolumeMapper;
	property?: vtkVolumeProperty;
	bounds?: Bounds;
}

/**
 * 
 */
export interface vtkVolume extends vtkProp3D {

	/**
	 * Get the volume mapper
	 */
	getMapper(): vtkVolumeMapper;

	/**
	 * For some exporters and other other operations we must be able to collect
	 * all the actors or volumes.
	 */
	getVolumes(): vtkVolume[];

	/**
	 * Get the volume property
	 */
	getProperty(): vtkVolumeProperty;

	/**
	 * Get the bounds for this mapper as [xmin, xmax, ymin, ymax,zmin, zmax].
	 * @return {Bounds} The bounds for the mapper.
	 */
	getBounds(): Bounds;

	/**
	 * Get the bounds as [xmin, xmax, ymin, ymax, zmin, zmax].
	 */
	getBoundsByReference(): Bounds;

	/**
	 * Get the `Modified Time` which is a monotonic increasing integer
	 * global for all vtkObjects.
	 *
	 * This allow to solve a question such as:
	 *  - Is that object created/modified after another one?
	 *  - Do I need to re-execute this filter, or not? ...
	 *
	 * @return {Number} the global modified time.
	 */
	getMTime(): number;

	/**
	 * Get the mtime of anything that would cause the rendered image to appear
	 * differently
	 */
	getRedrawMTime(): number;

	/**
	 * 
	 */
	makeProperty(): void;

	/**
	 * Set the volume mapper
	 * @param {vtkVolumeMapper} mapper 
	 */
	setMapper(mapper: vtkVolumeMapper): boolean;

	/**
	 * Set the volume property
	 * @param {vtkVolumeProperty} property 
	 */
	setProperty(property: vtkVolumeProperty): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkVolume characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IVolumeInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IVolumeInitialValues): void;

/**
 * Method use to create a new instance of vtkVolume 
 */
export function newInstance(initialValues?: IVolumeInitialValues): vtkVolume;

/** 
 * vtk-js includes support for volume rendering using hardware GPU acceleration. The
 * capabilities may change over time but as of this writing it includes support
 * for :
 * 
 * - multi-component data
 * - at least 24 bits linear resolution
 * - support for all native data types, 16 bit, float, etc
 * - opacity transfer functions
 * - color transfer functions
 * - volume interpolation of nearest, fast linear and linear
 * - automatic intermixing of opaque surfaces with volumes
 *
 * Using volume rendering in vtk-js is very much like using it VTK is you are
 * familiar with VTK. The main objects are :
 * 
 * - RenderWindow/Renderer as usual
 * - Volume  - similar to Actor, holds the property and mapper
 * - VolumeMapper - takes an ImageData as input
 * - VolumeProperty - holds the opacity and color transfer functions
 * - PiecewiseFunction - a piecewise interpolated function, good for opacity
 *   transfer functions
 * - ColorTransferFunction - similar to PiecewiseFunction but support an RGB
 *   value at each point.
 * 
 * @example
 * ```js
 * // Load the rendering pieces we want to use (for both WebGL and WebGPU)
 * import 'vtk.js/Sources/Rendering/Profiles/Volume';
 * 
 * import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
 * import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
 * 
 * import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
 * import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';

 * const vol = vtkVolume.newInstance();
 * const mapper = vtkVolumeMapper.newInstance();
 * mapper.setSampleDistance(2.0);
 * vol.setMapper(mapper);
 * 
 * const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
 * reader.setUrl(`${__BASE_PATH__}/Data/volume/headsq.vti`).then(() => {
 *   reader.loadData().then(() => {
 *     // we wait until the data is loaded before adding
 *     // the volume to the renderer
 *     renderer.addVolume(actor);
 *     renderer.resetCamera();
 *     renderWindow.render();
 *   });
 * });
 * 
 * // create color and opacity transfer functions
 * const ctfun = vtkColorTransferFunction.newInstance();
 * ctfun.addRGBPoint(200.0, 1.0, 1.0, 1.0);
 * ctfun.addRGBPoint(2000.0, 0.0, 0.0, 0.0);
 * 
 * const ofun = vtkPiecewiseFunction.newInstance();
 * ofun.addPoint(200.0, 0.0);
 * ofun.addPoint(1200.0, 0.2);
 * ofun.addPoint(4000.0, 0.4);
 * 
 * vol.getProperty().setRGBTransferFunction(0, ctfun);
 * vol.getProperty().setScalarOpacity(0, ofun);
 * vol.getProperty().setScalarOpacityUnitDistance(0, 4.5);
 * vol.getProperty().setInterpolationTypeToFastLinear();
 * 
 * mapper.setInputConnection(reader.getOutputPort());
 * ```
 * 
 * @see [vtkColorTransferFunction](./Rendering_Core_ColorTransferFunction.html) 
 * @see [vtkImageData](./Common_DataModel_ImageData.html) 
 * @see [vtkPiecewiseFunction](./Common_DataModel_PiecewiseFunction.html) 
 * @see [vtkVolumeMapper](./Rendering_Core_VolumeMapper.html) 
 * @see [vtkVolumeProperty](./Rendering_Core_VolumeProperty.html) 
 */
export declare const vtkVolume: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkVolume;
