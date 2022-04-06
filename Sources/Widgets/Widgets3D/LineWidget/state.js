import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

// make line position a sub-state so we can listen to it
// separately from the rest of the widget state.

const linePosState = vtkStateBuilder
  .createBuilder()
  .addField({
    name: 'posOnLine',
    initialValue: 0.5,
  })
  .build();

export default function generateState() {
  return vtkStateBuilder
    .createBuilder()
    .addStateFromMixin({
      labels: ['moveHandle'],
      mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator', 'shape'],
      name: 'moveHandle',
      initialValues: {
        scale1: 50,
        visible: true,
      },
    })
    .addStateFromMixin({
      labels: ['handle1'],
      mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator', 'shape'],
      name: 'handle1',
      initialValues: {
        scale1: 50,
      },
    })
    .addStateFromMixin({
      labels: ['handle2'],
      mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator', 'shape'],
      name: 'handle2',
      initialValues: {
        scale1: 50,
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
      },
    })
    .addStateFromInstance({ name: 'positionOnLine', instance: linePosState })
    .addField({ name: 'lineThickness' })
    .build();
}
