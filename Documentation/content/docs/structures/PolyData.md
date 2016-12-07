title: PolyData
---

A PolyData is a surface mesh structure that can hold data arrays either on points, cells or on the dataset itself.

## Structure

```js
{
  vtkClass: 'vtkPolyData',
  metadata: {
    name: 'example.vtk',
    size: 2345,
  },
  points: {
    data: {
      vtkClass: 'vtkDataArray',
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
  },
  verts: {
    vtkClass: 'vtkDataArray',
    name: '_verts',
    tuple: 1,
    size: 123,
    dataType: 'Uint32Array', // or Uint16Array
    buffer: new ArrayBuffer(),
    values: new Uint32Array(this.buffer), // Follow the CellArray Mapping [{nbPoints}, {pointIdx...}]
  },
  lines: {
    vtkClass: 'vtkDataArray',
    name: '_lines',
    tuple: 1,
    size: 0,
    dataType: 'Uint32Array', // or Uint16Array
    values: null,
  },
  polys: {
    vtkClass: 'vtkDataArray',
    name: '_lines',
    tuple: 1,
    size: 8,
    dataType: 'Uint32Array', // or Uint16Array
    values: new Uint32Array([3, 0, 1, 2, 3, 3, 4, 5]), // 2 triangles (0,1,2)+(3,4,5)
  },
  strips: {
    vtkClass: 'vtkDataArray',
    name: '_lines',
    tuple: 1,
    size: 0,
    dataType: 'Uint32Array', // or Uint16Array
    values: null,
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
  }
}
```
