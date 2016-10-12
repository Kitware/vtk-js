## Introduction

vtkViewport represents part or all of a RenderWindow. It holds a
colleciton of props that will be rendered into the area it represents.
This class also contains methods to convert between coordinate systems
commonly used in rendering.

## See Also

vtkActor vtkRenderer vtkRenderWindow vtkCoordinate vtkProp

### addViewProp(prop)

Add a prop to the list of props. Does nothing if the prop is
already present. Prop is the superclass of all actors, volumes,
2D actors, composite props etc.

### getViewProps() : []

Return any props in this viewport.

### hasViewProp(prop) : Boolean

Query if a prop is in the list of props.

### removeViewProp(prop)

Remove a prop from the list of props. Does nothing if the prop
is not already present.

### removeAllViewProps()

Remove all props from the list of props.

### (add/remove/get)Actor2D(actor2d)

Add/Remove different types of props to the renderer.
These methods are all synonyms to AddViewProp and RemoveViewProp.
They are here for convenience and backwards compatibility.

### normalizedDisplayToNormalizedViewport (x, y, z)
### normalizedViewportToView (x, y, z)
### viewToNormalizedDisplay (x, y, z)
### normalizedViewportToNormalizedDisplay (x, y, z) 
### viewToNormalizedViewport (x, y, z) 

See vtkCoordinate for the definition of these coordinate systems.

