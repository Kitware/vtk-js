/* eslint-disable arrow-body-style */
import otherStaticMethods from 'vtk.js/Sources/Rendering/Core/Mapper/Static';
import macro from 'vtk.js/Sources/macros';

function addCoincidentTopologyMethods(publicAPI, model, nameList) {
  nameList.forEach((item) => {
    publicAPI[`get${item.method}`] = () => model[item.key];
    publicAPI[`set${item.method}`] = (factor, offset) => {
      model[item.key] = { factor, offset };
    };
  });
}

export const CATEGORIES = ['Polygon', 'Line', 'Point'];

// CoincidentTopology static methods ------------------------------------------

const staticOffsetModel = {
  Polygon: { factor: 2, offset: 0 },
  Line: { factor: 1, offset: -1 },
  Point: { factor: 0, offset: -2 },
};
const staticOffsetAPI = {};

addCoincidentTopologyMethods(
  staticOffsetAPI,
  staticOffsetModel,
  CATEGORIES.map((key) => ({
    key,
    method: `ResolveCoincidentTopology${key}OffsetParameters`,
  }))
);

function implementCoincidentTopologyMethods(publicAPI, model) {
  if (model.resolveCoincidentTopology === undefined) {
    model.resolveCoincidentTopology = false;
  }

  macro.setGet(publicAPI, model, ['resolveCoincidentTopology']);

  // Relative methods
  model.topologyOffset = {
    Polygon: { factor: 0, offset: 0 },
    Line: { factor: 0, offset: 0 },
    Point: { factor: 0, offset: 0 },
  };

  // Add Static methods to our instance
  Object.keys(otherStaticMethods).forEach((methodName) => {
    publicAPI[methodName] = otherStaticMethods[methodName];
  });
  Object.keys(staticOffsetAPI).forEach((methodName) => {
    publicAPI[methodName] = staticOffsetAPI[methodName];
  });

  addCoincidentTopologyMethods(
    publicAPI,
    model.topologyOffset,
    CATEGORIES.map((key) => ({
      key,
      method: `RelativeCoincidentTopology${key}OffsetParameters`,
    }))
  );

  publicAPI.getCoincidentTopologyPolygonOffsetParameters = () => {
    const globalValue =
      staticOffsetAPI.getResolveCoincidentTopologyPolygonOffsetParameters();
    const localValue =
      publicAPI.getRelativeCoincidentTopologyPolygonOffsetParameters();
    return {
      factor: globalValue.factor + localValue.factor,
      offset: globalValue.offset + localValue.offset,
    };
  };

  publicAPI.getCoincidentTopologyLineOffsetParameters = () => {
    const globalValue =
      staticOffsetAPI.getResolveCoincidentTopologyLineOffsetParameters();
    const localValue =
      publicAPI.getRelativeCoincidentTopologyLineOffsetParameters();
    return {
      factor: globalValue.factor + localValue.factor,
      offset: globalValue.offset + localValue.offset,
    };
  };

  publicAPI.getCoincidentTopologyPointOffsetParameter = () => {
    const globalValue =
      staticOffsetAPI.getResolveCoincidentTopologyPointOffsetParameters();
    const localValue =
      publicAPI.getRelativeCoincidentTopologyPointOffsetParameters();
    return {
      factor: globalValue.factor + localValue.factor,
      offset: globalValue.offset + localValue.offset,
    };
  };
}

export default {
  implementCoincidentTopologyMethods,
  staticOffsetAPI,
  otherStaticMethods,
  CATEGORIES,
};
