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
  publicAPI.loadState = (state, options = {}) =>
    new Promise((resolve, reject) => {
      const proxyMapping = {};
      const $oldToNewIdMapping = {};
      const cameras = {};
      const datasetHandler = options.datasetHandler || vtk;
      const sourcePromises = [];

      state.sources.forEach(({ id, group, name, props }) => {
        sourcePromises.push(
          Promise.resolve(datasetHandler(props.dataset)).then((dataset) => {
            const proxy = publicAPI.createProxy(group, name);
            proxy.setName(props.name);
            proxy.setInputData(dataset, props.type);
            proxyMapping[id] = proxy;
            return proxy;
          })
        );
      });

      Promise.all(sourcePromises).then(() => {
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
            proxyMapping[view].getRenderer().updateLightsGeometryToFollowCamera();
            proxyMapping[view].renderLater();
          }, 0);
        });

        // Create id mapping
        Object.keys(proxyMapping).forEach((originalId) => {
          const newId = proxyMapping[originalId].getProxyId();
          $oldToNewIdMapping[originalId] = newId;
        });

        resolve(Object.assign({}, state.userData, { $oldToNewIdMapping }));
      });
    });

  publicAPI.saveState = (options = {}, userData = {}) =>
    new Promise((resolve, reject) => {
      const sources = publicAPI.getSources();
      // const representations = publicAPI.getRepresentations();
      const views = publicAPI.getViews();

      // Extract handlers
      const datasetHandler = options.datasetHandler || ((d) => d.getState());
      delete options.datasetHandler;
      const datasets = [];

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
        const dataset = Promise.resolve(
          datasetHandler(source.getDataset(), source)
        );
        datasets.push(dataset);
        state.sources.push({
          id: source.getProxyId(),
          group: source.getProxyGroup(),
          name: source.getProxyName(),
          props: {
            name: source.getName(),
            type: source.getType(),
            dataset,
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

      Promise.all(datasets).then(() => {
        // Patch datasets in state to the result of the promises
        for (let i = 0; i < state.sources.length; i++) {
          state.sources[i].props.dataset.then((value) => {
            state.sources[i].props.dataset = value;
          });
        }

        // provide valide state
        resolve(state);
      });
    });
}
