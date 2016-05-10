create a window for renderers to draw into

RenderWindow is an object that specify the behavior of a
rendering window. A rendering window is a window in a graphical user
interface where renderers draw their images. Methods are provided to
synchronize the rendering process, set window size, and control double
buffering.

### addRenderer(renderer)/ removeRenderer(renderer) / hasRenderer() : Boolean

Manage associated renderers.

### render()

Trigger a render call on each renderers.

### start()

Initialize the rendering process.

### finalize()

Finalize the rendering process.

### frame()

A termination method performed at the end of the rendering process
to do things like swapping buffers (if necessary) or similar actions.

### getRenderers() : Array

Return the array of Renderers.

### setCursor(str) / getCursor() : String

Allow to change cursor representation of the RenderWindow.
Default value is 'pointer', but any CSS cursor style can be used here.

### setCursorVisibility(show) / getCursorVisibility()

Allow to show or hide the mouse pointer. If visible the cursor used will be the one that was set with the setCursor method.

### setSwapBuffers(Boolean) / getSwapBuffers() : Boolean

Turn on/off buffer swapping between images.

### setMultiSamples(int) / getMultiSamples() : Integer

The number of multisamples to use for hardware antialiasing.

### setInteractor(interactor) / getInteractor() : Interactor

The interactor associated with this render window.

### setNumberOfLayers(int) / getNumberOfLayers() : Integer
 
Get the number of layers for renderers.  Each renderer should have
its layer set individually.  Some algorithms iterate through all layers,
so it is not wise to set the number of layers to be exorbitantly large
(say bigger than 100).

### getNeverRendered()

Return true if that render window never rendered anything yet.
