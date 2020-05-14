import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// vtkRenderWindow methods
// ----------------------------------------------------------------------------

function vtkRenderWindow(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkRenderWindow');

  // Add renderer
  publicAPI.addRenderer = (renderer) => {
    if (publicAPI.hasRenderer(renderer)) {
      return;
    }
    renderer.setRenderWindow(publicAPI);
    model.renderers.push(renderer);

    // for (this->Renderers->InitTraversal(rsit);
    //      (aren = this->Renderers->GetNextRenderer(rsit)); )
    //   {
    //   aren->SetAllocatedRenderTime
    //     (1.0/(this->DesiredUpdateRate*this->Renderers->GetNumberOfItems()));
    //   }

    publicAPI.modified();
  };

  // Remove renderer
  publicAPI.removeRenderer = (renderer) => {
    model.renderers = model.renderers.filter((r) => r !== renderer);
    publicAPI.modified();
  };

  publicAPI.hasRenderer = (ren) => model.renderers.indexOf(ren) !== -1;

  // Add renderer
  publicAPI.addView = (view) => {
    if (publicAPI.hasView(view)) {
      return;
    }
    view.setRenderable(publicAPI);
    model.views.push(view);
    publicAPI.modified();
  };

  // Remove renderer
  publicAPI.removeView = (view) => {
    model.views = model.views.filter((r) => r !== view);
    publicAPI.modified();
  };

  publicAPI.hasView = (view) => model.views.indexOf(view) !== -1;

  publicAPI.render = () => {
    if (model.interactor) {
      model.interactor.render();
    } else {
      model.views.forEach((view) => view.traverseAllPasses());
    }
  };

  publicAPI.getStatistics = () => {
    const results = { propCount: 0, invisiblePropCount: 0 };
    model.renderers.forEach((ren) => {
      const props = ren.getViewProps();
      props.forEach((prop) => {
        if (prop.getVisibility()) {
          results.propCount += 1;
          const mpr = prop.getMapper && prop.getMapper();
          if (mpr && mpr.getPrimitiveCount) {
            const pcount = mpr.getPrimitiveCount();
            Object.keys(pcount).forEach((keyName) => {
              if (!results[keyName]) {
                results[keyName] = 0;
              }
              results[keyName] += pcount[keyName];
            });
          }
        } else {
          results.invisiblePropCount += 1;
        }
      });
    });
    results.str = Object.keys(results)
      .map((keyName) => `${keyName}: ${results[keyName]}`)
      .join('\n');

    return results;
  };

  publicAPI.captureImages = (format = 'image/png') => {
    macro.setImmediate(publicAPI.render);
    return model.views
      .map(
        (view) =>
          view.captureNextImage ? view.captureNextImage(format) : undefined
      )
      .filter((i) => !!i);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

export const DEFAULT_VALUES = {
  renderers: [],
  views: [],
  interactor: null,
  neverRendered: true,
  numberOfLayers: 1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['interactor', 'numberOfLayers', 'views']);
  macro.get(publicAPI, model, ['neverRendered']);
  macro.getArray(publicAPI, model, ['renderers']);
  macro.event(publicAPI, model, 'completion');

  // Object methods
  vtkRenderWindow(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkRenderWindow');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
