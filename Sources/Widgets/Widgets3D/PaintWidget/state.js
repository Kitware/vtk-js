import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

export default function generateState(radius) {
  return vtkStateBuilder
    .createBuilder()
    .addField({
      name: 'trueOrigin',
      initialValue: [0, 0, 0],
    })
    .addStateFromMixin({
      labels: ['handle'],
      mixins: [
        'origin',
        'color',
        'scale1',
        'orientation',
        'manipulator',
        'visible',
      ],
      name: 'handle',
      initialValues: {
        scale1: radius * 2,
        origin: [0, 0, 0],
        orientation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
        visible: true,
      },
    })
    .addDynamicMixinState({
      labels: ['trail'],
      mixins: ['origin', 'color', 'scale1', 'orientation'],
      name: 'trail',
      initialValues: {
        scale1: radius * 2,
        origin: [0, 0, 0],
        orientation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
      },
    })
    .build();
}
