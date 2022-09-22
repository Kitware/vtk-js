import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';
import {
  ScrollingMethods,
  planeNames,
} from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/Constants';
import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

const viewsColor3 = {
  X: [255, 0, 0], // red
  Y: [0, 255, 0], // green
  Z: [0, 0, 255], // blue
};

export default function generateState() {
  const state = vtkStateBuilder
    .createBuilder()
    .addField({ name: 'center', initialValue: [0, 0, 0] })
    .addField({ name: 'opacity', initialValue: 1 })
    .addField({ name: 'image', initialValue: null })
    .addField({ name: 'activeViewType', initialValue: null })
    .addField({ name: 'lineThickness', initialValue: 2 })
    .addField({ name: 'sphereRadius', initialValue: 5 })
    .addField({ name: 'showCenter', initialValue: true })
    .addField({
      name: 'planes',
      initialValue: {
        [ViewTypes.YZ_PLANE]: { normal: [1, 0, 0], viewUp: [0, 0, 1] },
        [ViewTypes.XZ_PLANE]: { normal: [0, -1, 0], viewUp: [0, 0, 1] },
        [ViewTypes.XY_PLANE]: { normal: [0, 0, -1], viewUp: [0, -1, 0] },
      },
    })
    .addField({ name: 'enableRotation', initialValue: true })
    .addField({ name: 'enableTranslation', initialValue: true })
    .addField({ name: 'keepOrthogonality', initialValue: false })
    .addField({
      name: 'scrollingMethod',
      initialValue: ScrollingMethods.MIDDLE_MOUSE_BUTTON,
    })
    .addField({ name: 'cameraOffsets', initialValue: {} })
    .addField({ name: 'viewUpFromViewType', initialValue: {} })
    .addStateFromMixin({
      labels: ['handles', 'center'],
      mixins: ['origin', 'color3', 'scale1', 'visible', 'manipulator'],
      name: 'centerHandle',
      initialValues: {
        scale1: 30,
        color3: [255, 255, 255],
      },
    });

  planeNames.reduce(
    (viewState, view) =>
      planeNames
        .filter((v) => v !== view)
        .reduce((axisState, axis) => {
          // Line handle
          axisState.addStateFromMixin({
            labels: ['handles', 'line', `lineIn${view}`, `${axis}in${view}`],
            mixins: [
              'origin',
              'color3',
              'scale3', // scale3[2] will be automatically overwritten
              'orientation',
              'visible',
              'manipulator',
            ],
            name: `axis${axis}in${view}`,
            initialValues: {
              scale3: [4, 4, 4],
              color3: viewsColor3[axis],
            },
          });
          // Rotation handle
          for (let rotationHandle = 0; rotationHandle < 2; ++rotationHandle) {
            axisState.addStateFromMixin({
              labels: [
                'handles',
                'rotation',
                `rotationIn${view}`,
                `${axis}in${view}`,
                `point${rotationHandle}`,
              ],
              mixins: ['origin', 'color3', 'scale1', 'visible', 'manipulator'],
              name: `rotationHandle${axis}in${view}${rotationHandle}`,
              initialValues: {
                scale1: 30,
                color3: viewsColor3[axis],
              },
            });
          }
          return axisState;
        }, viewState),
    state
  );
  return state.build();
}
