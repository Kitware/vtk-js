### updateMarkerOrientation()

Manually updates the marker's orientation.

### computeViewport()

Returns the computed viewport size. The format is `[left bottom right top]`.

### updateViewport()

Updates the orientation widget viewport size.

### setEnabled(enabling)

Sets the widget enabled status, i.e. to show the widget or not.

### setViewportCorner(vtkOrientationMarkerWidget.Corner)

Sets which corner to put the widget's viewport. Defaults to
BOTTOM_LEFT.

### setViewportSize(sizeFactor)

Sets the viewport size. The sizeFactor should be between 0.0 and 1.0.
It says how much of the main render window to color. Defaults to 0.2.

### setMinPixelSize(pixelSize)

Sets the minimum side length, in pixels, for the orientation marker widget
viewport. Defaults to 50.

### setMaxPixelSize(pixelSize)

Sets the maximum side length, in pixels, for the orientation marker widget
viewport. Defaults to 200.

