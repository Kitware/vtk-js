## OpenGL index buffer object

OpenGL buffer object to store index data on the GPU.

### createTriangleIndexBuffer(cellArray, points)

Used to create an IBO for triangle primatives

### appendTriangleIndexBuffer(indexArray, cells, points, vertexOffset)

Used to create an IBO for triangle primatives

### createTriangleLineIndexBuffer(cells)

Create a IBO for wireframe polys/tris

### appendTriangleLineIndexBuffer(indexArray, cells, vertexOffset);

Create a IBO for wireframe polys/tris

### createLineIndexBuffer(cells)

Create a IBO for wireframe polys/tris

### appendLineIndexBuffer(indexArray, cells, vertexOffset)

Used to create an IBO for line primatives

### createPointIndexBuffer(cells)

Used to create an IBO for primatives as points

### appendPointIndexBuffer(indexArray, cells, vertexOffset)

Used to create an IBO for primatives as points

### createStripIndexBuffer(cells, wireframe)

Used to create an IBO for line strips and triangle strips (wireframe is a boolean option)

### createEdgeFlagIndexBuffer(cells, edgeflags)

Special index buffer for polys wireframe with edge visibility flags

### createCellSupportArrays(cellArrays, cellCellMap, representation)

Create supporting arays that are needed when rendering cell data.  Some VTK cells
have to be broken into smaller cells for OpenGL When we have cell data we have to
map cell attributes from the VTK cell number to the actual OpenGL cell.  The following
code fills in:

    cellCellMap which maps a openGL cell id to the VTK cell it came from
