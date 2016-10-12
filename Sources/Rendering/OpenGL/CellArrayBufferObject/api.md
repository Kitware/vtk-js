WebGL build ArrayBufferObjects based on CellArrays

The vtkCellArrayBufferObject is designed to build array buffers that do not rely on 
an index buffer but rather just a glDrawArrays. They are built based on cellArrays
that get passed from a PolyDataMapper

###   createVBO = (cellArray, inRep, outRep, points, normals, tcoords, colors)

The main entry point, builds the array buffer based on the supplied arguments

### elementCount

How many elements are in this buffer. Generally you would call DrawArrays 
with this number.

### stride

The stride in bytes between one element and the next

### vertexOffset

The offset in bytes from the start of an element and the vertex data

### normalOffset

The offset in bytes from the start of an element and the normal data

### tCoordOffset

The offset in bytes from the start of an element and the texture coordinate data

### tCoordComponents

The number of components in a texture coordinate, typically 2

### colorOffset

The offset in bytes from the start of an element and the color data

### colorComponents

The number of components in a color value typically 4
