
VertexArrayObject - encapsulate VAOs or emulate them

The VertexArrayObject class uses, or emulates, vertex array objects.
These are extremely useful for setup/tear down of vertex attributes, and can
offer significant performance benefits when the hardware supports them.
It should be noted that this object is very lightweight, and it assumes the
objects being used are correctly set up. Even without support for VAOs this
class caches the array locations, types, etc and avoids repeated look ups. It
it bound to a single ShaderProgram object.

### bind();

Bind the VAO

### release();

Release the VAO

### releaseGraphicsResources();

Release any graphics  resources used

### shaderProgramChanged();

Hand the shaderprogram changing, requires rebuilding the VAO

### addAttributeArray(shaderProgram, buffer, name, offset, stride,
                       elementType, elementTupleSize, normalize);

Add an attribute to the VAO with the specified characteristics

### addAttributeArrayWithDivisor(shaderProgram, buffer, name, offset, stride,
                         elementType, elementTupleSize, normalize,
                         divisor, isMatrix);

Add an attribute to the VAO with the specified characteristics. Handle
attribute divisors where an attribute updates less frequently than
every primitive.

### addAttributeMatrixWithDivisor(shaderProgram, buffer, name, offset, stride,
                         elementType, elementTupleSize, normalize,
                         divisor);

Add an attribute to the VAO with the specified characteristics. Handle
attribute divisors where an attribute updates less frequently than
every primitive.

### removeAttributeArray(name);

Remove ab attribute array from the VAO

### setForceEmulation(val);

Force this VAO to emulate a vertex aray object even if
the system supports VAOs. This can be useful in cases where
the vertex array object does not handle all extensions.
