/**
 * Required for testing
 */

export interface MockDataAccessHelperCallTrackerEntry {
	promise: Promise<object[]>;
	called: Date;
}

export interface MockDataAccessHelperCallTracker {
	fetchJSON: MockDataAccessHelperCallTrackerEntry[];
	fetchArray: MockDataAccessHelperCallTrackerEntry[];
}

export interface MockDataAccessHelper {
	fetchArray(instance: any, baseURL: string, array: object[], options?: object): Promise<object[]>;
	fetchJSON(instance: any, url: string, options?: object): Promise<object>;
	fetchText(instance: any, url: string, options?: object): Promise<string>;
	fetchBinary(instance: any, url: string, options?: object): Promise<ArrayBuffer>;
	fetchImage(instance: any, url: string, options?: object): Promise<HTMLImageElement>;
	getCallTracker(): MockDataAccessHelperCallTracker;
}

export default MockDataAccessHelper;
