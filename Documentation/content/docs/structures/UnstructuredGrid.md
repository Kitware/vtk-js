title: UnstructuredGrid
---

An UnstructuredGrid is a mesh structure that can hold data arrays either on points, cells or on the dataset itself. The mesh can be composed of several cells which could be either 2D or 3D.

## Structure

```js
{
  type: 'vtkUnstructuredGrid',
  metadata: {
    name: 'data.vtu',
    size: 2345,
  },
  vtkUnstructuredGrid: {
    Points: {
      type: 'vtkDataArray',
      name: '_points',
      tuple: 3,
      size: 300,
      dataType: 'Float32Array',
      buffer: new ArrayBuffer(),
      values: new Float32Array(this.buffer),
      ranges: [
        { min: -1, max: 1, component: 0, name: 'X' },
        { min: -1, max: 1, component: 1, name: 'Y' },
        { min: -1, max: 1, component: 2, name: 'Z' },
      ],
    },
    Cells: {
      type: 'vtkDataArray',
      name: '_cells',
      tuple: 1,
      size: 123,
      dataType: 'Uint32Array', // or Uint16Array
      buffer: new ArrayBuffer(),
      values: new Uint32Array(this.buffer), // Follow the CellArray Mapping [{nbPoints}, {pointIdx...}]
    },
    CellTypes: {
      type: 'vtkDataArray',
      name: '_cells',
      tuple: 1,
      size: 10,
      dataType: 'Uint8Array',
      buffer: new ArrayBuffer(),
      values: new Uint8Array(this.buffer), // CellTypes
    },
    PointData: {
      Temperature: {
        type: 'vtkDataArray',
        name: 'Temperature',
        tuple: 1,
        size: 300,
        dataType: 'Float32Array',
        buffer: new ArrayBuffer(), // Optional: Available if fetch from Network
        values: new Float32Array(this.buffer),
        ranges: [
          { min: -5.23, max: 25.7, component: 0, name: 'Scalar' },
        ],
      },
    },
    CellData: {
      CellId: {
        type: 'vtkDataArray',
        name: 'CellId',
        tuple: 1,
        size: 132,
        dataType: 'Uint32Array',
        values: new Uint32Array(this.buffer),
        ranges: [
          { min: 0, max: 131, component: 0, name: 'Scalar' },
        ],
      },
    },
    FieldData: {
      Meta: {
        type: 'VariantArray',
        name: 'Meta',
        size: 3,
        dataType: 'JSON',
        values: ['Some string', [1, 2, 3], { ex: 'obj' }],
      }
    },
  },
}
```
