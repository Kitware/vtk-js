import shapeBehavior from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget/behavior';

export default function widgetBehavior(publicAPI, model) {
  // We inherit shapeBehavior
  shapeBehavior(publicAPI, model);
  const superClass = { ...publicAPI };

  model.classHierarchy.push('vtkRectangleWidgetProp');

  publicAPI.setBounds = (bounds) => {
    if (superClass.setBounds) {
      superClass.setBounds(bounds);
    }

    model.shapeHandle.setBounds(bounds);
  };
}
