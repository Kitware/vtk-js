## Introduction

vtkPixelSpaceCallbackMapper iterates over the points of its input dataset,
using the transforms from the active camera to compute the screen coordinates
of each point.  

### callback: 

Set/Get the callback function the mapper will call, during the rendering
proces, with the screen coords of the points in dataset.  The callback
function will have the following parameters:

```js
// An array of 4-component arrays, in the index-order of the datasets points
coords: [
  [screenx, screeny, screenz, zBufValue],
  ...
]

// The active camera of the renderer, in case you may need to compute alternate
// depth values for your dataset points.  Using the sphere mapper in your
// application code is one example where this may be useful, so that you can
// account for that mapper's radius when doing depth checks.
camera: vtkCamera

// The aspect ratio of the render view and depthBuffer
aspect: float

// A Uint8Array of size width * height * 4, where the zbuffer values are
// encoded in the red and green components of each pixel.  This will only
// be non-null after you call setUseZValues(true) on the mapper before
// rendering.
depthBuffer: Uint8Array
```

### useZValues

Set/Get whether or not this mapper should capture the zbuffer during
rendering.  Useful for allowing depth checks in the application code.
