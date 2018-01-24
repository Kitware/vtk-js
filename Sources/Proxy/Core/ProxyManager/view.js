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
      view.renderLater();
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.renderAllViews = () => {
    const allViews = publicAPI.getViews();
    for (let i = 0; i < allViews.length; i++) {
      allViews[i].renderLater();
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.setAnimationOnAllViews = (enable = false) => {
    const allViews = publicAPI.getViews();
    for (let i = 0; i < allViews.length; i++) {
      allViews[i].setAnimation(enable);
    }
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
