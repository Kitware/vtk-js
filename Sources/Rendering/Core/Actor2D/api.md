vtkActor2D is used to represent a 2D entity in a rendering scene. It inherits
functions related to the actors position, and orientation from
vtkProp. The actor also has scaling and maintains a reference to the
defining geometry (i.e., the mapper), rendering properties, and possibly a
texture map.

## See Also

[vtkMapper2D](./Rendering_Core_Mapper2D.html) 
[vtkProperty2D](./Rendering_Core_Property2D.html) 

## newInstance()

Create an instance of vtkActor2D

## getActors2D()

For some exporters and other other operations we must be
able to collect all the actors or volumes. These methods
are used in that process.

## hasTranslucentPolygonalGeometry()

Does this prop have some translucent polygonal geometry?

## property

Set/Get the property object that controls this actors surface
properties. This should be an instance of a vtkProperty object. Every
actor must have a property associated with it. If one isn't specified,
then one will be generated automatically. Multiple actors can share one
property object.

## makeProperty()

Create a new property suitable for use with this type of Actor.
The default is to create a vtkProperty2D.

## mapper

This is the method that is used to connect an actor to the end of a
visualization pipeline, i.e. the mapper. This should be a subclass
of vtkMapper2D. Typically vtkPolyDataMapper2D will be used.

## bounds()

Get the bounds for this Actor as (Xmin,Xmax,Ymin,Ymax,Zmin,Zmax).

## getMTime()

Get the newest "modification time" of the actor, its properties, and texture (if set).

## getRedrawMTime()

Return the mtime of anything that would cause the rendered image to
appear differently. Usually this involves checking the mtime of the
prop plus anything else it depends on such as properties, textures,
etc.
