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
Z-buffer to resolve coincident topology. For example, if you’d like to
draw a mesh with some edges a different color, and the edges lie on the
mesh, this feature can be useful to get nice looking lines. (See the
ResolveCoincidentTopology-related methods.)




## See Also

## Methods


### acquireInvertibleLookupTable





### canUseTextureMapForColoring

Returns if we can use texture maps for scalar coloring. Note this doesn’t
say we “will” use scalar coloring. It says, if we do use scalar coloring,
we will use a texture.
When rendering multiblock datasets, if any 2 blocks provide different
lookup tables for the scalars, then also we cannot use textures. This case
can be handled if required.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **input** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### cellFlag





### clearColorArrays

Call to force a rebuild of color result arrays on next MapScalars.
Necessary when using arrays in the case of multiblock data.



### clearInvertibleColor





### colorToValue





### createColorTextureCoordinates




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **input** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **output** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **numScalars** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **numComps** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **component** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **range** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **tableRange** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **tableNumberOfColors** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **useLogScale** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### createDefaultLookupTable

Create default lookup table. Generally used to create one when
none is available with the scalar data.



### extend

Method used to decorate a given object (publicAPI+model) with vtkMapper characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### factor





### getAbstractScalars




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **input** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **scalarMode** | <span class="arg-type">ScalarMode</span></br></span><span class="arg-required">required</span> |  |
| **arrayAccessMode** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **arrayId** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **arrayName** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getArrayAccessMode





### getBounds

Get the bounds for this mapper as [Xmin,Xmax,Ymin,Ymax,Zmin,Zmax].



### getCoincidentTopologyLineOffsetParameters





### getCoincidentTopologyPointOffsetParameter





### getCoincidentTopologyPolygonOffsetParameters





### getColorByArrayName

Get the array name to color by.



### getColorCoordinates

Provide read access to the color texture coordinate array



### getColorMapColors

Provide read access to the color array.



### getColorMode

Return the method of coloring scalar data.



### getColorModeAsString

Return the method of coloring scalar data.



### getColorTextureMap

Provide read access to the color texture array



### getCustomShaderAttributes





### getFieldDataTupleId





### getInterpolateScalarsBeforeMapping

By default, vertex color is used to map colors to a surface.
Colors are interpolated after being mapped.
This option avoids color interpolation by using a one dimensional
texture map for the colors.



### getIsOpaque

Returns if the mapper does not expect to have translucent geometry. This
may happen when using ColorMode is set to not map scalars i.e. render the
scalar array directly as colors and the scalar array has opacity i.e. alpha
component. Default implementation simply returns true. Note that even if
this method returns true, an actor may treat the geometry as translucent
since a constant translucency is set on the property, for example.



### getLookupTable

Get a lookup table for the mapper to use.



### getPrimitiveCount





### getRelativeCoincidentTopologyLineOffsetParameters





### getRelativeCoincidentTopologyPointOffsetParameters





### getRelativeCoincidentTopologyPolygonOffsetParameters





### getResolveCoincidentTopology





### getResolveCoincidentTopologyAsString





### getResolveCoincidentTopologyLineOffsetParameters





### getResolveCoincidentTopologyPointOffsetParameters





### getResolveCoincidentTopologyPolygonOffsetFaces





### getResolveCoincidentTopologyPolygonOffsetParameters





### getScalarMode

Return the method for obtaining scalar data.



### getScalarModeAsString

Return the method for obtaining scalar data.



### getScalarRange





### getScalarRangeByReference





### getScalarVisibility

Check whether scalar data is used to color objects.



### getStatic

Check whether the mapper’s data is static.



### getUseLookupTableScalarRange





### getViewSpecificProperties





### lines





### mapScalars

Map the scalars (if there are any scalars and ScalarVisibility is on)
through the lookup table, returning an unsigned char RGBA array. This is
typically done as part of the rendering process. The alpha parameter
allows the blending of the scalars with an additional alpha (typically
which comes from a vtkActor, etc.)
{
    rgba: Uint8Array(),
    location: 0/1/2, // Points/Cells/Fields
}


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **input** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **alpha** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### mapScalarsToTexture




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **scalars** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **alpha** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### newInstance

Method used to create a new instance of vtkMapper


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### offset





### points





### scalarToTextureCoordinate

-----------------------------------------------------------------------------


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **scalarValue** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **rangeMin** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **invRangeWidth** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setArrayAccessMode




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **arrayAccessMode** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setColorByArrayName

Set the array name to color by.



### setColorMode




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **colorMode** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setColorModeToDefault

Sets colorMode to DEFAULT



### setColorModeToDirectScalars

Sets colorMode to DIRECT_SCALARS



### setColorModeToMapScalars

Sets colorMode to MAP_SCALARS



### setCustomShaderAttributes

Sets point data array names that will be transferred to the VBO



### setFieldDataTupleId

When ScalarMode is set to UseFieldData, set the index of the
tuple by which to color the entire data set. By default, the
index is -1, which means to treat the field data array selected
with SelectColorArray as having a scalar value for each cell.
Indices of 0 or higher mean to use the tuple at the given index
for coloring the entire data set.



### setForceCompileOnly




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **forceCompileOnly** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setLookupTable

Set a lookup table for the mapper to use.



### setResolveCoincidentTopology




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **mode** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setResolveCoincidentTopologyPolygonOffsetFaces




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **value** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setResolveCoincidentTopologyToDefault





### setResolveCoincidentTopologyToOff





### setResolveCoincidentTopologyToPolygonOffset





### setScalarMode

Control how the filter works with scalar point data and cell attribute
data. By default (ScalarModeToDefault), the filter will use point data,
and if no point data is available, then cell data is used. Alternatively
you can explicitly set the filter to use point data
(ScalarModeToUsePointData) or cell data (ScalarModeToUseCellData).
You can also choose to get the scalars from an array in point field
data (ScalarModeToUsePointFieldData) or cell field data
(ScalarModeToUseCellFieldData). If scalars are coming from a field
data array, you must call SelectColorArray before you call GetColors.

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


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **scalarMode** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setScalarModeToDefault

Sets scalarMode to DEFAULT



### setScalarModeToUseCellData

Sets scalarMode to USE_CELL_DATA



### setScalarModeToUseCellFieldData

Sets scalarMode to USE_CELL_FIELD_DATA



### setScalarModeToUseFieldData

Sets scalarMode to USE_FIELD_DATA



### setScalarModeToUsePointData

Sets scalarMode to USE_POINT_DATA



### setScalarModeToUsePointFieldData

Sets scalarMode to USE_POINT_FIELD_DATA



### setScalarRange

Specify range in terms of scalar minimum and maximum (smin,smax). These
values are used to map scalars into lookup table. Has no effect when
UseLookupTableScalarRange is true.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **min** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **max** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setScalarRange

Specify range in terms of scalar minimum and maximum (smin,smax). These
values are used to map scalars into lookup table. Has no effect when
UseLookupTableScalarRange is true.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **scalarRange** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setScalarRangeFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **scalarRange** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setScalarVisibility

Turn on/off flag to control whether scalar data is used to color objects.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **scalarVisibility** | <span class="arg-type">boolean</span></br></span><span class="arg-required">required</span> |  |


### setStatic

Turn on/off flag to control whether the mapper’s data is static. Static data
means that the mapper does not propagate updates down the pipeline, greatly
decreasing the time it takes to update many mappers. This should only be
used if the data never changes.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **static** | <span class="arg-type">boolean</span></br></span><span class="arg-required">required</span> |  |


### setUseLookupTableScalarRange

Control whether the mapper sets the lookuptable range based on its
own ScalarRange, or whether it will use the LookupTable ScalarRange
regardless of it’s own setting. By default the Mapper is allowed to set
the LookupTable range, but users who are sharing LookupTables between
mappers/actors will probably wish to force the mapper to use the
LookupTable unchanged.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **useLookupTableScalarRange** | <span class="arg-type">boolean</span></br></span><span class="arg-required">required</span> |  |


### setViewSpecificProperties

If you want to provide specific properties for rendering engines you can use
viewSpecificProperties.

You can go and have a look in the rendering backend of your choice for details
on specific properties.
For example, for OpenGL/WebGL see OpenGL/PolyDataMapper/api.md
If there is no details, viewSpecificProperties is not supported.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **viewSpecificProperties** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### texCoordS





### texCoordT





### triangles





### useInvertibleColorFor





### valueToColor





### verts





