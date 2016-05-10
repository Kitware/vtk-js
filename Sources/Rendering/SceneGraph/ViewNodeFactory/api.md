factory that chooses vtkViewNodes to create

Class tells VTK which specific vtkViewNode subclass to make when it is
asked to make a vtkViewNode for a particular renderable. modules for
different rendering backends are expected to use this to customize the
set of instances for their own purposes

### registerOverride(apiName, createFunc)

Give a functin pointer to a class that will manufacture a
vtkViewNode when given a class name string.

### createNode(apiName)

Creates and returns a vtkViewNode for the provided renderable.
