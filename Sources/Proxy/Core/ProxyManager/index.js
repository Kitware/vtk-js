import macro from 'vtk.js/Sources/macro';

import core from './core';
import state from './state';
import view from './view';
import properties from './properties';

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(
    model,
    {
      proxyIdMapping: {},
      proxyByGroup: {},
      proxyConfiguration: {}, // { definitions: {}, representations: { viewName: { sourceType: representationName } } }
      sv2rMapping: {}, // sv2rMapping[sourceId][viewId] = rep
      r2svMapping: {}, // r2svMapping[representationId] = { sourceId, viewId }
      collapseState: {},
      lookupTables: {},
      piecewiseFunctions: {},
      animating: false,
    },
    initialValues
  );

  // Object methods
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'proxyConfiguration',
    'activeSource',
    'activeView',
  ]);
  macro.event(publicAPI, model, 'ActiveSourceChange');
  macro.event(publicAPI, model, 'ActiveViewChange');
  macro.event(publicAPI, model, 'ProxyRegistrationChange');

  core(publicAPI, model);
  state(publicAPI, model);
  view(publicAPI, model);
  properties(publicAPI, model);

  // Add proxy API
  macro.proxy(publicAPI, model);

  model.classHierarchy.push('vtkProxyManager');
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkProxyManager');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
