factory that chooses vtkViewNodes to create specific to WebGPU

Registers functions to create WebGPU ViewNodes for  vtk

### registerOverride(apiName, createFunc)

Give a function pointer to a class that will manufacture a
vtkViewNode when given a class name string.

### createNode(apiName)

Creates and returns a vtkViewNode for the provided renderable.
