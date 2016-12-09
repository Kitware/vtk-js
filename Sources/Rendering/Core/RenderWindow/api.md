## newInstance()

Create a window for renderers to be placed into

RenderWindow is an object that specify the behavior of a
rendering window. A rendering window is a window in a graphical user
interface where renderers draw their images.

### addRenderer(renderer)/ removeRenderer(renderer) / hasRenderer() : Boolean

Manage associated renderers.

### getRenderers() : Array

Return the array of Renderers.

### setCursor(str) / getCursor() : String

Change cursor representation of the RenderWindow.
Default value is 'pointer', but any [CSS cursor style](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor#Values) can be used here.

### setCursorVisibility(show) / getCursorVisibility()

Show or hide the mouse pointer. If visible the cursor used will be the one that was set with the setCursor method.

### setSwapBuffers(Boolean) / getSwapBuffers() : Boolean

Turn on or off buffer swapping between images.

### setMultiSamples(int) / getMultiSamples() : Integer

The number of multisamples to use for hardware antialiasing.

### setInteractor(interactor) / getInteractor() : Interactor

The interactor associated with this render window.

### setNumberOfLayers(int) / getNumberOfLayers() : Integer

Get the number of layers for renderers. Each renderer should have
its layer set individually. Some algorithms iterate through all layers,
so it is not wise to set the number of layers to be exorbitantly large
(say bigger than 100).
