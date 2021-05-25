WebGL rendering window

vtkWebGLRenderWindow is designed to view/render a vkRenderWindow

### build()

preparefor rendering

### render()

do the rendering

### OpenGLInit()

Initialize OpenGL for this window.

### OpenGLInitState()

Initialize the state of OpenGL that VTK wants for this window

### OpenGLInitContext();

Initialize VTK for rendering in a new OpenGL context

### getShaderCache();

Returns an Shader Cache object

### Initialize();

Initialize the rendering window. This will setup all system-specific
resources. This method and Finalize() must be symmetric and it
should be possible to call them multiple times, even changing WindowId
in-between. This is what WindowRemap does.

### captureNextImage(format, options);

Capture a screenshot of the contents of this renderwindow.  The options object
can include a `size` array (`[w, h]`) or a `scale` floating point value, as well
as a `resetCamera` boolean.  If `size` is provided, the captured screenshot will
be of the given size (and `resetCamera` could be useful in this case if the
aspect ratio of `size` does not match the current renderwindow size).  Otherwise,
if `scale` is provided, it will be multiplied by the current renderwindow size
to compute the screenshot size.  If no `size` or `scale` are provided, the
current renderwindow size is assumed.  The default format is "image/png".

Returns a promise that resolves to the captured screenshot.
