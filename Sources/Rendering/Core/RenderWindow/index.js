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

  publicAPI.getSize = () => [model.width, model.height];

  // Initialize the rendering process.
  publicAPI.start = () => {
    // FIXME
  };

  // Finalize the rendering process.
  publicAPI.finalize = () => {
    // FIXME
  };

  // A termination method performed at the end of the rendering process
  // to do things like swapping buffers (if necessary) or similar actions.
  publicAPI.frame = () => {
    // FIXME
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

export const DEFAULT_VALUES = {
  renderers: [],
  views: [],
  cursor: 'pointer',
  cursorVisibility: true,
  swapBuffers: false,
  multiSamples: 0,
  interactor: null,
  neverRendered: true,
  numberOfLayers: 1,
  width: 400,
  height: 400,
  useOffScreen: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'cursor',
    'cursorVisibility',
    'swapBuffers',
    'multiSamples',
    'interactor',
    'numberOfLayers',
    'width',
    'height',
    'useOffScreen',
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
