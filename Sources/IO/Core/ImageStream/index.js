import macro from 'vtk.js/Sources/macros';
import DefaultProtocol from 'vtk.js/Sources/IO/Core/ImageStream/DefaultProtocol';
import ViewStream from 'vtk.js/Sources/IO/Core/ImageStream/ViewStream';

function vtkImageStream(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageStream');

  // --------------------------------------------------------------------------
  // Internal private method
  // --------------------------------------------------------------------------

  function onImage(data) {
    const message = data[0];
    if (!message || !message.image) {
      return;
    }
    for (let i = 0; i < model.viewStreams.length; i++) {
      model.viewStreams[i].processMessage(message);
    }
  }

  // --------------------------------------------------------------------------
  // PublicAPI
  // --------------------------------------------------------------------------

  publicAPI.setServerAnimationFPS = (maxFPS = 30) => {
    let changeDetected = false;
    if (model.serverAnimationFPS !== maxFPS) {
      model.serverAnimationFPS = maxFPS;
      changeDetected = true;
    }

    if (!model.protocol) {
      return Promise.resolve(true);
    }

    if (changeDetected) {
      publicAPI.modified();
    }

    return model.protocol.setServerAnimationFPS(maxFPS);
  };

  // --------------------------------------------------------------------------

  publicAPI.connect = (session, protocol = DefaultProtocol) => {
    if (model.connected || !session || !protocol) {
      return;
    }
    model.protocol = protocol(session);
    model.protocol
      .subscribeToImageStream(onImage)
      .promise // new API in wslink 1.0.5+
      .then((subscription) => {
        model.renderTopicSubscription = subscription;
        model.connected = true;
      })
      .catch((e) => {
        model.connected = false;
        console.error(e);
      });
  };

  // --------------------------------------------------------------------------

  publicAPI.disconnect = () => {
    if (model.protocol && model.connected && model.renderTopicSubscription) {
      model.protocol.unsubscribeToImageStream(model.renderTopicSubscription);
      model.renderTopicSubscription = null;
    }
    model.connected = false;
  };

  // --------------------------------------------------------------------------

  publicAPI.registerViewStream = (view) => {
    model.viewStreams.push(view);
  };

  // --------------------------------------------------------------------------

  publicAPI.unregisterViewStream = (view) => {
    model.viewStreams = model.viewStreams.filter((v) => v !== view);
  };

  // --------------------------------------------------------------------------

  publicAPI.createViewStream = (viewId = '-1', size = [400, 400]) => {
    const {
      setServerAnimationFPS,
      getServerAnimationFPS,
      unregisterViewStream,
    } = publicAPI;
    const viewStream = ViewStream.newInstance({
      protocol: model.protocol,
      unregisterViewStream,
      sharedAPI: {
        setServerAnimationFPS,
        getServerAnimationFPS,
      },
    });
    viewStream.setViewId(viewId);
    viewStream.setSize(size[0], size[1]);
    publicAPI.registerViewStream(viewStream);

    return viewStream;
  };

  // --------------------------------------------------------------------------

  publicAPI.delete = macro.chain(() => {
    while (model.viewStreams.length) {
      model.viewStreams.pop().delete();
    }
    publicAPI.disconnect();
  }, publicAPI.delete);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // protocol: null,
  viewStreams: [],
  serverAnimationFPS: -1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['serverAnimationFPS', 'protocol']);

  // Object specific methods
  vtkImageStream(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageStream');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
