import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';
import { TextPosition } from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget/Constants';

export default function generateState() {
  return (
    vtkStateBuilder
      .createBuilder()
      .addStateFromMixin({
        labels: ['moveHandle'],
        mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator'],
        name: 'point1Handle',
        initialValues: {
          scale1: 10,
          visible: false,
        },
      })
      .addStateFromMixin({
        labels: ['moveHandle'],
        mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator'],
        name: 'point2Handle',
        initialValues: {
          scale1: 10,
          visible: false,
        },
      })
      .addStateFromMixin({
        labels: ['rectangleHandle'],
        mixins: ['origin', 'corner', 'color', 'visible', 'orientation'],
        name: 'rectangleHandle',
        initialValues: {
          visible: false,
        },
      })
      // FIXME: How to not duplicate with EllipseWidget
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
      // FIXME: to move in text handle sub state
      .addField({
        name: 'textPosition',
        initialValue: [
          TextPosition.CENTER,
          TextPosition.CENTER,
          TextPosition.CENTER,
        ],
      })
      .addField({
        name: 'textWorldMargin',
        initialValue: 0,
      })
      .build()
  );
}
