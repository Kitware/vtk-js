import macro from 'vtk.js/Sources/macros';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkPixelSpaceCallbackMapper from 'vtk.js/Sources/Rendering/Core/PixelSpaceCallbackMapper';
import vtkWidgetRepresentation from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation';

import { Behavior } from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation/Constants';
import { RenderingTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

const SVG_XMLNS = 'http://www.w3.org/2000/svg';

// ----------------------------------------------------------------------------

function createSvgElement(tag) {
  return {
    name: tag,
    attrs: {},
    eventListeners: {},
    // implies no children if set
    textContent: null,
    children: [],
    setAttribute(attr, val) {
      this.attrs[attr] = val;
    },
    removeAttribute(attr) {
      delete this.attrs[attr];
    },
    appendChild(n) {
      this.children.push(n);
    },
    addEventListeners(event, callback) {
      this.eventListeners[event] = callback;
    },
  };
}

// ----------------------------------------------------------------------------

function createSvgDomElement(tag) {
  return document.createElementNS(SVG_XMLNS, tag);
}

// ----------------------------------------------------------------------------

function defer() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    resolve,
    reject,
  };
}

// ----------------------------------------------------------------------------
// vtkSVGRepresentation
// ----------------------------------------------------------------------------

function vtkSVGRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSVGRepresentation');

  let deferred = null;

  model.psActor = vtkActor.newInstance({
    pickable: false,
    _parentProp: publicAPI,
  });
  model.psMapper = vtkPixelSpaceCallbackMapper.newInstance();
  model.points = vtkPolyData.newInstance();

  model.psMapper.setInputData(model.points);
  model.psActor.setMapper(model.psMapper);

  model.psMapper.setCallback((...args) => {
    if (deferred) {
      const d = deferred;
      deferred = null;

      d.resolve({
        coords: args[0],
        camera: args[1],
        aspect: args[2],
        depthValues: args[3],
        windowSize: args[4],
      });
    }
  });

  publicAPI.addActor(model.psActor);

  // --------------------------------------------------------------------------

  publicAPI.worldPointsToPixelSpace = (points3d) => {
    const pts = new Float32Array(points3d.length * 3);
    for (let i = 0; i < points3d.length; i++) {
      pts[i * 3 + 0] = points3d[i][0];
      pts[i * 3 + 1] = points3d[i][1];
      pts[i * 3 + 2] = points3d[i][2];
    }
    model.points.getPoints().setData(pts);
    model.points.modified();

    deferred = defer();
    return deferred.promise;
  };

  publicAPI.createListenableSvgElement = (tag, id) => {
    const element = createSvgElement(tag);
    if (model.pickable) {
      element.addEventListeners('mouseenter', () => {
        publicAPI.setHover(id);
      });
      element.addEventListeners('mouseleave', () => {
        if (publicAPI.getHover() === id) {
          publicAPI.setHover(null);
        }
      });
    }
    return element;
  };

  // --------------------------------------------------------------------------

  publicAPI.updateActorVisibility = (
    renderingType = RenderingTypes.FRONT_BUFFER,
    ctxVisible = true,
    handleVisible = true
  ) => {
    if (model.behavior === Behavior.CONTEXT) {
      publicAPI.setVisibility(ctxVisible);
    } else if (model.behavior === Behavior.HANDLE) {
      publicAPI.setVisibility(handleVisible);
    }
  };

  // --------------------------------------------------------------------------

  // Subclasses must implement this method
  publicAPI.render = () => {
    throw new Error('Not implemented');
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

/**
 * 'hover' is not null when a pickable SVG element is mouse hovered.
 */
const DEFAULT_VALUES = {
  visibility: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Extend methods
  vtkWidgetRepresentation.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['visibility', 'hover']);

  // Object specific methods
  vtkSVGRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend, createSvgElement, createSvgDomElement };
