title: DataArray
---

A data array is meant to keep track of numerical values while providing associated metadata such as size, tupleSize, data type, array name, component names and so on.

## Structure

The possible dataType are the one available in the language itself as typed array:

| Type              | Bytes    | C type   |
| ----------------- | -------- | -------- |
| Int8Array         | 1 8-bit  | int8_t   |
| Uint8Array        | 1 8-bit  | uint8_t  |  
| Uint8ClampedArray | 1 8-bit  | uint8_t  |  
| Int16Array        | 2 16-bit | int16_t  |  
| Uint16Array       | 2 16-bit | uint16_t |  
| Int32Array        | 4 32-bit | int32_t  |  
| Uint32Array       | 4 32-bit | uint32_t |  
| Float32Array      | 4 32-bit | float    |
| Float64Array      | 8 64-bit | double   |


## Scalar array in memory

```js
{
  vtkClass: 'vtkDataArray',
  name: 'Temperature',
  tuple: 1,
  size: 1024,
  dataType: 'Float32Array',
  buffer: new ArrayBuffer(), // Optional: Available if fetch from Network
  values: new Float32Array(this.buffer),
  ranges: [
    { min: -5.23, max: 25.7, component: 0, name: 'Scalar' },
  ],
}
``` 

## Vector array in memory

```js
{
  vtkClass: 'vtkDataArray',
  name: 'Velocity',
  tuple: 3,
  size: 3072,
  dataType: 'Float64Array',
  values: new Float64Array([...]),
  ranges: [
    { min: -5.23, max: 25.7, component: 0, name: 'X' },
    { min: -1, max: 1, component: 1, name: 'Y' },
    { min: -0.23, max: 2.7, component: 2, name: 'Z' },
    { min: -35.3, max: 125.7, component: -1, name: 'Magnitude' },
  ],
}
``` 

## Scalar array reference

Reference array are used within dataset that needs to be fetch on the network
or that written on disk.
The __ref__ section provide the information needed to download the array and fill
it in memory like the previously described ones.

```js
{
  vtkClass: 'vtkDataArray',
  name: 'Velocity',
  tuple: 3,
  size: 3072,
  dataType: 'Float64Array',
  values: null,
  ref: {
    id: '57b161d50afcda9eee221d6a5190075e',
    basepath: '/pointdata/',
    encode: 'LittleEndian',
  },
  ranges: [
    { min: -5.23, max: 25.7, component: 0, name: 'X' },
    { min: -1, max: 1, component: 1, name: 'Y' },
    { min: -0.23, max: 2.7, component: 2, name: 'Z' },
    { min: -35.3, max: 125.7, component: -1, name: 'Magnitude' },
  ],
}
``` 
