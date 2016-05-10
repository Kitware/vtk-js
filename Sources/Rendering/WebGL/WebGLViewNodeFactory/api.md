factory that chooses vtkViewNodes to create specific to WebGL

Registers functions to create WebGL ViewNodes for  vtk

### registerOverride(apiName, createFunc)

Give a functin pointer to a class that will manufacture a
vtkViewNode when given a class name string.

### createNode(apiName)

Creates and returns a vtkViewNode for the provided renderable.
