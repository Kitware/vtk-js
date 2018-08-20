## Usage

```js
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';

const reader = vtkHttpDataSetReader.newInstance();
reader.setURL('/Data/can.ex2/index.json').then((reader, dataset) => {
  console.log('Metadata loaded with the geometry', dataset);

  reader.getArrays().forEach(array => {
    console.log('-', array.name, array.location, ':', array.enable);
  });

  reader.update()
    .then((reader, dataset) => {
      console.log('dataset fully loaded', dataset);
    });
});
```

The vtkHttpDataSetReader is using a custom format that only exist in vtk.js which aims to simplify data fetching in an HTTP context. Basically the format is composed of a JSON metadata file referencing all the required data array as side binary files along with all the dataset configuration (i.e.: type, extent...). 

## newInstance({ enableArray = true, fetchGzip = false })

Create a reader instance while enabeling a default behavior regarding the
data array and the way they should be fetched from the server.

The __enableArray__ argument allow you to choose if you want to activate
all data array by default or if you will have to manually enable them before
downloading them.


### setURL(url) : Promise()

Set the URL for the dataset to load.

```js
const reader = HttpDataSetReader.newInstance();
isReady = reader.setURL('/Data/can.ex2/index.json');

// Same as 
const reader = HttpDataSetReader.newInstance({ url: '/Data/can.ex2/index.json' });
isReady = reader.updateMetadata();
```

### update() : Promise()

Load all data arrays that have been enabled unsing the __enableArray__ method.

```js
reader
  .update()
  .then((reader, dataset) => console.log('Fully loaded dataset', dataset));
```

### getArrays() : [{ name, location, enable }, ...]

Return the list of available array with their location and if they are enable or not for download using the __update()__ method.

### getBlocks(): { BlockName: { type: 'MultiBlock', enable: true, SubBlockName: { type: 'UnstructuredGrid', enable: true }}}

List the blocks and their state for data loading. Each hierachy have its state.

```js
{
  "Element Blocks": {
    "Unnamed block ID: 1 Type: HEX8": {
      "type": "UnstructuredGrid",
      "enable": true
    },
    "enable": true
  },
  "Node Sets": {
    "enable": true
  },
  "Element Sets": {
    "enable": true
  },
  "Edge Blocks": {
    "enable": true
  },
  "Edge Sets": {
    "enable": true
  },
  "Face Blocks": {
    "enable": true
  },
  "Face Sets": {
    "enable": true
  },
  "Side Sets": {
    "enable": true
  }
}
```

### enableArray(location, name, enable = true)

Enable or disable a given array.

```js
reader.enableArray('pointData', 'Temperature');
reader.enableArray('pointData', 'Pressure', false);
reader.enableArray('cellData', 'CellId', true);
reader.enableArray('fieldData', 'labels', true);
```

### enableBlock(blockPath, enable = true, pathSeparator = '.') 

Enable or disable a given block.

```js
reader.enableBlock('Element Blocks.Unnamed block ID: 1 Type: HEX8');
reader.enableBlock('Face Sets', false);
reader.enableBlock('Edge Sets', false);
```

### getOutputData() : { dataset }

Return the dataset in its current state. 
Some arrays could be loaded (no more ref), while others could still be remote and have their ref.

### delete() 

Free memory and remove any listener.

### onBusy(callback) : subscription

Attach listener to monitor when the reader is downloading data or not.

```js
const subscription = reader.onBusy(busy => {
  console.log('Reader is', busy ? 'downloading' : 'idle');
})

reader.update();

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
