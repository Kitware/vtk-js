import shapeBehavior from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget/behavior';

export default function widgetBehavior(publicAPI, model) {
  // We inherit shapeBehavior
  shapeBehavior(publicAPI, model);

  model.classHierarchy.push('vtkEllipseWidgetProp');

  publicAPI.setBounds = (bounds) => {
    const origin = [
      (bounds[0] + bounds[1]) / 2,
      (bounds[2] + bounds[3]) / 2,
      (bounds[4] + bounds[5]) / 2,
    ];
    const scale3 = [
      Math.max(bounds[0], bounds[1]) - origin[0],
      Math.max(bounds[2], bounds[3]) - origin[1],
      Math.max(bounds[4], bounds[5]) - origin[2],
    ];
    model.shapeHandle.setOrigin(origin);
    model.shapeHandle.setScale3(scale3);
  };
}
