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
        origin: [0, 0, 0],
        visible: false,
      },
    })
    .addStateFromMixin({
      labels: ['moveHandle'],
      mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator'],
      name: 'point2Handle',
      initialValues: {
        scale1: 10,
        origin: [0, 0, 0],
        visible: false,
      },
    })
    .addStateFromMixin({
      labels: ['ellipseHandle'],
      mixins: ['origin', 'color', 'scale3', 'visible', 'orientation'],
      name: 'ellipseHandle',
      initialValues: {
        visible: false,
        scale3: [1, 1, 1],
      },
    })
    .build();
}
