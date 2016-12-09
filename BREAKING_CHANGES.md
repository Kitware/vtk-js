## From 1.x to 2.

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

Serialization model switch changed from { type: 'vtkPolyData', ... } to { vtkClass: 'vtkPolyData', ... }.
