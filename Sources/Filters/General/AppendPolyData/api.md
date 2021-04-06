## Introduction

vtkAppendPolyData - append one or more polygonal datasets together

vtkAppendPolyData is a filter that appends one of more polygonal datasets into a
single polygonal dataset. All geometry is extracted and appended, but point and
cell attributes (i.e., scalars, vectors, normals) are extracted and appended
only if all datasets have the point and/or cell attributes available.  (For
example, if one dataset has point scalars but another does not, point scalars
will not be appended.)


## Usage

Provide the first input to the filter via the standard
`setInput(Data/Connection)` methods. Any additional inputs can be provided via
the `addInput(Data/Connection)` methods. When only a single input is provided,
it is passed through as is to the output.

```js
const cone = vtkConeSource.newInstance();
const cylinder = vtkCylinderSource.newInstance();

const appendPolyData = vtkAppendPolyData.newInstance();
appendPolyData.setInputConnection(cone.getOutputPort());
appendPolyData.addInputConnection(cylinder.getOutputPort());

const appendedData = appendPolyData.getOutputData();
```


## See Also

## Methods


### extend

Method used to decorate a given object (publicAPI+model) with vtkAppendPolyData characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getOutputPointsPrecision

Get the desired precision for the output types.



### newInstance

Method used to create a new instance of vtkAppendPolyData


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### requestData




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **inData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **outData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setOutputPointsPrecision

Set the desired precision for the output types.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **outputPointsPrecision** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


