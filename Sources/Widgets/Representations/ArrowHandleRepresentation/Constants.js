import vtkArrow2DSource from 'vtk.js/Sources/Filters/Sources/Arrow2DSource';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkCircleSource from 'vtk.js/Sources/Filters/Sources/CircleSource';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkViewFinderSource from 'vtk.js/Sources/Filters/Sources/ViewFinderSource';

export const ShapeSource = {
  ARROWHEAD: vtkArrow2DSource,
  CONE: vtkConeSource,
  SPHERE: vtkSphereSource,
  CUBE: vtkCubeSource,
  CIRCLE: vtkCircleSource,
  VIEWFINDER: vtkViewFinderSource,
};

export default {
  ShapeSource,
};
