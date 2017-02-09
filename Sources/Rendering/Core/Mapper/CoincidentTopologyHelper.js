export function addCoincidentTopologyMethods(publicAPI, model, nameList) {
  nameList.forEach((item) => {
    publicAPI[`get${item.method}`] = () => model[item.key];
    publicAPI[`set${item.method}`] = (factor, unit) => {
      model[item.key] = { factor, unit };
    };
  });
}

export const CATEGORIES = ['Polygon', 'Line', 'Point'];

export default {
  addCoincidentTopologyMethods,
  CATEGORIES,
};
