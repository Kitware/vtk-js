## Introduction

vtkVolume inherits from vtkMapper.




## See Also

## Methods


### extend

Method use to decorate a given object (publicAPI+model) with vtkVolume characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getBounds

Get the bounds as [xmin, xmax, ymin, ymax, zmin, zmax].



### getBoundsByReference

Get the bounds as [xmin, xmax, ymin, ymax, zmin, zmax].



### getMTime

Return the `Modified Time` which is a monotonic increasing integer
global for all vtkObjects.

This allow to solve a question such as:
 - Is that object created/modified after another one?
 - Do I need to re-execute this filter, or not? ...

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> | the global modified time |


### getMapper





### getProperty





### getRedrawMTime





### getVolumes





### makeProperty





### newInstance

Method use to create a new instance of vtkVolume



### setMapper





### setProperty





