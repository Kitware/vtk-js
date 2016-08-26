import * as macro from '../../../macro';

// ----------------------------------------------------------------------------
// vtkRenderWindow methods
// ----------------------------------------------------------------------------

export function vtkRenderWindow(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkRenderWindow');

  // Add renderer
  publicAPI.addRenderer = renderer => {
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
  publicAPI.removeRenderer = renderer => {
    model.renderers = model.renderers.filter(r => r !== renderer);
    publicAPI.modified();
  };

  publicAPI.hasRenderer = ren => model.renderers.indexOf(ren) !== -1;

  // Add renderer
  publicAPI.addView = view => {
    if (publicAPI.hasView(view)) {
      return;
    }
    view.setRenderable(publicAPI);
    model.views.push(view);
    publicAPI.modified();
  };

  // Remove renderer
  publicAPI.removeView = view => {
    model.views = model.views.filter(r => r !== view);
    publicAPI.modified();
  };

  publicAPI.hasView = view => model.views.indexOf(view) !== -1;

  publicAPI.render = () => {
    model.views.forEach(view => view.traverseAllPasses());
  };

  publicAPI.captureImages = (format = 'image/png') => {
    publicAPI.render();
    return model.views
      .map(view => (view.captureImage ? view.captureImage(format) : undefined))
      .filter(i => !!i);
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
  macro.setGet(publicAPI, model, [
    'interactor',
    'numberOfLayers',
    'views',
  ]);
  macro.get(publicAPI, model, ['neverRendered']);
  macro.getArray(publicAPI, model, ['renderers']);
  macro.event(publicAPI, model, 'completion');

  // Object methods
  vtkRenderWindow(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
