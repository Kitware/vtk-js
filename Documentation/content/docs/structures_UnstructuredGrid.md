title: UnstructuredGrid
---

An UnstructuredGrid is a mesh structure that can hold data arrays in points, cells or in the dataset itself. The mesh can be composed of several cells which can be either 2D or 3D.

## Structure

```js
{
  vtkClass: 'vtkUnstructuredGrid',
  metadata: {
    name: 'data.vtu',
    size: 2345,
  },
  points: {
    data: {
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
    }
  },
  cells: {
    type: 'vtkDataArray',
    name: '_cells',
    tuple: 1,
    size: 123,
    dataType: 'Uint32Array', // or Uint16Array
    buffer: new ArrayBuffer(),
    values: new Uint32Array(this.buffer), // Follow the CellArray Mapping [{nbPoints}, {pointIdx...}]
  },
  cellTypes: {
    type: 'vtkDataArray',
    name: '_cells',
    tuple: 1,
    size: 10,
    dataType: 'Uint8Array',
    buffer: new ArrayBuffer(),
    values: new Uint8Array(this.buffer), // CellTypes
  },
  
  pointData: {
    "vtkClass": "vtkDataSetAttributes",
    "activeGlobalIds": -1,
    "activeNormals": -1,
    "activePedigreeIds": -1,
    "activeScalars": 0,
    "activeTCoords": -1,
    "activeTensors": -1,
    "activeVectors": -1,
    "copyFieldFlags": [],
    "doCopyAllOff": false,
    "doCopyAllOn": true,
    "arrays": [
      {
        "data": {
          vtkClass: 'vtkDataArray',
          name: 'Temperature',
          numberOfComponents: 1,
          size: 300,
          dataType: 'Float32Array',
          buffer: new ArrayBuffer(), // Optional: Available if fetch from Network
          values: new Float32Array(this.buffer)
        }
      }
    ],
  },
  cellData: {
    "vtkClass": "vtkDataSetAttributes",
    "activeGlobalIds": -1,
    "activeNormals": -1,
    "activePedigreeIds": -1,
    "activeScalars": 0,
    "activeTCoords": -1,
    "activeTensors": -1,
    "activeVectors": -1,
    "copyFieldFlags": [],
    "doCopyAllOff": false,
    "doCopyAllOn": true,
    "arrays": [
      {
        "data": {
          type: 'vtkDataArray',
          name: 'CellId',
          numberOfComponents: 1,
          size: 132,
          dataType: 'Uint32Array',
          values: new Uint32Array(this.buffer)
        }
      }
    ]
  },
  fieldData: {
    "vtkClass": "vtkDataSetAttributes",
    "activeGlobalIds": -1,
    "activeNormals": -1,
    "activePedigreeIds": -1,
    "activeScalars": -1,
    "activeTCoords": -1,
    "activeTensors": -1,
    "activeVectors": -1,
    "copyFieldFlags": [],
    "doCopyAllOff": false,
    "doCopyAllOn": true,
    "arrays": [
      {
        "data": {
          vtkClass: 'vtkVariantArray',
          name: 'Meta',
          size: 3,
          dataType: 'JSON',
          values: ['Some string', [1, 2, 3], { ex: 'obj' }],
        }
      }
    ]
  }
}
```
