## Introduction

vtkAbstractMapper is an abstract class to specify interface between data and
graphics primitives or software rendering techniques. Subclasses of
vtkAbstractMapper can be used for rendering 2D data, geometry, or volumetric
data.

### clippingPlanes (set/get)
Get/Set the vtkPlaneCollection which specifies the clipping planes.
Added plane needs to be a vtkPlane object.

### publicAPI

addClippingPlane(plane)  
removeAllClippingPlanes()
: Specify clipping planes to be applied when the data is mapped
(at most 6 clipping planes can be specified).

removeClippingPlane(i)
: Remove clipping plane at index i.

getNumberOfClippingPlanes()
: Return number of clipping planes.
