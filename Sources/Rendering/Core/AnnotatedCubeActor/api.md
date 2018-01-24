All `propertyObject`s may have any of the following keys:

- text: the face text (default "")
- faceColor: the face color (default "white")
- faceRotation: the face rotation, in degrees (default 0)
- fontFamily: the font family to use (default Arial)
- fontColor: the font color (default "black")
- fontStyle: the CSS style for the text (default "normal")
- fontSizeScale: A function that takes the face resolution and returns the
  pixel size of the font (default `(resolution) => resolution / 1.8`)
- edgeThickness: the face edge/border thickness, which is a fraction of the
  cube resolution (default 0.1)
- edgeColor: the color of each face's edge/border (default "white")
- resolution: the pixel resolution of a face, i.e. pixel side length
  (default 200)

If a key is not specified, then the default value is used.

### defaultStyle (get/set)

The default style for all faces.

### xPlusFaceProperty (get/set)

The +X face property.

The setter takes a `propertyObject` as detailed above.

### xMinusFaceProperty (get/set)

The -X face property.

The setter takes a `propertyObject` as detailed above.

### yPlusFaceProperty (get/set)

The +Y face property.

The setter takes a `propertyObject` as detailed above.

### yMinusFaceProperty (get/set)

The -Y face property.

The setter takes a `propertyObject` as detailed above.

### zPlusFaceProperty (get/set)

The +Z face property.

The setter takes a `propertyObject` as detailed above.

### zMinusFaceProperty (get/set)

The -Z face property.

The setter takes a `propertyObject` as detailed above.
