## Introduction

vtkRenderer is a Viewport designed to hold 3D properties. It contains
an instance of vtkCamera, a collection of vtkLights, and vtkActors. It exists
within a RenderWindow. A RenderWindow may have multiple Renderers
representing different viewports of the Window and Renderers can be layered
on top of each other as well.




## See Also

## Methods


### actors





### addActor




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **actor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### addLight

Add a light to the list of lights.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **light** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### addVolume




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **volume** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### allBounds





### allocateTime

Not Implemented yet



### allocatedRenderTime





### ambient





### automaticLightCreation





### clippingRangeExpansion





### computeVisiblePropBounds





### createLight

Create and add a light to renderer.



### draw





### erase





### extend

Method use to decorate a given object (publicAPI+model) with vtkRenderer characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getActiveCamera

Get the active camera



### getActiveCameraAndResetIfCreated





### getActors

Return any actors in this renderer.



### getActorsByReference

Return any actors in this renderer.



### getAllocatedRenderTime





### getAutomaticLightCreation





### getBackgroundTexture





### getBackingStore





### getClippingRangeExpansion





### getDelegate





### getDraw





### getErase





### getInteractive





### getLastRenderTimeInSeconds





### getLastRenderingUsedDepthPeeling





### getLayer





### getLightFollowCamera





### getLights





### getLightsByReference





### getMTime

Return the `Modified Time` which is a monotonic increasing integer
global for all vtkObjects.

This allow to solve a question such as:
 - Is that object created/modified after another one?
 - Do I need to re-execute this filter, or not? ...

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> | the global modified time |


### getMaximumNumberOfPeels





### getNearClippingPlaneTolerance





### getNumberOfPropsRendered





### getOcclusionRatio





### getPass





### getPreserveColorBuffer





### getPreserveDepthBuffer





### getRenderWindow





### getSelector





### getTexturedbackground





### getTimeFactor





### getTransparent





### getTwosidedlighting





### getUsedepthpeeling





### getUseshadows





### getVTKWindow





### getVolumes

Return the collection of volumes.



### getVolumesByReference

Return the collection of volumes.



### interactive





### isActiveCameraCreated





### lastRenderTimeInSeconds





### layer





### lightFollowCamera





### lights





### makeCamera

Create a new Camera sutible for use with this type of Renderer.



### makeLight

Create a new Light sutible for use with this type of Renderer.



### maximumNumberOfPeels





### nearClippingPlaneTolerance





### newInstance

Method use to create a new instance of vtkRenderer.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### normalizedDisplayToWorld

requires the aspect ratio of the viewport as X/Y


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **aspect** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### numberOfPropsRendered





### occlusionRatio





### pass





### preserveColorBuffer





### preserveDepthBuffer





### projectionToView




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **aspect** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### removeActor




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **actor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### removeAllActors





### removeAllLights

Remove all lights from the list of lights.



### removeAllVolumes





### removeLight

Remove a light from the list of lights.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **light** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### removeVolume




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **volume** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### resetCamera




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **bounds** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### resetCameraClippingRange




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **bounds** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setActiveCamera

Specify the camera to use for this renderer.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **camera** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setAutomaticLightCreation




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **automaticLightCreation** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setBackgroundTexture




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **backgroundTexture** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setBackingStore




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **backingStore** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setClippingRangeExpansion




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **clippingRangeExpansion** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDelegate




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **delegate** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDraw




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **draw** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setErase




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **erase** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setInteractive




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **interactive** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setLayer




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **layer** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setLightCollection

Set the collection of lights.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **lights** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setLightFollowCamera




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **lightFollowCamera** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setMaximumNumberOfPeels




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **maximumNumberOfPeels** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setNearClippingPlaneTolerance




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **nearClippingPlaneTolerance** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setOcclusionRatio




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **occlusionRatio** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPass




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **pass** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPreserveColorbuffer




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **preserveColorBuffer** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPreserveDepthbuffer




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **preserveDepthBuffer** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setRenderWindow




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **renderWindow** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setTexturedBackground




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **texturedBackground** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setTwoSidedLighting




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **twoSidedLighting** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setUseDepthPeeling




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **useDepthPeeling** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setUseShadows




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **useShadows** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### texturedBackground





### timeFactor





### twoSidedLighting





### updateCamera





### updateGeometry

Not Implemented yet



### updateLightGeometry





### updateLightsGeometryToFollowCamera

Ask the lights in the scene that are not in world space
(for instance, Headlights or CameraLights that are attached to the
camera) to update their geometry to match the active camera.



### useDepthPeeling





### useShadows





### viewToProjection

Convert world point coordinates to view coordinates.
requires the aspect ratio of the viewport as X/Y


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **aspect** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### viewToWorld

requires the aspect ratio of the viewport as X/Y


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### visibleActorCount





### visibleVolumeCount

Not Implemented yet



### volumes





### worldToNormalizedDisplay

requires the aspect ratio of the viewport as X/Y


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **aspect** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### worldToView

Convert world point coordinates to view coordinates.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


