WebGL build ArrayBufferObjects based on CellArrays

The vtkCellArrayBufferObject is designed to build array buffers that do not rely on 
an index buffer but rather just a glDrawArrays. They are build based on cellArrays
that get passed from a PolyDataMapper

###   createVBO = (cellArray, inRep, outRep, points, normals, tcoords, colors)

The main entry point, builds the array buffer based on the supplied arguments
