This class represents a reslice cursor that can be used to perform interactive thick slab MPR's through data. It consists of two cross sectional hairs. The hairs may have a hole in the center. These may be translated or rotated independent of each other in the view. The result is used to reslice the data along these cross sections. This allows the user to perform multi-planar thin or thick reformat of the data on an image view, rather than a 3D.




## getWidgetState(object)



Get the object that contains all the attributes used to update the representation and made computation for reslicing. The state contains:

- Six sub states which define the representation of all lines in all views. For example, the axis X is drawn in the Y and the Z view. Then, if we want to access to the attributes of the axis X, then we can call : state.getAxisXinY() and state.getAxisXinZ().

These sub states contain :
	* two points which define the lines
	* two rotation points which define the center of the rotation points
	* the color of the line
	* the name of the line (for example 'AxisXinY')
	* the name of the plane (X)

- Center: The center of the six lines

- Opacity: Update the opacity of the lines/rotation points actors

- activeLineState: Used in the behavior.js file in order to get the attribute of the selected line

- activeRotationPointName: Used in the behavior.js file in order to get the selected rotation point

- image: vtkImage used to place the reslice cursor

- activeViewType: Used in the behavior.js file in order to get the current view

- sphereRadius: Manages the radius of the rotation points

- showCenter: Defines if the reslice cursor center is displayed or not. If not, it's still possible to move the center. The cursor mouse will be turned into 'move' cursor when you can translate the center.

- updateMethodName: Used in the behavior.js in order to know which actions is going to be applied (translation, axisTransltaion, rotation)

- Planes: Contains the normal and viewUp of the YZ_, XZ_ and XY_PLANE views (which is updated when a rotation is applied). It's used to compute the resliced image

- enableRotation: if false, then remove the rotation points and disable the line rotation

- enableTranslation: if false, disable the translation of the axis

- keepOrthogonality: if false, then rotation are totally free. Else, if one axis is rotated, then the associated one if rotating the same axis in order to keep orthogonality

- scrollingMethod: Define which mouse button is used to scroll (use [Contants.js](https://github.com/Kitware/vtk-js/blob/master/Sources/Widgets/Widgets3D/ResliceCursorWidget/Constants.js)):
  * MIDDLE_MOUSE_BUTTON : Default
  * LEFT_MOUSE_BUTTON
  * RIGHT_MOUSE_BUTTON

## setCenter

You can manually set the center of the reslice cursor by calling this method with an array of three value. That can be useful if you want to implement a simple click which moves the center.
If you want to add the previous feature, then you'll have to defined the
```
renderer[axis].widgetInstance.onWidgetChange(() => {
	renderer
		// No need to update plane nor refresh when interaction
		// is on current view. Plane can't be changed with interaction on current
		// view. Refreshs happen automatically with `animation`.
		.filter((_, index) => index !== axis)
		.forEach((viewer) => {
			// update widget
		});
	});
```