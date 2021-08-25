import macro from 'vtk.js/Sources/macros';
import vtk from 'vtk.js/Sources/vtk';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';

import vtkAbstractRepresentationProxy from 'vtk.js/Sources/Proxy/Core/AbstractRepresentationProxy';

// For Glyph creation using the vtk factory
import 'vtk.js/Sources/Filters/Sources';

// ----------------------------------------------------------------------------
// vtkGlyphRepresentationProxy methods
// ----------------------------------------------------------------------------

function vtkGlyphRepresentationProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkGlyphRepresentationProxy');

  model.property = vtkProperty.newInstance();

  function processJSON(description) {
    model.actors.length = 0;

    // Handle colors
    const lookupTable = vtkColorTransferFunction.newInstance();
    lookupTable.applyColorMap({ RGBPoints: description.rgbPoints });

    // Handle glyph
    model.glyph = {};
    let count = description.glyph.length;
    while (count--) {
      const glyph = description.glyph[count];
      model.glyph[glyph.id] = vtk(glyph);
    }

    // Handle mapping
    count = description.mapping.length;
    while (count--) {
      const sourceDesc = description.mapping[count];
      const glyph = model.glyph[sourceDesc.glyphId];
      const source = vtkPolyData.newInstance();
      source.getPoints().setData(Float32Array.from(sourceDesc.coordinates), 3);
      if (sourceDesc.scale) {
        source.getPointData().addArray(
          vtkDataArray.newInstance({
            name: 'scaling',
            values: Float32Array.from(sourceDesc.scale),
            numberOfComponents: 3,
          })
        );
      }
      const mapper = vtkGlyph3DMapper.newInstance({
        useLookupTableScalarRange: true,
        lookupTable,
        orient: false,
        scaling: !!sourceDesc.scale,
        scaleArray: 'scaling',
        scaleMode: vtkGlyph3DMapper.ScaleModes.SCALE_BY_COMPONENTS,
      });
      const actor = vtkActor.newInstance();
      if (model.property) {
        actor.setProperty(model.property);
      }

      actor.setMapper(mapper);
      mapper.setInputData(source, 0);
      mapper.setInputConnection(glyph.getOutputPort(), 1);

      model.actors.push(actor);
    }
  }

  model.sourceDependencies.push({ setInputData: processJSON });

  // Add actors
  // model.actors.push(model.sphereActor);
  // model.actors.push(model.stickActor);

  // API ----------------------------------------------------------------------

  publicAPI.setColorBy = () => {};
  publicAPI.getColorBy = () => [];
  publicAPI.listDataArrays = () => [];
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  vtkAbstractRepresentationProxy.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkGlyphRepresentationProxy(publicAPI, model);
  macro.proxyPropertyMapping(publicAPI, model, {
    edgeVisibility: { modelKey: 'property', property: 'edgeVisibility' },
  });
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkGlyphRepresentationProxy'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
