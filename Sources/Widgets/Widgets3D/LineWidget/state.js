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
        origin: [],
      },
    })
    .addStateFromMixin({
      labels: ['handle1'],
      mixins: ['origin', 'color', 'scale1', 'visible'],
      name: 'handle1',
      initialValues: {
        scale1: 50,
        origin: [],
        visible: false,
      },
    })
    .addStateFromMixin({
      labels: ['handle2'],
      mixins: ['origin', 'color', 'scale1', 'visible'],
      name: 'handle2',
      initialValues: {
        scale1: 50,
        origin: [],
        visible: false,
      },
    })
    .addStateFromMixin({
      labels: ['SVGtext'],
      mixins: ['origin', 'color', 'text', 'visible'],
      name: 'text',
      initialValues: {
        /* text is empty to set a text filed in the SVGLayer and to avoid
         * displaying text before positionning the handles */
        text: '',
        visible: false,
        origin: [0, 0, 0],
      },
    })
    .addField({ name: 'positionOnLine', initialValues: 0 })
    .addField({ name: 'nbHandles', initialValues: 0 })
    .build();
}
