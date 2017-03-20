## Introduction

vtk-js includes support for volume rendering using
hardware GPU acceleration. The capabilities may change 
over time but as of this writing it includes support for

- single component data
- at least 24 bits linear resolution
- support for all native data types, 16 bit, float, etc
- opacity transfer functions
- color transfer functions
- volume interpolation of nearest, fast linear and linear
- automatic intermixing of opaque surfaces with volumes

Using volume rendering in vtk-js is very much like using it
VTK is you are familiar with VTK. The main objects are

- RenderWindow/Renderer as usual
- Volume  - similar to Actor, holds the property and mapper
- VolumeMapper - takes an ImageData as input
- VolumeProperty - holds the opacity and color transfer functions
- PiecewiseFunction - a piecewise interpolated function,
good for opacity transfer functions
- ColorTransferFunction - similar to PiecewiseFunction but
support an RGB value at each point.

## Usage

```js
  const vol = vtkVolume.newInstance();
  const mapper = vtkVolumeMapper.newInstance();
  mapper.setSampleDistance(2.0);
  vol.setMapper(mapper);

  const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
  reader.setUrl(`${__BASE_PATH__}/Data/volume/headsq.vti`).then(() => {
    reader.loadData().then(() => {
      // we wait until the data is loaded before adding
      // the volume to the renderer
      renderer.addVolume(actor);
      renderer.resetCamera();
      renderWindow.render();
    });
  });

  // create color and opacity transfer functions
  const ctfun = vtkColorTransferFunction.newInstance();
  ctfun.addRGBPoint(200.0, 1.0, 1.0, 1.0);
  ctfun.addRGBPoint(2000.0, 0.0, 0.0, 0.0);

  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(200.0, 0.0);
  ofun.addPoint(1200.0, 0.2);
  ofun.addPoint(4000.0, 0.4);

  vol.getProperty().setRGBTransferFunction(0, ctfun);
  vol.getProperty().setScalarOpacity(0, ofun);
  vol.getProperty().setScalarOpacityUnitDistance(0, 4.5);
  vol.getProperty().setInterpolationTypeToFastLinear();

  mapper.setInputConnection(reader.getOutputPort());
```
## Methods

The main methods you will interact with on Volume are
the set/getProperty and set/getMapper to work with the
VolumeProperty and VolumeMapper classes respectively.
As a convinience getProperty() will instantiate a 
VolumeProperty if one does not already exist.

## See Also

[vtkColorTransferFunction](./Rendering_Core_ColorTransferFunction.html) 
[vtkImageData](./Common_DataModel_ImageData.html) 
[vtkPiecewiseFunction](./Common_DataModel_PiecewiseFunction.html) 
[vtkVolumeMapper](./Rendering_Core_VolumeMapper.html) 
[vtkVolumeProperty](./Rendering_Core_VolumeProperty.html) 
