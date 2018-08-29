import vtk from 'vtk.js/Sources/vtk';
import macro from 'vtk.js/Sources/macro';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import { FieldDataTypes } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';
import { AttributeTypes } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';

const { vtkWarningMacro } = macro;

// ----------------------------------------------------------------------------
// vtkCalculator methods
// ----------------------------------------------------------------------------

function vtkCalculator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCalculator');

  publicAPI.setFormula = (formula) => {
    if (formula === model.formula) {
      return false;
    }
    model.formula = formula;
    publicAPI.modified();
    return true;
  };

  publicAPI.getFormula = () => model.formula;

  publicAPI.augmentInputArrays = (locn, arraysIn) => {
    const arraysOut = arraysIn.slice(0); // shallow-copy the inputs
    // Make point coordinates available whenever the field-data is associated with
    // points or graph vertices:
    if (locn === FieldDataTypes.POINT || locn === FieldDataTypes.VERTEX) {
      arraysOut.push({ location: FieldDataTypes.COORDINATE });
    }
    // TODO: Make cell connectivity available when field-data is associated with
    // cells or graph edges.
    return arraysOut;
  };

  publicAPI.createSimpleFormulaObject = (
    locn,
    arrNames,
    resultName,
    singleValueFormula,
    options = {}
  ) => ({
    getArrays: () => ({
      input: publicAPI.augmentInputArrays(
        locn,
        arrNames.map((x) => ({ location: locn, name: x }))
      ),
      output: [
        {
          location: locn,
          name: resultName,
          attribute:
            'outputAttributeType' in options
              ? options.outputAttributeType
              : AttributeTypes.SCALARS,
          numberOfComponents:
            'numberOfOutputComponents' in options
              ? options.numberOfOutputComponents
              : 1,
        },
      ],
    }),
    evaluate: (arraysIn, arraysOut) => {
      const tuples = new Array(arraysIn.length);
      const arrayInAccessors = arraysIn.map((x, jj) => {
        const nc = x.getNumberOfComponents();
        const rawData = x.getData();
        return nc === 1
          ? (ii) => rawData[ii]
          : (ii) => x.getTuple(ii, tuples[jj]);
      });
      const arrayOut = arraysOut[0];
      const arrayOutRaw = arrayOut.getData();
      const nc = arrayOut.getNumberOfComponents();
      let tupleOut = new Array(nc);
      if (nc === 1) {
        arrayOutRaw.forEach((xxx, ii) => {
          arrayOutRaw[ii] = singleValueFormula(
            ...arrayInAccessors.map((x) => x(ii)),
            ii,
            tupleOut
          );
        });
      } else {
        const nt = arrayOut.getNumberOfTuples();
        for (let ii = 0; ii < nt; ++ii) {
          tupleOut = singleValueFormula(
            ...arrayInAccessors.map((x) => x(ii)),
            ii,
            tupleOut
          );
          arrayOut.setTuple(ii, tupleOut);
        }
      }
    },
  });

  publicAPI.setFormulaSimple = (
    locn,
    arrNames,
    resultName,
    formula,
    options = {}
  ) =>
    publicAPI.setFormula(
      publicAPI.createSimpleFormulaObject(
        locn,
        arrNames,
        resultName,
        formula,
        options
      )
    );

  publicAPI.prepareArrays = (arraySpec, inData, outData) => {
    const arraysIn = [];
    const arraysOut = [];
    arraySpec.input.forEach((spec) => {
      if (spec.location === FieldDataTypes.COORDINATE) {
        arraysIn.push(inData.getPoints());
      } else {
        const fetchArrayContainer = [
          [FieldDataTypes.UNIFORM, (x) => x.getFieldData()],
          [FieldDataTypes.POINT, (x) => x.getPointData()],
          [FieldDataTypes.CELL, (x) => x.getCellData()],
          [FieldDataTypes.VERTEX, (x) => x.getVertexData()],
          [FieldDataTypes.EDGE, (x) => x.getEdgeData()],
          [FieldDataTypes.ROW, (x) => x.getRowData()],
        ].reduce((result, value) => {
          result[value[0]] = value[1];
          return result;
        }, {});
        const dsa =
          'location' in spec && spec.location in fetchArrayContainer
            ? fetchArrayContainer[spec.location](inData)
            : null;
        if (dsa) {
          if (spec.name) {
            arraysIn.push(dsa.getArrayByName(spec.name));
          } else if ('index' in spec) {
            arraysIn.push(dsa.getArrayByIndex(spec.index));
          } else if (
            'attribute' in spec &&
            spec.location !== FieldDataTypes.UNIFORM
          ) {
            arraysIn.push(dsa.getActiveAttribute(spec.attribute));
          } else {
            vtkWarningMacro(
              `No matching array for specifier "${JSON.stringify(spec)}".`
            );
            arraysIn.push(null);
          }
        } else {
          vtkWarningMacro(
            `Specifier "${JSON.stringify(
              spec
            )}" did not provide a usable location.`
          );
          arraysIn.push(null);
        }
      }
    });
    arraySpec.output.forEach((spec) => {
      const fullSpec = Object.assign({}, spec);
      const ncomp =
        'numberOfComponents' in fullSpec ? fullSpec.numberOfComponents : 1;
      if (spec.location === FieldDataTypes.UNIFORM && 'tuples' in fullSpec) {
        fullSpec.size = ncomp * fullSpec.tuples;
      }
      if (spec.location === FieldDataTypes.COORDINATE) {
        const inPts = inData.getPoints();
        const pts = vtkPoints.newInstance({ dataType: inPts.getDataType() });
        pts.setNumberOfPoints(
          inPts.getNumberOfPoints(),
          inPts.getNumberOfComponents()
        );
        outData.setPoints(pts);
        arraysOut.push(pts);
      } else {
        const fetchArrayContainer = [
          [
            FieldDataTypes.UNIFORM,
            (x) => x.getFieldData(),
            (x, y) => ('tuples' in y ? y.tuples : 0),
          ],
          [
            FieldDataTypes.POINT,
            (x) => x.getPointData(),
            (x) => x.getPoints().getNumberOfPoints(),
          ],
          [
            FieldDataTypes.CELL,
            (x) => x.getCellData(),
            (x) => x.getNumberOfCells(),
          ],
          [
            FieldDataTypes.VERTEX,
            (x) => x.getVertexData(),
            (x) => x.getNumberOfVertices(),
          ],
          [
            FieldDataTypes.EDGE,
            (x) => x.getEdgeData(),
            (x) => x.getNumberOfEdges(),
          ],
          [
            FieldDataTypes.ROW,
            (x) => x.getRowData(),
            (x) => x.getNumberOfRows(),
          ],
        ].reduce((result, value) => {
          result[value[0]] = { getData: value[1], getSize: value[2] };
          return result;
        }, {});
        let dsa = null;
        let tuples = 0;
        if ('location' in spec && spec.location in fetchArrayContainer) {
          dsa = fetchArrayContainer[spec.location].getData(outData);
          tuples = fetchArrayContainer[spec.location].getSize(inData, fullSpec);
        }
        if (tuples <= 0) {
          vtkWarningMacro(
            `Output array size could not be determined for ${JSON.stringify(
              spec
            )}.`
          );
          arraysOut.push(null);
        } else if (dsa) {
          fullSpec.size = ncomp * tuples;
          const arrOut = vtkDataArray.newInstance(fullSpec);
          const arrIdx = dsa.addArray(arrOut);
          if (
            'attribute' in fullSpec &&
            spec.location !== FieldDataTypes.UNIFORM
          ) {
            dsa.setActiveAttributeByIndex(arrIdx, fullSpec.attribute);
          }
          arraysOut.push(arrOut);
        } else {
          vtkWarningMacro(
            `Specifier "${JSON.stringify(
              spec
            )}" did not provide a usable location.`
          );
          arraysOut.push(null);
        }
      }
    });
    return { arraysIn, arraysOut };
  };

  publicAPI.requestData = (inData, outData) => {
    if (!model.formula) {
      return 0;
    }

    const arraySpec = model.formula.getArrays(inData);

    const newDataSet = vtk({ vtkClass: inData[0].getClassName() });
    newDataSet.shallowCopy(inData[0]);
    outData[0] = newDataSet;

    const arrays = publicAPI.prepareArrays(arraySpec, inData[0], outData[0]);
    model.formula.evaluate(arrays.arraysIn, arrays.arraysOut);

    return 1;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  formula: {
    getArrays: () => ({ input: [], output: [] }),
    evaluate: () => null,
  },
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  // Object specific methods
  vtkCalculator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCalculator');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
