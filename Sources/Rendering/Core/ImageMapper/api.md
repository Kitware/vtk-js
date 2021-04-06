## Introduction

vtkImageMapper provides 2D image display support for vtk.
It can be associated with a vtkImageSlice prop and placed within a Renderer.

This class resolves coincident topology with the same methods as vtkMapper.




## Methods


### extend

Method use to decorate a given object (publicAPI+model) with vtkImageMapper characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### factor





### flip





### getBounds

Get the bounds for this mapper as [Xmin,Xmax,Ymin,Ymax,Zmin,Zmax].

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### getBoundsForSlice




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **slice** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **thickness** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getClosestIJKAxis





### getCoincidentTopologyLineOffsetParameters





### getCoincidentTopologyPointOffsetParameter





### getCoincidentTopologyPolygonOffsetParameters





### getIsOpaque





### getRelativeCoincidentTopologyLineOffsetParameters





### getRelativeCoincidentTopologyPointOffsetParameters





### getRelativeCoincidentTopologyPolygonOffsetParameters





### getRenderToRectangle





### getResolveCoincidentTopology





### getResolveCoincidentTopologyAsString





### getResolveCoincidentTopologyLineOffsetParameters





### getResolveCoincidentTopologyPointOffsetParameters





### getResolveCoincidentTopologyPolygonOffsetFaces





### getResolveCoincidentTopologyPolygonOffsetParameters





### getSlice





### getSliceAtFocalPoint





### getSliceAtPosition




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **pos** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getSlicingModeNormal





### getUseCustomExtents





### ijkMode





### intersectWithLineForCellPicking




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **p1** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **p2** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### intersectWithLineForPointPicking




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **p1** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **p2** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### newInstance

Method use to create a new instance of vtkImageMapper


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### offset





### setClosestIJKAxis




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **closestIJKAxis** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setCustomDisplayExtent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x1** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **x2** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y1** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y2** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z1** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z2** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setCustomDisplayExtentFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **customDisplayExtent** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setISlice




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **id** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setJSlice




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **id** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setKSlice




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **id** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setRelativeCoincidentTopologyLineOffsetParameters




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **factor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **offset** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setRelativeCoincidentTopologyPointOffsetParameters




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **factor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **offset** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setRelativeCoincidentTopologyPolygonOffsetParameters




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **factor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **offset** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setRenderToRectangle




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **renderToRectangle** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setResolveCoincidentTopology




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **resolveCoincidentTopology** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setResolveCoincidentTopologyLineOffsetParameters




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **factor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **offset** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setResolveCoincidentTopologyPointOffsetParameters




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **factor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **offset** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setResolveCoincidentTopologyPolygonOffsetFaces




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **value** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setResolveCoincidentTopologyPolygonOffsetParameters




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **factor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **offset** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setResolveCoincidentTopologyToDefault





### setResolveCoincidentTopologyToOff





### setResolveCoincidentTopologyToPolygonOffset





### setSlice




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **slice** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setSliceFromCamera




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **cam** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setSlicingMode




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **mode** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setUseCustomExtents





### setXSlice




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **id** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setYSlice




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **id** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setZSlice




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **id** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### sliceAtFocalPoint




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **sliceAtFocalPoint** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


