import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

export default function generateState() {
  return vtkStateBuilder
    .createBuilder()
    .addStateFromMixin({
      labels: ['moveHandle'],
      mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator'],
      name: 'point1Handle',
      initialValues: {
        scale1: 10,
        origin: [1, 0, 0],
        visible: false,
      },
    })
    .addStateFromMixin({
      labels: ['moveHandle'],
      mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator'],
      name: 'point2Handle',
      initialValues: {
        scale1: 10,
        origin: [1, 0, 0],
        visible: false,
      },
    })
    .addStateFromMixin({
      labels: ['rectangleHandle'],
      mixins: ['bounds', 'color', 'visible', 'direction', 'normal'],
      name: 'rectangleHandle',
      initialValues: {
        bounds: [0, 0, 0, 0, 0, 0],
        visible: false,
        direction: [0, 0, 1],
        normal: [0, 0, -1],
      },
    })
    .build();
}
