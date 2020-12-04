import macro from 'vtk.js/Sources/macro';
import vtkSVGRepresentation from 'vtk.js/Sources/Widgets/SVG/SVGRepresentation';

const { createSvgElement } = vtkSVGRepresentation;

// ----------------------------------------------------------------------------
// vtkSVGLandmarkRepresentation
// ----------------------------------------------------------------------------

function vtkSVGLandmarkRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSVGLandmarkRepresentation');

  publicAPI.setDy = (val) => {
    model.dy = val;
  };

  publicAPI.getDy = () => {
    return model.dy;
  };

  publicAPI.setFontProperties = (fontProperties) => {
    model.fontProperties = fontProperties;
  };

  publicAPI.getFontProperties = () => {
    return model.fontProperties;
  };

  publicAPI.render = () => {
    const list = publicAPI.getRepresentationStates();

    let index = 0;
    const coords = list.map((state) => state.getOrigin());
    const texts = list.map((state) => {
      const ret =
        typeof state.getText !== 'undefined' ? state.getText() : `L${index}`;
      index++;
      return ret;
    });

    return publicAPI.worldPointsToPixelSpace(coords).then((pixelSpace) => {
      const points2d = pixelSpace.coords;
      const winHeight = pixelSpace.windowSize[1];

      const root = createSvgElement('g');
      for (let i = 0; i < points2d.length; i++) {
        const xy = points2d[i];
        const x = xy[0];
        const y = winHeight - xy[1];

        let circle = {};
        if (model.showCircle === true) {
          circle = createSvgElement('circle');
          Object.keys(model.circleProps || {}).forEach((prop) =>
            circle.setAttribute(prop, model.circleProps[prop])
          );
          circle.setAttribute('cx', x);
          circle.setAttribute('cy', y);
          root.appendChild(circle);
        }

        const splitText = texts[i].split('\n');
        let j = 0;
        const newlineOffset =
          model.fontProperties != null && model.fontProperties.fontSize
            ? model.fontProperties.fontSize
            : 15;
        splitText.forEach((subText) => {
          const text = createSvgElement('text');
          Object.keys(model.textProps || {}).forEach((prop) => {
            if (model.fromLineWidget === true && prop === 'dy') {
              return text.setAttribute(prop, model.dy + newlineOffset * j);
            }
            return text.setAttribute(prop, model.textProps[prop]);
          });
          text.setAttribute('x', x);
          text.setAttribute('y', y);
          if (model.fontProperties != null) {
            text.setAttribute('font-size', model.fontProperties.fontSize);
            text.setAttribute('font-family', model.fontProperties.fontFamily);
            text.setAttribute('font-weight', model.fontProperties.fontStyle);
            text.setAttribute('fill', model.fontProperties.fontColor);
          }
          text.textContent = subText;
          j++;
          root.appendChild(text);
        });
      }

      return root;
    });
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  circleProps: {
    r: 5,
    stroke: 'red',
    fill: 'red',
  },
  textProps: {
    fill: 'white',
    dx: 12,
    dy: -12,
  },
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkSVGRepresentation.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['circleProps', 'textProps', 'name']);

  model.fontProperties = null;
  if (initialValues.fromLineWidget === true) {
    // this allows for different offset values when there are multiple instances of this class
    model.dx = model.textProps.dx;
    model.dy = model.textProps.dy;
    model.fromLineWidget = true;
  } else {
    model.fromLineWidget = false;
  }

  // Object specific methods
  vtkSVGLandmarkRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkSVGLandmarkRepresentation'
);

// ----------------------------------------------------------------------------

export default { extend, newInstance };
