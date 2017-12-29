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
`SetInput(Data/Connection)` methods. Any additional inputs can be provided via
the `AddInput(Data/Connection)` methods. When only a single input is provided,
it is passed through as is to the output.

```js
const cone = vtkConeSource.newInstance();
const cylinder = vtkCylinderSource.newInstance();

const appendFilter = vtkAppendFilter.newInstance();
appendFilter.setInputConnection(cone.getOutputPort());
appendFilter.addInputConnection(cylinder.getOutputPort());

const appendedData = appendFilter.getOutputData();
```

## Public API

### OutputPointsPrecision (set/get)

Set / get the desired precision for the output types.
Available options for desired output precision are:

- `DEFAULT`: Output precision should match the input precision
- `SINGLE`: Output single-precision floating-point (i.e. float32)
- `DOUBLE`: Output double-precision floating point (i.e. float64)

See the documentation for [vtkDataArray::getDataType()](../api/Common_Core_DataArray.html#getDataType-String) for additional data type settings.
