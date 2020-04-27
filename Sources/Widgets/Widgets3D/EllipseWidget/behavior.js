import shapeBehavior from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget/behavior';
import { vec3 } from 'gl-matrix';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';

export default function widgetBehavior(publicAPI, model) {
  // We inherit shapeBehavior
  shapeBehavior(publicAPI, model);
  const superClass = { ...publicAPI };

  model.classHierarchy.push('vtkEllipseWidgetProp');

  publicAPI.setBounds = (bounds) => {
    if (superClass.setBounds) {
      superClass.setBounds(bounds);
    }

    const center = vtkBoundingBox.getCenter(bounds);
    const scale3 = vtkBoundingBox.computeScale3(bounds);

    model.shapeHandle.setOrigin(center);
    model.shapeHandle.setScale3(scale3);
  };

  publicAPI.setBoundsFromRadius = (center, pointOnCircle) => {
    const radius = vec3.distance(center, pointOnCircle);

    publicAPI.setBounds([
      center[0] - radius,
      center[0] + radius,
      center[1] - radius,
      center[1] + radius,
      center[2] - radius,
      center[2] + radius,
    ]);
  };

  publicAPI.setBoundsFromDiameter = (point1, point2) => {
    const center = [
      0.5 * (point1[0] + point2[0]),
      0.5 * (point1[1] + point2[1]),
      0.5 * (point1[2] + point2[2]),
    ];

    publicAPI.setBoundsFromRadius(center, point1);
  };
}
