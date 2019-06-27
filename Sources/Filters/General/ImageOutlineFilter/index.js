import macro from 'vtk.js/Sources/macro';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkImageOutlineFilter methods
// ----------------------------------------------------------------------------

function vtkImageOutlineFilter(publicAPI, model) {
  model.classHierarchy.push('vtkImageOutlineFilter');

  publicAPI.requestData = (inData, outData) => {
    // implement requestData
    const input = inData[0];
    if (!input || input.getClassName() !== 'vtkImageData') {
      vtkErrorMacro('Invalid or missing input');
      return;
    }

    const output = vtkImageData.newInstance(
      input.get('spacing', 'origin', 'direction')
    );

    const getIndex = (point, dims) =>
      point[0] + point[1] * dims[0] + point[2] * dims[0] * dims[1];

    const getIJK = (index, dims) => {
      const ijk = [0, 0, 0];
      ijk[0] = index % dims[0];
      ijk[1] = Math.floor(index / dims[0]) % dims[1];
      ijk[2] = Math.floor(index / (dims[0] * dims[1]));
      return ijk;
    };
    const dims = input.getDimensions();
    output.setDimensions(dims);
    output.computeTransforms();
    const values = new Uint8Array(input.getNumberOfPoints());
    const inputDataArray = input
      .getPointData()
      .getScalars()
      .getData();
    inputDataArray.forEach((el, index) => {
      if (el !== model.background) {
        const ijk = getIJK(index, dims);
        let isBorder = false;
        for (let pI = -1; pI <= 1 && !isBorder; pI++) {
          for (let pJ = -1; pJ <= 1 && !isBorder; pJ++) {
            const evalI = ijk[0] + pI;
            const evalJ = ijk[1] + pJ;
            // check boundaries
            if (
              evalI >= 0 &&
              evalI < dims[0] &&
              evalJ >= 0 &&
              evalJ < dims[1]
            ) {
              const hoodValue =
                inputDataArray[
                  getIndex([ijk[0] + pI, ijk[1] + pJ, ijk[2]], dims)
                ];
              if (hoodValue === model.background) isBorder = true;
            }
          }
        }
        if (isBorder) values[index] = 1;
        else values[index] = model.background;
      } else {
        values[index] = model.background;
      }
    });

    const dataArray = vtkDataArray.newInstance({
      numberOfComponents: 1,
      values,
    });
    output.getPointData().setScalars(dataArray);
    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  outline: 1,
  slicingMode: 2,
  background: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  macro.setGet(publicAPI, model, ['outline', 'slicingMode', 'background']);

  // Object specific methods
  vtkImageOutlineFilter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageOutlineFilter');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
