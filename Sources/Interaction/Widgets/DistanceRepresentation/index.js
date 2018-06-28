import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkLineRepresentation from 'vtk.js/Sources/Interaction/Widgets/LineRepresentation';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPixelSpaceCallbackMapper from 'vtk.js/Sources/Rendering/Core/PixelSpaceCallbackMapper';

// ----------------------------------------------------------------------------
// vtkDistanceRepresentation methods
// ----------------------------------------------------------------------------

function vtkDistanceRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkDistanceRepresentation');

  const superClass = Object.assign({}, publicAPI);

  publicAPI.displayLabel = (displayPoint1, displayPoint2) => {
    if (model.container) {
      // Clear label
      model.labelContext.clearRect(
        0,
        0,
        model.labelCanvas.width,
        model.labelCanvas.height
      );

      if (model.labelVisibility) {
        // Compute distance
        const distance = Math.sqrt(
          vtkMath.distance2BetweenPoints(
            publicAPI.getPoint1WorldPosition(),
            publicAPI.getPoint2WorldPosition()
          )
        ).toFixed(model.numberOfDecimals);

        model.labelCanvas.width = Math.round(
          model.labelContext.measureText(distance).width
        );
        model.labelCanvas.height = Math.round(model.labelStyle.fontSize);

        // Update label style
        model.labelContext.strokeStyle = model.labelStyle.strokeColor;
        model.labelContext.lineWidth = model.labelStyle.strokeSize;
        model.labelContext.fillStyle = model.labelStyle.fontColor;
        model.labelContext.font = `${model.labelStyle.fontStyle} ${
          model.labelStyle.fontSize
        }px ${model.labelStyle.fontFamily}`;

        // Compute label position
        const x =
          displayPoint1[0] +
          (displayPoint2[0] - displayPoint1[0]) * model.labelPosition;
        const y =
          displayPoint1[1] +
          (displayPoint2[1] - displayPoint1[1]) * model.labelPosition +
          publicAPI.getLineProperty().getLineWidth();

        model.labelCanvas.style.left = `${x}px`;
        model.labelCanvas.style.bottom = `${y}px`;

        // Render label
        model.labelContext.strokeText(distance, 0, model.labelCanvas.height);
        model.labelContext.fillText(distance, 0, model.labelCanvas.height);
      }
    }
  };

  publicAPI.setContainer = (container) => {
    if (model.container && model.container !== container) {
      model.container.removeChild(model.labelCanvas);
    }

    if (model.container !== container) {
      model.container = container;

      if (model.container) {
        model.container.appendChild(model.labelCanvas);
      }

      publicAPI.modified();
    }
  };

  publicAPI.setLabelVisibility = (visibility) => {
    model.labelCanvas.style.visibility = visibility ? 'visible' : 'hidden';

    publicAPI.modified();
  };

  publicAPI.setLabelStyle = (labelStyle) => {
    model.labelStyle = Object.assign({}, model.labelStyle, labelStyle);

    publicAPI.modified();
  };

  publicAPI.getActors = () => {
    const actors = superClass.getActors();
    actors.push(model.labelActor);
    return actors;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  labelVisibility: true,
  labelStyle: {
    fontColor: 'white',
    fontStyle: 'normal',
    fontSize: '15',
    fontFamily: 'Arial',
    strokeColor: 'black',
    strokeSize: '1',
  },
  numberOfDecimals: 2,
  labelPosition: 0.5,
  container: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkLineRepresentation.extend(publicAPI, model, initialValues);

  // private variable
  model.labelCanvas = document.createElement('canvas');
  model.labelCanvas.style.position = 'absolute';
  model.labelContext = model.labelCanvas.getContext('2d');

  model.labelMapper = vtkPixelSpaceCallbackMapper.newInstance();
  model.labelMapper.setInputConnection(model.lineSource.getOutputPort());
  model.labelMapper.setCallback((coordList) => {
    publicAPI.displayLabel(coordList[0], coordList[coordList.length - 1]);
  });

  model.labelActor = vtkActor.newInstance();
  model.labelActor.setMapper(model.labelMapper);

  macro.setGet(publicAPI, model, ['numberOfDecimals', 'labelPosition']);

  macro.get(publicAPI, model, ['labelVisibility', 'container']);

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
