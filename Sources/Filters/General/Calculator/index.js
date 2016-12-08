import * as macro from '../../../macro';
import vtkDataArray from '../../../Common/Core/DataArray';
import vtkPoints from '../../../Common/Core/Points';
import { FieldDataTypes } from '../../../Common/DataModel/DataSet/Constants';
import vtk from '../../../vtk';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkCalculator methods
// ----------------------------------------------------------------------------

function vtkCalculator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCalculator');

  publicAPI.setFormula = (formula) => {
    if (formula === model.formula) {
      return;
    }
    model.formula = formula;
    publicAPI.modified();
  };

  /** Accept a simple one-line format for the calculator. For example:
    *
    *     calc.setFormulaSimple(
    *       FieldDataTypes.POINT,                      // Operate on point data
    *       ['temp', 'press', 'nR'],                   // Require these point-data arrays as input
    *       'rho',                                     // Name the output array 'rho'
    *       (temp, press, nR) => press / nR / temp);   // Apply this formula to each point to compute rho.
    *
    * Caveats:
    * + No way to get point coordinates
    * + Output required to be a single array of 1 component
    */
  publicAPI.setFormulaSimple = (locn, arrNames, resultName, singleValueFormula) =>
    publicAPI.setFormula({
      getArrays: () => ({
        input: arrNames.map(x => ({ location: locn, name: x })),
        output: [{ location: locn, name: resultName }],
      }),
      evaluate: (arraysIn, arraysOut) => {
        arraysOut[0].forEach((xxx, ii) => {
          arraysOut[ii] = singleValueFormula(...arraysIn.map(x => x[ii]));
        });
      },
    });

  publicAPI.requestData = (inData, outData) => {
    if (!model.formula) {
      return 0;
    }
    if (!outData[0] || inData[0].getMTime() > outData[0].getMTime()) {
      const arraySpec = model.formula.getArrays(inData);
      const arraysIn = [];
      const arraysOut = [];

      const newDataSet = vtk({ vtkClass: inData[0].getClassName() });
      newDataSet.shallowCopy(inData[0]);
      outData[0] = newDataSet;

      arraySpec.input.forEach((spec) => {
        if (spec.location === FieldDataTypes.COORDINATE) {
          arraysIn.push(inData[0].getPoints().getData());
        } else {
          const fetchArrayContainer = [
            [FieldDataTypes.UNIFORM, x => x.getFieldData()],
            [FieldDataTypes.POINT, x => x.getPointData()],
            [FieldDataTypes.CELL, x => x.getCellData()],
            [FieldDataTypes.VERTEX, x => x.getVertexData()],
            [FieldDataTypes.EDGE, x => x.getEdgeData()],
            [FieldDataTypes.ROW, x => x.getRowData()],
          ].reduce((result, value) => { result[value[0]] = value[1]; return result; }, {});
          const dsa = ('location' in spec && spec.location in fetchArrayContainer ?
            fetchArrayContainer[spec.location](inData[0]) : null);
          if (dsa) {
            if (spec.name) {
              arraysIn.push(dsa.getArrayByName(spec.name));
            } else if ('index' in spec) {
              arraysIn.push(dsa.getArrayByIndex(spec.index));
            } else if ('attribute' in spec && spec.location !== FieldDataTypes.UNIFORM) {
              arraysIn.push(dsa.getActiveAttribute(spec.attribute));
            } else {
              vtkWarningMacro(`No matching array for specifier "${JSON.stringify(spec)}".`);
              arraysIn.push(null);
            }
          } else {
            vtkWarningMacro(`Specifier "${JSON.stringify(spec)}" did not provide a usable location.`);
            arraysIn.push(null);
          }
        }
      });
      arraySpec.output.forEach((spec) => {
        const fullSpec = Object.assign({}, spec);
        const ncomp = ('numberOfComponents' in fullSpec ? fullSpec.numberOfComponents : 1);
        if (spec.location === FieldDataTypes.UNIFORM && 'tuples' in fullSpec) {
          fullSpec.size = ncomp * fullSpec.tuples;
        }
        if (spec.location === FieldDataTypes.COORDINATE) {
          const pts = vtkPoints.newInstance();
          fullSpec.numberOfComponents = 3;
          fullSpec.size = 3 * pts.getNumberOfPoints();
          const newPoints = vtkDataArray.newInstance(fullSpec);
          pts.setData(newPoints);
          outData[0].setPoints(pts);
          arraysOut.push(newPoints);
        } else {
          const fetchArrayContainer = [
            [FieldDataTypes.UNIFORM, x => x.getFieldData(), (x, y) => ('tuples' in y ? y.tuples : 0)],
            [FieldDataTypes.POINT, x => x.getPointData(), x => x.getPoints().getNumberOfPoints()],
            [FieldDataTypes.CELL, x => x.getCellData(), x => x.getNumberOfCells()],
            [FieldDataTypes.VERTEX, x => x.getVertexData(), x => x.getNumberOfVertices()],
            [FieldDataTypes.EDGE, x => x.getEdgeData(), x => x.getNumberOfEdges()],
            [FieldDataTypes.ROW, x => x.getRowData(), x => x.getNumberOfRows()],
          ].reduce((result, value) => { result[value[0]] = { getData: value[1], getSize: value[2] }; return result; }, {});
          let dsa = null;
          let tuples = 0;
          if ('location' in spec && spec.location in fetchArrayContainer) {
            dsa = fetchArrayContainer[spec.location].getData(inData[0]);
            tuples = fetchArrayContainer[spec.location].getSize(inData[0], fullSpec);
          }
          if (tuples <= 0) {
            vtkWarningMacro(`Output array size could not be determined for ${JSON.stringify(spec)}.`);
            arraysOut.push(null);
          } else if (dsa) {
            fullSpec.size = ncomp * tuples;
            console.log('    Create data array ', fullSpec);
            const arrOut = vtkDataArray.newInstance(fullSpec);
            const arrIdx = dsa.addArray(arrOut);
            if ('attribute' in fullSpec && spec.location !== FieldDataTypes.UNIFORM) {
              dsa.setActiveAttributeByIndex(arrIdx, fullSpec.attribute);
            }
            arraysOut.push(arrOut);
          } else {
            vtkWarningMacro(`Specifier "${JSON.stringify(spec)}" did not provide a usable location.`);
            arraysOut.push(null);
          }
        }
      });
      model.formula.evaluate(arraysIn, arraysOut);
    }

    return 1;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  arrayName: 'Result',
  function: '0',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  // Generate macros for properties
  macro.setGet(publicAPI, model, [
    'arrayName',
    'function',
  ]);

  // Object specific methods
  vtkCalculator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWarpScalar');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
