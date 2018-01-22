## Introduction
vtkTubeFilter - A filter that generates tubes around lines 

vtkTubeFilter is a filter that generates a tube around each input line.  The
tubes are made up of triangle strips and rotate around the tube with the
rotation of the line normals. (If no normals are present, they are computed
automatically.) The radius of the tube can be set to vary with scalar or vector
value. If the radius varies with scalar value the radius is linearly adjusted.
If the radius varies with vector value, a mass flux preserving variation is
used. The number of sides for the tube also can be specified. You can also
specify which of the sides are visible. This is useful for generating
interesting striping effects. Other options include the ability to cap the tube
and generate texture coordinates.  Texture coordinates can be used with an
associated texture map to create interesting effects such as marking the tube
with stripes corresponding to length or time.

This filter is typically used to create thick or dramatic lines. Another common
use is to combine this filter with vtkStreamTracer to generate streamtubes.

**Warning**
The number of tube sides must be greater than 3.

**Warning**
The input line must not have duplicate points, or normals at points that are
parallel to the incoming/outgoing line segments. If a line does not meet this
criteria, then that line is not tubed.

## Public API

### OutputPointsPrecision (set/get)

Set / get the desired precision for the output types.
Available options for desired output precision are:

- `DEFAULT`: Output precision should match the input precision
- `SINGLE`: Output single-precision floating-point (i.e. float32)
- `DOUBLE`: Output double-precision floating point (i.e. float64)

See the documentation for [vtkDataArray::getDataType()](../api/Common_Core_DataArray.html#getDataType-String) for additional data type settings.

### Radius (set/get)

Set the minimum tube radius (minimum because the tube radius may vary). Defaults
to 0.5.

### VaryRadius (set/get)

Enable or disable variation of tube radius with scalar or vector values.
Available options for VaryRadius are:

- `VARY_RADIUS_OFF`: Disable variation of tube radius
- `VARY_RADIUS_BY_SCALAR`: Vary tube radius with normalized scalar values
- `VARY_RADIUS_BY_VECTOR`: Vary tube radius with vector values
- `VARY_RADIUS_BY_ABSOLUTE_SCALAR`: Vary tube radius with absolute scalar values

### NumberOfSides (set/get)

Set the number of sides for the tube. At a minimum, number of sides is 3.
Defaults to 3. 

### RadiusFactor (set/get)

Set the maximum tube radius in terms of a multiple of the minimum radius.
Defaults to 10.

### DefaultNormal (set/get)

Set the default normal to use if no normals are supplied. Requires that
[UseDefaultNormal](#UseDefaultNormal-set-get) is set. Defaults to [0, 0, 1].

### UseDefaultNormal (set/get)

Boolean to control whether to use the [DefaultNormal](#DefaultNormal-set-get).
Defaults to false.

### SidesShareVertices (set/get)

Boolean to control whether the tube sides should share vertices. This creates
independent strips, with constant normals so the tube is always faceted in
appearance. Defaults to true.

### Capping (set/get)

Enable / disable capping the ends of the tube with polygons. Defaults to false.

### OnRatio (set/get)

Control the stripping of tubes. If OnRatio is greater than 1, then every nth
tube side is turned on, beginning with the [Offset](#Offset-set-get) side.
Defaults to 1.

### Offset (set/get)

Control the stripping of tubes. The offset sets the first tube side that is
visible. Offset is generally used with [OnRatio](#OnRatio-set-get) to create
nifty stripping effects. Defaults to 0.

### GenerateTCoords (set/get)

Control whether and how texture coordinates are produced. This is useful for
stripping the tube with length textures, etc. If you use scalars to create the
texture, the scalars are assumed to be monotonically increasing (or decreasing).
Available options for generating texture coordinates are:

- `TCOORDS_OFF`: Disable generation of texture coordinates
- `TCOORDS_FROM_NORMALIZED_LENGTH`: Generate texture coordinates based on
normalized length of the line
- `TCOORDS_FROM_LENGTH`: Generate texture coordinates based on absolute length of
the line
- `TCOORDS_FROM_SCALARS`: Generate texture coordinates using scalars provided

### TextureLength (set/get)

Control the conversion of units during texture coordinates calculation. The
texture length indicates what length (whether calculated from scalars or length)
is mapped to [0, 1) texture space. Defaults to 1.0.
