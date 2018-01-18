## Usage

```js
import LineSource from 'vtk.js/Sources/Filters/Sources/LineSource';

const lineSource = LineSource.New({ resolution: 10 });
const polydata = lineSource.getOutputData();
```

### Resolution (set/get)

Integer representing the x resolution of the line.

### Point1 (set/get)

Float array of size 3 representing the starting point of the line.

### Point2 (set/get)

Float array of size 3 representing the ending point of the line.

