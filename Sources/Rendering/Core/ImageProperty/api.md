## Introduction

vtkImageProperty -- image display properties

vtkImageProperty is an object that allows control of the display
of an image slice.

## See Also

[vtkImageMapper](./Rendering_Core_ImageMapper.html)
[vtkImageProperty](./Rendering_Core_ImageProperty.html)

### colorWindow

Controls the window in a window level mapping of the input image. Window
level mapping is a technique to map the raw data values of an image
into screen intensities in a manner akin to

pixelIntensity = (inputValue - level)/window;

### colorLevel

Controls the level in a window level mapping of the input image. Window
level mapping is a technique to map the raw data values of an image
into screen intensities in a manner akin to

pixelIntensity = (inputValue - level)/window;

### ambient

Control the ambient lighting intensity for this image.

### diffuse

Control the diffuse lighting intensity of this image.

### opacity

Control the opacity of this image.

### rGBTransferFunction

Specify vtkColorTransferFunction to map scalars to colors. If set, then
colorWindow and colorLevel are not used.
