import vtk from 'vtk.js/Sources/vtk';

function getProperties(proxy) {
  const props = {};
  proxy.listPropertyNames().forEach((name) => {
    props[name] = proxy.getPropertyByName(name).value;
  });
  return props;
}

// ----------------------------------------------------------------------------
// Proxy State Handling
// ----------------------------------------------------------------------------

export default function addStateAPI(publicAPI, model) {
  publicAPI.loadState = (state) => {
    const proxyMapping = {};
    const cameras = {};

    state.sources.forEach(({ id, group, name, props }) => {
      const proxy = publicAPI.createProxy(group, name);
      const dataset = vtk(props.dataset);
      proxy.setName(props.name);
      proxy.setInputData(dataset, props.type);
      proxyMapping[id] = proxy;
    });

    const views = publicAPI.getViews();
    state.views.forEach(({ id, group, name, props, camera }) => {
      let proxy = null;
      if (state.options.recycleViews) {
        proxy = views.find(
          (v) =>
            v.getProxyGroup() === group &&
            v.getProxyName() === name &&
            v.getName() === props.name
        );
      }
      if (!proxy) {
        proxy = publicAPI.createProxy(group, name);
      }

      proxy.set(props, true);
      proxyMapping[id] = proxy;
      cameras[id] = camera;
    });

    Object.keys(state.fields).forEach((fieldName) => {
      const { lookupTable, piecewiseFunction } = state.fields[fieldName];
      publicAPI.getLookupTable(fieldName, lookupTable);
      publicAPI.getPiecewiseFunction(fieldName, piecewiseFunction);
    });

    state.representations.forEach(({ source, view, props }) => {
      const proxy = publicAPI.getRepresentation(
        proxyMapping[source],
        proxyMapping[view]
      );
      proxy.set(props, true);
      proxyMapping[view].resetOrientation();
      setTimeout(() => {
        proxyMapping[view].getRenderWindow().render();
        proxyMapping[view].getCamera().set(cameras[view]);
        proxyMapping[view].renderLater();
      }, 1000);
    });
    return state.userData;
  };

  publicAPI.saveState = (options = {}, userData = {}) => {
    const sources = publicAPI.getSources();
    // const representations = publicAPI.getRepresentations();
    const views = publicAPI.getViews();

    const fieldNames = new Set();
    const state = {
      userData,
      options,
      sources: [],
      views: [],
      representations: [],
      fields: {},
    };
    sources.forEach((source) => {
      state.sources.push({
        id: source.getProxyId(),
        group: source.getProxyGroup(),
        name: source.getProxyName(),
        props: {
          name: source.getName(),
          type: source.getType(),
          dataset: source.getDataset().getState(),
        },
      });
    });
    views.forEach((view) => {
      const camera = view.getCamera().get('position', 'viewUp', 'focalPoint');
      state.views.push({
        id: view.getProxyId(),
        group: view.getProxyGroup(),
        name: view.getProxyName(),
        props: Object.assign(
          getProperties(view),
          view.get('axis', 'orientation', 'viewUp')
        ),
        camera,
      });

      // Loop over view representations
      const representations = view.getRepresentations();
      representations.forEach((representation) => {
        state.representations.push({
          source: representation.getInput().getProxyId(),
          view: view.getProxyId(),
          props: getProperties(representation),
        });
        fieldNames.add(representation.getColorBy()[0]);
      });
    });

    fieldNames.forEach((fieldName) => {
      state.fields[fieldName] = {
        lookupTable: publicAPI
          .getLookupTable(fieldName)
          .get(
            'mode',
            'presetName',
            'rgbPoints',
            'hsvPoints',
            'nodes',
            'arrayName',
            'arrayLocation',
            'dataRange'
          ),
        piecewiseFunction: publicAPI
          .getPiecewiseFunction(fieldName)
          .get(
            'mode',
            'gaussians',
            'points',
            'nodes',
            'arrayName',
            'arrayLocation',
            'dataRange'
          ),
      };
    });

    return state;
  };
}
