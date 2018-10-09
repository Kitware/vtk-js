import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

export const INITIAL_POINTS = [
  [-1, -1, -1], // 0
  [-1, 1, -1], // 1
  [1, -1, -1], // 2
  [1, 1, -1], // 3
  [-1, -1, 1], // 4
  [-1, 1, 1], // 5
  [1, -1, 1], // 6
  [1, 1, 1], // 7
];

export function generateState() {
  return vtkStateBuilder
    .createBuilder()
    .addStateFromMixin({
      labels: ['handles', '---'],
      mixins: ['origin'],
      name: 'handle',
      initialValues: {
        origin: INITIAL_POINTS[0],
      },
    })
    .addStateFromMixin({
      labels: ['handles', '-+-'],
      mixins: ['origin'],
      name: 'handle',
      initialValues: {
        origin: INITIAL_POINTS[1],
      },
    })
    .addStateFromMixin({
      labels: ['handles', '+--'],
      mixins: ['origin'],
      name: 'handle',
      initialValues: {
        origin: INITIAL_POINTS[2],
      },
    })
    .addStateFromMixin({
      labels: ['handles', '++-'],
      mixins: ['origin'],
      name: 'handle',
      initialValues: {
        origin: INITIAL_POINTS[3],
      },
    })
    .addStateFromMixin({
      labels: ['handles', '--+'],
      mixins: ['origin'],
      name: 'handle',
      initialValues: {
        origin: INITIAL_POINTS[4],
      },
    })
    .addStateFromMixin({
      labels: ['handles', '-++'],
      mixins: ['origin'],
      name: 'handle',
      initialValues: {
        origin: INITIAL_POINTS[5],
      },
    })
    .addStateFromMixin({
      labels: ['handles', '+-+'],
      mixins: ['origin'],
      name: 'handle',
      initialValues: {
        origin: INITIAL_POINTS[6],
      },
    })
    .addStateFromMixin({
      labels: ['handles', '+++'],
      mixins: ['origin'],
      name: 'handle',
      initialValues: {
        origin: INITIAL_POINTS[7],
      },
    })
    .build('orientation', 'name');
}

export default generateState;
