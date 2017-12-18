### setResolution(resolution)

Sets the cube face resolution. Defaults to 200.

### setFontStyle(style)

Sets the font style. This is any valid CSS font style, e.g. normal,
bold, etc. Defaults to "normal".

### setFontFamily(family)

Sets the font family. This is any valid CSS font family name. Defaults
to "Arial".

### setFontColor(color)

Sets the font color. This is any valid CSS color. Defaults to "black".

### setEdgeThickness(thickness)

Edge thickness is a value between 0.0 and 1.0, and represents the
fraction of the face resolution to cover (for one edge). Defaults to
0.1.

If the thickness is 0, then no edge is rendered.

### setEdgeColor(color)

Sets the edge color. Defaults to black.

### setXPlusFaceProperty({ text, faceColor})

Sets the +X face property.

This takes an object, where you can optionally set the face text
or the face color, e.g. { text: 'Text', faceColor: '#0000ff' }.

### setXMinusFaceProperty({ text, faceColor})

Sets the -X face property.

This takes an object, where you can optionally set the face text
or the face color, e.g. { text: 'Text', faceColor: '#0000ff' }.

### setYPlusFaceProperty({ text, faceColor})

Sets the +Y face property.

This takes an object, where you can optionally set the face text
or the face color, e.g. { text: 'Text', faceColor: '#0000ff' }.

### setYMinusFaceProperty({ text, faceColor})

Sets the -Y face property.

This takes an object, where you can optionally set the face text
or the face color, e.g. { text: 'Text', faceColor: '#0000ff' }.

### setZPlusFaceProperty({ text, faceColor})

Sets the +Z face property.

This takes an object, where you can optionally set the face text
or the face color, e.g. { text: 'Text', faceColor: '#0000ff' }.

### setZMinusFaceProperty({ text, faceColor})

Sets the -Z face property.

This takes an object, where you can optionally set the face text
or the face color, e.g. { text: 'Text', faceColor: '#0000ff' }.
