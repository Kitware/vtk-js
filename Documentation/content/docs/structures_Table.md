title: Table
---

A Table is a structure that gathers DataArray's with the same number of tuples.

## Structure

```js
{
  type: 'vtkTable',
  metadata: {
    name: 'data.csv',
    size: 2345,
  },
  vtkTable: {
    Columns: {
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
      Pressure: {
        type: 'vtkDataArray',
        name: 'Pressure',
        tuple: 1,
        size: 300,
        dataType: 'Float32Array',
        buffer: new ArrayBuffer(), // Optional: Available if fetch from Network
        values: new Float32Array(this.buffer),
        ranges: [
          { min: -5.23, max: 25.7, component: 0, name: 'Scalar' },
        ],
      },
      Name: {
        type: 'StringArray',
        name: 'Name',
        tuple: 1,
        size: 300,
        dataType: 'JSON',
        values: ['a', 'b', 'c', ...],
      },
    }
  },
}
```
