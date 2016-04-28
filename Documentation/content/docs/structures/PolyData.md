# PolyData

A PolyData is a surface mesh structure that can hold data arrays wither on points, cells or on the dataset itself.

# Structure

```js
{
  type: 'PolyData',
  metadata: {
    name: 'example.vtk',
    size: 2345,
  },
  PolyData: {
    Points: {
      type: 'DataArray',
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
      Verts: {
        type: 'DataArray',
        name: '_verts',
        tuple: 1,
        size: 123,
        dataType: 'Uint32Array', // or Uint16Array
        buffer: new ArrayBuffer(),
        values: new Uint32Array(this.buffer), // Follow the CellArray Mapping [{nbPoints}, {pointIdx...}]
      },
      Lines: {
        type: 'DataArray',
        name: '_lines',
        tuple: 1,
        size: 0,
        dataType: 'Uint32Array', // or Uint16Array
        values: null,
      },
      Polys: {
        type: 'DataArray',
        name: '_lines',
        tuple: 1,
        size: 8,
        dataType: 'Uint32Array', // or Uint16Array
        values: new Uint32Array([3, 0, 1, 2, 3, 3, 4, 5]), // 2 triangles (0,1,2)+(3,4,5)
      },
      Strips: {
        type: 'DataArray',
        name: '_lines',
        tuple: 1,
        size: 0,
        dataType: 'Uint32Array', // or Uint16Array
        values: null,
      },
    },
    PointData: {
      Temperature: {
        type: 'DataArray',
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
        type: 'DataArray',
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
  }
}
```
