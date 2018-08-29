## Usage

```js
import CircleSource from 'vtk.js/Sources/Filters/Sources/CircleSource';

const source = CircleSource.newInstance({ radius: 1, resolution: 80 });
const polydata = source.getOutputData();
```

### Radius (set/get)

Floating point number representing the radius of the cylinder base.

### Resolution (set/get)

Integer representing the number of facets used to define cylinder.
