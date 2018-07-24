## Introduction
This class represents a reslice cursor. It consists of two cross
sectional hairs.

### Image (set/get)
Set the image (3D) that we are slicing.

### Center (set/get)
The center of the reslice cursor.

### GetCenterlineAxisPolyData(i)
Get the centerline polydata along an axis.

### GetPlane(i)
Get the planes that represent normals along the X, Y and Z. The argument
passed to this method must be an integer in the range 0-2 (corresponding
to the X, Y and Z axes.)

### GetAxis(i)
Get the computed axes directions.

### Reset()
Reset the cursor to the default position, ie with the axes, normal
to each other and axis aligned and with the cursor pointed at the
center of the image.