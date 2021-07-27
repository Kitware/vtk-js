import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';
import { ScrollingMethods } from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/Constants';
import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

const factor = 1;
const axisXColor = [1, 0, 0];
const axisYColor = [0, 1, 0];
const axisZColor = [0, 0, 1];

const generateAxisXinY = () =>
  vtkStateBuilder
    .createBuilder()
    .addField({ name: 'point1', initialValue: [0, 0, -factor] })
    .addField({ name: 'point2', initialValue: [0, 0, factor] })
    .addField({ name: 'color', initialValue: axisXColor })
    .addField({ name: 'name', initialValue: 'AxisXinY' })
    .addField({ name: 'viewType', initialValue: ViewTypes.YZ_PLANE })
    .addField({ name: 'inViewType', initialValue: ViewTypes.XZ_PLANE })
    .build();

const generateAxisXinZ = () =>
  vtkStateBuilder
    .createBuilder()
    .addField({ name: 'point1', initialValue: [0, -factor, 0] })
    .addField({ name: 'point2', initialValue: [0, factor, 0] })
    .addField({ name: 'color', initialValue: axisXColor })
    .addField({ name: 'name', initialValue: 'AxisXinZ' })
    .addField({ name: 'viewType', initialValue: ViewTypes.YZ_PLANE })
    .addField({ name: 'inViewType', initialValue: ViewTypes.XY_PLANE })
    .build();

const generateAxisYinX = () =>
  vtkStateBuilder
    .createBuilder()
    .addField({ name: 'point1', initialValue: [0, 0, -factor] })
    .addField({ name: 'point2', initialValue: [0, 0, factor] })
    .addField({ name: 'color', initialValue: axisYColor })
    .addField({ name: 'name', initialValue: 'AxisYinX' })
    .addField({ name: 'viewType', initialValue: ViewTypes.XZ_PLANE })
    .addField({ name: 'inViewType', initialValue: ViewTypes.YZ_PLANE })
    .build();

const generateAxisYinZ = () =>
  vtkStateBuilder
    .createBuilder()
    .addField({ name: 'point1', initialValue: [-factor, 0, 0] })
    .addField({ name: 'point2', initialValue: [factor, 0, 0] })
    .addField({ name: 'color', initialValue: axisYColor })
    .addField({ name: 'name', initialValue: 'AxisYinZ' })
    .addField({ name: 'viewType', initialValue: ViewTypes.XZ_PLANE })
    .addField({ name: 'inViewType', initialValue: ViewTypes.XY_PLANE })
    .build();

const generateAxisZinX = () =>
  vtkStateBuilder
    .createBuilder()
    .addField({ name: 'point1', initialValue: [0, -factor, 0] })
    .addField({ name: 'point2', initialValue: [0, factor, 0] })
    .addField({ name: 'color', initialValue: axisZColor })
    .addField({ name: 'name', initialValue: 'AxisZinX' })
    .addField({ name: 'viewType', initialValue: ViewTypes.XY_PLANE })
    .addField({ name: 'inViewType', initialValue: ViewTypes.YZ_PLANE })
    .build();

const generateAxisZinY = () =>
  vtkStateBuilder
    .createBuilder()
    .addField({ name: 'point1', initialValue: [-factor, 0, 0] })
    .addField({ name: 'point2', initialValue: [factor, 0, 0] })
    .addField({ name: 'color', initialValue: axisZColor })
    .addField({ name: 'name', initialValue: 'AxisZinY' })
    .addField({ name: 'viewType', initialValue: ViewTypes.XY_PLANE })
    .addField({ name: 'inViewType', initialValue: ViewTypes.XZ_PLANE })
    .build();

export default function generateState() {
  return vtkStateBuilder
    .createBuilder()
    .addStateFromInstance({
      labels: ['AxisXinY'],
      name: 'AxisXinY',
      instance: generateAxisXinY(),
    })
    .addStateFromInstance({
      labels: ['AxisXinZ'],
      name: 'AxisXinZ',
      instance: generateAxisXinZ(),
    })
    .addStateFromInstance({
      labels: ['AxisYinX'],
      name: 'AxisYinX',
      instance: generateAxisYinX(),
    })
    .addStateFromInstance({
      labels: ['AxisYinZ'],
      name: 'AxisYinZ',
      instance: generateAxisYinZ(),
    })
    .addStateFromInstance({
      labels: ['AxisZinX'],
      name: 'AxisZinX',
      instance: generateAxisZinX(),
    })
    .addStateFromInstance({
      labels: ['AxisZinY'],
      name: 'AxisZinY',
      instance: generateAxisZinY(),
    })
    .addField({ name: 'center', initialValue: [0, 0, 0] })
    .addField({ name: 'opacity', initialValue: 1 })
    .addField({ name: 'activeLineState', initialValue: null })
    .addField({ name: 'activeRotationPointName', initialValue: '' })
    .addField({ name: 'image', initialValue: null })
    .addField({ name: 'activeViewType', initialValue: null })
    .addField({ name: 'lineThickness', initialValue: 2 })
    .addField({ name: 'sphereRadius', initialValue: 5 })
    .addField({ name: 'showCenter', initialValue: true })
    .addField({
      name: 'updateMethodName',
    })
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
    .build();
}
