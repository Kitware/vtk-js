import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

export default function generateState() {
  return vtkStateBuilder
    .createBuilder()
    .addStateFromMixin({
      labels: ['moveHandle'],
      mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator'],
      name: 'moveHandle',
      initialValues: {
        scale1: 30,
        visible: false,
      },
    })
    .addDynamicMixinState({
      labels: ['handles'],
      mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator'],
      name: 'handle',
      initialValues: {
        scale1: 30,
      },
    })
    .build();
}
