The vtkHttpDataSetSeriesReader object is a reader which can load datasets that can vary over time. It is a wrapper over multiple [httpDataSetReader](IO_Core_HttpDataSetReader.html).

## Usage

```js
import vtkHttpDataSetSeriesReader from 'vtk.js/Sources/IO/Core/HttpDataSetSeriesReader';

const reader = vtkHttpDataSetReader.newInstance();
reader.setURL('https://kitware.github.io/vtk-js-datasets/data/temporal').then(() => {
  const [begin, end] = reader.getTimeRange();
  reader.setUpdateTimeStep((begin + end) / 2);
});
```


### newInstance({ fetchGzip = false })

Create an instance and pass the `fetchGzip` parameter to the underling `HttpDataSetReader`s. 


### setURL(url) : Promise()

Set the URL for the series to load. The URL must point to an `index.json` file, or a folder containing an `index.json` file with the following format.

```json
{
  "series": [
    {
      "url": "0",
      "timeStep": 0.0
    },
    {
      "url": "1",
      "timeStep": 0.333333
    },
    {
      "url": "2",
      "timeStep": 0.666667
    },
    {
      "url": "3",
      "timeStep": 0.888889
    }
  ]
}
```

Like `HttpDataSetReader`, data can be loaded by two methods:

```js
const reader = HttpDataSetSeriesReader.newInstance();
const isReady = reader.setURL('https://kitware.github.io/vtk-js-datasets/data/temporal/index.json');
// Same as
const reader = HttpDataSetSeriesReader.newInstance({url: 'https://kitware.github.io/vtk-js-datasets/data/temporal/index.json'});
const isReady = reader.updateMetadata();
```

### getTimeSteps() : [Number]

Return the list of time steps defined in the series.

### getTimeRange() : [begin : Number, end : Number]

Return the first end last time steps of the series.

### enableArray(location, name, enable = true)

Enable or disable a given array for the current `HttpDataSetReader`.

### getOutputData() : { dataset }

Return the dataset of the current `HttpDataSetReader`.
