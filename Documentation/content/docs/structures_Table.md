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

<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-90338862-1', 'auto');
  ga('send', 'pageview');

</script>
