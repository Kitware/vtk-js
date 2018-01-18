## Usage

```js
import PointSource from 'vtk.js/Sources/Filters/Sources/PointSource';

const pointSource = PointSource.New({ numberOfPoints: 10 });
const polydata = pointSource.getOutputData();
```

### Number Of Points (set/get)

Integer representing the number of points to be created.

### Center (set/get)

Float array of size 3 representing the center of the sphere in which the points will be generated.

### Radius (set/get)

Float value specifying the radius of the sphere.

