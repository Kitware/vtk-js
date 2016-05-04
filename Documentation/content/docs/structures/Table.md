title: Table
---

A Table is a structure that gather DataArray with the same number of tuples.

## Structure

```js
{
  type: 'Table',
  metadata: {
    name: 'data.csv',
    size: 2345,
  },
  Table: {
    Columns: {
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
      Pressure: {
        type: 'DataArray',
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
