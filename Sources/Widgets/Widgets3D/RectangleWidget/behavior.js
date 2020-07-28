import shapeBehavior from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget/behavior';

export default function widgetBehavior(publicAPI, model) {
  // We inherit shapeBehavior
  shapeBehavior(publicAPI, model);
  const superClass = { ...publicAPI };

  model.classHierarchy.push('vtkRectangleWidgetProp');

  publicAPI.setCorners = (point1, point2) => {
    if (superClass.setCorners) {
      superClass.setCorners(point1, point2);
    }
    model.shapeHandle.setOrigin(point1);
    model.shapeHandle.setCorner(point2);
  };
}
