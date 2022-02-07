import { Size, Vector3 } from '../../../types';

declare function createMethods(session: any): {
	subscribeToImageStream: (callback: any) => any;
	unsubscribeToImageStream: (subscription: any) => any;
	registerView: (viewId: string) => any;
	unregisterView: (viewId: string) => any;
	enableView: (viewId: string, enabled: boolean) => any;
	render: (options?: {
			size: Size;
			view: number;
	}) => any;
	resetCamera: (view?: number) => any;
	invalidateCache: (viewId: string) => any;
	setQuality: (viewId: string, quality: number, ratio?: number) => any;
	setSize: (viewId: string, width?: number, height?: number) => any;
	setServerAnimationFPS: (fps?: number) => any;
	getServerAnimationFPS: () => number;
	startAnimation: (viewId?: number) => any;
	stopAnimation: (viewId?: number) => any;
	updateCamera: (viewId: string, focalPoint: Vector3, viewUp: Vector3, position: Vector3, forceUpdate?: boolean) => any;
	updateCameraParameters: (viewId?: number, parameters?: {}, forceUpdate?: boolean) => any;
}

export default createMethods;
