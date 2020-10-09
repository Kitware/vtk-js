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
        visible: false,
        origin: [0, 0, 0],
      },
    })
    .addDynamicMixinState({
      labels: ['handle1'],
      mixins: ['origin', 'color', 'scale1'],
      name: 'handle1',
      initialValues: {
        scale1: 50,
        origin: [0, 0, 0],
      },
    })
    .addDynamicMixinState({
      labels: ['handle2'],
      mixins: ['origin', 'color', 'scale1'],
      name: 'handle2',
      initialValues: {
        scale1: 50,
        origin: [0, 0, 0],
      },
    })
    .addDynamicMixinState({
      labels: ['SVGtext'],
      mixins: ['origin', 'color', 'text'],
      name: 'text',
      initialValues: {
        text: 'initialValues text',
        visible: false,
        origin: [0, 0, 0],
        positionOnLine: 0,
      },
    })
    .addField({ name: 'positionOnLine', initialValues: 0 })
    .build();
}
