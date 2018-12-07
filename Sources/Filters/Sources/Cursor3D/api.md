## Introduction
 vtkCursor3D is an object that generates a 3D representation of a cursor. The cursor consists of a wireframe bounding box, three intersecting axes lines that meet at the cursor focus, and "shadows" or projections of the axes against the sides of the bounding box. Each of these components can be turned on/off.

## Usage
```js
  import vtkCursor3D from 'vtk.js/Sources/Filters/Sources/vtkCursor3D';
  const cursor = vtkCursor3D.newInstance({focalPoint: [0, 0, 0], modelBounds: [-100, 100, -100, 100, -100, 100]});
  const polyData = cursor.getOutputData();
```

### ModelBounds (set/get)
The boundary of the 3D cursor.

### FocalPoint (set/get)
The position of cursor focus. 

### Outline (set/get)
Boolean to turn on/off the wireframe. Default is on.

### Axes (set/get)
Boolean to turn on/off the axes. Default is on.

### XShadows (set/get)
Boolean to turn on/off the wireframe xshadows. Default is on.

### YShadows (set/get)
Boolean to turn on/off the wireframe yshadows. Default is on.

### ZShadows (set/get)
Boolean to turn on/off the wireframe Zshadows. Default is on.

### Translation Mode (set/get)
Boolean to let cursor position cause the entire widget to translate along with the cursor. Default is off.

### Wrap (set/get)
Boolean to let the cursor focus to restrained against the closest "wall". Default is off.

### Focus (get)
Get the polydata of the focus.

### All (set)
Boolean to turn everything on.