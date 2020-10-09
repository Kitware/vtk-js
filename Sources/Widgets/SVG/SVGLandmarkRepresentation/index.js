import macro from 'vtk.js/Sources/macro';
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

    const coords = [];
    const texts = [];
    for (let i = 0; i < list.length; i++) {
      coords.push(list[i].getOrigin());
      if (typeof list[i].getText !== 'undefined') texts.push(list[i].getText());
      else {
        texts.push(false);
      }
    }

    return publicAPI.worldPointsToPixelSpace(coords).then((pixelSpace) => {
      const points2d = pixelSpace.coords;
      const winHeight = pixelSpace.windowSize[1];

      const root = createSvgElement('g');

      for (let i = 0; i < points2d.length; i++) {
        const xy = points2d[i];
        const x = xy[0];
        const y = winHeight - xy[1];

        let circle = {};
        if (model.visibleCircle === true) {
          circle = createSvgElement('circle');
          Object.keys(model.circleProps || {}).forEach((prop) =>
            circle.setAttribute(prop, model.circleProps[prop])
          );
          circle.setAttribute('cx', x);
          circle.setAttribute('cy', y);
        }

        const text = createSvgElement('text');
        Object.keys(model.textProps || {}).forEach((prop) =>
          text.setAttribute(prop, model.textProps[prop])
        );
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        text.textContent = texts[i] !== false ? texts[i] : `L${i}`;

        if (model.visibleCircle) root.appendChild(circle);
        root.appendChild(text);
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
