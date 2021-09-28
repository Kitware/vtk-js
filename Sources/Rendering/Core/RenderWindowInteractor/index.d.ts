import { vtkObject } from "../../../interfaces";
import vtkRenderer from "../Renderer";

export enum Device {
	Unknown,
	LeftController,
	RightController,
}

export enum Input {
	Unknown,
	Trigger,
	TrackPad,
	Grip,
	ApplicationMenu,
}

/**
 *
 */
export interface IRenderWindowInteractorInitialValues {
	initialized?: boolean;
	enabled?: boolean;
	enableRender?: boolean;
	lightFollowCamera?: boolean;
	desiredUpdateRate?: number;
	stillUpdateRate?: number;
	recognizeGestures?: boolean;
	currentGesture?: string;
	lastFrameTime?: number;
	wheelTimeoutID?: number;
	moveTimeoutID?: number;
}

interface IPosition {
	type: string;
}

export interface vtkRenderWindowInteractor extends vtkObject {

	/**
	 * 
	 * @default false
	 */
	getInitialized(): boolean;

	/**
	 *
	 * @default null
	 */
	getContainer(): HTMLElement;

	/**
	 *
	 * @default false
	 */

	getEnabled(): boolean;

	/**
	 *
	 * @default true
	 */
	getEnableRender(): boolean;

	/**
	 *
	 * @default null
	 */
	getInteractorStyle(): any;

	/**
	 *
	 * @default 0.1
	 */
	getLastFrameTime(): number;

	/**
	 *
	 * @default null
	 */
	getView(): any;

	/**
	 *
	 * @default true
	 */
	getLightFollowCamera(): boolean;

	/**
	 *
	 */
	getPicker(): any;

	/**
	 *
	 * @default true
	 */
	getRecognizeGestures(): boolean;

	/**
	 *
	 * @default 30.0
	 */
	getDesiredUpdateRate(): number;

	/**
	 *
	 * @default 2.0
	 */
	getStillUpdateRate(): number;

	/**
	 *
	 */
	invokeStartAnimation(callData: object): any;

	/**
	 *
	 */
	invokeAnimation(callData: object): any;

	/**
	 *
	 */
	invokeEndAnimation(callData: object): any;

	/**
	 *
	 */
	invokeMouseEnter(callData: object): any;

	/**
	 *
	 */
	invokeMouseLeave(callData: object): any;

	/**
	 *
	 */
	invokeStartMouseMove(callData: object): any;

	/**
	 *
	 */
	invokeMouseMove(callData: object): any;

	/**
	 *
	 */
	invokeEndMouseMove(callData: object): any;

	/**
	 *
	 */
	invokeLeftButtonPress(callData: object): any;

	/**
	 *
	 */
	invokeLeftButtonRelease(callData: object): any;

	/**
	 *
	 */
	invokeMiddleButtonPress(callData: object): any;

	/**
	 *
	 */
	invokeMiddleButtonRelease(callData: object): any;

	/**
	 *
	 */
	invokeRightButtonPress(callData: object): any;

	/**
	 *
	 */
	invokeRightButtonRelease(callData: object): any;

	/**
	 *
	 */
	invokeKeyPress(callData: object): any;

	/**
	 *
	 */
	invokeKeyDown(callData: object): any;

	/**
	 *
	 */
	invokeKeyUp(callData: object): any;

	/**
	 *
	 */
	invokeStartMouseWheel(callData: object): any;

	/**
	 *
	 */
	invokeMouseWheel(callData: object): any;

	/**
	 *
	 */
	invokeEndMouseWheel(callData: object): any;

	/**
	 *
	 */
	invokeStartPinch(callData: object): any;

	/**
	 *
	 */
	invokePinch(callData: object): any;

	/**
	 *
	 */
	invokeEndPinch(callData: object): any;

	/**
	 *
	 */
	invokeStartPan(callData: object): any;

	/**
	 *
	 */
	invokePan(callData: object): any;

	/**
	 *
	 */
	invokeEndPan(callData: object): any;

	/**
	 *
	 */
	invokeStartRotate(callData: object): any;

	/**
	 *
	 */
	invokeRotate(callData: object): any;

	/**
	 *
	 */
	invokeEndRotate(callData: object): any;

	/**
	 *
	 */
	invokeButton3D(callData: object): any;

	/**
	 *
	 */
	invokeMove3D(callData: object): any;

	/**
	 *
	 */
	invokeStartPointerLock(callData: object): any;

	/**
	 *
	 */
	invokeEndPointerLock(callData: object): any;

	/**
	 *
	 */
	invokeStartInteractionEvent(callData: object): any;

	/**
	 *
	 */
	invokeInteractionEvent(callData: object): any;

	/**
	 *
	 */
	invokeEndInteractionEvent(callData: object): any;

	/**
	 *
	 * @param args
	 */
	onStartAnimation(args: any): any;

	/**
	 *
	 * @param args
	 */
	onAnimation(args: any): any;

	/**
	 *
	 * @param args
	 */
	onEndAnimation(args: any): any;

	/**
	 *
	 * @param args
	 */
	onMouseEnter(args: any): any;

	/**
	 *
	 * @param args
	 */
	onMouseLeave(args: any): any;

	/**
	 *
	 * @param args
	 */
	onStartMouseMove(args: any): any;

	/**
	 *
	 * @param args
	 */
	onMouseMove(args: any): any;

	/**
	 *
	 * @param args
	 */
	onEndMouseMove(args: any): any;

	/**
	 *
	 * @param args
	 */
	onLeftButtonPress(args: any): any;

	/**
	 *
	 * @param args
	 */
	onLeftButtonRelease(args: any): any;

	/**
	 *
	 * @param args
	 */
	onMiddleButtonPress(args: any): any;

	/**
	 *
	 * @param args
	 */
	onMiddleButtonRelease(args: any): any;

	/**
	 *
	 * @param args
	 */
	onRightButtonPress(args: any): any;

	/**
	 *
	 * @param args
	 */
	onRightButtonRelease(args: any): any;

	/**
	 *
	 * @param args
	 */
	onKeyPress(args: any): any;

	/**
	 *
	 * @param args
	 */
	onKeyDown(args: any): any;

	/**
	 *
	 * @param args
	 */
	onKeyUp(args: any): any;

	/**
	 *
	 * @param args
	 */
	onStartMouseWheel(args: any): any;

	/**
	 *
	 * @param args
	 */
	onMouseWheel(args: any): any;

	/**
	 *
	 * @param args
	 */
	onEndMouseWheel(args: any): any;

	/**
	 *
	 * @param args
	 */
	onStartPinch(args: any): any;

	/**
	 *
	 * @param args
	 */
	onPinch(args: any): any;

	/**
	 *
	 * @param args
	 */
	onEndPinch(args: any): any;

	/**
	 *
	 * @param args
	 */
	onStartPan(args: any): any;

	/**
	 *
	 * @param args
	 */
	onPan(args: any): any;

	/**
	 *
	 * @param args
	 */
	onEndPan(args: any): any;

	/**
	 *
	 * @param args
	 */
	onStartRotate(args: any): any;

	/**
	 *
	 * @param args
	 */
	onRotate(args: any): any;

	/**
	 *
	 * @param args
	 */
	onEndRotate(args: any): any;

	/**
	 *
	 * @param args
	 */
	onButton3D(args: any): any;

	/**
	 *
	 * @param args
	 */
	onMove3D(args: any): any;

	/**
	 *
	 * @param args
	 */
	onStartPointerLock(args: any): any;

	/**
	 *
	 * @param args
	 */
	onEndPointerLock(args: any): any;

	/**
	 *
	 * @param args
	 */
	onStartInteractionEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	onInteractionEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	onEndInteractionEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	animationEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	button3DEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	endAnimationEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	endInteractionEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	endMouseMoveEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	endMouseWheelEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	endPanEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	endPinchEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	endPointerLockEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	endRotateEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	interactionEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	keyDownEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	keyPressEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	keyUpEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	leftButtonPressEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	leftButtonReleaseEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	middleButtonPressEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	middleButtonReleaseEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	mouseEnterEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	mouseLeaveEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	mouseMoveEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	mouseWheelEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	move3DEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	panEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	pinchEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	rightButtonPressEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	rightButtonReleaseEvent(args: any): any;

	/**
	 *
	 * @param args
	 */
	rotateEvent(args: any): any;

	/**
	 * Turn on/off the automatic repositioning of lights as the camera moves.
	 * @param lightFollowCamera
	 */
	setLightFollowCamera(lightFollowCamera: boolean): boolean;

	/**
	 * Set the object used to perform pick operations.
	 * @param picker
	 */
	setPicker(picker: any): boolean;

	/**
	 *
	 * @param recognizeGestures
	 */
	setRecognizeGestures(recognizeGestures: boolean): boolean;

	/**
	 * Set the desired update rate.
	 * @param desiredUpdateRate
	 */
	setDesiredUpdateRate(desiredUpdateRate: number): boolean;

	/**
	 * Set the desired update rate when movement has stopped.
	 * @param stillUpdateRate
	 */
	setStillUpdateRate(stillUpdateRate: number): boolean;

	/**
	 * Start the event loop.
	 * This is provided so that you do not have to implement your own event loop.
	 * You still can use your own event loop if you want.
	 */
	start(): void;

	/**
	 *
	 * @param args
	 */
	startAnimationEvent(args: any): any;


	/**
	 *
	 * @param args
	 */
	startInteractionEvent(args: any): any;


	/**
	 *
	 * @param args
	 */
	startMouseMoveEvent(args: any): any;


	/**
	 *
	 * @param args
	 */
	startMouseWheelEvent(args: any): any;


	/**
	 *
	 * @param args
	 */
	startPanEvent(args: any): any;


	/**
	 *
	 * @param args
	 */
	startPinchEvent(args: any): any;


	/**
	 *
	 * @param args
	 */
	startPointerLockEvent(args: any): any;


	/**
	 *
	 * @param args
	 */
	startRotateEvent(args: any): any;


	/**
	 * Set/Get the rendering window being controlled by this object.
	 * @param aren
	 */
	setRenderWindow(aren: any): void;

	/**
	 * External switching between joystick/trackball/new? modes.
	 * @param style
	 */
	setInteractorStyle(style: any): void;

	/**
	 * ---------------------------------------------------------------------
	 */
	initialize(): void;

	/**
	 * Enable/Disable interactions.
	 * By default interactors are enabled when initialized.
	 * Initialize() must be called prior to enabling/disabling interaction.
	 * These methods are used when a window/widget is being shared by multiple renderers and interactors.
	 * This allows a "modal" display where one interactor is active when its data is to be displayed and all other interactors associated with the widget are disabled when their data is not displayed.
	 */
	enable(): void;

	/**
	 *
	 */
	disable(): void;

	/**
	 *
	 */
	startEventLoop(): void;

	/**
	 *
	 */
	getCurrentRenderer(): void;

	/**
	 *
	 * @param container
	 */
	bindEvents(container: any): void;

	/**
	 *
	 */
	unbindEvents(): void;

	/**
	 *
	 * @param {KeyboardEvent} event 
	 */
	handleKeyPress(event: KeyboardEvent): void;

	/**
	 *
	 * @param {KeyboardEvent} event 
	 */
	handleKeyDown(event: KeyboardEvent): void;

	/**
	 *
	 * @param {KeyboardEvent} event 
	 */
	handleKeyUp(event: KeyboardEvent): void;

	/**
	 *
	 * @param {MouseEvent} event 
	 */
	handleMouseDown(event: MouseEvent): void;

	/**
	 *
	 */
	requestPointerLock(): void;

	/**
	 *
	 */
	exitPointerLock(): void;

	/**
	 *
	 */
	isPointerLocked(): boolean;

	/**
	 *
	 */
	handlePointerLockChange(): void;

	/**
	 *
	 * @param requestor
	 */
	requestAnimation(requestor: any): void;

	/**
	 *
	 */
	isAnimating(): boolean;

	/**
	 *
	 * @param requestor 
	 * @param {Boolean} [skipWarning] 
	 */
	cancelAnimation(requestor: any, skipWarning?: boolean): void;

	/**
	 *
	 */
	switchToVRAnimation(): void;

	/**
	 *
	 */
	returnFromVRAnimation(): void;

	/**
	 *
	 * @param {Number} displayId The ID of the display.
	 */
	updateGamepads(displayId: number): void;

	/**
	 *
	 * @param {MouseEvent} event 
	 */
	handleMouseMove(event: MouseEvent): void;

	/**
	 *
	 */
	handleAnimation(): void;

	/**
	 *
	 * @param {MouseEvent} event 
	 */
	handleWheel(event: MouseEvent): void;

	/**
	 *
	 * @param {MouseEvent} event 
	 */
	handleMouseEnter(event: MouseEvent): void;

	/**
	 *
	 * @param {MouseEvent} event 
	 */
	handleMouseLeave(event: MouseEvent): void;

	/**
	 *
	 * @param {MouseEvent} event 
	 */
	handleMouseUp(event: MouseEvent): void;

	/**
	 *
	 * @param {TouchEvent} event 
	 */
	handleTouchStart(event: TouchEvent): void;

	/**
	 *
	 * @param {TouchEvent} event 
	 */
	handleTouchMove(event: TouchEvent): void;

	/**
	 *
	 * @param {TouchEvent} event 
	 */
	handleTouchEnd(event: TouchEvent): void;

	/**
	 *
	 * @param val
	 */
	setView(val: any): void;

	/**
	 * @return first renderer to be used for camera manipulation
	 */
	getFirstRenderer(): vtkRenderer;

	/**
	 *
	 * @param {Number} x 
	 * @param {Number} y 
	 */
	findPokedRenderer(x: number, y: number): vtkRenderer;

	/**
	 * only render if we are not animating. If we are animating
	 * then renders will happen naturally anyhow and we definitely
	 * do not want extra renders as the make the apparent interaction
	 * rate slower.
	 */
	render(): void;

	/**
	 * we know we are in multitouch now, so start recognizing
	 * @param event
	 * @param positions
	 */
	recognizeGesture(event: 'TouchStart' | 'TouchMouve' | 'TouchEnd', positions: IPosition): void;

	/**
	 *
	 */
	handleVisibilityChange(): void;

	/**
	 * Stop animating if the renderWindowInteractor is deleted.
	 */
	delete(): void;
}


/**
 * Method use to decorate a given object (publicAPI+model) with vtkRenderWindowInteractor characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IRenderWindowInteractorInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IRenderWindowInteractorInitialValues): void;

/**
 * Method use to create a new instance of vtkRenderWindowInteractor
 */
export function newInstance(initialValues?: IRenderWindowInteractorInitialValues): vtkRenderWindowInteractor;

/**
 * vtkRenderWindowInteractor provides an interaction mechanism for
 * mouse/key/time events. It handles routing of mouse/key/timer messages to
 * vtkInteractorObserver and its subclasses. vtkRenderWindowInteractor also
 * provides controls for picking, rendering frame rate.
 *
 * vtkRenderWindowInteractor serves to hold user preferences and route messages
 * to vtkInteractorStyle. Callbacks are available for many events. Platform
 * specific subclasses should provide methods for manipulating timers,
 * TerminateApp, and an event loop if required via
 *
 * Initialize/Start/Enable/Disable.
 *
 * ## Caveats
 * 
 * vtkRenderWindowInteractor routes events through VTK’s command/observer design
 * pattern. That is, when vtkRenderWindowInteractor (actually, one of its
 * subclasses) sees an event, it translates it into a VTK event using the
 * InvokeEvent() method. Afterward, any vtkInteractorObservers registered for
 * that event are expected to respond appropriately.
 */
export declare const vtkRenderWindowInteractor: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkRenderWindowInteractor;
