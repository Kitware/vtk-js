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

    if (!list.length) {
      return createSvgElement('g');
    }

    const coords = [];
    const texts = [];
    list.forEach((state, index) => {
      if (
        state.getOrigin &&
        state.getOrigin() &&
        state.getVisible &&
        state.getVisible()
      ) {
        coords.push(state.getOrigin());
        texts.push(state.getText ? state.getText() : `L${index}`);
      }
    });

    const state = list[0];
    const isActive = state.getActive();

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

        if (model.circleProps && model.circleProps.visible) {
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
          let dy = model.textProps?.dy || 0;
          switch (model.textProps?.verticalAlign) {
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
          text.setAttribute('font-size', fontSize);

          if (model.fontProperties && model.fontProperties.fontFamily) {
            text.setAttribute('font-family', model.fontProperties.fontFamily);
          } else if (
            isActive &&
            model.strokeFontProperties &&
            model.strokeFontProperties.fontFamily
          ) {
            text.setAttribute(
              'font-family',
              model.strokeFontProperties.fontFamily
            );
          }

          if (model.fontProperties && model.fontProperties.fontStyle) {
            text.setAttribute('font-weight', model.fontProperties.fontStyle);
          } else if (
            isActive &&
            model.strokeFontProperties &&
            model.strokeFontProperties.fontStyle
          ) {
            text.setAttribute(
              'font-weight',
              model.strokeFontProperties.fontStyle
            );
          }

          if (model.fontProperties && model.fontProperties.fontColor) {
            text.setAttribute('fill', model.fontProperties.fontColor);
          } else if (
            isActive &&
            model.strokeFontProperties &&
            model.strokeFontProperties.fontColor
          ) {
            text.setAttribute('fill', model.strokeFontProperties.fontColor);
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
 */
function defaultValues(initialValues) {
  return {
    ...initialValues,
    circleProps: {
      visible: false,
      r: 5,
      stroke: 'red',
      fill: 'red',
      ...initialValues.circleProps,
    },
    fontProperties: {
      fontColor: 'white',
      ...initialValues.fontProperties,
    },
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkSVGRepresentation.extend(publicAPI, model, defaultValues(initialValues));

  macro.setGet(publicAPI, model, [
    'circleProps',
    'fontProperties',
    'strokeFontProperties',
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
