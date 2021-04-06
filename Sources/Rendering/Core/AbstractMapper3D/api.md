## Introduction

vtkAbstractMapper3D is an abstract class to specify interface between 3D
data and graphics primitives or software rendering techniques. Subclasses
of vtkAbstractMapper3D can be used for rendering geometry or rendering
volumetric data.

This class also defines an API to support hardware clipping planes (at most
six planes can be defined). It also provides geometric data about the input
data it maps, such as the bounding box and center.




## See Also

## Methods


### extend

Method use to decorate a given object (publicAPI+model) with vtkAbstractMapper3D characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getBounds

Get the bounds for this mapper as [xmin, xmax, ymin, ymax,zmin, zmax].

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> | number |


### getCenter

Return the Center of this mapper’s data.



### getClippingPlaneInDataCoords

Get the ith clipping plane as a homogeneous plane equation.
Use getNumberOfClippingPlanes() to get the number of planes.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **propMatrix** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **i** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **hnormal** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getLength

Return the diagonal length of this mappers bounding box.



