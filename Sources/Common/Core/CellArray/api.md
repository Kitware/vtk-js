## Introduction

vtkCellArray stores dataset topologies as an explicit connectivity table
listing the point ids that make up each cell.




## See Also

[vtkDataArray](./Common_Core_DataArray.html)

## Methods


### extend

Method used to decorate a given object (publicAPI+model) with vtkCellArray characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### extractCellSizes




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **cellArray** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getCell

Returns the point indexes at the given location as a subarray.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **loc** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getCellSizes




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **recompute** | <span class="arg-type">boolean</span></br></span><span class="arg-required">required</span> |  |


### getNumberOfCells

Get the number of cells in the array.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **recompute** | <span class="arg-type">boolean</span></br></span><span class="arg-required">required</span> |  |


### getNumberOfCells




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **cellArray** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### newInstance

Method used to create a new instance of vtkCellArray


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### setData




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **typedArray** | <span class="arg-type">TypedArray</span></br></span><span class="arg-required">required</span> |  |


