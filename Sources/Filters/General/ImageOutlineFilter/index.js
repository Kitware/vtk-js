import macro from 'vtk.js/Sources/macros';
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
    const inputDataArray = input.getPointData().getScalars().getData();
    let kernelX = 0; // default K slicing mode
    let kernelY = 1;
    if (model.slicingMode === 1) {
      kernelX = 0;
      kernelY = 2;
    } else if (model.slicingMode === 0) {
      kernelX = 1;
      kernelY = 2;
    }
    inputDataArray.forEach((el, index) => {
      if (el !== model.background) {
        const ijk = getIJK(index, dims);
        let isBorder = false;
        for (let x = -1; x <= 1 && !isBorder; x++) {
          for (let y = -1; y <= 1 && !isBorder; y++) {
            let dx = x;
            let dy = y;
            let dz = 0;
            if (model.slicingMode === 1) {
              dx = x;
              dy = 0;
              dz = y;
            } else if (model.slicingMode === 0) {
              dx = 0;
              dy = y;
              dz = x;
            }
            const evalX = ijk[kernelX] + dx;
            const evalY = ijk[kernelY] + dy;
            // check boundaries
            if (
              evalX >= 0 &&
              evalX < dims[kernelX] &&
              evalY >= 0 &&
              evalY < dims[kernelY]
            ) {
              const hoodValue =
                inputDataArray[
                  getIndex([ijk[0] + dx, ijk[1] + dy, ijk[2] + dz], dims)
                ];
              if (hoodValue !== el) isBorder = true;
            }
          }
        }
        if (isBorder) values[index] = el;
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

  macro.setGet(publicAPI, model, ['slicingMode', 'background']);

  // Object specific methods
  vtkImageOutlineFilter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageOutlineFilter');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
