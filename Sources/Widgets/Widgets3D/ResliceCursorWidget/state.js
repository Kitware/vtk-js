import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';
import {
  ScrollingMethods,
  planeNames,
  planeNameToViewType,
} from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/Constants';

const defaultPlanes = {
  X: {
    normal: [1, 0, 0],
    viewUp: [0, 0, 1],
    color3: [255, 0, 0],
  },
  Y: {
    normal: [0, -1, 0],
    viewUp: [0, 0, 1],
    color3: [0, 255, 0],
  },
  Z: {
    normal: [0, 0, -1],
    viewUp: [0, -1, 0],
    color3: [0, 0, 255],
  },
};

const viewsColor3 = {
  X: [255, 0, 0], // red
  Y: [0, 255, 0], // green
  Z: [0, 0, 255], // blue
};

export default function generateState(planes = planeNames) {
  const state = vtkStateBuilder
    .createBuilder()
    .addField({ name: 'center', initialValue: [0, 0, 0] })
    .addField({ name: 'image', initialValue: null })
    .addField({ name: 'activeViewType', initialValue: null })
    .addField({
      name: 'planes',
      initialValue: planes.reduce(
        (res, planeName) => ({
          ...res,
          [planeNameToViewType[planeName]]: {
            normal: defaultPlanes[planeName].normal,
            viewUp: defaultPlanes[planeName].viewUp,
          },
        }),
        {}
      ),
    })
    .addField({
      name: 'scrollingMethod',
      initialValue: ScrollingMethods.MIDDLE_MOUSE_BUTTON,
    })
    .addField({ name: 'cameraOffsets', initialValue: {} })
    .addField({ name: 'viewUpFromViewType', initialValue: {} })
    .addStateFromMixin({
      labels: ['handles', 'sphere', 'center'],
      mixins: ['origin', 'color3', 'scale1', 'visible', 'manipulator'],
      name: 'centerHandle',
      initialValues: {
        scale1: 30,
        color3: [255, 255, 255],
      },
    });

  planes.reduce(
    (viewState, view) =>
      planes
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
                'sphere',
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
