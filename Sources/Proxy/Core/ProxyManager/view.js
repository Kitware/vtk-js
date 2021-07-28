import macro from 'vtk.js/Sources/macros';

export default function addViewHandlingAPI(publicAPI, model) {
  publicAPI.create3DView = (options) =>
    publicAPI.createProxy('Views', 'View3D', options);

  // --------------------------------------------------------------------------

  publicAPI.create2DView = (options) =>
    publicAPI.createProxy('Views', 'View2D', options);

  // --------------------------------------------------------------------------

  publicAPI.render = (view) => {
    const viewToRender = view || publicAPI.getActiveView();
    if (viewToRender) {
      viewToRender.renderLater();
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.renderAllViews = (blocking = false) => {
    const allViews = publicAPI.getViews();
    for (let i = 0; i < allViews.length; i++) {
      allViews[i].render(blocking);
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.setAnimationOnAllViews = (enable = false) => {
    const allViews = publicAPI
      .getViews()
      .filter((v) => !enable || v.getContainer());
    for (let i = 0; i < allViews.length; i++) {
      allViews[i].setAnimation(enable, publicAPI);
    }
  };

  // --------------------------------------------------------------------------

  function clearAnimations() {
    model.animating = false;
    const allViews = publicAPI.getViews();
    for (let i = 0; i < allViews.length; i++) {
      allViews[i].setAnimation(false, publicAPI);
    }
  }

  // --------------------------------------------------------------------------

  publicAPI.autoAnimateViews = (debouceTimout = 250) => {
    if (!model.animating) {
      model.animating = true;
      const allViews = publicAPI.getViews().filter((v) => v.getContainer());
      for (let i = 0; i < allViews.length; i++) {
        allViews[i].setAnimation(true, publicAPI);
      }
      model.clearAnimations = macro.debounce(clearAnimations, debouceTimout);
    }
    model.clearAnimations();
  };

  // --------------------------------------------------------------------------

  publicAPI.resizeAllViews = () => {
    const allViews = publicAPI.getViews();
    for (let i = 0; i < allViews.length; i++) {
      allViews[i].resize();
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.resetCamera = (view) => {
    const viewToRender = view || publicAPI.getActiveView();
    if (viewToRender && viewToRender.resetCamera) {
      viewToRender.resetCamera();
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.createRepresentationInAllViews = (source) => {
    const allViews = publicAPI.getViews();
    for (let i = 0; i < allViews.length; i++) {
      publicAPI.getRepresentation(source, allViews[i]);
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.resetCameraInAllViews = () => {
    const allViews = publicAPI.getViews();
    for (let i = 0; i < allViews.length; i++) {
      allViews[i].resetCamera();
    }
  };
}
