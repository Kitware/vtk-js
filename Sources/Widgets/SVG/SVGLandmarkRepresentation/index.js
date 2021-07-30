import macro from 'vtk.js/Sources/macros';
import vtkSVGRepresentation from 'vtk.js/Sources/Widgets/SVG/SVGRepresentation';

const { createSvgElement } = vtkSVGRepresentation;

// ----------------------------------------------------------------------------
// vtkSVGLandmarkRepresentation
// ----------------------------------------------------------------------------

function vtkSVGLandmarkRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSVGLandmarkRepresentation');

  publicAPI.render = () => {
    const list = publicAPI.getRepresentationStates();

    const coords = list.map((state) => state.getOrigin());
    const texts = list.map((state, index) =>
      state.getText ? state.getText() : `L${index}`
    );

    return publicAPI.worldPointsToPixelSpace(coords).then((pixelSpace) => {
      const points2d = pixelSpace.coords;
      const winHeight = pixelSpace.windowSize[1];

      const root = createSvgElement('g');
      for (let i = 0; i < points2d.length; i++) {
        const xy = points2d[i];
        if (Number.isNaN(xy[0]) || Number.isNaN(xy[1])) {
          continue; // eslint-disable-line
        }
        const x = xy[0];
        const y = winHeight - xy[1];

        if (model.showCircle === true) {
          const circle = publicAPI.createListenableSvgElement('circle', i);
          Object.keys(model.circleProps || {}).forEach((prop) =>
            circle.setAttribute(prop, model.circleProps[prop])
          );
          circle.setAttribute('cx', x);
          circle.setAttribute('cy', y);
          root.appendChild(circle);
        }
        if (!texts[i]) {
          texts[i] = '';
        }
        const splitText = texts[i].split('\n');
        const newlineOffset =
          model.fontProperties != null && model.fontProperties.fontSize
            ? model.fontProperties.fontSize
            : 15;
        splitText.forEach((subText, j) => {
          const text = publicAPI.createListenableSvgElement('text', i);
          Object.keys(model.textProps || {}).forEach((prop) => {
            let propValue = model.textProps[prop];
            if (model.offsetText === true && prop === 'dy') {
              propValue = model.textProps.dy + newlineOffset * j;
            }
            text.setAttribute(prop, propValue);
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

function defaultValues(initialValues) {
  return {
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
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, defaultValues(initialValues));

  vtkSVGRepresentation.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, [
    'circleProps',
    'fontProperties',
    'name',
    'textProps',
  ]);

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
