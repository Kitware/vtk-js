## Introduction

vtkSphereSource is a source object that creates a user-specified number of
points within a specified radius about a specified center point. By default
location of the points is random within the sphere. It is also possible to
generate random points only on the surface of the sphere. The output PolyData
has the specified number of points and 1 cell - a vtkPolyVertex containing
all of the points.




## See Also

## Methods


### extend

Method used to decorate a given object (publicAPI+model) with vtkSphereSource characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getCenter

Get the center of the sphere.



### getCenterByReference

Get the center of the sphere.



### getEndPhi

Get the ending latitude angle.



### getEndTheta

Set the ending longitude angle.



### getLatLongTessellation





### getPhiResolution

Get the number of points in the latitude direction (ranging from StartPhi to EndPhi).



### getRadius

Get the radius of sphere.



### getStartPhi

Get the starting latitude angle in degrees (0 is at north pole).



### getStartTheta

Get the starting longitude angle.



### getThetaResolution

Get the number of points in the longitude direction (ranging from StartTheta to EndTheta).



### newInstance

Method used to create a new instance of vtkSphereSource.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### requestData




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **inData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **outData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setCenter

Set the center of the sphere.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setCenter

Set the center of the sphere.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **center** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setCenterFrom

Set the center of the sphere.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **center** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setEndPhi

Set the ending latitude angle.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **endPhi** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setEndTheta

Set the ending longitude angle.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **endTheta** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setLatLongTessellation

Cause the sphere to be tessellated with edges along the latitude and
longitude lines. If off, triangles are generated at non-polar regions,
which results in edges that are not parallel to latitude and longitude
lines. If on, quadrilaterals are generated everywhere except at the
poles. This can be useful for generating a wireframe sphere with natural
latitude and longitude lines.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **latLongTessellation** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPhiResolution

Set the number of points in the latitude direction (ranging from StartPhi to EndPhi).


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **phiResolution** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setRadius

Set the radius of sphere.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **radius** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setStartPhi

Set the starting latitude angle in degrees (0 is at north pole).


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **startPhi** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setStartTheta

Set the starting longitude angle.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **startTheta** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setThetaResolution

Set the number of points in the longitude direction (ranging from StartTheta to EndTheta).


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **thetaResolution** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


