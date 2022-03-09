import { vtkObject, vtkSubscription } from "../../../interfaces";

import vtkActor from "../../../Rendering/Core/Actor";
import HtmlDataAccessHelper from "../../Core/DataAccessHelper/HtmlDataAccessHelper";
import HttpDataAccessHelper from "../../Core/DataAccessHelper/HttpDataAccessHelper";
import JSZipDataAccessHelper from "../../Core/DataAccessHelper/JSZipDataAccessHelper";
import LiteHttpDataAccessHelper from "../../Core/DataAccessHelper/LiteHttpDataAccessHelper";


interface IMTLReaderOptions {
	binary?: boolean;
	compression?: string;
	progressCallback?: any;
}

/**
 * 
 */
export interface IMTLReaderInitialValues {
	numberOfOutputs?: number;
	requestCount?: number;
	materials?: object;
	interpolateTextures?: boolean;
}

export interface vtkMTLReader extends vtkObject {

	/**
	 * 
	 * @param {String} name 
	 * @param {vtkActor} actor 
	 */
	applyMaterialToActor(name: string, actor: vtkActor): void;

	/**
	 * 
	 */
	getBaseURL(): string;

	/**
	 * 
	 */
	getDataAccessHelper(): HtmlDataAccessHelper | HttpDataAccessHelper | JSZipDataAccessHelper | LiteHttpDataAccessHelper;

	/**
	 * 
	 */
	getInterpolateTextures(): boolean;

	/**
	 * 
	 * @param {String} name The name of the material.
	 */
	getMaterial(name: string): object;

	/**
	 * 
	 */
	getMaterialNames(): object;

	/**
	 * 
	 */
	getSplitGroup(): boolean;

	/**
	 * Get the url of the object to load.
	 */
	getUrl(): string;

	/**
	 * 
	 * @param {Boolean} busy 
	 */
	invokeBusy(busy: boolean): void;

	/**
	 * 
	 */
	isBusy(): number;

	/**
	 * 
	 */
	listImages(): any;

	/**
	 * Load the object data.
	 * @param {IMTLReaderOptions} [options] 
	 */
	loadData(options?: IMTLReaderOptions): Promise<any>;

	/**
	 * 
	 * @param callback 
	 */
	onBusy(callback: (busy: boolean) => any): vtkSubscription;

	/**
	 * Parse data as text.
	 * @param {String} content The content to parse. 
	 */
	parseAsText(content: string): void;
	/**
	 *
	 * @param inData 
	 * @param outData 
	 */
	requestData(inData: any, outData: any): void;

	/**
	 * 
	 * @param dataAccessHelper 
	 */
	setDataAccessHelper(dataAccessHelper: HtmlDataAccessHelper | HttpDataAccessHelper | JSZipDataAccessHelper | LiteHttpDataAccessHelper): boolean;

	/**
	 * 
	 * @param imagePath 
	 * @param src 
	 */
	setImageSrc(imagePath: string, src: string): any;

	/**
	 * 
	 * @param interpolateTextures 
	 */
	setInterpolateTextures(interpolateTextures: boolean): boolean;

	/**
	 * 
	 * @param splitGroup 
	 */
	setSplitGroup(splitGroup: boolean): boolean;

	/**
	 * Set the url of the object to load.
	 * @param {String} url the url of the object to load.
	 * @param {IMTLReaderOptions} [option] The MTL reader options.
	 */
	setUrl(url: string, option?: IMTLReaderOptions): Promise<string>;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkMTLReader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IMTLReaderInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IMTLReaderInitialValues): void;

/**
 * Method used to create a new instance of vtkMTLReader
 * @param {IMTLReaderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IMTLReaderInitialValues): vtkMTLReader;


/**
 * The vtkMTLReader aims to parse the  MTL(Material Template Library file format
 * which is a companion file format to .OBJ that describes surface shading
 * (material) properties of objects within one or more .OBJ files.
 */
export declare const vtkMTLReader: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkMTLReader;
