import shapeBehavior from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget/behavior';

export default function widgetBehavior(publicAPI, model) {
  // We inherit shapeBehavior
  shapeBehavior(publicAPI, model);

  model.classHierarchy.push('vtkRectangleWidgetProp');

  publicAPI.setBounds = (bounds) => {
    model.shapeHandle.setBounds(bounds);
  };
}
