import macro from 'vtk.js/Sources/macro';
import vtkLabelRepresentation from 'vtk.js/Sources/Interaction/Widgets/LabelRepresentation';
import vtkLineRepresentation from 'vtk.js/Sources/Interaction/Widgets/LineRepresentation';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';

// ----------------------------------------------------------------------------
// vtkDistanceRepresentation methods
// ----------------------------------------------------------------------------

function vtkDistanceRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkDistanceRepresentation');

  const superClass = Object.assign({}, publicAPI);

  publicAPI.setRenderer = (renderer) => {
    model.labelRepresentation.setRenderer(renderer);

    superClass.setRenderer(renderer);

    publicAPI.modified();
  };

  publicAPI.getContainer = () => model.labelRepresentation.getContainer();

  publicAPI.setContainer = (container) => {
    model.labelRepresentation.setContainer(container);

    publicAPI.modified();
  };

  publicAPI.getLabelStyle = () => model.labelRepresentation.getLabelStyle();

  publicAPI.setLabelStyle = (labelStyle) => {
    model.labelRepresentation.setLabelStyle(labelStyle);

    publicAPI.modified();
  };

  publicAPI.getActors = () => {
    let actors = superClass.getActors();

    actors = [...actors, ...model.labelRepresentation.getActors()];

    return actors;
  };

  publicAPI.getDistance = () =>
    Math.sqrt(
      vtkMath.distance2BetweenPoints(
        publicAPI.getPoint1WorldPosition(),
        publicAPI.getPoint2WorldPosition()
      )
    ).toFixed(model.numberOfDecimals);

  publicAPI.setPoint1WorldPosition = (pos) => {
    superClass.setPoint1WorldPosition(pos);

    publicAPI.updateLabelRepresentation();
    publicAPI.modified();
  };

  publicAPI.setPoint2WorldPosition = (pos) => {
    superClass.setPoint2WorldPosition(pos);

    publicAPI.updateLabelRepresentation();
    publicAPI.modified();
  };

  publicAPI.updateLabelRepresentation = () => {
    model.labelRepresentation.setLabelText(publicAPI.getDistance());

    const p1Position = model.point1Representation.getWorldPosition();
    const p2Position = model.point2Representation.getWorldPosition();

    const coord = [];

    for (let i = 0; i < 3; i++) {
      coord[i] =
        p1Position[i] +
        (p2Position[i] - p1Position[i]) * model.labelPositionInLine;
    }

    model.labelRepresentation.setWorldPosition(coord);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  labelStyle: {
    fontColor: 'white',
    fontStyle: 'normal',
    fontSize: '15',
    fontFamily: 'Arial',
    strokeColor: 'black',
    strokeSize: '1',
  },
  numberOfDecimals: 2,
  labelPositionInLine: 0.5,
  container: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkLineRepresentation.extend(publicAPI, model, initialValues);

  model.labelRepresentation = vtkLabelRepresentation.newInstance();

  macro.setGet(publicAPI, model, ['numberOfDecimals', 'labelPosition']);
  macro.get(publicAPI, model, ['labelRepresentation']);

  // Object methods
  vtkDistanceRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkDistanceRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
