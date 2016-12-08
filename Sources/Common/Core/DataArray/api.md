## Usage

```js
const data = {};
const dataArray = vtk(data);
alert(dataArray.getNumberOfValues());
alert(dataArray.getValue(10));
```

## getNumberOfComponents(): Number

Return number of components in the array;

## getNumberOfValues(): Number

## getNumberOfComponents(): Number

## getNumberOfTuples(): Number

## getBounds(): Number

Get bounds of the array and its components.

## getDataType(): String

Type of data in the array, one of: 

- CHAR: 'Int8Array
- SIGNED_CHAR: 'Int8Array
- UNSIGNED_CHAR: 'Uint8Array
- SHORT: 'Int16Array
- UNSIGNED_SHORT: 'Uint16Array
- INT: 'Int32Array
- UNSIGNED_INT: 'Uint32Array
- FLOAT: 'Float32Array
- DOUBLE: 'Float64Array

## setData(typedArray, numberOfComponents)

Sets values, size, and dataType from typedArray, triggers a dataChange. Number of components is an optional argument and defaults to 1.
