# Introduction

vtkResliceCursorPolyDataAlgorithm is a class that generates a 2D
reslice cursor vtkPolyData, suitable for rendering within a
vtkResliceCursorActor. The class takes as input the reslice plane
normal index (an index into the normal plane maintained by the reslice
cursor object) and generates the polydata represeting the other two
reslice axes suitable for rendering on a slice through this plane.
The cursor consists of two intersection axes lines that meet at the
cursor focus. These lines may have a user defined thickness. They
need not be orthogonal to each other.

### ReslicePlaneNormal (set/get)

Which of the 3 axes defines the reslice plane normal.

### SetReslicePlaneNormalToXAxis()
### SetReslicePlaneNormalToYAxis()
### SetReslicePlaneNormalToZAxis()

Set the planes that correspond to the reslice axes.

### SetResliceCursor()

Set the Reslice cursor from which to generate the polydata representation.

### GetCenterlineAxis1()
### GetCenterlineAxis2()

Get either one of the axes that this object produces.

### GetAxis1()
### GetAxis2()
### GetPlaneAxis1()
### GetPlaneAxis2()

Get the index of the axes and the planes that they represent.
