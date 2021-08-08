import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';
import {
  HorizontalTextPosition,
  VerticalTextPosition,
} from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget/Constants';

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
          origin: null,
          visible: false,
        },
      })
      .addStateFromMixin({
        labels: ['moveHandle'],
        mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator'],
        name: 'point2Handle',
        initialValues: {
          scale1: 10,
          origin: null,
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
      // FIXME: How to not duplicate with RectangleWidget
      .addStateFromMixin({
        labels: ['SVGtext'],
        mixins: ['origin', 'color', 'text', 'visible'],
        name: 'text',
        initialValues: {
          /* text is empty to set a text filed in the SVGLayer and to avoid
           * displaying text before positioning the handles */
          text: '',
          visible: false,
          origin: null,
        },
      })
      // FIXME: to move in text handle sub state
      .addField({
        name: 'horizontalTextPosition',
        initialValue: HorizontalTextPosition.MIDDLE,
      })
      // FIXME: to move in text handle sub state
      .addField({
        name: 'verticalTextPosition',
        initialValue: VerticalTextPosition.MIDDLE,
      })
      .build()
  );
}
