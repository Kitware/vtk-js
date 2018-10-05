## Introduction

vtkAbstractMapper3D is an abstract class to specify interface between 3D
data and graphics primitives or software rendering techniques. Subclasses
of vtkAbstractMapper3D can be used for rendering geometry or rendering
volumetric data.

This class also defines an API to support hardware clipping planes (at most
six planes can be defined). It also provides geometric data about the input
data it maps, such as the bounding box and center.

### getBounds()
Return bounding box (array of six doubles) of data expressed as
(xmin,xmax, ymin,ymax, zmin,zmax).
Update this->Bounds as a side effect.

### getBounds(bounds)
Get the bounds for this mapper as (Xmin,Xmax,Ymin,Ymax,Zmin,Zmax).

### getCenter(...center)
Return the Center of this mapper's data.
If center is empty model.center is returned, otherwise fills center

### getLength()
Return the diagonal length of this mappers bounding box.  

### getClippingPlaneInDataCoords(propMatrix, i, hnormal)
Get the ith clipping plane as a homogeneous plane equation.
Use getNumberOfClippingPlanes() to get the number of planes.
