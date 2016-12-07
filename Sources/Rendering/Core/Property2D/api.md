## Introduction

Represent surface properties of a 2D geometric object

vtkProperty2D is an object that represents lighting and other surface
properties of a 2D geometric object. The primary properties that can be
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

### setColor(r, g, b) / getColor() : [r, g, b]

Set the color of the object. Has the side effect of setting the
ambient diffuse and specular colors as well. This is basically
a quick overall color setting method.

### setOpacity(Number) / getOpacity() : Number

Set/Get the object's opacity. 1.0 is totally opaque and 0.0 is completely
transparent.

### getLineWidth(Number) / getLineWidth(): Number

Set/Get the width of a Line. The width is expressed in screen units.
This is only implemented for OpenGL. The default is 1.0.

### getPointSize(Number) / getPointSize(): Number

Set/Get the diameter of a point. The size is expressed in screen units.
This is only implemented for OpenGL. The default is 1.0.
