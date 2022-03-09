import { vtkAlgorithm, vtkObject, vtkSubscription } from "../../../interfaces";
import HtmlDataAccessHelper from "../../Core/DataAccessHelper/HtmlDataAccessHelper";
import HttpDataAccessHelper from "../../Core/DataAccessHelper/HttpDataAccessHelper";
import JSZipDataAccessHelper from "../../Core/DataAccessHelper/JSZipDataAccessHelper";
import LiteHttpDataAccessHelper from "../../Core/DataAccessHelper/LiteHttpDataAccessHelper";


interface IElevationReaderOptions {
	binary?: boolean;
	compression?: string;
	progressCallback?: any;
}

/**
 * 
 */
export interface IElevationReaderInitialValues {
	origin?: number[];
	xSpacing?: number;
	ySpacing?: number;
	zScaling?: number;
	xDirection?: number;
	yDirection?: number;
	requestCount?: number;
}

type vtkElevationReaderBase = vtkObject & Omit<vtkAlgorithm,
	| 'getInputData'
	| 'setInputData'
	| 'setInputConnection'
	| 'getInputConnection'
	| 'addInputConnection'
	| 'addInputData'>;

export interface vtkElevationReader extends vtkElevationReaderBase {

	/**
	 * 
	 */
	getDataAccessHelper(): HtmlDataAccessHelper | HttpDataAccessHelper | JSZipDataAccessHelper | LiteHttpDataAccessHelper;

	/**
	 * Get the url of the object to load.
	 */
	getUrl(): string;

	/**
	 * 
	 */
	getXDirection(): number;

	/**
	 * 
	 */
	getXSpacing(): number;

	/**
	 * 
	 */
	getYDirection(): number;

	/**
	 * 
	 */
	getYSpacing(): number;

	/**
	 * 
	 */
	getZScaling(): number;

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
	 * Load the object data.
	 * @param {IElevationReaderOptions} [options] 
	 */
	loadData(options?: IElevationReaderOptions): Promise<any>;

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
	 * Set the url of the object to load.
	 * @param {String} url the url of the object to load.
	 * @param {IElevationReaderOptions} [option] The Elevation reader options.
	 */
	setUrl(url: string, option?: IElevationReaderOptions): Promise<any>;

	/**
	 * 
	 * @param {Number} xDirection 
	 */
	setXDirection(xDirection: number): boolean;

	/**
	 * 
	 * @param {Number} xSpacing 
	 */
	setXSpacing(xSpacing: number): boolean;

	/**
	 * 
	 * @param {Number} yDirection 
	 */
	setYDirection(yDirection: number): boolean;

	/**
	 * 
	 * @param {Number} ySpacing 
	 */
	setYSpacing(ySpacing: number): boolean;

	/**
	 * 
	 * @param {Number} zScaling 
	 */
	setZScaling(zScaling: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkElevationReader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IElevationReaderInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IElevationReaderInitialValues): void;

/**
 * Method used to create a new instance of vtkElevationReader
 * @param {IElevationReaderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IElevationReaderInitialValues): vtkElevationReader;


/**
 * The vtkElevationReader aims to read a text file formatted as below and create
 * a bumpy plane based on the elevation defined in that file. If a line has 10
 * elevation values, that means the plane will have 10 points along the X axis.
 * If the file has 5 lines, that means the plane will have 5 points along the Y
 * axis.
 *
 * ```
 * 1 2 3 4 5
 * 5 4 3 2 1
 * 1 2 3 4 5
 * 5 4 3 2 1
 * 1 2 3 4 5
 * ```
 *
 * Each number represents an elevation on a uniform grid where a line
 * (horizontal) define the elevations along the X axis. With that in mind, new
 * lines (vertical) define the elevations along the Y axis and the actual number
 * is the elevation along Z.
 *
 * In order to properly represent that in world coordinates, you can provide an
 * `origin` which will define the coordinate of the first point without its
 * elevation. Then you need to describe how much you should move along X and Y
 * between two elevations definition. For that we use `xSpacing` and `ySpacing`.
 * Since the elevation is given to us as a number, we can scale it via
 * `zScaling`. Finally you may decide that your grid should move along positive
 * X and negative Y while reading the file. The `xDirection` and `yDirection`
 * are meant to give you control on that end.
 */
export declare const vtkElevationReader: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkElevationReader;
