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
