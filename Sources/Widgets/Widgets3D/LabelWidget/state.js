import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

export default function generateState() {
  return vtkStateBuilder
    .createBuilder()
    .addStateFromMixin({
      labels: ['moveHandle'],
      mixins: ['origin', 'color', 'scale1', 'visible'],
      name: 'moveHandle',
      initialValues: {
        scale1: 0.1,
        visible: false,
      },
    })
    .addStateFromMixin({
      labels: ['SVGtext'],
      mixins: ['origin', 'color', 'text', 'visible'],
      name: 'text',
      initialValues: {
        visible: true,
      },
    })
    .build();
}
