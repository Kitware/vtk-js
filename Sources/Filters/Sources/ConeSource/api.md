## Usage

```js
import ConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';

const coneSource = ConeSource.New({ height: 2, radius: 1, resolution: 80 });
const polydata = coneSource.getOutputData();
```

### Height (set/get)

Floating point number representing the height of the cone.

### Radius (set/get)

Floating point number representing the radius of the cone base.

### Resolution (set/get)

Integer representing the number of points used to build the base of the cone.

### Capping (set/get)

Boolean letting you close the base of the cone.

