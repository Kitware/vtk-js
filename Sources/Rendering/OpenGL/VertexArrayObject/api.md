
VertexArrayObject - encapsulate WebGL2 vertex array objects

The VertexArrayObject class wraps native WebGL2 vertex array objects.
These are extremely useful for setup/tear down of vertex attributes, and
offer significant performance benefits. It should be noted that this object
is very lightweight, and it assumes the objects being used are correctly set
up. It is bound to a single ShaderProgram object.

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

Remove an attribute array from the VAO
