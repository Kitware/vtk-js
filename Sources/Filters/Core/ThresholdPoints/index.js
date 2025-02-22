import macro from 'vtk.js/Sources/macros';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import { POLYDATA_FIELDS } from 'vtk.js/Sources/Common/DataModel/PolyData/Constants';

const { vtkErrorMacro } = macro;

const OperationType = {
  Below: 'Below',
  Above: 'Above',
};

// Function to perform binary search on a sorted array
function binarySearch(items, value) {
  let firstIndex = 0;
  let lastIndex = items.length - 1;
  let middleIndex = Math.floor((lastIndex + firstIndex) / 2);

  while (items[middleIndex] !== value && firstIndex < lastIndex) {
    if (value < items[middleIndex]) {
      lastIndex = middleIndex - 1;
    } else if (value > items[middleIndex]) {
      firstIndex = middleIndex + 1;
    }
    middleIndex = Math.floor((lastIndex + firstIndex) / 2);
  }

  return {
    found: items[middleIndex] === value,
    index: Math.max(
      items[middleIndex] < value ? middleIndex + 1 : middleIndex,
      0
    ),
  };
}

function camelize(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter) => letter.toUpperCase())
    .replace(/\s+/g, '');
}
// ----------------------------------------------------------------------------
// vtkThresholdPoints methods
// ----------------------------------------------------------------------------

function vtkThresholdPoints(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkThresholdPoints');

  publicAPI.requestData = (inData, outData) => {
    const input = inData[0];
    const output = vtkPolyData.newInstance();
    outData[0] = output;

    if (model.criterias.length === 0) {
      output.shallowCopy(input);
      return;
    }
    const oldPoints = input.getPoints();
    const oldPointCount = oldPoints.getNumberOfPoints();
    const oldPointData = input.getPointData();
    const oldPointsData = oldPoints.getData();
    const newPointsData = macro.newTypedArray(
      input.getPoints().getDataType(),
      3 * oldPointCount
    );
    const oldArrays = [];
    const newArraysData = [];
    const numArrays = oldPointData.getNumberOfArrays();
    for (let i = 0; i < numArrays; ++i) {
      const oldArray = oldPointData.getArrayByIndex(i);
      oldArrays.push(oldArray);
      newArraysData.push(
        macro.newTypedArray(
          oldArray.getDataType(),
          oldPointCount * oldArray.getNumberOfComponents()
        )
      );
    }
    const pointAcceptanceFunctions = model.criterias.map((criteria) => {
      let inputArray = null;
      let component = 0;
      let numberOfComponents = 1;
      if (criteria.fieldAssociation === 'PointData') {
        inputArray = oldArrays.find(
          (oldArray) => oldArray.getName() === criteria.arrayName
        );
        numberOfComponents = inputArray.getNumberOfComponents();
      } else if (criteria.fieldAssociation === 'Points') {
        inputArray = oldPoints;
        if (criteria.arrayName === 'z') {
          component = 2;
        } else {
          component = criteria.arrayName === 'y' ? 1 : 0;
        }
        numberOfComponents = 3;
      } else {
        vtkErrorMacro('No field association');
      }
      const inputArrayData = inputArray.getData();
      const operation =
        criteria.operation === OperationType.Below
          ? (a, b) => a < b
          : (a, b) => a > b;
      const pointAcceptanceFunction = (pointId) =>
        operation(
          inputArrayData[numberOfComponents * pointId + component],
          criteria.value
        );
      return pointAcceptanceFunction;
    });

    const thresholdedPointIds = []; // sorted list
    let newI = 0;
    for (let i = 0; i < oldPointCount; ++i) {
      const keepPoint = pointAcceptanceFunctions.reduce(
        (keep, pointAcceptanceFunction) => keep && pointAcceptanceFunction(i),
        true
      );
      if (keepPoint) {
        let ii = 3 * i;
        let newII = 3 * newI;
        for (let c = 0; c < 3; ++c) {
          newPointsData[newII++] = oldPointsData[ii++];
        }
        for (let j = 0; j < numArrays; ++j) {
          const oldArrayData = oldArrays[j].getData();
          const newArrayData = newArraysData[j];
          const cc = oldArrays[j].getNumberOfComponents();
          ii = cc * i;
          newII = cc * newI;
          for (let c = 0; c < cc; ++c) {
            newArrayData[newII++] = oldArrayData[ii++];
          }
        }
        ++newI;
      } else {
        thresholdedPointIds.push(i);
      }
    }
    if (thresholdedPointIds.length === 0) {
      output.shallowCopy(input);
      return;
    }

    output.setPoints(
      vtkPoints.newInstance({ values: newPointsData, size: 3 * newI })
    );
    for (let i = 0; i < numArrays; ++i) {
      const oldArray = oldArrays[i];
      const newArray = vtkDataArray.newInstance({
        name: oldArray.getName(),
        values: newArraysData[i],
        dataType: oldArray.getDataType(),
        numberOfComponents: oldArray.getNumberOfComponents(),
        size: newI * oldArray.getNumberOfComponents(),
      });
      output.getPointData().addArray(newArray);
      oldPointData.getAttributes(oldArray).forEach((attrType) => {
        output.getPointData().setAttribute(newArray, attrType);
      });
    }

    POLYDATA_FIELDS.forEach((cellType) => {
      const oldPolysData = input[`get${camelize(cellType)}`]().getData();
      const newCellData = macro.newTypedArray(
        input.getPolys().getDataType(),
        oldPolysData.length
      );
      const newPointIds = []; // first point starts at [1]
      const firstPointIndex = cellType === 'verts' ? 0 : 1;
      let numberOfPoints = 1;
      let newP = 0;
      for (
        let c = 0;
        c < oldPolysData.length;
        c += numberOfPoints + firstPointIndex
      ) {
        if (firstPointIndex === 1) {
          // not for verts
          numberOfPoints = oldPolysData[c];
        }
        let keepCell = true;

        for (let p = firstPointIndex; p <= numberOfPoints; ++p) {
          const { found, index } = binarySearch(
            thresholdedPointIds,
            oldPolysData[c + p]
          );
          if (found) {
            keepCell = false;
            break;
          }
          newPointIds[p] = oldPolysData[c + p] - index;
        }
        if (keepCell) {
          newCellData[newP++] = numberOfPoints;
          for (let p = firstPointIndex; p <= numberOfPoints; ) {
            newCellData[newP++] = newPointIds[p++];
          }
        }
      }
      output[`set${camelize(cellType)}`](
        vtkCellArray.newInstance({
          values: newCellData,
          size: newP, // it may shorter than original array if cells are not kept
          dataType: input.getPolys().getDataType(),
        })
      );
    });

    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------

function defaultValues(publicAPI, model, initialValues = {}) {
  return {
    criterias: [], // arrayName: string, fieldAssociation: string, operation: string, value: number
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, defaultValues(publicAPI, model, initialValues));

  // Build VTK API
  macro.setGet(publicAPI, model, []);
  macro.get(publicAPI, model, []);
  macro.setGetArray(publicAPI, model, ['criterias']);

  // Make this a VTK object
  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 1, 1);

  // Object specific methods
  vtkThresholdPoints(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkThresholdPoints');

// ----------------------------------------------------------------------------

export default { newInstance, extend, OperationType };
