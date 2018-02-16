## Usage

```js
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';

const cubeSource = vtkCubeSource.newInstance({ xLength: 5, yLength: 5, zLength: 5 });
const cubePolydata = cubeSource.getOutputData();
```

### xLength (set/get)

Floating value representing cube length along x axis.

### yLength (set/get)

Floating value representing cube length along y axis.

### zLength (set/get)

Floating value representing cube length along z axis.

### center (set/get)

Float array of size 3 representing the center of the cube.

### rotations (set/get)

Float array of size 3 representing the angles, in degrees, of rotation for the cube.

### requestData(inData, outData)

