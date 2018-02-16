## Usage

```js
import ArrowSource from 'vtk.js/Sources/Filters/Sources/ArrowSource';

const ArrowSource = ArrowSource.New({
  tipResolution: 6,
  tipRadius: 0.1,
  tipLength: 0.35,
  shaftResolution: 6,
  shaftRadius: 0.03,
  invert: false,
  direction: [1.0, 0.0, 0.0]});
const polydata = ArrowSource.getOutputData();
```

### TipResolution (set/get)

Integer representing the resolution of the tip.
The tip behaves the same as a cone. TipResolution of 1 gives a single triangle,
2 gives two crossed triangles. Defaults to 6. 

### TipRadius (set/get)

Floating point number representing the radius of the tip. Defaults to 0.1.

### TipLength (set/get)

Floating point number representing the length of the tip. Defaults to 0.35.

### ShaftResolution (set/get)

Integer representing the resolution of the shaft. ShaftResolution of 2 gives a
rectangle. Defaults to 6.

### ShaftRadius (set/get)

Floating point number representing the radius of the shaft. Defaults to 0.03.

### Invert (set/get)

Boolean that inverts the arrow direction. When set to true, base is at (1, 0, 0)
while tip is at (0, 0, 0). Defaults to false, i.e. base at (0, 0, 0) and the tip
at (1, 0, 0).

### direction (set/get)

Float array of size 3 representing the direction for the arrow. Defaults to [1, 0, 0].
