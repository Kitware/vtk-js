## Usage

```js
import PlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';

const planeSource = PlaneSource.New({ xResolution: 10, yResolution: 10 });
const polydata = planeSource.getOutputData();
```

### XResolution (set/get)

Integer representing the x resolution of the plane.

### YResolution (set/get)

Integer representing the y resolution of the plane.

### Origin (set/get)

Float array of size 3 representing the origin of the plane, lower-left corner.

### Point1 (set/get)

Float array of size 3 representing the x axes of the plane.

### Point2 (set/get)

Float array of size 3 representing the y axes of the plane.

