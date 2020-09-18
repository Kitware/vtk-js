import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

export default function generateState() {
  return vtkStateBuilder
    .createBuilder()
    .addStateFromMixin({
      labels: ['moveHandle'],
      mixins: ['origin', 'color', 'scale1', 'visible'],
      name: 'moveHandle',
      initialValues: {
        scale1: 50,
        origin: [1, 1, 1],
        visible: false,
      },
    })
    .addDynamicMixinState({
      labels: ['handle1'],
      mixins: ['origin', 'color', 'scale1'],
      name: 'handle1',
      initialValues: {
        scale1: 50,
        origin: [-1, -2, -3],
      },
    })
    .addDynamicMixinState({
      labels: ['handle2'],
      mixins: ['origin', 'color', 'scale1'],
      name: 'handle2',
      initialValues: {
        scale1: 50,
        origin: [-1, -2, -3],
      },
    })
    .addDynamicMixinState({
      labels: ['text'],
      mixins: ['origin', 'color', 'text'],
      name: 'text',
      initialValues: {
        text: 'initialValues text',
        origin: [-1, -1, -1],
        visible: true,
      },
    })
    .build();
}
