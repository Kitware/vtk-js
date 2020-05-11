export default function addVPropertyHandlingAPI(publicAPI, model) {
  // --------------------------------------------------------------------------
  // Property management
  // --------------------------------------------------------------------------

  publicAPI.getSections = () => {
    const sections = [];
    const source = publicAPI.getActiveSource();
    if (!source) {
      return [];
    }
    const view = publicAPI.getActiveView();
    if (source) {
      const section = source.getProxySection();
      if (section.ui.length) {
        sections.push(
          Object.assign(section, {
            collapsed: model.collapseState[section.name],
          })
        );
      }
    }
    if (source && view) {
      const representation = publicAPI.getRepresentation(source, view);
      if (representation) {
        const section = representation.getProxySection();
        if (section.ui.length) {
          sections.push(
            Object.assign(section, {
              collapsed: model.collapseState[section.name],
            })
          );
        }
      }
    }
    if (view) {
      const section = view.getProxySection();
      if (section.ui.length) {
        sections.push(
          Object.assign(section, {
            collapsed: model.collapseState[section.name],
          })
        );
      }
    }
    return sections;
  };

  // --------------------------------------------------------------------------

  publicAPI.updateCollapseState = (name, state) => {
    model.collapseState[name] = state;
    publicAPI.modified();
  };

  // --------------------------------------------------------------------------

  publicAPI.applyChanges = (changeSet) => {
    const groupBy = {};
    const keys = Object.keys(changeSet);
    let count = keys.length;
    while (count--) {
      const key = keys[count];
      const [id, prop] = key.split(':');
      if (!groupBy[id]) {
        groupBy[id] = {};
      }
      if (changeSet[key] === '__command_execute__') {
        const obj = publicAPI.getProxyById(id);
        if (obj) {
          obj[prop]();
        }
      } else {
        groupBy[id][prop] = changeSet[key];
      }
    }

    // Apply changes
    const objIds = Object.keys(groupBy);
    count = objIds.length;
    while (count--) {
      const id = objIds[count];
      const obj = publicAPI.getProxyById(id);
      if (obj) {
        obj.set(groupBy[id]);
      }
    }
    publicAPI.modified();
    publicAPI.renderAllViews();
  };

  // --------------------------------------------------------------------------
  // Color Management
  // --------------------------------------------------------------------------

  publicAPI.getLookupTable = (arrayName, options) => {
    if (!model.lookupTables[arrayName]) {
      model.lookupTables[arrayName] = publicAPI.createProxy(
        'Proxy',
        'LookupTable',
        { arrayName, ...options }
      );
    }
    return model.lookupTables[arrayName];
  };

  // --------------------------------------------------------------------------

  publicAPI.getPiecewiseFunction = (arrayName, options) => {
    if (!model.piecewiseFunctions[arrayName]) {
      model.piecewiseFunctions[arrayName] = publicAPI.createProxy(
        'Proxy',
        'PiecewiseFunction',
        { arrayName, ...options }
      );
    }
    return model.piecewiseFunctions[arrayName];
  };

  // --------------------------------------------------------------------------

  publicAPI.rescaleTransferFunctionToDataRange = (arrayName, dataRange) => {
    const lut = publicAPI.getLookupTable(arrayName);
    const pwf = publicAPI.getPiecewiseFunction(arrayName);
    lut.setDataRange(dataRange[0], dataRange[1]);
    pwf.setDataRange(dataRange[0], dataRange[1]);
  };
}
