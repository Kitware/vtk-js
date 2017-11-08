## Introduction

vtkImageSlice is used to represent an image in a 3D scene. It displays
the image either as a slice or as a projection from the camera's
perspective. Adjusting the position and orientation of the slice
is done by adjusting the focal point and direction of the camera,
or alternatively the slice can be set manually in vtkImageMapper
The lookup table and window/level are set in vtkImageProperty.

Thanks to David Gobbi at the Seaman Family MR Centre and Dept. of Clinical
Neurosciences, Foothills Medical Centre, Calgary, for providing
the basis for this and many other image display classes.

## See Also

[vtkImageMapper](./Rendering_Core_ImageMapper.html)
[vtkImageProperty](./Rendering_Core_ImageProperty.html)

### mapper

The mapper to use represent this image/data. Typically this is a
vtkImageMapper.

### property

The properties of this image slice. The properties help determine how
an image will be rendered. Typically an instance of vtkImageProperty.
