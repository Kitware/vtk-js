import { vec3, vec4 } from "gl-matrix";
import vtkDataArray from "../../../Common/Core/DataArray";
import vtkImageData from "../../../Common/DataModel/ImageData";
import vtkPolyData from "../../../Common/DataModel/PolyData";
import { vtkOutputPort } from "../../../interfaces";
import vtkAbstractMapper3D, { IAbstractMapper3DInitialValues } from "../AbstractMapper3D";

interface ICoincidentTopology {
	factor: number;
	offset: number;
}

export interface IImageCPRMapperInitialValues extends IAbstractMapper3DInitialValues{
	width: number,
	uniformDirection: number[],
	useUniformDirection: boolean,
	reformationAngle: number,
	minHorizontalOffset: number,
	maxHorizontalOffset: number,
	preferSizeOverAccuracy: boolean, // Whether to use halfFloat representation of float, when it is inaccurate
	directionArrayName: string | null,
	directionArrayOffset: number,
	outColor: number[],
}

export interface vtkImageCPRMapper extends vtkAbstractMapper3D {
	/**
	 * @returns the width of the image in model coordinates of the input volume
	 */
	getWidth(): number;

	/**
	 * @see getWidth
	 * @param width
	 */
	setWidth(width: number): boolean;

	/**
	 * Use @see useUniformDirection to use the this uniform direction instead of the direction specified by the centerline
	 * @returns the uniform direction vector of the centerline
	 */
	getUniformDirection(): vec3;

	/**
	 * @see getUniformDirection
	 * @param direction
	 */
	setUniformDirection(direction: number[]): boolean;

	/**
	 * @see getUniformDirection
	 * @param x
	 * @param y
	 * @param z
	 */
	setUniformDirection(x: number, y: number, z: number): boolean;

	/**
	 * This flag specifies wether the mapper should use the uniformDirection ( @see getUniformDirection ) or the direction specified in centerline at centerline input ( @see setCenterlineData )
	 * Defaults to false.
	 * @returns the useUniformDirection flag
	 */
	getUseUniformDirection(): boolean;
	
	/**
	 * @see getUseUniformDirection
	 * @param useUniformDirection
	 */
	setUseUniformDirection(useUniformDirection: boolean): boolean;

	/**
	 * This flag indicates wether the GPU should use half float or not
	 * When true, will use half float
	 * When false, may use half float if there is no loss of accuracy (see in Texture: checkUseHalfFloat)
	 * Defaults to false.
	 * @returns the preferSizeOverAccuracy flag
	 */
	getPreferSizeOverAccuracy(): boolean;

	/**
	 * @see getPreferSizeOverAccuracy
	 * @param preferSizeOverAccuracy
	 */
	setPreferSizeOverAccuracy(preferSizeOverAccuracy: boolean): boolean;

	/**
	 * DirectionArrayName specifies the name of the data array which gives a direction vector for each point of the centerline
	 * The data array has to be in the PointData attribute of the centerline input
	 * If null, look for the direction data array in: "Direction", Vectors, Tensors, Normals
	 * The data array should have a number of components greater than 3 as the mapper only uses the vectors ( @see directionArrayOffset @see getDirectionArrayOffset )
	 * Default to null.
	 */
	getDirectionArrayName(): string | null;

	/**
	 * @see getDirectionArrayName
	 * @param arrayName
	 */
	setDirectionArrayName(arrayName: string | null): boolean;

	/**
	 * Use this offset for tuples in the data array specifying the direction vectors of the centerline
	 * For example, if using the y-axis of a column-major mat3 as a direction vector, you can use a directionArrayOffset of 3
	 * For the z-axis of a mat4, use an offset of 8
	 * Defaults to 0.
	 */
	getDirectionArrayOffset(): number;

	/**
	 * @see getDirectionArrayOffset
	 * @param directionArrayOffset
	 */
	setDirectionArrayOffset(directionArrayOffset: number): boolean;

	/**
	 * The RGBA color of the image when sampling outside of the volume
	 * Defaults to an opaque red: [1, 0, 0, 1]
	 */
	getOutColor(): vec4;

	/**
	 * @see getOutColor
	 * @param outColor
	 */
	setOutColor(outColor: number[]): boolean;

	/**
	 * @see getOutColor
	 * @param r
	 * @param g
	 * @param b
	 * @param a
	 */
	setOutColor(r: number, g: number, b: number, a: number): boolean;
	
	/**
	 * @returns An array of accumulated heights. The array at index i contains the sum of the height of all segments from 0 to i (included)
	 */
	getAccumulatedSegmentHeights(): number[];

	/**
	 * @returns The total height of the image in model coordinates.
	 */
	getHeight(): number;

	/**
	 * @returns An array of segments of the centerline. The segments have a shape [idxa, idxb] where idxa and idxb are the index of the points in the centerline polydata (centerline.getPoints()).
	 */
	getSegmentList(): number[][];

	/**
	 * @returns The data array used to give direction vectors the centerline points. This data array is retrieved using directionArrayName ( @see getDirectionArrayName ) and uses model coordinates of the volume used as input
	 */
	getDirectionDataArray(): vtkDataArray;

	/**
	 * @returns A boolean indicating if the mapper is ready to render
	 */
	preRenderCheck(): boolean;

	/**
	 * Set the polydata used as a centerline
	 * You can also use `publicAPI.setInputData(centerlineData, 1);`
	 * Use all the segments of all the polylines (the centerline can be in multiple pieces)
	 * The polydata can contain a PointData DataArray to specify the direction in which the mapper should sample for each point of the centerline ( @see getDirectionArrayName @see getDirectionArrayOffset )
	 * If no such point data is specified, a uniform direction can be used instead ( @see getUniformDirection @see getUseUniformOrientation )
	 * The points of the centerline are in model coordinates of the volume used as input ( @see setImageData ) and not index coordinates (see MCTC matrix of the OpenGL ImageCPRMapper)
	 * Use `imageData.getWorldToIndex();` or `imageData.getIndexToWorld();` to go from model coordinates to index coordinates or the other way around
	 * @param centerlineData A polydata containing one or multiple polyline(s) and optionnally a PointData DataArray for direction
	 */
	setCenterlineData(centerlineData: vtkPolyData): void;

	/**
	 * Same as setCenterlineData except it uses an output port instead of a polydata
	 * You can also use `publicAPI.setInputConnection(centerlineConnection, 1);`
	 * @see setCenterlineData
	 * @param centerlineConnection 
	 */
	setCenterlineConnection(centerlineConnection: vtkOutputPort): void;

	/**
	 * Set the volume which should be sampled by the mapper
	 * You can also use `publicAPI.setInputData(imageData, 0);`
	 * The model coordinates of this imageData are used by this mapper when specifying points, vectors or width (see MCTC matrix of the OpenGL ImageCPRMapper)
	 * You can use `imageData.getWorldToIndex();` or `imageData.getIndexToWorld();` to go from this model coordinates to index coordinates or the other way around
	 * @param imageData
	 */
	setImageData(imageData: vtkImageData): void;

	/**
	 * Set the connection for the volume
	 * You can also use `publicAPI.setInputConnection(imageData, 0);`
	 * @see setImageData
	 * @param imageData
	 */
	setImageConnection(imageData: vtkOutputPort): void;

	/**
	 *
	 */
	getResolveCoincidentTopology(): ICoincidentTopology

	/**
	 *
	 */
	getResolveCoincidentTopologyAsString(): ICoincidentTopology

	/**
	 *
	 */
	getResolveCoincidentTopologyLineOffsetParameters(): ICoincidentTopology

	/**
	 *
	 */
	getResolveCoincidentTopologyPointOffsetParameters(): ICoincidentTopology

	/**
	 *
	 */
	getResolveCoincidentTopologyPolygonOffsetFaces(): ICoincidentTopology

	/**
	 *
	 */
	getResolveCoincidentTopologyPolygonOffsetParameters(): ICoincidentTopology;

	/**
	 *
	 * @param {Number} factor 
	 * @param {Number} offset 
	 */
	setRelativeCoincidentTopologyLineOffsetParameters(factor: number, offset: number): boolean;

	/**
	 *
	 * @param {Number} factor 
	 * @param {Number} offset 
	 */
	setRelativeCoincidentTopologyPointOffsetParameters(factor: number, offset: number): boolean;

	/**
	 *
	 * @param {Number} factor 
	 * @param {Number} offset 
	 */
	setRelativeCoincidentTopologyPolygonOffsetParameters(factor: number, offset: number): boolean;

	/**
	 *
	 * @param resolveCoincidentTopology
	 * @default false
	 */
	setResolveCoincidentTopology(resolveCoincidentTopology: boolean): boolean;

	/**
	 *
	 * @param {Number} factor 
	 * @param {Number} offset 
	 */
	setResolveCoincidentTopologyLineOffsetParameters(factor: number, offset: number): boolean;

	/**
	 *
	 * @param {Number} factor 
	 * @param {Number} offset 
	 */
	setResolveCoincidentTopologyPointOffsetParameters(factor: number, offset: number): boolean;

	/**
	 *
	 * @param value
	 */
	setResolveCoincidentTopologyPolygonOffsetFaces(value: number): boolean;

	/**
	 *
	 * @param {Number} factor 
	 * @param {Number} offset 
	 */
	setResolveCoincidentTopologyPolygonOffsetParameters(factor: number, offset: number): boolean;

	/**
	 *
	 */
	setResolveCoincidentTopologyToDefault(): boolean;

	/**
	 *
	 */
	setResolveCoincidentTopologyToOff(): boolean;

	/**
	 *
	 */
	setResolveCoincidentTopologyToPolygonOffset(): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkImageCPRMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageCPRMapperInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IImageCPRMapperInitialValues): void;

/**
 * Method used to create a new instance of vtkImageCPRMapper
 * @param {IImageCPRMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IImageCPRMapperInitialValues): vtkImageCPRMapper;

/**
 * CPR in vtkImageCPRMapper stands for Curved Planar Reformation. This mapper
 * can be used to visualize tubular structures such as blood vessels.
 * 
 * This specialised mapper takes as input a vtkImageData representing a volume
 * ( @see setImageData ) and a vtkPolyData representing a centerline
 * ( @see setCenterlineData ). The mapper also need to have an orientation per
 * point or for all points. This can be specified using a uniform orientation
 * ( @see getUniformOrientation @see getUseUniformOrientation ) or a point
 * data array ( @see getOrientationArrayName ). Every point, vector or length
 * specified to the mapper (centerline points, orientation, width...) use model
 * coordinates of the volume used as input ( @see setImageData ).
 *
 * For each segment of the centerline the mapper creates a quad of the
 * specified width ( @see getWidth ) and of height equal to the length of the
 * segment. The position and the directions vectors of the centerline are
 * interpolated along the y-axis of the quad. The position is linearly
 * interpolated (lerp) and the direction vector is interpolated using
 * spherical linear interpolation (slerp). For a point (x, y) on the quad,
 * the value of y gives the interpolated position P and interpolated direction
 * vector D. The value of x between -0.5 and 0.5 then gives the position to
 * sample in the volume: P + x*D.
 *
 * This mapper can be used to visualize tubular structures such as blood
 * vessels. By computing the right centerline positions and directions, one
 * can simulate Stretched CPR and Straightened CPR.
 * 
 * This class resolves coincident topology with the same methods as vtkMapper.
 */
export declare const vtkImageCPRMapper: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkImageCPRMapper;
