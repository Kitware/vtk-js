## Introduction

vtkDataSet is an abstract class that specifies an interface for dataset
objects. vtkDataSet also provides methods to provide information about
the data, such as center, bounding box, and representative length.

In vtk a dataset consists of a structure (geometry and topology) and
attribute data. The structure is defined implicitly or explicitly as
a collection of cells. The geometry of the structure is contained in
point coordinates plus the cell interpolation functions. The topology
of the dataset structure is defined by cell types and how the cells
share their defining points.

Attribute data in vtk is either point data (data at points) or cell data
(data at cells). Typically filters operate on point data, but some may
operate on cell data, both cell and point data, either one, or none.




## Methods


### extend

Method used to decorate a given object (publicAPI+model) with vtkDataSet characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getCellData

Get dataset's cell data



### getFieldData





### getPointData

Get dataset's point data.



### newInstance

Method used to create a new instance of vtkDataSet.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### setCellData




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **cellData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setFieldData




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **fieldData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPointData




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **pointData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


