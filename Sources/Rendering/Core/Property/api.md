## Introduction

represent surface properties of a geometric object

vtkProperty is an object that represents lighting and other surface
properties of a geometric object. The primary properties that can be
set are colors (overall, ambient, diffuse, specular, and edge color);
specular power; opacity of the object; the representation of the
object (points, wireframe, or surface); and the shading method to be
used (flat, Gouraud, and Phong). Also, some special graphics features
like backface properties can be set and manipulated with this object.

### newInstance()

Construct object with object color, ambient color, diffuse color,
specular color, and edge color white; ambient coefficient=0; diffuse
coefficient=0; specular coefficient=0; specular power=1; Gouraud shading;
and surface representation. Backface and frontface culling are off.

### render(actor, renderer)

This method causes the property to set up whatever is required for
its instance variables. This is actually handled by a subclass of
vtkProperty, which is created automatically. This
method includes the invoking actor as an argument which can
be used by property devices that require the actor.

### backfaceRender(actor, renderer)

This method renders the property as a backface property. TwoSidedLighting
must be turned off to see any backface properties. Note that only
colors and opacity are used for backface properties. Other properties
such as Representation, Culling are specified by the Property.

### lighting

Set/Get lighting flag for an object. Initial value is true.

### interpolation

Set the shading interpolation method for an object.

### setInterpolationToFlat() 

Set interpolation to 0 => 'VTK_FLAT';

### setInterpolationToGouraud() 

Set interpolation to 1 => 'VTK_GOURAUD';

### setInterpolationToPhong() 

Set interpolation to 2 => 'VTK_PHONG';

### getInterpolationAsString() : String

Map the interpolation integer to the corresponding ShadingModel.

```js
const ShadingModel = ['VTK_FLAT', 'VTK_GOURAUD', 'VTK_PHONG'];
```

### representation

Control the surface geometry representation for the object.

### setRepresentationToPoints()

Set representation to 0 => 'VTK_POINTS'

### setRepresentationToWireframe()

Set representation to 1 => 'VTK_WIREFRAME'

### setRepresentationToSurface()

Set representation to 2 => 'VTK_SURFACE'

### getRepresentationAsString() : String

Map the representation integer to the corresponding RepresentationModel.

```js
const RepresentationModel = ['VTK_POINTS', 'VTK_WIREFRAME', 'VTK_SURFACE'];
```

### setColor(r, g, b) / getColor() : [r, g, b]

Set the color of the object. Has the side effect of setting the
ambient diffuse and specular colors as well. This is basically
a quick overall color setting method.

### ambient

Set/Get the lighting coefficient.

### diffuse

Set/Get the diffuse lighting coefficient.

### specular

Set/Get the specular lighting coefficient.

### specularPower

Set/Get the specular power.

### opacity

Set/Get the object's opacity. 1.0 is totally opaque and 0.0 is completely
transparent.

### ambientColor[3]

Set/Get the ambient surface color. Not all renderers support separate
ambient and diffuse colors. From a physical standpoint it really
doesn't make too much sense to have both. For the rendering
libraries that don't support both, the diffuse color is used.

### diffuseColor[3]

Set/Get the diffuse surface color.

### specularColor[3]

Set/Get the specular surface color.

### edgeVisibility

Turn on/off the visibility of edges. On some renderers it is
possible to render the edges of geometric primitives separately
from the interior.

### edgeColor[3]

Set/Get the color of primitive edges (if edge visibility is enabled).

### lineWidth

Set/Get the width of a Line. The width is expressed in screen units.
This is only implemented for OpenGL. The default is 1.0.

### lineStipplePattern

Set/Get the stippling pattern of a Line, as a 16-bit binary pattern
(1 = pixel on, 0 = pixel off).
This is only implemented for OpenGL. The default is 0xFFFF.

```js
property.setLineStipplePattern(b0, b1);
const uint8Array = property.getLineStipplePattern();
```

### lineStippleRepeatFactor

Set/Get the stippling repeat factor of a Line, which specifies how
many times each bit in the pattern is to be repeated.
This is only implemented for OpenGL. The default is 1.

### pointSize

Set/Get the diameter of a point. The size is expressed in screen units.
This is only implemented for OpenGL. The default is 1.0.

### backfaceCulling

Turn on/off fast culling of polygons based on orientation of normal
with respect to camera. If backface culling is on, polygons facing
away from camera are not drawn.

### frontfaceCulling

Turn on/off fast culling of polygons based on orientation of normal
with respect to camera. If frontface culling is on, polygons facing
towards camera are not drawn.

### releaseGraphicsResources(win)

Release any graphics resources that are being consumed by this
property. The parameter window could be used to determine which graphic
resources to release.
