## Introduction

vtkImageSlice provides 2D image display support for vtk.
It can be associated with a vtkImageSlice prop and placed within a Renderer.

This class resolves coincident topology with the same methods as vtkMapper.




## Methods


### bounds





### extend

Method use to decorate a given object (publicAPI+model) with vtkImageSlice characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getActors





### getBounds

Get the bounds as [xmin, xmax, ymin, ymax, zmin, zmax].



### getBoundsForSlice




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **slice** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **thickness** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getImages





### getIsOpaque





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





### getMaxXBound

Get the maximum X bound



### getMaxYBound

Get the maximum Y bound



### getMaxZBound

Get the maximum Z bound



### getMinXBound

Get the minimum X bound



### getMinYBound

Get the minimum Y bound



### getMinZBound

Get the minimum Z bound



### getProperty





### getRedrawMTime





### getSupportsSelection





### hasTranslucentPolygonalGeometry

Always render during opaque pass, to keep the behavior
predictable and because depth-peeling kills alpha-blending.
In the future, the Renderer should render images in layers,
i.e. where each image will have a layer number assigned to it,
and the Renderer will do the images in their own pass.



### mapper





### newInstance

Method use to create a new instance of vtkImageSlice


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### property





