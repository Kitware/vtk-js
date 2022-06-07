import { vtkAlgorithm, vtkObject, vtkSubscription } from "../../../interfaces";
import HtmlDataAccessHelper from "../DataAccessHelper/HtmlDataAccessHelper";
import HttpDataAccessHelper from "../DataAccessHelper/HttpDataAccessHelper";
import JSZipDataAccessHelper from "../DataAccessHelper/JSZipDataAccessHelper";
import LiteHttpDataAccessHelper from "../DataAccessHelper/LiteHttpDataAccessHelper";

/**
 *
 */
export interface IHttpDataSetReaderInitialValues {
	enableArray?: boolean;
	fetchGzip?: boolean;
	arrays?: any[];
	url?: string;
	baseURL?: string;
	requestCount?: number;
}

export interface IHttpDataSetReaderOptions {
	fullpath?: string,
	compression?: string,
	loadData?: boolean;
}

export interface IHttpDataSetReaderArray {
	location: string;
	name: string;
	enable: boolean;
}

export interface IRange {
	max: number,
	component: unknown,
	min: number
}

export interface IPointDataArray {
	data: {
		numberOfComponents: number,
		name: string,
		vtkClass: string,
		dataType: string,
		ranges: Array<IRange>,
		ref: {
			registration: string,
			encode: string,
			basepath: string,
			id: string
		},
		size: number
	}
}

export interface IDatasetManifest {
	origin: [number, number, number],
	cellData: {
		arrays: Array<unknown>,
		vtkClass: string
	},
	FieldData: {
		arrays: Array<unknown>,
		vtkClass: string,
	},
	vtkClass: string,	
	pointData: {
		arrays: Array<IPointDataArray>,
		vtkClass: string
	},
	spacing: [number, number, number],
	extent: [number, number, number, number, number, number],
	direction: [number, number, number, number, number, number, number, number, number],
	metadata?: Record<string, unknown>
}

export interface IParseObjectOptions {
	loadData: boolean,
	baseUrl: string,
	deepCopy: boolean
}

type vtkHttpDataSetReaderBase = vtkObject & Omit<vtkAlgorithm,
	| 'getInputData'
	| 'setInputData'
	| 'setInputConnection'
	| 'getInputConnection'
	| 'addInputConnection'
	| 'addInputData'>;

export interface vtkHttpDataSetReader extends vtkHttpDataSetReaderBase {

	/**
	 * Enable or disable a given array.
	 * 
	 * ```js
	 * reader.enableArray('pointData', 'Temperature');
	 * reader.enableArray('pointData', 'Pressure', false);
	 * reader.enableArray('cellData', 'CellId', true);
	 * reader.enableArray('fieldData', 'labels', true);
	 * ```
	 * @param {String} location 
	 * @param {String} name 
	 * @param {Boolean} [enable] 
	 */
	enableArray(location: string, name: string, enable?: boolean): void;

	/**
	 * Get the list of available array with their location and if they are
	 * enable or not for download using the __update()__ method.
	 */
	getArrays(): IHttpDataSetReaderArray[];

	/**
	 * 
	 */
	getArraysByReference(): IHttpDataSetReaderArray[];

	/**
	 * Get the base url to use to download arrays or other data from the given
	 * dataset.
	 * 
	 * ```js
	 * reader.setURL('/Data/can.ex2/index.json');
	 * 
	 * if (reader.getBaseURL() === '/Data/can.ex2') {
	 *   console.log('Good guess...');
	 * }
	 * ```
	 */
	getBaseURL(): string;

	/**
	 * 
	 */
	getDataAccessHelper(): HtmlDataAccessHelper | HttpDataAccessHelper | JSZipDataAccessHelper | LiteHttpDataAccessHelper;

	/**
	 * 
	 */
	getEnableArray(): boolean;

	/**
	 * 
	 */
	getFetchGzip(): boolean;

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
	 * Get the current status of the reader. True means busy and False means
	 * idle.
	 */
	isBusy(): boolean;

	/**
	 * 
	 */
	loadData(): string;

	/**
	 * Attach listener to monitor when the reader is downloading data or not.
	 * 
	 * ```js
	 * const subscription = reader.onBusy(busy => {
	 *   console.log('Reader is', busy ? 'downloading' : 'idle');
	 * })
	 * 
	 * reader.update();
	 * // much later
	 * subscription.unsubscribe();
	 * ```
	 * @param callback 
	 */
	onBusy(callback: (busy: boolean) => any): vtkSubscription;

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
	 * @param progressCallback 
	 */
	setProgressCallback(progressCallback: any): boolean;

	/**
	 * Set the url for the dataset to load.
	 * 
	 * ```js
	 * const reader = HttpDataSetReader.newInstance();
	 * isReady = reader.setURL('/Data/can.ex2/index.json');
	 * 
	 * // Same as 
	 * const reader = HttpDataSetReader.newInstance({ url: '/Data/can.ex2/index.json' });
	 * isReady = reader.updateMetadata();
	 * ```
	 * @param {String} url the url of the object to load.
	 * @param {IHttpDataSetReaderOptions} [option] The Draco reader options.
	 */
	setUrl(url: string, option?: IHttpDataSetReaderOptions): Promise<any>;

	/**
	 * Set the dataset object to use for data fetching.
	 * 
	 * @param {IDatasetManifest} manifest The dataset manifest object
	 * @param {IParseObjectOptions} options
	 */
	parseObject(manifest: IDatasetManifest, options: IParseObjectOptions): Promise<void>;

	/**
	 * 
	 */
	updateMetadata(): Promise<any>;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkHttpDataSetReader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public) 
 * @param model object on which data structure will be bounds (protected) 
 * @param {IHttpDataSetReaderInitialValues} [initialValues] (default: {}) 
 */
export function extend(publicAPI: object, model: object, initialValues?: IHttpDataSetReaderInitialValues): void;

/**
 * Method used to create a new instance of vtkHttpDataSetReader while enabling a
 * default behavior regarding the data array and the way they should be fetched
 * from the server.
 *
 * The __enableArray__ argument allow you to choose if you want to activate all
 * data array by default or if you will have to manually enable them before
 * downloading them.
 * @param {IHttpDataSetReaderInitialValues} [initialValues] for pre-setting some of its content 
 */
export function newInstance(initialValues?: IHttpDataSetReaderInitialValues): vtkHttpDataSetReader;

/**
 * The vtkHttpDataSetReader is using a custom format that only exist in vtk.js
 * which aims to simplify data fetching in an HTTP context. Basically the format
 * is composed of a JSON metadata file referencing all the required data array
 * as side binary files along with all the dataset configuration (i.e.: type,
 * extent...). 
 *
 * @example
 * ```js
 * import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
 *
 * const reader = vtkHttpDataSetReader.newInstance();
 * reader.setURL('/Data/can.ex2/index.json').then((reader, dataset) => {
 *   console.log('Metadata loaded with the geometry', dataset);
 * 
 *   reader.getArrays().forEach(array => {
 *     console.log('-', array.name, array.location, ':', array.enable);
 *   });
 * 
 *   reader.update()
 *     .then((reader, dataset) => {
 *       console.log('dataset fully loaded', dataset);
 *     });
 * });
 * ```
 */
export declare const vtkHttpDataSetReader: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkHttpDataSetReader;
