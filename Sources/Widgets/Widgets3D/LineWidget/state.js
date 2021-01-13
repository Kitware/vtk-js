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
      mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator'],
      name: 'handle1',
      initialValues: {
        scale1: 50,
        visible: false,
        origin: [],
      },
    })
    .addStateFromMixin({
      labels: ['handle2'],
      mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator'],
      name: 'handle2',
      initialValues: {
        scale1: 50,
        visible: false,
        origin: [],
      },
    })
    .addStateFromMixin({
      labels: ['SVGtext'],
      mixins: ['origin', 'color', 'text', 'visible'],
      name: 'text',
      initialValues: {
        /* text is empty to set a text filed in the SVGLayer and to avoid
         * displaying text before positioning the handles */
        text: '',
        visible: false,
        origin: [0, 0, 0],
      },
    })
    .addField({ name: 'positionOnLine', initialValue: 0 })
    .addField({ name: 'nbHandles', initialValue: 0 })
    .addField({ name: 'handle1Shape', initialValue: 'sphere' })
    .addField({ name: 'handle2Shape', initialValue: 'sphere' })
    .addField({ name: 'handle1Visibility', initialValue: true })
    .addField({ name: 'handle2Visibility', initialValue: false })
    .addField({ name: 'handle1FaceCamera', initialValue: true })
    .addField({ name: 'handle2FaceCamera', initialValue: true })
    .build();
}
