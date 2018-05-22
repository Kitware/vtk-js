import macro from 'vtk.js/Sources/macro';
import vtkAbstractRepresentation from 'vtk.js/Sources/Interaction/Widgets2/AbstractRepresentation';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkCellPicker from 'vtk.js/Sources/Rendering/Core/CellPicker';

function vtkHandleRepresentation(publicAPI, model) {
  model.classHierarchy.push('vtkHandleRepresentation');

  // default to a sphere
  model.source = vtkSphereSource.newInstance();
  model.source.setThetaResolution(16);
  model.source.setPhiResolution(8);
  model.source.setRadius(0.1);

  model.mapper = vtkMapper.newInstance();
  model.mapper.setInputConnection(model.source.getOutputPort());

  model.actor = vtkActor.newInstance();
  model.actor.setMapper(model.mapper);

  // default property
  model.property = model.actor.getProperty();

  // select property
  model.selectProperty = vtkProperty.newInstance();
  model.selectProperty.setColor(0, 1, 0);

  model.picker = vtkCellPicker.newInstance();
  model.picker.setPickFromList(true);
  model.picker.initializePickList();
  model.picker.addPickList(model.actor);

  //----------------------------------------------------------------------------

  // virtual override (vtkStateObserver mixin)
  publicAPI.onStateChanged = (state) => {
    const { selected } = state.getData();
    if (selected) {
      model.actor.setProperty(model.selectProperty);
    } else {
      model.actor.setProperty(model.property);
    }
  };

  // --------------------------------------------------------------------------

  // virtual override (vtkAbstractRepresentation)
  publicAPI.getEventIntersection = (event) => {
    const { x, y, z } = event.position;
    model.picker.pick([x, y, z], event.pokedRenderer);
    // Should the contents of this object be standardized?
    return {
      intersects: !!model.picker.getDataSet(),
      pickPosition: model.picker.getPickPosition(),
    };
  };

  // --------------------------------------------------------------------------

  // virtual override (vtkAbstractRepresentation)
  publicAPI.getBounds = () => model.actor.getBounds();

  // --------------------------------------------------------------------------

  // virtual override (vtkProp)
  publicAPI.getActors = () => [model.actor];

  // --------------------------------------------------------------------------

  // virtual override (vtkProp)
  publicAPI.getNestedProps = () => publicAPI.getActors();

  // --------------------------------------------------------------------------

  publicAPI.setSource = (source) => {
    if (model.source === source) {
      return;
    }

    model.source = source;

    if ('getOutputPort' in source) {
      model.mapper.setInputConnection(source.getOutputPort());
    } else {
      model.mapper.setInputData(source);
    }

    publicAPI.modified();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractRepresentation.extend(publicAPI, model, initialValues);

  macro.get(publicAPI, model, [
    'source',
    'mapper',
    'actor',
    'picker',
    'property',
    'selectProperty',
  ]);

  // Object methods
  vtkHandleRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkHandleRepresentation');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
