## Introduction

vtkProp is an abstract superclass for any objects that can exist in a
rendered scene (either 2D or 3D). Instances of vtkProp may respond to
various render methods (e.g., RenderOpaqueGeometry()). vtkProp also
defines the API for picking, LOD manipulation, and common instance
variables that control visibility, picking, and dragging.

## newInstance()

### visibility

Set/Get visibility of this vtkProp. Initial value is true.

### pickable

Set/Get the pickable instance variable. This determines if the vtkProp
can be picked (typically using the mouse). Also see dragable.
Initial value is true.

### dragable

Set/Get the value of the dragable instance variable. This determines if
an Prop, once picked, can be dragged (translated) through space.
This is typically done through an interactive mouse interface.
This does not affect methods such as SetPosition, which will continue
to work. It is just intended to prevent some vtkProp'ss from being
dragged from within a user interface.
Initial value is true.

### getRedrawMTime()

Return the mtime of anything that would cause the rendered image to
appear differently. Usually this involves checking the mtime of the
prop plus anything else it depends on such as properties, textures
etc.

### useBounds

In case the Visibility flag is true, tell if the bounds of this prop
should be taken into account or ignored during the computation of other
bounding boxes, like in vtkRenderer::ResetCamera().
Initial value is true.

