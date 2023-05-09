import { mat3, mat4, quat, vec3 } from "gl-matrix";
import { Nullable } from "../../../types";
import { vtkOutputPort } from "../../../interfaces";
import vtkAbstractMapper3D, { IAbstractMapper3DInitialValues } from "../AbstractMapper3D";
import vtkDataArray from "../../../Common/Core/DataArray";
import vtkImageData from "../../../Common/DataModel/ImageData";
import vtkPolyData from "../../../Common/DataModel/PolyData";
import vtkPolyLine from "../../../Common/DataModel/PolyLine";

interface ICoincidentTopology {
	factor: number;
	offset: number;
}

type TOrientation = mat4 | mat3 | quat | vec3;

export interface IImageCPRMapperInitialValues extends IAbstractMapper3DInitialValues{
	width: number;
	uniformOrientation: TOrientation; // Don't use vec3 if possible
	useUniformOrientation: boolean;
	preferSizeOverAccuracy: boolean; // Whether to use halfFloat representation of float, when it is inaccurate
	orientationArrayName: Nullable<string>;
	tangentDirection: vec3;
	bitangentDirection: vec3;
	normalDirection: vec3;
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
	 * Use @see getUseUniformOrientation to use the uniform orientation instead of the orientation specified by the centerline
	 * @returns the uniform orientation of the centerline
	 */
	getUniformOrientation(): TOrientation;

	/**
	 * @see getUniformOrientation
	 * @param orientation
	 */
	setUniformOrientation(orientation: TOrientation): boolean;

	/**
	 * This flag specifies wether the mapper should use the uniformOrientation ( @see getUniformOrientation ) or the orientation specified in centerline at centerline input ( @see setCenterlineData )
	 * Defaults to false.
	 * @returns the useUniformOrientation flag
	 */
	getUseUniformOrientation(): boolean;
	
	/**
	 * @see getUseUniformOrientation
	 * @param useUniformOrientation
	 */
	setUseUniformOrientation(useUniformOrientation: boolean): boolean;

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
	 * OrientationArrayName specifies the name of the data array which gives an orientation for each point of the centerline
	 * The data array has to be in the PointData attribute of the centerline input
	 * If null, look for the orientation data array in: "Orientation", "Direction", Vectors, Tensors, Normals
	 * The data array should be an array of mat4, mat3, quat or vec3 but using vec3 makes the CPRInteractor unusable
	 * Default to null.
	 */
	getOrientationArrayName(): Nullable<string>;

	/**
	 * @see getOrientationArrayName
	 * @param arrayName
	 */
	setOrientationArrayName(arrayName: Nullable<string>): boolean;

	/**
	 * For each point on the oriented centerline, the tangent direction is the direction in which the mapper will sample
	 * Let O (a mat3) be the orientation at a point on a centerline, and N (a vec3) the tangent direction
	 * Then the mapper will sample along O * N
	 * Default value: [1, 0, 0]
	 */
	getTangentDirection(): vec3;

	/**
	 * @see getTangentDirection
	 * @param tangent
	 */
	setTangentDirection(tangent: vec3): boolean;

	/**
	 * For each point on the oriented centerline, the bitangent direction forms with the normal and the tangent direction a new basis
	 * Default value: [0, 1, 0]
	 */
	getBitangentDirection(): vec3;

	/**
	 * @see getBitangentDirection
	 * @param bitangent
	 */
	setBitangentDirection(bitangent: vec3): boolean;

	/**
	 * For each point on the oriented centerline, the normal direction is the direction along the centerline
	 * Default value: [0, 0, 1]
	 */
	getNormalDirection(): vec3;

	/**
	 * @see getNormalDirection
	 * @param normal
	 */
	setNormalDirection(normal: vec3): boolean;

	/**
	 * The direction matrix is the matrix composed of tangent, bitangent and normal directions
	 * It is used to orient the camera or the actor
	 */
	getDirectionMatrix(): mat3;

	/**
	 * @see getDirectionMatrix
	 * @param mat
	 */
	setDirectionMatrix(mat: mat3): boolean;

	/**
	 * Find the data array to use for orientation in the input polydata ( @see getOrientationArrayName )
	 */
	getOrientationDataArray(): Nullable<vtkDataArray>;

	/**
	 * Recompute the oriented centerline from the input polydata if needed and return the result
	 * If there is no polydata as input, return the last oriented centerline
	 * It means that if no polydata is given as input and the centerline is set using @see setOrientedCenterline , the given centerline will be used
	 */
	getOrientedCenterline(): vtkPolyLine;
	
	/**
	 * Set the internal oriented centerline
	 * WARNING: this centerline will be overwritten if the polydata centerline is specified (input 1 @see setCenterlineData )
	 * @param centerline An oriented centerline
	 */
	setOrientedCenterline(centerline: vtkPolyLine): boolean;

	/**
	 * @returns The total height of the image in model coordinates.
	 */
	getHeight(): number;

	/**
	 * @param distance Distance from the beginning of the centerline, following the centerline, in model coordinates
	 * @returns The position and orientation which is at the given distance from the beginning of the centerline.
	 * If the distance is negative or greater than the length of the centerline, position and orientation are not defined.
	 * If the centerline is not oriented, orientation is not defined.
	 */
	getCenterlinePositionAndOrientation(distance: number): { position?: vec3, orientation?: quat };

	/**
	 * @returns A flat array of vec3 representing the direction at each point of the centerline
	 * It is computed from the orientations of the centerline and tangentDirection
	 * Uses caching to avoid recomputing at each frame
	 */
	getCenterlineTangentDirections(): Float32Array;

	/**
	 * @returns The direction to sample, in model space, computed using uniform orientation and tangent direction
	 */
	getUniformDirection(): vec3;

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
	 * The points of the centerline are in model coordinates of the volume used as input ( @see setImageDataData ) and not index coordinates (see MCTC matrix of the OpenGL ImageCPRMapper)
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
 * segment. The position and the orientation of the centerline are
 * interpolated along the y-axis of the quad. The position is linearly
 * interpolated (lerp) and the orientation is interpolated using
 * spherical linear interpolation (slerp). For a point (x, y) on the quad,
 * the value of y gives the interpolated position P and interpolated
 * orientation O which combined with tangentDirection gives D
 * ( @see getTangentDirection ). The value of x between -0.5 and 0.5 then gives
 * the position to sample in the volume: P + x*D.
 *
 * By computing the right centerline positions and orientations, one
 * can simulate Stretched CPR and Straightened CPR.
 * 
 * This class resolves coincident topology with the same methods as vtkMapper.
 */
export declare const vtkImageCPRMapper: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkImageCPRMapper;
