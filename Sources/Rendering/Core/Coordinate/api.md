## Introduction

vtkCoordinate performs coordinate transformation, and represent position, in a variety of vtk coordinate systems

vtkCoordinate represents position in a variety of coordinate systems, and
converts position to other coordinate systems. It also supports relative
positioning, so you can create a cascade of vtkCoordinate objects (no loops
please!) that refer to each other. The typical usage of this object is
to set the coordinate system in which to represent a position (e.g.,
SetCoordinateSystemToNormalizedDisplay()), set the value of the coordinate
(e.g., SetValue()), and then invoke the appropriate method to convert to
another coordinate system (e.g., GetComputedWorldValue()).
The coordinate systems in vtk are as follows:

<PRE>
  DISPLAY -             x-y pixel values in window
  NORMALIZED DISPLAY -  x-y (0,1) normalized values
  VIEWPORT -            x-y pixel values in viewport
  NORMALIZED VIEWPORT - x-y (0,1) normalized value in viewport
  VIEW -                x-y-z (-1,1) values in camera coordinates. (z is depth)
  WORLD -               x-y-z global coordinate values
  USERDEFINED -         x-y-z in User defined space
</PRE>

If you cascade vtkCoordinate objects, you refer to another vtkCoordinate
object which in turn can refer to others, and so on. This allows you to
create composite groups of things like vtkActor2D that are positioned
relative to one another. Note that in cascaded sequences, each
vtkCoordinate object may be specified in different coordinate systems!

## See Also

[vtkActor2D](./Rendering_Core_Actor2D.html) 

### referenceCoordinate

Make this coordinate relative to another coordinate instance.

### viewport

The viewport to use for calculations that require it.

### value

The x y z location of this point.
