## Usage

```js
import ConcentricCylinderSource from 'vtk.js/Sources/Filters/Sources/ConcentricCylinderSource';

const ConcentricCylinderSource = ConcentricCylinderSource.New({
  height: 2,
  radius: [0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9, 1],
  cellFields: [0, 0.2, 0.4, 0.6, 0.7, 0.8, 0.9, 1],
  resolution: 60,
  skipInnerFaces: true,
  });
const polydata = ConcentricCylinderSource.getOutputData();
```

### Height (set/get)

Floating point number representing the height of the cylinder.

### Radius (set/get)

Floating point array representing the radii of each cylinder base.

### Resolution (set/get)

Integer representing the number of facets used to define cylinder.

### Direction (set/get)

Float array of size 3 representing the direction for the cylinder. Defaults to [0, 0, 1].

### StartTheta (set/get)

Floating point number setting a starting angle for a cylinder section.

### CellFields (set/get)

Floating point array representing the cell data value for each cylinder with the corresponding radius.

### SkipInnerFaces (set/get)

Boolean turning on or off the interior cylinder faces that are invisible from the outside of an opaque cylinder.

### setMaskLayer(index, hide)

For the specified layer, setting `hide` to `true` will make the layer invisible.
