import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

// Defines the structure of the widget state.
// See https://kitware.github.io/vtk-js/docs/concepts_widgets.html.
export default function stateGenerator() {
  return vtkStateBuilder
    .createBuilder()
    .addStateFromMixin({
      labels: ['moveHandle'],
      mixins: [
        'origin',
        'color3',
        'scale1',
        'direction',
        'visible',
        'manipulator',
      ],
      name: 'moveHandle',
      initialValues: {
        scale1: 20,
        visible: true,
        direction: [0, 0, 1],
      },
    })
    .build();
}
