import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

export default function generateState() {
  return vtkStateBuilder
    .createBuilder()
    .addStateFromMixin({
      labels: ['moveHandle', 'test'],
      mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator'],
      name: 'moveHandle',
      initialValues: {
        scale1: 0.3,
        origin: [1, 0, 0],
        visible: false,
      },
    })
    .addStateFromMixin({
      labels: ['rectangleHandle'],
      mixins: ['bounds', 'color', 'visible', 'direction'],
      name: 'rectangleHandle',
      initialValues: {
        bounds: [0, 0, 0, 0, 0, 0],
        visible: false,
        direction: [0, 0, 1],
      },
    })
    .build();
}
