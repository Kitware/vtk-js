manage Shader Programs within a context

### readyShaderProgram(vertexCode, fragmentCode, geometryCode)

make sure the specified shaders are compiled, linked, and bound

### readyShaderProgram(shaders)

make sure the specified shaders are compiled, linked, and bound
will increment the reference count on the shaders if it
needs to keep them around

### readyShaderProgram(shaderprogram)

make sure the specified shaders are compiled, linked, and bound

### releaseCurrentShader()

Release the current shader. Basically go back to
having no shaders loaded. This is useful for old
legacy code that relies on no shaders being loaded.

###  releaseGraphicsResources(window)

Free up any resources being used by the provided shader

###  clearLastShaderBound()

Clear the last Shader bound, called by shaders as they release
their graphics resources
