import macro from 'vtk.js/Sources/macros';
import vtkSVGRepresentation from 'vtk.js/Sources/Widgets/SVG/SVGRepresentation';

import {
  VerticalTextAlignment,
  fontSizeToPixels,
} from 'vtk.js/Sources/Widgets/SVG/SVGLandmarkRepresentation/Constants';

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
        const fontSize = fontSizeToPixels(model.fontProperties);
        splitText.forEach((subText, j) => {
          const text = publicAPI.createListenableSvgElement('text', i);
          Object.keys(model.textProps || {}).forEach((prop) => {
            text.setAttribute(prop, model.textProps[prop]);
          });
          text.setAttribute('x', x);
          text.setAttribute('y', y);
          // Vertical offset (dy) calculation based on VerticalTextAlignment
          let dy = model.textProps.dy ? model.textProps.dy : 0;
          switch (model.textProps.verticalAlign) {
            case VerticalTextAlignment.MIDDLE:
              dy -= fontSize * (0.5 * splitText.length - j - 1);
              break;
            case VerticalTextAlignment.TOP:
              dy += fontSize * (j + 1);
              break;
            case VerticalTextAlignment.BOTTOM:
            default:
              dy -= fontSize * (splitText.length - j - 1);
              break;
          }
          text.setAttribute('dy', dy);
          if (model.fontProperties != null) {
            text.setAttribute('font-size', fontSize);
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

/**
 * textProps can contain any "svg" attribute (e.g. text-anchor, text-align,
 * alignment-baseline...)
 * @param {*} initialValues
 * @returns
 */
function defaultValues(initialValues) {
  return {
    ...initialValues,
    circleProps: {
      r: 5,
      stroke: 'red',
      fill: 'red',
      ...initialValues.circleProps,
    },
    textProps: {
      fill: 'white',
      ...initialValues.textProps,
    },
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkSVGRepresentation.extend(publicAPI, model, defaultValues(initialValues));

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
