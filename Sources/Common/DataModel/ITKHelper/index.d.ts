export interface T100 {
  [key: string]: any;
}
/**
 * Converts an itk.js image to a vtk.js image.
 *
 * Requires an itk.js image as input.
 */
declare function convertItkToVtkImage(itkImage: any, options?: T100): any;
export interface T101 {
  dimension: number;
  pixelType: number;
  componentType: string;
  components: number;
}
export interface T102 {
  data: number[];
}
export interface T103 {
  imageType: T101;
  name: string;
  origin: any;
  spacing: any;
  direction: T102;
  size: any;
}
/**
 * Converts a vtk.js image to an itk.js image.
 *
 * Requires a vtk.js image as input.
 */
declare function convertVtkToItkImage(vtkImage: any, copyData?: boolean): T103;
export interface T104 {
  convertItkToVtkImage: typeof convertItkToVtkImage;
  convertVtkToItkImage: typeof convertVtkToItkImage;
}
declare const T105: T104;
export default T105;
