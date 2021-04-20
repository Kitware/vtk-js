## Introduction

vtkPointSource is a source object that creates a user-specified number of
points within a specified radius about a specified center point. By default
location of the points is random within the sphere. It is also possible to
generate random points only on the surface of the sphere. The output PolyData
has the specified number of points and 1 cell - a vtkPolyVertex containing
all of the points.




## Methods


### extend

Method used to decorate a given object (publicAPI+model) with vtkPointSource characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getCenter

Get the center of the plane.



### getCenterByReference

Get the center of the plane.



### getNumberOfPoints

Get the number of points to generate.



### getRadius

Get the radius of the point cloud.



### newInstance

Method used to create a new instance of vtkPointSource.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### requestData




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **inData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **outData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setCenter

Set the center of the point cloud.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setCenter

Set the center of the point cloud.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **center** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setCenterFrom

Set the center of the point cloud.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **center** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setNumberOfPoints

Set the number of points to generate.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **numberOfPoints** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setRadius

Set the radius of the point cloud. If you are generating a Gaussian
distribution, then this is the standard deviation for each of x, y, and z.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **radius** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


