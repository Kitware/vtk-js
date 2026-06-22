import macro from 'vtk.js/Sources/macros';

const { vtkWarningMacro } = macro;

function listClassHierarchy(dataObject) {
  const classNames = [];
  let depth = 0;
  let className = dataObject.getClassName(depth++);
  while (className) {
    classNames.push(className);
    className = dataObject.getClassName(depth++);
  }
  return classNames;
}

function buildMissingImplementationMessage(factoryName, classNames) {
  const classList = classNames.join(' → ');
  return [
    `No ${factoryName} implementation found for ${classNames[0]}.`,
    `Class hierarchy: ${classList}.`,
    `A rendering Profile is likely missing for ${classNames[0]}.`,
    "Try importing '@kitware/vtk.js/Rendering/Profiles/All' or 'vtk.js/Sources/Rendering/Profiles/All',",
    'or import the specific rendering profile needed by this renderable if known.',
    'See https://kitware.github.io/vtk-js/docs/concepts_profile.html for details.',
  ].join('\n');
}

function isWidgetContainer(classNames) {
  return (
    classNames.includes('vtkAbstractWidget') ||
    classNames.includes('vtkWidgetRepresentation')
  );
}

// ----------------------------------------------------------------------------
// vtkViewNodeFactory methods
// ----------------------------------------------------------------------------

function vtkViewNodeFactory(publicAPI, model) {
  // Make sure our overrides is just for our instance not shared with everyone...
  if (!model.overrides) {
    model.overrides = {};
  }

  // Set our className
  model.classHierarchy.push('vtkViewNodeFactory');

  publicAPI.createNode = (dataObject) => {
    if (dataObject.isDeleted()) {
      return null;
    }

    const classNames = listClassHierarchy(dataObject);
    let cpt = 0;
    let className = classNames[cpt++];
    let isObject = false;
    const keys = Object.keys(model.overrides);
    while (className && !isObject) {
      if (keys.indexOf(className) !== -1) {
        isObject = true;
      } else {
        className = dataObject.getClassName(cpt++);
      }
    }

    if (!isObject) {
      // Widgets and widget representations are prop containers. They do not have a
      // direct backend view node and are rendered through their nested props.
      if (isWidgetContainer(classNames)) {
        return null;
      }
      vtkWarningMacro(
        buildMissingImplementationMessage(publicAPI.getClassName(), classNames)
      );
      return null;
    }
    const vn = model.overrides[className]();
    vn.setMyFactory(publicAPI);
    return vn;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // overrides: {},
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  // Object methods
  vtkViewNodeFactory(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkViewNodeFactory');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
