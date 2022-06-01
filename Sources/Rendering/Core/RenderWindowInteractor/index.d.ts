import { vtkObject, vtkSubscription } from "../../../interfaces";
import vtkRenderer from "../Renderer";
import { Axis, Device, Input } from "./Constants";

declare enum handledEvents {
	'StartAnimation',
	'Animation',
	'EndAnimation',
	'MouseEnter',
	'MouseLeave',
	'StartMouseMove',
	'MouseMove',
	'EndMouseMove',
	'LeftButtonPress',
	'LeftButtonRelease',
	'MiddleButtonPress',
	'MiddleButtonRelease',
	'RightButtonPress',
	'RightButtonRelease',
	'KeyPress',
	'KeyDown',
	'KeyUp',
	'StartMouseWheel',
	'MouseWheel',
	'EndMouseWheel',
	'StartPinch',
	'Pinch',
	'EndPinch',
	'StartPan',
	'Pan',
	'EndPan',
	'StartRotate',
	'Rotate',
	'EndRotate',
	'Button3D',
	'Move3D',
	'StartPointerLock',
	'EndPointerLock',
	'StartInteraction',
	'Interaction',
	'EndInteraction',
	'AnimationFrameRateUpdate',
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
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeStartAnimation(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeAnimation(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeEndAnimation(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokePointerEnter(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokePointerLeave(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 */
	invokeMouseEnter(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeMouseLeave(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeStartMouseMove(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeMouseMove(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeEndMouseMove(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeLeftButtonPress(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeLeftButtonRelease(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeMiddleButtonPress(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeMiddleButtonRelease(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeRightButtonPress(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeRightButtonRelease(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeKeyPress(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeKeyDown(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeKeyUp(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeStartMouseWheel(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeMouseWheel(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeEndMouseWheel(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeStartPinch(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokePinch(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeEndPinch(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeStartPan(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokePan(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeEndPan(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeStartRotate(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeRotate(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeEndRotate(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeButton3D(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeMove3D(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeStartPointerLock(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeEndPointerLock(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeStartInteractionEvent(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeInteractionEvent(callData: IRenderWindowInteractorEvent): void;

	/**
	 * 
	 * @param {IRenderWindowInteractorEvent} callData 
	 */
	invokeEndInteractionEvent(callData: IRenderWindowInteractorEvent): void;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onStartAnimation(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onAnimation(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onEndAnimation(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onPointerEnter(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onPointerLeave(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 *
	 * @param cb The callback to be called
	 */
	onMouseEnter(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onMouseLeave(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onStartMouseMove(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onMouseMove(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onEndMouseMove(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onLeftButtonPress(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onLeftButtonRelease(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onMiddleButtonPress(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onMiddleButtonRelease(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onRightButtonPress(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onRightButtonRelease(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onKeyPress(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onKeyDown(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onKeyUp(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onStartMouseWheel(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onMouseWheel(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onEndMouseWheel(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onStartPinch(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onPinch(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onEndPinch(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onStartPan(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onPan(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onEndPan(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onStartRotate(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onRotate(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onEndRotate(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onButton3D(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onMove3D(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onStartPointerLock(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onEndPointerLock(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onStartInteractionEvent(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
	 */
	onInteractionEvent(cb: InteractorEventCallback, priority?: number): Readonly<vtkSubscription>;

	/**
	 * 
	 * @param {InteractorEventCallback} cb The callback to be called.
	 * @param {Number} [priority] The priority of the event.
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
	 * @param {PointerEvent} event 
	 */
	handlePointerDown(event: PointerEvent): void;

	/**
	 * 
	 * @param {PointerEvent} event 
	 */
	handlePointerUp(event: PointerEvent): void;

	/**
	 * 
	 * @param {PointerEvent} event 
	 */
	handlePointerCancel(event: PointerEvent): void;

	/**
	 * 
	 * @param {PointerEvent} event 
	 */
	handlePointerMove(event: PointerEvent): void;

	/**
	 *
	 * @param {PointerEvent} event 
	 */
	handleMouseDown(event: PointerEvent): void;

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
	 * @param {PointerEvent} event 
	 */
	handleMouseMove(event: PointerEvent): void;

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
	 * @param {PointerEvent} event 
	 */
	handlePointerEnter(event: PointerEvent): void;

	/**
	 *
	 * @param {PointerEvent} event 
	 */
	handlePointerLeave(event: PointerEvent): void;

	/**
	 *
	 * @param {PointerEvent} event 
	 */
	handleMouseUp(event: PointerEvent): void;

	/**
	 *
	 * @param {PointerEvent} event 
	 */
	handleTouchStart(event: PointerEvent): void;

	/**
	 *
	 * @param {PointerEvent} event 
	 */
	handleTouchMove(event: PointerEvent): void;

	/**
	 *
	 * @param {PointerEvent} event 
	 */
	handleTouchEnd(event: PointerEvent): void;

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
	recognizeGesture(event: 'TouchStart' | 'TouchMove' | 'TouchEnd', positions: IPosition): void;

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
	newInstance: typeof newInstance;
	extend: typeof extend;
	handledEvents: typeof handledEvents;
	Device: typeof Device;
	Input: typeof Input;
	Axis: typeof Axis;
};
export default vtkRenderWindowInteractor;
