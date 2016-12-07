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
