encapsulate a glsl shader

represents a shader, vertex, fragment, geometry etc

### type

The type  of this shader, vertex, fragment, geometry

### source

the shader source code

### getError()

Get the error message (empty if none) for the shader. */

### getHandle()

Get the handle of the shader. */

### compile()

Compile the shader. A valid context must to current in order to compile the shader.

### cleanup();
