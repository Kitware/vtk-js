## Usage

```js
import HttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';

const reader = new HttpDataSetReader();
reader.setURL('/Data/can.ex2/index.json');

reader.update().then((reader, dataset) => {
  console.log('Metadata loaded with the geometry', dataset);

  reader.listArrays.forEach(array => {
    console.log('-', array.name, array.location, ':', array.enable);
  });

  reader.updateData()
    .then((reader, dataset) => {
      console.log('dataset fully loaded', dataset);
    });
});


```

### constructor(enableAllArrays = true)

Create a reader instance while enabeling a default behavior regarding the
data array.

The __enableAllArrays__ argument allow you to choose if you want to activate
all data array by default or if you will have to manually enable them before
downloading them.


### setURL(url)

Set the URL for the dataset to load.

```js
const reader = new HttpDataSetReader();
reader.setURL('/Data/can.ex2/index.json');
```

### update() : Promise(resolve(this, dataset), reject(xhr, error))

Fetch dataset metadata and geometry arrays which return a Promise.

```js
reader
  .update()
  .then((reader, dataset) => reader.updateData())
  .then((reader, dataset) => console.log('Fully loaded dataset', dataset));
```

### updateData() : Promise(resolve(this, dataset), reject(xhr, error))

Load all data arrays that have been enabled unsing the __enableArray__ method.

### listArrays() : [{ name, location, enable }, ...]

Return the list of available array with their location and if they are enable or not for download using the __updateData()__ method.

### enableArray(location, name, enable = true)

Enable or disable a given array.

```js
reader.enableArray('PointData', 'Temperature');
reader.enableArray('PointData', 'Pressure', false);
reader.enableArray('CellData', 'CellId', true);
reader.enableArray('FieldData', 'labels', true);
```


### getOutput() : {}

Return the dataset in its current state. 
Some arrays could be loaded (no more ref), while others could still be remote and have their ref.

### destroy() 

Free memory and remove any listener.

### onBusy(callback) : subscription

Attach listener to monitor when the reader is downloading data or not.

```js
const subscription = reader.onBusy(busy => {
  console.log('Reader is', busy ? 'downloading' : 'idle');
})

reader.updateData();

// much later
subscription.unsubscribe();
```

### isBusy() : Boolean

Return the current status of the reader. True means busy and False means idle.


### getBaseURL() : String

Return the base url to use to download arrays or other data from the given dataset.

```js
reader.setURL('/Data/can.ex2/index.json');

if (reader.getBaseURL() === '/Data/can.ex2') {
  console.log('Good guess...');
}
```
