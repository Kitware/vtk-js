import { vtkObject } from "../../../interfaces";
import vtkAnnotatedCubeActor from "../../../Rendering/Core/AnnotatedCubeActor";
import vtkAxesActor from "../../../Rendering/Core/AxesActor";
import vtkRenderer from "../../../Rendering/Core/Renderer";
import vtkRenderWindowInteractor from "../../../Rendering/Core/RenderWindowInteractor";

/**
 * 
 */
export interface IHttpSceneLoaderInitialValues {
	fetchGzip?: boolean,
	url?: string,
	baseURL?: string,
	animationHandler?: null,
	startLODLoaders?: boolean,
}

export interface vtkHttpSceneLoader extends vtkObject {

	/**
	 * 
	 */
	getAnimationHandler(): any; // vtkTimeStepBasedAnimationHandler

	/**
	 * 
	 */
	getBaseURL(): string;

	/**
	 * 
	 * @param fetchGzip 
	 */
	getFetchGzip(fetchGzip: boolean): boolean;

	/**
	 * 
	 */
	getMetadata(): any;

	/**
	 * 
	 */
	getRenderer(): vtkRenderer;

	/**
	 * 
	 */
	getScene(): object;

	/**
	 * 
	 */
	getUrl(): string;

	/**
	 * 
	 */
	invokeReady(): void;

	/**
	 * 
	 */
	onReady(): void;

	/**
	 * 
	 */
	resetScene(): void;

	/**
	 * 
	 * @param renderer 
	 */
	setRenderer(renderer: vtkRenderer): boolean;
	setUrl(url: string): void;
	update(): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkHttpSceneLoader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IHttpSceneLoaderInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IHttpSceneLoaderInitialValues): void;

/**
 * Method used to create a new instance of vtkHttpSceneLoader
 * @param {IHttpSceneLoaderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IHttpSceneLoaderInitialValues): vtkHttpSceneLoader;

/**
 * 
 * @param sceneItem 
 * @param settings 
 */
export function applySettings(sceneItem: object, settings: object): void;

/**
 * 
 * @param typeName 
 * @param handler 
 */
export function updateDatasetTypeMapping(typeName: string, handler: any): void;

/**
 * vtkHttpSceneLoader
 */
export declare const vtkHttpSceneLoader: {
	newInstance: typeof newInstance;
	extend: typeof extend;
	applySettings: typeof applySettings;
	updateDatasetTypeMapping: typeof updateDatasetTypeMapping;
}
export default vtkHttpSceneLoader;
