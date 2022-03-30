vtkBoundingBox maintains a collection of function to manipulate 3D axis
aligned bounding box.
It is very lite weight and the static functions are very fast.

### equals(bounds[6], otherBounds[6]) : Boolean

True if boundingboxes are strictly equal.

### setMinPoint(bounds[6], x, y, z)

Set the minimum point of the bounding box - if the min point
is greater than the max point then the max point will also be changed

### setMaxPoint(bounds[6], x, y, z)

Set the maximum point of the bounding box - if the max point
is less than the min point then the  min point will also be changed

### addPoint(bounds[6], x, y, z)

Change bounding box so it includes the point p
Note that the bounding box may have 0 volume if its bounds
were just initialized.
Returns the updated bounds

### addBounds(bounds[6], xMin, xMax, yMin, yMax, zMin, zMax)

Change the bounding box so it includes bounds (defined by vtk standard)
Returns the updated bounds

### intersect(bounds[6], otherBounds[6]) : Boolean

Intersect this box with bbox. The method returns 1 if
both boxes are valid and they do have overlap else it will return false.
If false is returned the box has not been modified.

### intersects(bounds[6], otherBounds[6]) : Boolean

Returns true if the boxes intersect else returns false.

### cutWithPlane(bounds[6], origin[3], normal[3]) : Boolean

Intersect this box with the half space defined by plane.
Returns true if there is intersection---which implies that the box has been modified
Returns false otherwise

### contains(bounds[6], otherBounds[6]) : Boolean

Returns true if the min and max points of bbox are contained
within the bounds of this box, else returns false.

### getBound(bounds[6], index) : Number

Return the ith bounds of the box (defined by vtk style)

### getMinPoint(bounds[6]) : [xMin, yMin, zMin]

Get the minimum point of the bounding box.

### getMaxPoint(bounds[6]) : [xMax, yMax, zMax]

Get the maximum point of the bounding box;

### containsPoint(bounds[6], x, y, z) : Boolean

Returns true if the point is contained in the box else false.

### getCenter(bounds[6]) : [x, y, z]

Get the center of the bounding box

### getLengths(bounds[6]) : [with, height, depth]

Get the lengths of the box.

### getLength(bounds[6], index) : Number

Return the length in the ith direction.

### getMaxLength(bounds[6]) : Number

Return the Max Length of the box

### getDiagonalLength(bounds[6]) : Number

Return the length of the diagonal or null if not valid.

### inflate(bounds[6], delta)

Expand the Box by delta on each side, the box will grow by
2*delta in x, y and z
Returns the updated bounds

### isValid(bounds[6])

Returns true if the bounds have been set and false if the box is in its
initialized state which is an inverted state.

### reset(bounds[6])

Returns the box to its initialized state.

### scale(bounds[6], x, y, z)

Scale each dimension of the box by some given factor.
If the box is not valid, it stays unchanged.
If the scalar factor is negative, bounds are flipped: for example,
if (xMin,xMax)=(-2,4) and sx=-3, (xMin,xMax) becomes (-12,6).
Returns the updated bounds
