## Introduction

vtkAbstractMapper is an abstract class to specify interface between data and
graphics primitives or software rendering techniques. Subclasses of
vtkAbstractMapper can be used for rendering 2D data, geometry, or volumetric
data.




## Methods


### addClippingPlane

Added plane needs to be a vtkPlane object.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **plane** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### extend

Method use to decorate a given object (publicAPI+model) with vtkAbstractMapper characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getClippingPlanes

Get all clipping planes.

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### getNumberOfClippingPlanes

Return number of clipping planes.

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### removeAllClippingPlanes

Remove all clipping planes.



### removeClippingPlane

Remove clipping plane at index i.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **i** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setClippingPlanes

Set clipping planes.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **planes** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### update





