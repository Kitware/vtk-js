## Introduction

vtkPicker is used to select instances of vtkProp3D by shooting 
a ray into a graphics window and intersecting with the actor's bounding box.
The ray is defined from a point defined in window (or pixel) coordinates, 
and a point located from the camera's position.

vtkPicker may return more than one vtkProp3D, since more than one bounding box may be intersected.
vtkPicker returns an unsorted list of props that were hit, and a list of the corresponding world points of the hits.
For the vtkProp3D that is closest to the camera, vtkPicker returns the pick coordinates in world and untransformed mapper space,
the prop itself, the data set, and the mapper. 
For vtkPicker the closest prop is the one whose center point (i.e., center of bounding box) projected on the view ray is closest
to the camera. Subclasses of vtkPicker use other methods for computing the pick point.




## Methods


### extend

Method use to decorate a given object (publicAPI+model) with vtkRenderer characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getActors

Get a collection of all the actors that were intersected.



### getDataSet

Get a pointer to the dataset that was picked (if any).



### getMapper

Get mapper that was picked (if any)



### getMapperPosition

Get position in mapper (i.e., non-transformed) coordinates of pick point.



### getMapperPositionByReference





### getPickedPositions

Get a list of the points the actors returned by GetProp3Ds were intersected at.



### getTolerance

Get tolerance for performing pick operation.



### intersectWithLine

Intersect data with specified ray.
Project the center point of the mapper onto the ray and determine its parametric value


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **p1** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **p2** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **tol** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **mapper** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### newInstance

Method use to create a new instance of vtkPicker with its focal point at the origin, 
and position=(0,0,1). The view up is along the y-axis, view angle is 30 degrees, 
and the clipping range is (.1,1000).


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### pick

Perform pick operation with selection point provided.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **selection** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **renderer** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setMapperPosition

Set position in mapper coordinates of pick point. More...


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setMapperPositionFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **mapperPosition** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setTolerance

Specify tolerance for performing pick operation.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **tolerance** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


