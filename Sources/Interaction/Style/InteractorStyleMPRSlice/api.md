## Introduction

This interactor style performs MPR via the camera, a volume of the target image, and camera clipping planes. This does NOT manually compute image reslices. Since this interactor drives the camera, there should be no other usage of the renderer camera.

This interactor style will trigger the `onModified` event whenever a camera property changes.

This interactor inherits from `vtkInteractorStyleManipulator`. It utilizes the following manipulators internally:
- `vtkMouseCameraTrackballRotateManipulator`
- `vtkMouseCameraTrackballZoomManipulator`
- `vtkMouseCameraTrackballPanManipulator`
- `vtkMouseRangeManipulator`

## See Also

[vtkInteractorStyleManipulator](./Interactor_Style_InteractorStyleManipulator.html)

### setSlice(slice) / getSlice() -> sliceNum

Slice index should be provided in world space, along the slice normal. This effectively sets the camera focal point.

### setSliceNormal(...normal) / getSliceNormal() -> normal[3]

The slice normal should be provided in world space. This effectively sets the camera's direction of projection.

### getSliceRange() -> [min, max]

Retrieves the minimum and maximum possible values for the slice. Slice values are restricted based on bounding box and slice normal.

### setVolumeMapper(mapper) / getVolumeMapper()

Since this interactor style depends on the properties of an actual volume in the scene, it requires a valid volume mapper.
