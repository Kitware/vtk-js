## From 4.x to 5

Improve and normalize methods inside DataAccessHelper to allow network progress monitoring:
- Refactor fetchText(instance = {}, url, compression, progressCallback) into fetchText(instance = {}, url, options = { compression, progressCallback: fn() })
- Refactor fetchJSON(instance = {}, url, compression) into fetchJSON(instance = {}, baseURL, array, options = { compression, progressCallback: fn() })
- Refactor fetchArray(instance = {}, baseURL, array, fetchGzip = false) into fetchArray(instance = {}, baseURL, array, options = { compression: 'gz', progressCallback: fn() })
- Rename HttpDataSetReader.fetchZipFile(url) to HttpDataSetReader.fetchBinary(url, options)

## From 3.x to 4

The representation module as been removed and a better approach has been taken for OBJ/MTL loading.

## From 2.x to 3

Migrate to Webpack 2+ which changed the way rules are defined and how to intgrate vtk.js into your project. The following [documentation](https://kitware.github.io/vtk-js/docs/intro_vtk_as_es6_dependency.html) has been updated accordingly.

## From 1.x to 2

### vtkDataSetAttributes

vtkDataSetAttributes has been reimplemented to follow the VTK model. By doing so the data model structure as changed and any code that was using it as input will need to be updated.

Before:

{
   "ArrayName": { vtkDataArray instance ... }
}

After:

{
   "activeTCoords": -1,
   "activeScalars": -1,
   "vtkClass": "vtkDataSetAttributes",
   "arrays": [
     { "data": { vtkDataArray instance ... } }
   ],
   "activeNormals": -1,
   "activeGlobalIds": -1,
   "activeTensors": -1,
   "activePedigreeIds": -1,
   "activeVectors": -1
}

### vtkPoints

points used to be simple vtkDataArray.
Now we have a vtkPoint class that contains a vtkDataArray in its data.

Before:

const coordsAsTypedArray = dataset.getPoints().getData();

After:

const dataArray = dataset.getPoints().getData();
const coordsAsTypedArray = dataArray.getData();

### vtk()

Serialization model changed from { type: 'vtkPolyData', ... } to { vtkClass: 'vtkPolyData', ... }.




