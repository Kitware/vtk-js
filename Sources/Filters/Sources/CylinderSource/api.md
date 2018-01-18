## Usage

```js
import CylinderSource from 'vtk.js/Sources/Filters/Sources/CylinderSource';

const CylinderSource = CylinderSource.New({ height: 2, radius: 1, resolution: 80 });
const polydata = CylinderSource.getOutputData();
```

### Height (set/get)

Floating point number representing the height of the cylinder.

### Radius (set/get)

Floating point number representing the radius of the cylinder base.

### Resolution (set/get)

Integer representing the number of facets used to define cylinder.

### Capping (set/get)

Boolean letting you cap the cylinder with polygons at its ends.


