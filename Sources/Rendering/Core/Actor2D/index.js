import macro from 'vtk.js/Sources/macro';
import vtkCoordinate from 'vtk.js/Sources/Rendering/Core/Coordinate';
import vtkProp from 'vtk.js/Sources/Rendering/Core/Prop';
import vtkProperty2D from 'vtk.js/Sources/Rendering/Core/Property2D';
import { Coordinate } from 'vtk.js/Sources/Rendering/Core/Coordinate/Constants';

// ----------------------------------------------------------------------------
// vtkActor2D methods
// ----------------------------------------------------------------------------

function vtkActor2D(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkActor2D');

  publicAPI.getActors2D = () => publicAPI;

  publicAPI.getIsOpaque = () => {
    // make sure we have a property
    if (!model.property) {
      // force creation of a property
      publicAPI.getProperty();
    }

    let isOpaque = model.property.getOpacity() >= 1.0;

    // are we using an opaque texture, if any?
    isOpaque = isOpaque && (!model.texture || !model.texture.isTranslucent());

    // are we using an opaque scalar array, if any?
    isOpaque = isOpaque && (!model.mapper || model.mapper.getIsOpaque());

    return isOpaque;
  };

  publicAPI.hasTranslucentPolygonalGeometry = () => {
    if (model.mapper === null) {
      return false;
    }
    // make sure we have a property
    if (model.property === null) {
      // force creation of a property
      publicAPI.setProperty(publicAPI.makeProperty());
    }

    // is this actor opaque ?
    return !publicAPI.getIsOpaque();
  };

  publicAPI.makeProperty = vtkProperty2D.newInstance;

  publicAPI.getProperty = () => {
    if (model.property === null) {
      model.property = publicAPI.makeProperty();
    }
    return model.property;
  };

  //----------------------------------------------------------------------------
  // Set the Prop2D's position in display coordinates.
  publicAPI.setDisplayPosition = (XPos, YPos) => {
    model.positionCoordinate.setCoordinateSystem(Coordinate.DISPLAY);
    model.positionCoordinate.setValue(XPos, YPos, 0.0);
  };

  //----------------------------------------------------------------------------
  publicAPI.setWidth = (w) => {
    const pos = model.position2Coordinate.getValue();
    model.position2Coordinate.setCoordinateSystemToNormalizedViewport();
    model.position2Coordinate.setValue(w, pos[1]);
  };

  //----------------------------------------------------------------------------
  publicAPI.setHeight = (w) => {
    const pos = model.position2Coordinate.getValue();
    model.position2Coordinate.setCoordinateSystemToNormalizedViewport();
    model.position2Coordinate.setValue(pos[0], w);
  };

  //----------------------------------------------------------------------------
  publicAPI.getWidth = () => model.position2Coordinate.getValue()[0];

  //----------------------------------------------------------------------------
  publicAPI.getHeight = () => model.position2Coordinate.getValue()[1];

  publicAPI.getMTime = () => {
    let mt = model.mtime;
    if (model.property !== null) {
      const time = model.property.getMTime();
      mt = time > mt ? time : mt;
    }

    mt =
      model.positionCoordinate.getMTime() > mt
        ? model.positionCoordinate.getMTime()
        : mt;
    mt =
      model.positionCoordinate2.getMTime() > mt
        ? model.positionCoordinate2.getMTime()
        : mt;

    // TBD: Handle array of textures here.

    return mt;
  };

  publicAPI.getRedrawMTime = () => {
    let mt = model.mtime;
    if (model.mapper !== null) {
      let time = model.mapper.getMTime();
      mt = time > mt ? time : mt;
      if (model.mapper.getInput() !== null) {
        // FIXME !!! getInputAlgorithm / getInput
        model.mapper.getInputAlgorithm().update();
        time = model.mapper.getInput().getMTime();
        mt = time > mt ? time : mt;
      }
    }
    return mt;
  };

  publicAPI.getBounds = () => {
    // does our mapper support bounds
    if (typeof publicAPI.getMapper().getBounds === 'function') {
      model.useBounds = true;
      return publicAPI.getMapper().getBounds();
    }
    model.useBounds = false;
    return [];
  };

  // Description:
  // Return the actual vtkCoordinate reference that the mapper should use
  // to position the actor. This is used internally by the mappers and should
  // be overridden in specialized subclasses and otherwise ignored.
  publicAPI.getActualPositionCoordinate = () => model.positionCoordinate;
  publicAPI.getActualPositionCoordinate2 = () => model.positionCoordinate2;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  mapper: null,
  property: null,
  layerNumber: 0,
  positionCoordinate: null,
  positionCoordinate2: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkProp.extend(publicAPI, model, initialValues);

  model.positionCoordinate = vtkCoordinate.newInstance();
  model.positionCoordinate.setCoordinateSystemToViewport();
  model.positionCoordinate2 = vtkCoordinate.newInstance();
  model.positionCoordinate2.setCoordinateSystemToNormalizedViewport();
  model.positionCoordinate2.setValue(0.5, 0.5);
  model.positionCoordinate2.setReferenceCoordinate(model.positionCoordinate);

  // Build VTK API
  macro.set(publicAPI, model, ['property']);
  macro.setGet(publicAPI, model, ['mapper']);

  // Object methods
  vtkActor2D(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkActor2D');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
