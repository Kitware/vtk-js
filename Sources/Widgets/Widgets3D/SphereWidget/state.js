import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

// Defines the structure of the widget state.
// See https://kitware.github.io/vtk-js/docs/concepts_widgets.html.
export default function stateGenerator() {
  return (
    vtkStateBuilder
      .createBuilder()
      // The handle used only for during initial placement.
      .addStateFromMixin({
        labels: ['moveHandle'],
        mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator'],
        name: 'moveHandle',
        initialValues: {
          scale1: 20,
          visible: true,
        },
      })
      // The handle for the center of the sphere.
      .addStateFromMixin({
        labels: ['centerHandle'],
        mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator'],
        name: 'centerHandle',
        initialValues: {
          scale1: 20,
          visible: true,
        },
      })
      // The handle for a border point of the sphere.
      .addStateFromMixin({
        labels: ['borderHandle'],
        mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator'],
        name: 'borderHandle',
        initialValues: {
          scale1: 20,
          visible: true,
        },
      })
      // For displaying the sphere.
      .addStateFromMixin({
        labels: ['sphereHandle'],
        mixins: ['origin', 'color', 'scale1', 'visible', 'orientation'],
        name: 'sphereHandle',
        initialValues: {
          visible: true,
          radius: 1,
        },
      })
      .build()
  );
}
