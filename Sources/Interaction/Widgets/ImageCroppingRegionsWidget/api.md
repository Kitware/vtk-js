## Introduction

The vtkImageCroppingRegionsWidget provides interactive 3D axis-aligned image
cropping. The cropping is performed via axis-aligned slice views.

An example usage of vtkImageCroppingRegions is available in the Examples section.

## See also

- [vtkAbstractWidget (superclass)](./Interaction_Widgets_AbstractWidget.html)
- [vtkImageCroppingRegionsRepresentation](./Interaction_Widgets_ImageCroppingRegionsRepresentation.html)

## volumeMapper (set/get)

The volume mapper containing the volume to crop. There must be data loaded
into the volume mapper. This is required.

## handleSize (set/get)

The size, in pixels, of the crop handle region. Defaults to 3.

## slice (set/get)

The slice index that is currently being viewed.

## sliceOrientation (set/get)

The slice orientation/camera viewing position. Valid values are:

- 0 (YZ plane)
- 1 (XZ plane)
- 2 (XY plane)

These values are also supplied by ImageCroppingRegionsWidget/Constants,
under the `Orientation` object.
