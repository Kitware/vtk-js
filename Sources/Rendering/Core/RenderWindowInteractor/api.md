## Introduction

vtkRenderWindowInteractor provides an interaction mechanism for
mouse/key/time events. It handles routing of mouse/key/timer messages to
vtkInteractorObserver and its subclasses. vtkRenderWindowInteractor also
provides controls for picking, rendering frame rate.

vtkRenderWindowInteractor serves to hold user preferences and route messages
to vtkInteractorStyle. Callbacks are available for many events. Platform
specific subclasses should provide methods for manipulating timers,
TerminateApp, and an event loop if required via

Initialize/Start/Enable/Disable.

## Caveats

vtkRenderWindowInteractor routes events through VTK’s command/observer design
pattern. That is, when vtkRenderWindowInteractor (actually, one of its
subclasses) sees an event, it translates it into a VTK event using the
InvokeEvent() method. Afterward, any vtkInteractorObservers registered for
that event are expected to respond appropriately.




## See Also

## Methods


### animationEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### bindEvents




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **container** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### button3DEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### cancelAnimation




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **requestor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **skipWarning** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### delete

Stop animating if the renderWindowInteractor is deleted.



### disable





### enable

Enable/Disable interactions.
By default interactors are enabled when initialized.
Initialize() must be called prior to enabling/disabling interaction.
These methods are used when a window/widget is being shared by multiple renderers and interactors.
This allows a "modal" display where one interactor is active when its data is to be displayed and all other interactors associated with the widget are disabled when their data is not displayed.



### endAnimationEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### endInteractionEventEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### endMouseMoveEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### endMouseWheelEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### endPanEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### endPinchEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### endPointerLockEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### endRotateEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### exitPointerLock





### extend

Method use to decorate a given object (publicAPI+model) with vtkRenderWindowInteractor characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### findPokedRenderer




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getContainer





### getCurrentRenderer





### getDesiredUpdateRate





### getEnableRender





### getEnabled





### getFirstRenderer



#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> | first renderer to be used for camera manipulation |


### getInitialized





### getInteractorStyle





### getLastFrameTime





### getLightFollowCamera





### getPicker





### getRecognizeGestures





### getStillUpdateRate





### getView





### handleAnimation





### handleKeyDown




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **event** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### handleKeyPress




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **event** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### handleKeyUp




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **event** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### handleMouseDown




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **event** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### handleMouseEnter




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **event** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### handleMouseLeave




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **event** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### handleMouseMove




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **event** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### handleMouseUp




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **event** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### handlePointerLockChange





### handleTouchEnd




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **event** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### handleTouchMove




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **event** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### handleTouchStart




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **event** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### handleVisibilityChange





### handleWheel




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **event** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### initialize

---------------------------------------------------------------------



### interactionEventEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### invokeAnimation





### invokeButton3D





### invokeEndAnimation





### invokeEndInteractionEvent





### invokeEndMouseMove





### invokeEndMouseWheel





### invokeEndPan





### invokeEndPinch





### invokeEndPointerLock





### invokeEndRotate





### invokeInteractionEvent





### invokeKeyDown





### invokeKeyPress





### invokeKeyUp





### invokeLeftButtonPress





### invokeLeftButtonRelease





### invokeMiddleButtonPress





### invokeMiddleButtonRelease





### invokeMouseEnter





### invokeMouseLeave





### invokeMouseMove





### invokeMouseWheel





### invokeMove3D





### invokePan





### invokePinch





### invokeRightButtonPress





### invokeRightButtonRelease





### invokeRotate





### invokeStartAnimation





### invokeStartInteractionEvent





### invokeStartMouseMove





### invokeStartMouseWheel





### invokeStartPan





### invokeStartPinch





### invokeStartPointerLock





### invokeStartRotate





### isAnimating





### isPointerLocked





### keyDownEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### keyPressEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### keyUpEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### leftButtonPressEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### leftButtonReleaseEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### middleButtonPressEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### middleButtonReleaseEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### mouseEnterEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### mouseLeaveEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### mouseMoveEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### mouseWheelEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### move3DEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### newInstance

Method use to create a new instance of vtkRenderWindowInteractor



### onAnimation




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onButton3D




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onEndAnimation




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onEndInteractionEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onEndMouseMove




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onEndMouseWheel




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onEndPan




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onEndPinch




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onEndPointerLock




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onEndRotate




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onInteractionEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onKeyDown




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onKeyPress




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onKeyUp




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onLeftButtonPress




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onLeftButtonRelease




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onMiddleButtonPress




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onMiddleButtonRelease




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onMouseEnter




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onMouseLeave




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onMouseMove




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onMouseWheel




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onMove3D




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onPan




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onPinch




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onRightButtonPress




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onRightButtonRelease




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onRotate




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onStartAnimation




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onStartInteractionEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onStartMouseMove




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onStartMouseWheel




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onStartPan




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onStartPinch




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onStartPointerLock




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### onStartRotate




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### panEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### pinchEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### recognizeGesture

we know we are in multitouch now, so start recognizing


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **event** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **positions** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### render

only render if we are not animating. If we are animating
then renders will happen naturally anyhow and we definitely
do not want extra renders as the make the apparent interaction
rate slower.



### requestAnimation




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **requestor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### requestPointerLock





### returnFromVRAnimation





### rightButtonPressEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### rightButtonReleaseEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### rotateEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDesiredUpdateRate

Set the desired update rate.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **desiredUpdateRate** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setInteractorStyle

External switching between joystick/trackball/new? modes.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **style** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setLightFollowCamera

Turn on/off the automatic repositioning of lights as the camera moves.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **lightFollowCamera** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPicker

Set the object used to perform pick operations.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **picker** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setRecognizeGestures




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **recognizeGestures** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setRenderWindow

Set/Get the rendering window being controlled by this object.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **aren** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setStillUpdateRate

Set the desired update rate when movement has stopped.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **stillUpdateRate** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setView




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **val** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### start

Start the event loop.
This is provided so that you do not have to implement your own event loop.
You still can use your own event loop if you want.



### startAnimationEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### startEventLoop





### startInteractionEventEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### startMouseMoveEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### startMouseWheelEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### startPanEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### startPinchEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### startPointerLockEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### startRotateEvent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### switchToVRAnimation





### type





### unbindEvents





### updateGamepads




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **displayId** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


