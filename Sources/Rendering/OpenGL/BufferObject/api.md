## OpenGL buffer object

OpenGL buffer object to store index, geometry and/or attribute data on the GPU.

### getType()

Get the type of the buffer object.

### setType(type)

Set the type of the buffer object.

### getHandle()

Get the handle of the buffer object (actual buffer object returned by WebGL).

### isReady()

Determine if the buffer object is ready to be used.

### generateBuffer

Generate the the opengl buffer for this handle.

### upload(data, type)

Upload data to the buffer object. The internal buffer object type must match the type or be
uninitialized. The data param must be a typed array and contain tightly packed values
accessible by the index operator ([]).

### bind()

Bind the buffer object ready for rendering. Note: Only one ARRAY_BUFFER and one
ELEMENT_ARRAY_BUFFER may be bound at any time.

### release()

Release the buffer. This should be done after rendering is complete.

### releaseGraphicsResources()

Release any graphics resources that are being consumed by this class.

### getError()

Return a string describing errors.
