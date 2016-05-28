import * as macro from '../../../macro';
import vtkPolyData from '../../../Common/DataModel/PolyData';
import vtkDataArray from '../../../Common/Core/DataArray';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkWarpScalar methods
// ----------------------------------------------------------------------------

function warpScalar(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWarpScalar');

  let inputArrayName = null;
  let shouldAbort = false;

  /** *************************************************************
   * FIXME: Some functions needed by vtkAlgorithm instances could
   * be moved to a higher level
   * *************************************************************/
  publicAPI.setInputArrayToProcess = arrayName => {
    inputArrayName = arrayName;
  };

  publicAPI.getInputArrayToProcess = (idx, inputVector) => {
    const input = inputVector[0];
    const pointData = input.getPointData();
    return pointData.getArray(inputArrayName);
  };

  publicAPI.updateProgress = completeRatio => {
    console.log(`vtkWarpScalars is ${completeRatio} percent complete`);
  };

  publicAPI.setAbortExecute = abort => {
    shouldAbort = abort;
  };

  publicAPI.getAbortExecute = () => shouldAbort;

  publicAPI.requestData = (inData, outData) => { // implement requestData
    if (!outData[0] || inData[0].getMTime() > outData[0].getMTime()) {
      const input = inData[0];

      // if (!input)
        // {
        // Try converting image data.
        // vtkImageData *inImage = vtkImageData::GetData(inputVector[0]);
        // if (inImage)
          // {
          // vtkNew<vtkImageDataToPointSet> image2points;
          // image2points->SetInputData(inImage);
          // image2points->Update();
          // input = image2points->GetOutput();
          // }
        // }

      // if (!input)
        // {
        // Try converting rectilinear grid.
        // vtkRectilinearGrid *inRect = vtkRectilinearGrid::GetData(inputVector[0]);
        // if (inRect)
          // {
          // vtkNew<vtkRectilinearGridToPointSet> rect2points;
          // rect2points->SetInputData(inRect);
          // rect2points->Update();
          // input = rect2points->GetOutput();
          // }
        // }

      if (!input) {
        vtkErrorMacro('Invalid or missing input');
        return 1;
      }

      // First, copy the input to the output as a starting point
      // output->CopyStructure( input );

      const inPts = input.getPoints();
      const pd = input.getPointData();
      const inNormals = pd.getNormals();

      const inScalars = publicAPI.getInputArrayToProcess(0, inData);
      if (!inPts || !inScalars) {
        vtkDebugMacro('No data to warp');
        outData[0] = inData[0];
        return 1;
      }

      const numPts = inPts.getNumberOfValues();

      let pointNormal = null;

      if (inNormals && !model.getUseNormal()) {
        pointNormal = (id, normals) => normals.getTuple(id);
        vtkDebugMacro('Using data normals');
      } else if (model.getXyPlane()) {
        const normal = [0, 0, 1];
        pointNormal = (id, array) => normal;
        vtkDebugMacro('Using x-y plane normal');
      } else {
        pointNormal = (id, array) => model.getNormal();
        vtkDebugMacro('Using Normal instance variable');
      }

      // newPts = vtkPoints::New();
      // newPts->SetNumberOfPoints(numPts);
      const newPtsData = new Float32Array(numPts * 3);
      const inPoints = inPts.getData();
      let ptOffset = 0;
      let n = [0, 0, 1];
      let s = 1;

      // Loop over all points, adjusting locations
      for (let ptId = 0; ptId < numPts; ++ptId) {
        if (!(ptId % 10000)) {
          publicAPI.updateProgress(ptId / numPts);
          if (publicAPI.getAbortExecute()) {
            break;
          }
        }

        ptOffset = ptId * 3;
        n = pointNormal(ptId, inNormals);

        if (model.getXyPlane()) {
          s = inPoints[ptOffset + 2];
        } else {
          s = inScalars.getComponent(ptId, 0);
        }

        newPtsData[ptOffset] = inPoints[ptOffset] + model.getScaleFactor() * s * n[0];
        newPtsData[ptOffset + 1] = inPoints[ptOffset + 1] + model.getScaleFactor() * s * n[1];
        newPtsData[ptOffset + 2] = inPoints[ptOffset + 2] + model.getScaleFactor() * s * n[2];
      }

      const newPts = vtkDataArray.newInstance();
      newPts.setData(newPtsData);

      // Update ourselves and release memory

      // output->GetPointData()->CopyNormalsOff(); // distorted geometry
      // output->GetPointData()->PassData(input->GetPointData());
      // output->GetCellData()->CopyNormalsOff(); // distorted geometry
      // output->GetCellData()->PassData(input->GetCellData());

      const newPolyData = vtkPolyData.newInstance();
      newPolyData.setPoints(newPts);
      newPolyData.setPolys(inData[0].getPolys());
      outData[0] = newPolyData;

      // newPts->Delete();
    }

    return 1;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  scaleFactor: 1,
  useNormal: false,
  normal: [0, 0, 1],
  xyPlane: false,
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
    'scaleFactor',
    'useNormal',
    'xyPlane',
  ]);

  macro.setGetArray(publicAPI, model, [
    'normal',
  ], 3);

  // Object specific methods
  warpScalar(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWarpScalar');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
