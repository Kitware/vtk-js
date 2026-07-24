import macro from 'vtk.js/Sources/macros';
import vtkAbstractMapper3D from 'vtk.js/Sources/Rendering/Core/AbstractMapper3D';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';

import CoincidentTopologyHelper from 'vtk.js/Sources/Rendering/Core/Mapper/CoincidentTopologyHelper';
import ScalarColoringHelper from 'vtk.js/Sources/Rendering/Core/Mapper/ScalarColoringHelper';
import Constants from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';

import vtkDataSet from 'vtk.js/Sources/Common/DataModel/DataSet';

import { PassTypes } from 'vtk.js/Sources/Rendering/OpenGL/HardwareSelector/Constants';

const { FieldAssociations } = vtkDataSet;

const { staticOffsetAPI, otherStaticMethods } = CoincidentTopologyHelper;

// ----------------------------------------------------------------------------

function notImplemented(method) {
  return () => macro.vtkErrorMacro(`vtkMapper::${method} - NOT IMPLEMENTED`);
}

// ----------------------------------------------------------------------------
// vtkMapper methods
// ----------------------------------------------------------------------------

function vtkMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMapper');

  publicAPI.computeBounds = () => {
    const input = publicAPI.getInputData();
    if (!input) {
      vtkBoundingBox.reset(model.bounds);
    } else {
      if (!model.static) {
        publicAPI.update();
      }
      vtkBoundingBox.setBounds(model.bounds, input.getBounds());
    }
  };

  publicAPI.setForceCompileOnly = (v) => {
    model.forceCompileOnly = v;
    // make sure we do NOT call modified()
  };

  publicAPI.setSelectionWebGLIdsToVTKIds = (selectionWebGLIdsToVTKIds) => {
    model.selectionWebGLIdsToVTKIds = selectionWebGLIdsToVTKIds;
    // make sure we do NOT call modified()
    // this attribute is only used when processing a selection made with the hardware selector
    // the mtime of the mapper doesn't need to be changed
  };

  publicAPI.getIsOpaque = () => {
    const input = publicAPI.getInputData();
    const gasResult = publicAPI.getAbstractScalars(
      input,
      model.scalarMode,
      model.arrayAccessMode,
      model.arrayId,
      model.colorByArrayName
    );
    const scalars = gasResult.scalars;
    if (!model.scalarVisibility || scalars == null) {
      // No scalar colors.
      return true;
    }
    const lut = publicAPI.getLookupTable();
    if (lut) {
      // Ensure that the lookup table is built
      lut.build();
      return lut.areScalarsOpaque(scalars, model.colorMode, -1);
    }
    return true;
  };

  publicAPI.getPrimitiveCount = () => {
    const input = publicAPI.getInputData();
    const pcount = {
      points: input.getPoints().getNumberOfValues() / 3,
      verts:
        input.getVerts().getNumberOfValues() -
        input.getVerts().getNumberOfCells(),
      lines:
        input.getLines().getNumberOfValues() -
        2 * input.getLines().getNumberOfCells(),
      triangles:
        input.getPolys().getNumberOfValues() -
        3 * input.getPolys().getNumberOfCells(),
    };
    return pcount;
  };

  publicAPI.acquireInvertibleLookupTable = notImplemented(
    'AcquireInvertibleLookupTable'
  );
  publicAPI.valueToColor = notImplemented('ValueToColor');
  publicAPI.colorToValue = notImplemented('ColorToValue');
  publicAPI.useInvertibleColorFor = notImplemented('UseInvertibleColorFor');
  publicAPI.clearInvertibleColor = notImplemented('ClearInvertibleColor');

  publicAPI.processSelectorPixelBuffers = (selector, pixelOffsets) => {
    /* eslint-disable no-bitwise */
    if (
      !selector ||
      !model.selectionWebGLIdsToVTKIds ||
      !model.populateSelectionSettings
    ) {
      return;
    }

    const rawLowData = selector.getRawPixelBuffer(PassTypes.ID_LOW24);
    const rawHighData = selector.getRawPixelBuffer(PassTypes.ID_HIGH24);
    const currentPass = selector.getCurrentPass();
    const fieldAssociation = selector.getFieldAssociation();

    let idMap = null;
    if (fieldAssociation === FieldAssociations.FIELD_ASSOCIATION_POINTS) {
      idMap = model.selectionWebGLIdsToVTKIds.points;
    } else if (fieldAssociation === FieldAssociations.FIELD_ASSOCIATION_CELLS) {
      idMap = model.selectionWebGLIdsToVTKIds.cells;
    }

    if (!idMap) {
      return;
    }

    pixelOffsets.forEach((pos) => {
      if (currentPass === PassTypes.ID_LOW24) {
        let inValue = 0;
        if (rawHighData) {
          inValue += rawHighData[pos];
          inValue *= 256;
        }
        inValue += rawLowData[pos + 2];
        inValue *= 256;
        inValue += rawLowData[pos + 1];
        inValue *= 256;
        inValue += rawLowData[pos];

        const outValue = idMap[inValue];
        const lowData = selector.getPixelBuffer(PassTypes.ID_LOW24);
        lowData[pos] = outValue & 0xff;
        lowData[pos + 1] = (outValue & 0xff00) >> 8;
        lowData[pos + 2] = (outValue & 0xff0000) >> 16;
      } else if (currentPass === PassTypes.ID_HIGH24 && rawHighData) {
        let inValue = 0;
        inValue += rawHighData[pos];
        inValue *= 256;
        inValue += rawLowData[pos + 2];
        inValue *= 256;
        inValue += rawLowData[pos + 1];
        inValue *= 256;
        inValue += rawLowData[pos];

        const outValue = idMap[inValue];
        const highData = selector.getPixelBuffer(PassTypes.ID_HIGH24);
        highData[pos] = (outValue & 0xff000000) >> 24;
      }
    });
    /* eslint-enable no-bitwise */
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  static: false,

  renderTime: 0,

  populateSelectionSettings: true,
  selectionWebGLIdsToVTKIds: null,

  forceCompileOnly: 0,

  useInvertibleColors: false,
  invertibleScalars: null,

  customShaderAttributes: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkAbstractMapper3D.extend(publicAPI, model, initialValues);

  // Scalar coloring pipeline (shared helper)
  ScalarColoringHelper.implementScalarColoringMethods(publicAPI, model);

  macro.get(publicAPI, model, ['selectionWebGLIdsToVTKIds']);
  macro.setGet(publicAPI, model, [
    'populateSelectionSettings',
    'renderTime',
    'static',
    'customShaderAttributes', // point data array names that will be transferred to the VBO
  ]);

  CoincidentTopologyHelper.implementCoincidentTopologyMethods(publicAPI, model);

  // Object methods
  vtkMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkMapper');

// ----------------------------------------------------------------------------

export default {
  newInstance,
  extend,
  ...staticOffsetAPI,
  ...otherStaticMethods,
  ...Constants,
};
