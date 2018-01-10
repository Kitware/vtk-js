## Introduction

The vtkImageCroppingRegionsRepresentation provides the graphical rendering
of the cropping regions.

## See also

- [vtkWidgetRepresentation (superclass)](./Interaction_Widgets_WidgetRepresentation.html)
- [vtkImageCroppingRegionsWidget](./Interaction_Widgets_ImageCroppingRegionsWidget.html)

## opacity (get/set)

The opacity of the cropped regions. Defaults to 0.5.

## edgeColor (get/set)

The edge color of the cropped regions. Default to (1.0, 1.0, 1.0) (white).

## initialBounds (get)

The boundaries for the cropping regions.

## planePositions (get)

The current cropping region/plane positions. The return value is a 6-tuple,
with the format `(XLower, XUpper, YLower, YUpper, ZLower, ZUpper)`.

## slice (set/get)

The slice position (in world space) at which to render.

## sliceOrientation (set/get)

The slice orientation, i.e. which plane is being viewed.
