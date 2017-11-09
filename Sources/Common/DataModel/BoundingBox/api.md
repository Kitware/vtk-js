vtkBoundingBox maintains a 3D axis aligned bounding box.
It is very lite weight and many of the member functions are in-lined so its
very fast. It is not derived from vtkObject so it can be allocated on the stack

## newInstance({ bounds: [xMin, xMax, yMin, yMax, zMin, zMax]})

Construct a bounding box with the min point set to Number.MAX_VALUE and the max point set to -Number.MAX_VALUE unless { bounds } are provided.

### clone() : newInstance

Return new instance with the same bounds.

### equals(otherInstance) : Boolean

### bounds

Set/Get the bounds explicitly of the box (vtk Style)

### setMinPoint(x, y, z)

Set the minimum point of the bounding box - if the min point
is greater than the max point then the max point will also be changed

### setMaxPoint(x, y, z)

Set the maximum point of the bounding box - if the max point
is less than the min point then the  min point will also be changed

### addPoint(x, y, z)

Change bounding box so it includes the point p
Note that the bounding box may have 0 volume if its bounds
were just initialized.

### addBox(otherInstance)

Change the bouding box to be the union of itself and bbox

### addBounds(xMin, xMax, yMin, yMax, zMin, zMax)

Change the bounding box so it includes bounds (defined by vtk standard)

### intersect(otherInstance) : Boolean

Intersect this box with bbox. The method returns 1 if
both boxes are valid and they do have overlap else it will return false.
If false is returned the box has not been modified.

### intersects(otherInstance) : Boolean

Returns true if the boxes intersect else returns false.

### intersectPlane(origin[3], normal[3]) : Boolean

Intersect this box with the half space defined by plane.
Returns true if there is intersection---which implies that the box has been modified
Returns false otherwise

### contains(otherInstance) : Boolean

Returns true if the min and max points of bbox are contained
within the bounds of this box, else returns false.

### getBound(index) : Number

Return the ith bounds of the box (defined by vtk style)

### getMinPoint() : [xMin, yMin, zMin]

Get the minimum point of the bounding box.

### getMaxPoint() : [xMax, yMax, zMax]

Get the maximum point of the bounding box;

### containsPoint(x, y, z) : Boolean

Returns true if the point is contained in the box else false.

### getCenter() : [x, y, z]

Get the center of the bounding box

### getLengths() : [with, height, depth]

Get the lengths of the box.

### getLength(index) : Number

Return the length in the ith direction.

### getMaxLength() : Number

Return the Max Length of the box

### getDiagonalLength() : Number

Return the length of the diagonal or null if not valid.

### inflate(delta)

Expand the Box by delta on each side, the box will grow by
2*delta in x, y and z

### isValid()

Returns true if the bounds have been set and false if the box is in its
initialized state which is an inverted state.

### reset()

Returns the box to its initialized state.

### scale(x, y, z)

Scale each dimension of the box by some given factor.
If the box is not valid, it stays unchanged.
If the scalar factor is negative, bounds are flipped: for example,
if (xMin,xMax)=(-2,4) and sx=-3, (xMin,xMax) becomes (-12,6).

