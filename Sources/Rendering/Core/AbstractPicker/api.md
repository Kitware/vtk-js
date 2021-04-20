## Introduction

vtkAbstractPicker is an abstract superclass that defines a minimal API for its concrete subclasses.
The minimum functionality of a picker is to return the x-y-z global coordinate position of a pick (the pick itself is defined in display coordinates).

The API to this class is to invoke the Pick() method with a selection point (in display coordinates - pixels)
and a renderer. Then get the resulting pick position in global coordinates with the GetPickPosition() method.




## See Also

[vtkPointPicker](./Rendering_Core_PointPicker.html)

## Methods


### addPickList




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **actor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### deletePickList




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **actor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### extend

Method used to decorate a given object (publicAPI+model) with vtkAbstractPicker characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getPickFromList





### getPickList





### getPickPosition

Get the picked position

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### getPickPositionByReference

Get the picked position

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### getRenderer





### getSelectionPoint



#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### getSelectionPointByReference



#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### initialize





### initializePickList

Set pickList to empty array.



### setPickFromList




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **pickFromList** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPickList




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **pickList** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


