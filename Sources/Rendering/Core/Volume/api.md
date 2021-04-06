## Introduction

vtk-js includes support for volume rendering using hardware GPU acceleration. The
capabilities may change over time but as of this writing it includes support
for :

- multi-component data
- at least 24 bits linear resolution
- support for all native data types, 16 bit, float, etc
- opacity transfer functions
- color transfer functions
- volume interpolation of nearest, fast linear and linear
- automatic intermixing of opaque surfaces with volumes

Using volume rendering in vtk-js is very much like using it VTK is you are
familiar with VTK. The main objects are :

- RenderWindow/Renderer as usual
- Volume  - similar to Actor, holds the property and mapper
- VolumeMapper - takes an ImageData as input
- VolumeProperty - holds the opacity and color transfer functions
- PiecewiseFunction - a piecewise interpolated function, good for opacity
  transfer functions
- ColorTransferFunction - similar to PiecewiseFunction but support an RGB
  value at each point.


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


## See Also

[vtkColorTransferFunction](./Rendering_Core_ColorTransferFunction.html) 

[vtkImageData](./Common_DataModel_ImageData.html) 

[vtkPiecewiseFunction](./Common_DataModel_PiecewiseFunction.html) 

[vtkVolumeMapper](./Rendering_Core_VolumeMapper.html) 

[vtkVolumeProperty](./Rendering_Core_VolumeProperty.html)

## Methods


### extend

Method use to decorate a given object (publicAPI+model) with vtkVolume characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getBounds

Get the bounds as [xmin, xmax, ymin, ymax, zmin, zmax].



### getBoundsByReference

Get the bounds as [xmin, xmax, ymin, ymax, zmin, zmax].



### getMTime

Return the `Modified Time` which is a monotonic increasing integer
global for all vtkObjects.

This allow to solve a question such as:
 - Is that object created/modified after another one?
 - Do I need to re-execute this filter, or not? ...

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> | the global modified time |


### getMapper





### getProperty





### getRedrawMTime





### getVolumes





### makeProperty





### newInstance

Method use to create a new instance of vtkVolume



### setMapper





### setProperty





