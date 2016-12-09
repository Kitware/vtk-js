## Introduction

Renderer is a Viewport designed to hold 3D properties. It contains
an instance of vtkCamera, a collection of vtkLights, and vtkActors. It exists
within a RenderWindow. A RenderWindow may have multiple Renderers
representing different viewports of the Window and Renderers can be layered
on top of each other as well.

### addActor(actor) / removeActor(actor) / getActors() : []

Actors that compose the renderer.

### addVolume(volume) / removeVolume(volume) / getVolumes() : []

Volumes that compose the renderer.

### addLight(light) / removeLight(light) / getLights() : []

Lights that compose the renderer.

### twoSidedLighting (set/get Boolean)

Turn on/off two-sided lighting of surfaces. If two-sided lighting is
off, then only the side of the surface facing the light(s) will be lit,
and the other side dark. If two-sided lighting on, both sides of the
surface will be lit.

### lightFollowCamera (set/get Boolean)

Turn on/off the automatic repositioning of lights as the camera moves.
If LightFollowCamera is on, lights that are designated as Headlights
or CameraLights will be adjusted to move with this renderer's camera.
If LightFollowCamera is off, the lights will not be adjusted.

(Note: In previous versions of vtk, this light-tracking
functionality was part of the interactors, not the renderer. For
backwards compatibility, the older, more limited interactor
behavior is enabled by default. To disable this mode, turn the
interactor's LightFollowCamera flag OFF, and leave the renderer's
LightFollowCamera flag ON.)

### updateLightsGeometryToFollowCamera()

Ask the lights in the scene that are not in world space
(for instance, Headlights or CameraLights that are attached to the
camera) to update their geometry to match the active camera.

### activeCamera (set/get Camera)

Get the current camera. If there is not camera assigned to the
renderer already, a new one is created automatically.
This does *not* reset the camera.

### makeCamera()

Create a new Camera sutible for use with this type of Renderer.
For example, a vtkMesaRenderer should create a vtkMesaCamera
in this function. The default is to just call vtkCamera::New.

### allocatedRenderTime

Set/Get the amount of time this renderer is allowed to spend
rendering its scene. This is used by vtkLODActor's.

### getTimeFactor()

Get the ratio between allocated time and actual render time.
TimeFactor has been taken out of the render process.
It is still computed in case someone finds it useful.
It may be taken away in the future.

### visibleActorCount() / visibleVolumeCount()

Returns the number of visible actors or volumes respectively.

### computeVisiblePropBounds() : bounds[6]

Compute the bounding box of all the visible props
Used in ResetCamera() and ResetCameraClippingRange()

### resetCameraClippingRange( bounds = null )

Reset the camera clipping range based on the bounds of the
visible actors. This ensures that no props are cut off

If `bounds` is provided, then reset the camera clipping range
based on the bounding box.
This method is called from `resetCameraClippingRange()`
If Deering frustum field of view is used then the bounds get expanded
by the camera's modelview matrix.

### erase  (set/get Boolean)

When this flag is off, the renderer will not erase the background
or the Z-buffer. It is used to have overlapping renderers.
Both the RenderWindow Erase and Render Erase must be on
for the camera to clear the renderer. By default, Erase is on.

### draw (set/get Boolean)

When this flag is off, render commands are ignored. It is used to either
multiplex a vtkRenderWindow or render only part of a vtkRenderWindow.
By default, Draw is on.

### interactive (set/get Boolean)

Turn on/off interactive status. An interactive renderer is one that
can receive events from an interactor. Should only be set if
there are multiple renderers in the same section of the viewport.

### layer (set/get Integer)

Set/Get the layer that this renderer belongs to. This is only used if
there are layered renderers.

Note: Changing the layer will update the PreserveColorBuffer setting. If
the layer is 0, PreserveColorBuffer will be set to false, making the
bottom renderer opaque. If the layer is non-zero, PreserveColorBuffer will
be set to true, giving the renderer a transparent background. If other
PreserveColorBuffer configurations are desired, they must be adjusted after
the layer is set.

### renderWindow (set/get RenderWindow)

Specify the rendering window in which to draw. This is automatically set
when the renderer is created by MakeRenderer. The user should never need to call this method.

### preserveColorBuffer (set/get Boolean)

By default, the renderer at layer 0 is opaque, and all non-zero layer
renderers are transparent. This flag allows this behavior to be overridden.
If true, this setting will force the renderer to preserve the existing
color buffer regardless of layer. If false, it will always be cleared at
the start of rendering.

This flag influences the Transparent() method, and is updated by calls to
SetLayer(). For this reason it should only be set after changing the layer.

### preserveDepthBuffer (set/get Boolean)

By default, the depth buffer is reset for each renderer. If this flag is
true, this renderer will use the existing depth buffer for its rendering.

### useDepthPeeling (set/get Boolean)

Turn on/off rendering of translucent material with depth peeling
technique. The render window must have alpha bits (i.e., call
`SetAlphaBitPlanes(1)`) and no multisample buffer (i.e. call
`SetMultiSamples(0)`) to support depth peeling.
If UseDepthPeeling is on and the GPU supports it, depth peeling is used
for rendering translucent materials.
If UseDepthPeeling is off, alpha blending is used.
Initial value is off.

### delegate

Set/Get a custom Render call. Allows to hook a Render call from an
external project.It will be used in place of vtkRenderer::Render() if it
is not NULL and its Used ivar is set to true.
Initial value is NULL.

### occlusionRatio (set/get Number)

In case of use of depth peeling technique for rendering translucent
material, define the threshold under which the algorithm stops to
iterate over peel layers. This is the ratio of the number of pixels
that have been touched by the last layer over the total number of pixels
of the viewport area.
Initial value is 0.0, meaning rendering have to be exact. Greater values
may speed-up the rendering with small impact on the quality.

### maximumNumberOfPeels (set/get Integer)

In case of depth peeling, define the maximum number of peeling layers.
Initial value is 4. A special value of 0 means no maximum limit.
It has to be a positive value.

### useShadows (set/get Boolean)

Turn on/off rendering of shadows if supported
Initial value is off.
