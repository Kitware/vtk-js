## vtkTexture - handles properties associated with a texture map

## Description
vtkTexture is an object that handles loading and binding of texture
maps. It obtains its data from an input image data dataset type.
Thus you can create visualization pipelines to read, process, and
construct textures. Note that textures will only work if texture
coordinates are also defined, and if the rendering system supports
texture.

Instances of vtkTexture are associated with actors via the actor's
SetTexture() method. Actors can share texture maps (this is encouraged
to save memory resources.)

.SECTION Caveats
Currently only 2D texture maps are supported, even though the data pipeline
supports 1,2, and 3D texture coordinates.

Some systems require that the texture map dimensions
are a power of two in each direction.

## See Also

[vtkProp](./Rendering_Core_Prop.html) 
[vtkRenderer](./Rendering_Core_Renderer.html) 

## Methods

### Repeat

Turn on/off the repetition of the texture map when the texture
coords extend beyond the [0,1] range.

### EdgeCLamp

Turn on/off the clamping of the texture map when the texture
coords extend beyond the [0,1] range.
Only used when Repeat is off, and edge clamping is supported by
the graphics card.

### Interpolate

Turn on/off linear interpolation of the texture map when rendering.
