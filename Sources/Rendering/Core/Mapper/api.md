## Introduction

vtkMapper is an abstract class to specify interface between data and
graphics primitives. Subclasses of vtkMapper map data through a
lookuptable and control the creation of rendering primitives that
interface to the graphics library. The mapping can be controlled by
supplying a lookup table and specifying a scalar range to map data
through.

There are several important control mechanisms affecting the behavior of
this object. The ScalarVisibility flag controls whether scalar data (if
any) controls the color of the associated actor(s) that refer to the
mapper. The ScalarMode ivar is used to determine whether scalar point data
or cell data is used to color the object. By default, point data scalars
are used unless there are none, then cell scalars are used. Or you can
explicitly control whether to use point or cell scalar data. Finally, the
mapping of scalars through the lookup table varies depending on the
setting of the ColorMode flag. See the documentation for the appropriate
methods for an explanation.

Another important feature of this class is whether to use immediate mode
rendering (ImmediateModeRenderingOn) or display list rendering
(ImmediateModeRenderingOff). If display lists are used, a data structure
is constructed (generally in the rendering library) which can then be
rapidly traversed and rendered by the rendering library. The disadvantage
of display lists is that they require additional memory which may affect
the performance of the system.

Another important feature of the mapper is the ability to shift the
Z-buffer to resolve coincident topology. For example, if you'd like to
draw a mesh with some edges a different color, and the edges lie on the
mesh, this feature can be useful to get nice looking lines. (See the
ResolveCoincidentTopology-related methods.)

### lookupTable

Set/Get a lookup table for the mapper to use.

### createDefaultLookupTable()

Create default lookup table. Generally used to create one when none
is available with the scalar data.

### scalarVisibility (get/set)

Turn on/off flag to control whether scalar data is used to color objects.

### static (get/set)

Turn on/off flag to control whether the mapper's data is static. Static data
means that the mapper does not propagate updates down the pipeline, greatly
decreasing the time it takes to update many mappers. This should only be
used if the data never changes.

### colorMode

Description: Control how the scalar data is mapped to colors. By
default (ColorModeToDefault), unsigned char scalars are treated
as colors, and NOT mapped through the lookup table, while
everything else is. ColorModeToDirectScalar extends
ColorModeToDefault such that all integer types are treated as
colors with values in the range 0-255 and floating types are
treated as colors with values in the range 0.0-1.0. Setting
ColorModeToMapScalars means that all scalar data will be mapped
through the lookup table. (Note that for multi-component
scalars, the particular component to use for mapping can be
specified using the SelectColorArray() method.)

```js

// Helper methods
instance.setColorModeToDefault();
instance.setColorModeToMapScalars();
instance.setColorModeToDirectScalars();
```

### getColorModeAsString()

Return the method of coloring scalar data.

### interpolateScalarsBeforeMapping

By default, vertex color is used to map colors to a surface.
Colors are interpolated after being mapped.
This option avoids color interpolation by using a one dimensional
texture map for the colors.

### useLookupTableScalarRange

Control whether the mapper sets the lookuptable range based on its
own ScalarRange, or whether it will use the LookupTable ScalarRange
regardless of it's own setting. By default the Mapper is allowed to set
the LookupTable range, but users who are sharing LookupTables between
mappers/actors will probably wish to force the mapper to use the
LookupTable unchanged.

### scalarRange

Specify range in terms of scalar minimum and maximum (smin,smax). These
values are used to map scalars into lookup table. Has no effect when
UseLookupTableScalarRange is true.

### scalarMode

Control how the filter works with scalar point data and cell attribute
data. By default (ScalarModeToDefault), the filter will use point data,
and if no point data is available, then cell data is used. Alternatively
you can explicitly set the filter to use point data
(ScalarModeToUsePointData) or cell data (ScalarModeToUseCellData).
You can also choose to get the scalars from an array in point field
data (ScalarModeToUsePointFieldData) or cell field data
(ScalarModeToUseCellFieldData). If scalars are coming from a field
data array, you must call SelectColorArray before you call
GetColors.

When ScalarMode is set to use Field Data (ScalarModeToFieldData),
you must call SelectColorArray to choose the field data array to
be used to color cells. In this mode, the default behavior is to
treat the field data tuples as being associated with cells. If
the poly data contains triangle strips, the array is expected to
contain the cell data for each mini-cell formed by any triangle
strips in the poly data as opposed to treating them as a single
tuple that applies to the entire strip. This mode can also be
used to color the entire poly data by a single color obtained by
mapping the tuple at a given index in the field data array
through the color map. Use SetFieldDataTupleId() to specify
the tuple index.

```js
instance.setScalarModeToDefault();
instance.setScalarModeToUsePointData();
instance.setScalarModeToUseCellData();
instance.setScalarModeToUsePointFieldData();
instance.setScalarModeToUseCellFieldData();
instance.setScalarModeToUseFieldData();
```
### getScalarModeAsString()

Return the method for obtaining scalar data.

### selectColorArray(arrayName, component = -1)

When ScalarMode is set to UsePointFieldData or UseCellFieldData,
you can specify which array to use for coloring using these methods.
The lookup table will decide how to convert vectors to colors.

### fieldDataTupleId

When ScalarMode is set to UseFieldData, set the index of the
tuple by which to color the entire data set. By default, the
index is -1, which means to treat the field data array selected
with SelectColorArray as having a scalar value for each cell.
Indices of 0 or higher mean to use the tuple at the given index
for coloring the entire data set.

### colorByArrayName

Set/Get the array name to color by.

### resolveCoincidentTopology (STATIC)

Set/Get a global flag that controls whether coincident topology (e.g., a
line on top of a polygon) is shifted to avoid Z-buffer resolution (and
hence rendering problems). If not off, there are two methods to choose
from. PolygonOffset uses graphics systems calls to shift polygons, but
does not distinguish vertices and lines from one another. ShiftZBuffer
remaps the Z-buffer to distinguish vertices, lines, and polygons, but
does not always produce acceptable results. If you use the ShiftZBuffer
approach, you may also want to set the ResolveCoincidentTopologyZShift
value. (Note: not all mappers/graphics systems implement this
functionality.)

```js
Mapper.setResolveCoincidentTopology(val);
Mapper.setResolveCoincidentTopologyToDefault();
Mapper.setResolveCoincidentTopologyToOff()
Mapper.setResolveCoincidentTopologyToPolygonOffset()

console.log(Mapper.getResolveCoincidentTopology());
console.log(Mapper.getResolveCoincidentTopologyAsString());
```

### resolveCoincidentTopologyPolygonOffsetParameters (STATIC)

Used to set the polygon offset scale factor and units.
Used when ResolveCoincidentTopology is set to PolygonOffset.
These are global variables.

```js
Mapper.setResolveCoincidentTopologyPolygonOffsetParameters(factor, units);
console.log(Mapper.getResolveCoincidentTopologyPolygonOffsetParameters());
```

### relativeCoincidentTopologyPolygonOffsetParameters

Used to set the polygon offset values relative to the global
Used when ResolveCoincidentTopology is set to PolygonOffset.

```js
instance.setRelativeCoincidentTopologyPolygonOffsetParameters(factor, unit)
instance.getRelativeCoincidentTopologyPolygonOffsetParameters() => { factor, unit }
```

### resolveCoincidentTopologyLineOffsetParameters (STATIC)

Used to set the line offset scale factor and units.
Used when ResolveCoincidentTopology is set to PolygonOffset.
These are global variables.

```js
Mapper.setResolveCoincidentTopologyLineOffsetParameters(factor, unit)
Mapper.getResolveCoincidentTopologyLineOffsetParameters() => { factor, unit }
```

### relativeCoincidentTopologyLineOffsetParameters

Used to set the line offset values relative to the global
Used when ResolveCoincidentTopology is set to PolygonOffset.

```js
instance.setRelativeCoincidentTopologyLineOffsetParameters(factor, unit)
instance.getRelativeCoincidentTopologyLineOffsetParameters() => { factor, unit
```

### resolveCoincidentTopologyPointOffsetParameter (STATIC)

Used to set the point offset value
Used when ResolveCoincidentTopology is set to PolygonOffset.
These are global variables.

```js
Mapper.setResolveCoincidentTopologyPointOffsetParameter(factor, unit)
Mapper.getResolveCoincidentTopologyPointOffsetParameter() => { factor, unit }
```

### relativeCoincidentTopologyPointOffsetParameter

Used to set the point offset value relative to the global
Used when ResolveCoincidentTopology is set to PolygonOffset.
(factor is ignored but kept for concistency)

```js
instance.setRelativeCoincidentTopologyPointOffsetParameters(factor, unit)
instance.getRelativeCoincidentTopologyPointOffsetParameters() => { factor, unit }
```

### getCoincidentTopologyPolygonOffsetParameters() => { factor, units }

Get the net paramters for handlig coincident topology obtained by summing
the global values with the relative values.

### getCoincidentTopologyLineOffsetParameters() => { factor, units }

Get the net paramters for handlig coincident topology obtained by summing
the global values with the relative values.

### getCoincidentTopologyPointOffsetParameter() => { factor, units }

Get the net paramters for handlig coincident topology obtained by summing
the global values with the relative values.

### resolveCoincidentTopologyPolygonOffsetFaces

Used when ResolveCoincidentTopology is set to PolygonOffset. The polygon
offset can be applied either to the solid polygonal faces or the
lines/vertices. When set (default), the offset is applied to the faces
otherwise it is applied to lines and vertices.
This is a global variable.

### getBounds() : Array(6)

Return bounding box (array of six doubles) of data expressed as
(xmin,xmax, ymin,ymax, zmin,zmax).

### renderTime (set/get)

This instance variable is used by vtkLODActor to determine which
mapper to use. It is an estimate of the time necessary to render.
Setting the render time does not modify the mapper.

### mapScalars(input, alpha) => { rgba, cellFlag }

Map the scalars (if there are any scalars and ScalarVisibility is on)
through the lookup table, returning an unsigned char RGBA array. This is
typically done as part of the rendering process. The alpha parameter
allows the blending of the scalars with an additional alpha (typically
which comes from a vtkActor, etc.)

```js
{
  rgba: Uint8Array(),
  location: 0/1/2, // Points/Cells/Fields
}
```

### getIsOpaque() : Boolean

Returns if the mapper does not expect to have translucent geometry. This
may happen when using ColorMode is set to not map scalars i.e. render the
scalar array directly as colors and the scalar array has opacity i.e. alpha
component. Default implementation simply returns true. Note that even if
this method returns true, an actor may treat the geometry as translucent
since a constant translucency is set on the property, for example.

### canUseTextureMapForColoring(input)

Returns if we can use texture maps for scalar coloring. Note this doesn't
say we "will" use scalar coloring. It says, if we do use scalar coloring,
we will use a texture.
When rendering multiblock datasets, if any 2 blocks provide different
lookup tables for the scalars, then also we cannot use textures. This case
can be handled if required.

### clearColorArrays()

Call to force a rebuild of color result arrays on next MapScalars.
Necessary when using arrays in the case of multiblock data.

### getColorMapColors() : Uint8Array()

Provide read access to the color array.

### getColorCoordinates() : Float32Array()

Provide read access to the color texture coordinate array

### getColorTextureMap() : ?? ImageData ??

Provide read access to the color texture array

### viewSpecificProperties

If you want to provide specific properties for rendering engines you can use
viewSpecificProperties.

You can go and have a look in the rendering backend of your choice for details
on specific properties.
For example, for OpenGL/WebGL see OpenGL/PolyDataMapper/api.md
If there is no details, viewSpecificProperties is not supported.
