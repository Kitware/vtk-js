## Introduction

This class represents a reslice cursor that can be used to
perform interactive thick slab MPR's through data.
It consists of two cross sectional hairs. These may be translated or rotated
independent of each other in the view. The result is used to reslice
the data along these cross sections. This allows the user to perform
multi-planar thin reformat of the data on an image view, rather
than a 3D view. The class internally uses vtkImageReslice in vtkResliceCursor to
do its reslicing.

### SetRepresentation()

Specify an instance of vtkWidgetRepresentation used to represent this
widget in the scene. Note that the representation is a subclass of vtkProp
so it can be added to the renderer independent of the widget.

### CreateDefaultRepresentation

Create the default widget representation if one is not set.
Default is vtkResliceCursorLineRepresentation.