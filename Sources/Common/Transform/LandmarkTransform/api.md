## Usage

'''js
import vtkLandmarkTransform from 'vtk.js/Sources/Common/Transform/LandmarkTransform';

const transform = LandmarkTransform.New();
transform.setMode(Mode.RIGID_BODY);
transform.setSourceLandmark(...); // vtkPoints
transform.setTargetLandmark(...); // vtkPoints
transform.update();
const transformMatrix = transform.getMatrix();
'''

### sourceLandmark (set/get)

vtkPoints
List of 3D points which defines the source points

### targetLandmark (set/get)

vtkPoints
List of 3D points which defines the target points

### mode (set)

Enum Mode.
Set the number of degrees of freedom to constrain the solution to.
Mode.RIGID_BODY : Rotation and translation onlu
Mode.SIMILARITY : rotation, translation and isotropic scaling
Mode.AFFINE : collinearity is preserved. Ratios of distances along a line are preserved.
Default is SIMILARITY

### update

Launch the computation of the matrix according to target and source points.

### matrix (get)

Mat4 matrix, result of the landmark transform.
If vtkLandmarkTransformed failed, default is identity.
