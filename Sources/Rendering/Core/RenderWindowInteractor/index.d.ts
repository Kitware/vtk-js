import { vtkObject, vtkSubscription } from "../../../interfaces";
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

export type InteractorEventCallback = (e: IRenderWindowInteractorEvent) => void

export type InteractorEventType = "StartInteractionEvent" | "InteractionEvent" | "EndInteractionEvent"

export interface IRenderWindowInteractorEvent {
	altKey: boolean;
	controlKey: boolean;
	firstRenderer: vtkRenderer;
	pokedRenderer: vtkRenderer;
	position: { x: number; y: number; z: number };
	shiftKey: boolean;
	type: InteractorEventType;
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
	invokeStartAnimation(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeAnimation(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeEndAnimation(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeMouseEnter(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeMouseLeave(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeStartMouseMove(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeMouseMove(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeEndMouseMove(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeLeftButtonPress(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeLeftButtonRelease(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeMiddleButtonPress(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeMiddleButtonRelease(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeRightButtonPress(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeRightButtonRelease(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeKeyPress(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeKeyDown(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeKeyUp(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeStartMouseWheel(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeMouseWheel(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeEndMouseWheel(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeStartPinch(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokePinch(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeEndPinch(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeStartPan(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokePan(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeEndPan(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeStartRotate(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeRotate(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeEndRotate(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeButton3D(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeMove3D(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeStartPointerLock(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeEndPointerLock(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeStartInteractionEvent(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeInteractionEvent(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeEndInteractionEvent(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onStartAnimation(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onAnimation(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onEndAnimation(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onMouseEnter(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onMouseLeave(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onStartMouseMove(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onMouseMove(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onEndMouseMove(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onLeftButtonPress(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onLeftButtonRelease(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onMiddleButtonPress(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onMiddleButtonRelease(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onRightButtonPress(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onRightButtonRelease(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onKeyPress(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onKeyDown(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onKeyUp(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onStartMouseWheel(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onMouseWheel(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onEndMouseWheel(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onStartPinch(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onPinch(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onEndPinch(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onStartPan(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onPan(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onEndPan(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onStartRotate(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onRotate(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onEndRotate(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onButton3D(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onMove3D(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onStartPointerLock(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onEndPointerLock(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onStartInteractionEvent(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onInteractionEvent(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onEndInteractionEvent(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

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
