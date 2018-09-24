import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

export default function generateState() {
  return vtkStateBuilder
    .createBuilder()
    .addStateFromMixin({
      labels: ['handles', '---'],
      mixins: ['origin', 'color', 'scale1', 'manipulator'],
      name: 'handle',
      initialValues: {
        scale1: 0.1,
        origin: [-1, -1, -1],
      },
    })
    .addStateFromMixin({
      labels: ['handles', '-+-'],
      mixins: ['origin', 'color', 'scale1', 'manipulator'],
      name: 'handle',
      initialValues: {
        scale1: 0.1,
        origin: [-1, 1, -1],
      },
    })
    .addStateFromMixin({
      labels: ['handles', '+--'],
      mixins: ['origin', 'color', 'scale1', 'manipulator'],
      name: 'handle',
      initialValues: {
        scale1: 0.1,
        origin: [1, -1, -1],
      },
    })
    .addStateFromMixin({
      labels: ['handles', '++-'],
      mixins: ['origin', 'color', 'scale1', 'manipulator'],
      name: 'handle',
      initialValues: {
        scale1: 0.1,
        origin: [1, 1, -1],
      },
    })
    .addStateFromMixin({
      labels: ['handles', '--+'],
      mixins: ['origin', 'color', 'scale1', 'manipulator'],
      name: 'handle',
      initialValues: {
        scale1: 0.1,
        origin: [-1, -1, 1],
      },
    })
    .addStateFromMixin({
      labels: ['handles', '-++'],
      mixins: ['origin', 'color', 'scale1', 'manipulator'],
      name: 'handle',
      initialValues: {
        scale1: 0.1,
        origin: [-1, 1, 1],
      },
    })
    .addStateFromMixin({
      labels: ['handles', '+-+'],
      mixins: ['origin', 'color', 'scale1', 'manipulator'],
      name: 'handle',
      initialValues: {
        scale1: 0.1,
        origin: [1, -1, 1],
      },
    })
    .addStateFromMixin({
      labels: ['handles', '+++'],
      mixins: ['origin', 'color', 'scale1', 'manipulator'],
      name: 'handle',
      initialValues: {
        scale1: 0.1,
        origin: [1, 1, 1],
      },
    })
    .build('orientation');
}
