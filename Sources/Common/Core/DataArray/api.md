




## Methods


### computeRange

Compute range of a given array. The array could be composed of tuples and
individual component range could be computed as well as magnitude.

```
const array = [x0, y0, z0, x1, y1, z1, ..., xn, yn, zn];
const { min: yMin, max: yMax } = computeRange(array, 1, 3);
const { min: minMagnitude, max: maxMagnitude } = computeRange(array, -1, 3);
```


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **values** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | Array to go through to extract the range from |
| **component** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: 0) indice to use inside tuple size |
| **numberOfComponents** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: 1) size of the tuple |


### createRangeHelper

Create helper object that can be used to gather min, max, count, sum of
a set of values.



### extend

Method use to decorate a given object (publicAPI+model) with vtkDataArray characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getDataType

Return the name of a typed array

```
const isFloat32 = ('Float32Array' === getDataType(array));
const clone = new macro.TYPED_ARRAYS[getDataType(array)](array.length);
```


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **typedArray** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | to extract its type from |


### getMaxNorm

Return the max norm of a given vtkDataArray


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **dataArray** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | to process |


### newInstance

Method use to create a new instance of vtkDataArray


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


