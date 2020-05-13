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
DISPLAY -             x-y pixel values in a window
NORMALIZED DISPLAY -  x-y (0,1) normalized values
VIEWPORT -            x-y pixel values in viewport
NORMALIZED VIEWPORT - x-y (0,1) normalized value in viewport
PROJECTION -          View coordinates transformed by the ortho/perspective
                      equations and normalized to -1,1 cube on X and Y. The
                      z range is defined by the code and may be -1,1
                      for OpenGL or other values. This is the coordinate system
                      that is typically coming out of the vertex shader.
VIEW -                x-y-z values in camera coordinates. The origin is
                      at the camera position and the orientation is such
                      that the -Z axis is the view direction, the X axis
                      is the view right, and Y axis is view up. This is
                      a translation and rotation from world coordinates
                      based on the camera settings.
WORLD -               x-y-z global coordinate values
MODEL -               The coordinate system specific to a dataset or
                      actor. This is normally converted into WORLD coordinates
                      as part of the rendering process.
</PRE>

If you cascade vtkCoordinate objects, you refer to another vtkCoordinate
object which in turn can refer to others, and so on. This allows you to
create composite groups of things like vtkActor2D that are positioned
relative to one another. Note that in cascaded sequences, each
vtkCoordinate object may be specified in different coordinate systems!

In shader code coordinate system transformations will often be referenced
as matricies with common ones being.
<PRE>
MCWCMatrix - model to world
MCPCMatrix - model to projection
WCVCMatrix - world to view - half of the camera transform
WCPCMatrix - world to projection
VCPCMatrix - view to projection - the other part of the camera transform
</PRE>

## See Also

[vtkActor2D](./Rendering_Core_Actor2D.html)

### referenceCoordinate

Make this coordinate relative to another coordinate instance.

### viewport

The viewport to use for calculations that require it.

### value

The x y z location of this point.
