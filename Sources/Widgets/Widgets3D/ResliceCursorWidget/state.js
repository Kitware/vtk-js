import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';
import { ScrollingMethods } from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/Constants';

const factor = 1;
const rotationFactor = 1;
const axisXColor = [1, 0, 0];
const axisYColor = [0, 1, 0];
const axisZColor = [0, 0, 1];

const generateAxisXinY = () =>
  vtkStateBuilder
    .createBuilder()
    .addField({ name: 'point1', initialValue: [0, 0, -factor] })
    .addField({ name: 'point2', initialValue: [0, 0, factor] })
    .addField({ name: 'rotationPoint1', initialValue: [0, 0, -rotationFactor] })
    .addField({ name: 'rotationPoint2', initialValue: [0, 0, rotationFactor] })
    .addField({ name: 'color', initialValue: axisXColor })
    .addField({ name: 'name', initialValue: 'AxisXinY' })
    .addField({ name: 'planeName', initialValue: 'X' })
    .build();

const generateAxisXinZ = () =>
  vtkStateBuilder
    .createBuilder()
    .addField({ name: 'point1', initialValue: [0, -factor, 0] })
    .addField({ name: 'point2', initialValue: [0, factor, 0] })
    .addField({ name: 'rotationPoint1', initialValue: [0, -rotationFactor, 0] })
    .addField({ name: 'rotationPoint2', initialValue: [0, rotationFactor, 0] })
    .addField({ name: 'color', initialValue: axisXColor })
    .addField({ name: 'name', initialValue: 'AxisXinZ' })
    .addField({ name: 'planeName', initialValue: 'X' })
    .build();

const generateAxisYinX = () =>
  vtkStateBuilder
    .createBuilder()
    .addField({ name: 'point1', initialValue: [0, 0, -factor] })
    .addField({ name: 'point2', initialValue: [0, 0, factor] })
    .addField({ name: 'rotationPoint1', initialValue: [0, 0, -rotationFactor] })
    .addField({ name: 'rotationPoint2', initialValue: [0, 0, rotationFactor] })
    .addField({ name: 'color', initialValue: axisYColor })
    .addField({ name: 'name', initialValue: 'AxisYinX' })
    .addField({ name: 'planeName', initialValue: 'Y' })
    .build();

const generateAxisYinZ = () =>
  vtkStateBuilder
    .createBuilder()
    .addField({ name: 'point1', initialValue: [-factor, 0, 0] })
    .addField({ name: 'point2', initialValue: [factor, 0, 0] })
    .addField({ name: 'rotationPoint1', initialValue: [-rotationFactor, 0, 0] })
    .addField({ name: 'rotationPoint2', initialValue: [rotationFactor, 0, 0] })
    .addField({ name: 'color', initialValue: axisYColor })
    .addField({ name: 'name', initialValue: 'AxisYinZ' })
    .addField({ name: 'planeName', initialValue: 'Y' })
    .build();

const generateAxisZinX = () =>
  vtkStateBuilder
    .createBuilder()
    .addField({ name: 'point1', initialValue: [0, -factor, 0] })
    .addField({ name: 'point2', initialValue: [0, factor, 0] })
    .addField({ name: 'rotationPoint1', initialValue: [0, -rotationFactor, 0] })
    .addField({ name: 'rotationPoint2', initialValue: [0, rotationFactor, 0] })
    .addField({ name: 'color', initialValue: axisZColor })
    .addField({ name: 'name', initialValue: 'AxisZinX' })
    .addField({ name: 'planeName', initialValue: 'Z' })
    .build();

const generateAxisZinY = () =>
  vtkStateBuilder
    .createBuilder()
    .addField({ name: 'point1', initialValue: [-factor, 0, 0] })
    .addField({ name: 'point2', initialValue: [factor, 0, 0] })
    .addField({ name: 'rotationPoint1', initialValue: [-rotationFactor, 0, 0] })
    .addField({ name: 'rotationPoint2', initialValue: [rotationFactor, 0, 0] })
    .addField({ name: 'color', initialValue: axisZColor })
    .addField({ name: 'name', initialValue: 'AxisZinY' })
    .addField({ name: 'planeName', initialValue: 'Z' })
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
    .addField({ name: 'activeRotationPointName', initialValue: null })
    .addField({ name: 'image', initialValue: null })
    .addField({ name: 'activeViewName', initialValue: '' })
    .addField({ name: 'lineThickness', initialValue: 2 })
    .addField({ name: 'sphereRadius', initialValue: 5 })
    .addField({ name: 'showCenter', initialValue: true })
    .addField({
      name: 'updateMethodName',
    })
    .addField({ name: 'XPlaneNormal', initialValue: [1, 0, 0] })
    .addField({ name: 'YPlaneNormal', initialValue: [0, -1, 0] })
    .addField({ name: 'ZPlaneNormal', initialValue: [0, 0, -1] })
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
