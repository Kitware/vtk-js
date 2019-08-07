import shapeBehavior from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget/behavior';
import { vec3 } from 'gl-matrix';

export default function widgetBehavior(publicAPI, model) {
  // We inherit shapeBehavior
  shapeBehavior(publicAPI, model);
  const superAPI = Object.assign({}, publicAPI);

  model.classHierarchy.push('vtkEllipseWidgetProp');

  publicAPI.setBounds = (bounds) => {
    if (superAPI.setBounds) {
      superAPI.setBounds(bounds);

      const center = [
        (bounds[0] + bounds[1]) / 2,
        (bounds[2] + bounds[3]) / 2,
        (bounds[4] + bounds[5]) / 2,
      ];

      const scale3 = [
        Math.max(bounds[0], bounds[1]) - center[0],
        Math.max(bounds[2], bounds[3]) - center[1],
        Math.max(bounds[4], bounds[5]) - center[2],
      ];

      model.shapeHandle.setOrigin(center);
      model.shapeHandle.setScale3(scale3);
    }
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
