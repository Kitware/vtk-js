import vtkPolyData from "../PolyData";
import vtkImageData from "../ImageData";

export interface IOptions {
	pointDataName?: string;
	scalarArrayName?: string;
	cellDataName?: string;
}

/**
 * Converts an itk-wasm Image to a vtk.js vtkImageData.
 * Requires an itk-wasm Image as input.
 * @param itkImage 
 * @param {IOptions} [options] 
 */
export function convertItkToVtkImage(itkImage: any, options?: IOptions): vtkImageData;

/**
 * Converts a vtk.js vtkImageData to an itk-wasm Image.
 * Requires a vtk.js vtkImageData as input.
 * @param {vtkImageData} vtkImage 
 * @param {IOptions} [options] 
 */
export function convertVtkToItkImage(vtkImage: vtkImageData, options?: IOptions): any;

/**
 * Converts an itk-wasm PolyData to a vtk.js vtkPolyData.
 * Requires an itk-wasm PolyData as input.
 * @param itkPolyData 
 * @param {IOptions} [options] 
 */
export function convertItkToVtkPolyData(itkPolyData: any, options?: IOptions): vtkPolyData;

/**
 * Converts a vtk.js vtkPolyData to an itk-wasm PolyData.
 * Requires a vtk.js vtkPolyData as input.
 * 
 * @param {vtkPolyData} polyData 
 * @param {IOptions} [options] 
 */
export function convertVtkToItkPolyData(polyData: vtkPolyData, options?: IOptions): any;


/** 
 * vtkITKHelper is a helper which provides a set of functions to work with
 * itk-wasm module.
 */
export declare const vtkITKHelper: {
	convertItkToVtkImage: typeof convertItkToVtkImage,
	convertVtkToItkImage: typeof convertVtkToItkImage,
	convertItkToVtkPolyData: typeof convertItkToVtkPolyData,
	convertVtkToItkPolyData: typeof convertVtkToItkPolyData,
};
export default vtkITKHelper;
