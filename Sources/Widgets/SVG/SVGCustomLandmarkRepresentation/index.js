import macro from 'vtk.js/Sources/macro';
import vtkSVGRepresentation from 'vtk.js/Sources/Widgets/SVG/SVGRepresentation';

const { createSvgElement } = vtkSVGRepresentation;

// ----------------------------------------------------------------------------
// vtkSVGCustomLandmarkRepresentation
// ----------------------------------------------------------------------------

function vtkSVGCustomLandmarkRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSVGCustomLandmarkRepresentation');

  publicAPI.render = () => {
    const list = publicAPI.getRepresentationStates();

    const coords = [];
    for (let i = 0; i < list.length; i++) {
      coords.push(list[i].getOrigin());
    }

    return publicAPI.worldPointsToPixelSpace(coords).then((pixelSpace) => {
      const points2d = pixelSpace.coords;
      const winHeight = pixelSpace.windowSize[1];

      const root = createSvgElement('g');

      for (let i = 0; i < points2d.length; i++) {
        const xy = points2d[i];
        const x = xy[0];
        const y = winHeight - xy[1];

        const text = createSvgElement('text');
        Object.keys(model.textProps || {}).forEach((prop) =>
          text.setAttribute(prop, model.textProps[prop])
        );
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        text.textContent = publicAPI
          .getInputData()
          .getAllNestedStates()[3]
          .getText();
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

  macro.setGet(publicAPI, model, ['textProps', 'coords']);

  // Object specific methods
  vtkSVGCustomLandmarkRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkSVGCustomLandmarkRepresentation'
);

// ----------------------------------------------------------------------------

export default { extend, newInstance };
