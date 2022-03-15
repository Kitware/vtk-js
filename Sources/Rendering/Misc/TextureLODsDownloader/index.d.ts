import { vtkObject } from "../../../interfaces";
import { CrossOrigin, Nullable } from "../../../types";
import vtkTexture from "../../Core/Texture";

/**
 *
 */
export interface ITextureLODsDownloaderInitialValues {
	baseUrl?: string;
	crossOrigin?: CrossOrigin;
	files?: string[];
	maxTextureLODSize?: number;
	texture?: vtkTexture;
	stepFinishedCallback?: any;
	waitTimeToStart?: number;
	waitTimeBetweenDownloads?: number;
}


export interface vtkTextureLODsDownloader extends vtkObject {

	/**
	 * Get the base of the url
	 */
	getBaseUrl(): string;

	/**
	 * Get the crossorigin attribute
	 */
	getCrossOrigin(): Nullable<CrossOrigin>;

	/**
	 * Get the list of files to download
	 */
	getFiles(): string[];

	/**
	 * Get the max texture LOD size
	 */
	getMaxTextureLODSize(): number;

	/**
	 * 
	 */
	getStepFinishedCallback(): any;
	
	/**
	 * Get the vtkTexture object
	 */
	getTexture(): vtkTexture;
	
	/**
	 * Get the delay between downloads
	 */
	getWaitTimeBetweenDownloads(): number;
	
	/**
	 * Get the delay before the start of download.
	 */
	getWaitTimeToStart(): number;

	/**
	 * Set the base of the url
	 * @param {String} baseUrl The base of the url.
	 */
	setBaseUrl(baseUrl: string): boolean;
	
	/**
	 * Set the crossorigin attribute
	 * @param {CrossOrigin} crossOrigin The crossorigin value.
	 */
	setCrossOrigin(crossOrigin: CrossOrigin): boolean;
	
	/**
	 * Set the list of files to download
	 * @param {String[]} files The array of files urls.
	 */
	setFiles(files: string[]): boolean;
	
	/**
	 * Set the max texture LOD size
	 * @param {Number} maxTextureLODSize The max texture LOD size.
	 */
	setMaxTextureLODSize(maxTextureLODSize: number): boolean;
	
	/**
	 * 
	 * @param stepFinishedCallback 
	 */
	setStepFinishedCallback(stepFinishedCallback: any): boolean;
	
	/**
	 * Set the vtkTexture object
	 * @param {vtkTexture} texture The vtkTexture object.
	 */
	setTexture(texture: vtkTexture): boolean;
	
	/**
	 * Set the delay between downloads
	 * @param {Number} waitTimeBetweenDownloads The delay between downloads.
	 */
	setWaitTimeBetweenDownloads(waitTimeBetweenDownloads: number): boolean;
	
	/**
	 * Set the delay before the start of download
	 * @param {Number} waitTimeToStart The delay before the start of download.
	 */
	setWaitTimeToStart(waitTimeToStart: number): boolean;

	/**
	 * Start the download
	 */
	startDownloads(): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkTextureLODsDownloader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ITextureLODsDownloaderInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ITextureLODsDownloaderInitialValues): void;

/**
 * Method used to create a new instance of vtkTextureLODsDownloader
 * @param {ITextureLODsDownloaderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ITextureLODsDownloaderInitialValues): vtkTextureLODsDownloader;

/**
 * vtkTextureLODsDownloader provides a way to download textures by bulk.
 */
export declare const vtkTextureLODsDownloader: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkTextureLODsDownloader;
