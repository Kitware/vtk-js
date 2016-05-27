import * as macro from '../../../macro';
import vtkPolyData from '../../../Common/DataModel/PolyData';

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

  publicAPI.requestData = (inData, outData) => { // implement requestData
    if (!outData[0] || inData[0].getMTime() > outData[0].getMTime()) {
      const pd = vtkPolyData.newInstance();
      pd.setPolys(inData[0].getPolys());
      pd.setPoints(inData[0].getPoints());
      outData[0] = pd;
    }

  // vtkSmartPointer<vtkPointSet> input = vtkPointSet::GetData(inputVector[0]);
  // vtkPointSet *output = vtkPointSet::GetData(outputVector);

  // if (!input)
  //   {
  //   // Try converting image data.
  //   vtkImageData *inImage = vtkImageData::GetData(inputVector[0]);
  //   if (inImage)
  //     {
  //     vtkNew<vtkImageDataToPointSet> image2points;
  //     image2points->SetInputData(inImage);
  //     image2points->Update();
  //     input = image2points->GetOutput();
  //     }
  //   }

  // if (!input)
  //   {
  //   // Try converting rectilinear grid.
  //   vtkRectilinearGrid *inRect = vtkRectilinearGrid::GetData(inputVector[0]);
  //   if (inRect)
  //     {
  //     vtkNew<vtkRectilinearGridToPointSet> rect2points;
  //     rect2points->SetInputData(inRect);
  //     rect2points->Update();
  //     input = rect2points->GetOutput();
  //     }
  //   }

  // if (!input)
  //   {
  //   vtkErrorMacro(<< "Invalid or missing input");
  //   return 0;
  //   }

  // vtkPoints *inPts;
  // vtkDataArray *inNormals;
  // vtkDataArray *inScalars;
  // vtkPoints *newPts;
  // vtkPointData *pd;
  // int i;
  // vtkIdType ptId, numPts;
  // double x[3], *n, s, newX[3];

  // vtkDebugMacro(<<"Warping data with scalars");

  // // First, copy the input to the output as a starting point
  // output->CopyStructure( input );

  // inPts = input->GetPoints();
  // pd = input->GetPointData();
  // inNormals = pd->GetNormals();

  // inScalars = this->GetInputArrayToProcess(0,inputVector);
  // if ( !inPts || !inScalars )
  //   {
  //   vtkDebugMacro(<<"No data to warp");
  //   return 1;
  //   }

  // numPts = inPts->GetNumberOfPoints();

  // if ( inNormals && !this->UseNormal )
  //   {
  //   this->PointNormal = &vtkWarpScalar::DataNormal;
  //   vtkDebugMacro(<<"Using data normals");
  //   }
  // else if ( this->XYPlane )
  //   {
  //   this->PointNormal = &vtkWarpScalar::ZNormal;
  //   vtkDebugMacro(<<"Using x-y plane normal");
  //   }
  // else
  //   {
  //   this->PointNormal = &vtkWarpScalar::InstanceNormal;
  //   vtkDebugMacro(<<"Using Normal instance variable");
  //   }

  // newPts = vtkPoints::New();
  // newPts->SetNumberOfPoints(numPts);

  // // Loop over all points, adjusting locations
  // //
  // for (ptId=0; ptId < numPts; ptId++)
  //   {
  //   if ( ! (ptId % 10000) )
  //     {
  //     this->UpdateProgress ((double)ptId/numPts);
  //     if (this->GetAbortExecute())
  //       {
  //       break;
  //       }
  //     }

  //   inPts->GetPoint(ptId, x);
  //   n = (this->*(this->PointNormal))(ptId,inNormals);
  //   if ( this->XYPlane )
  //     {
  //     s = x[2];
  //     }
  //   else
  //     {
  //     s = inScalars->GetComponent(ptId,0);
  //     }
  //   for (i=0; i<3; i++)
  //     {
  //     newX[i] = x[i] + this->ScaleFactor * s * n[i];
  //     }
  //   newPts->SetPoint(ptId, newX);
  //   }

  // // Update ourselves and release memory
  // //
  // output->GetPointData()->CopyNormalsOff(); // distorted geometry
  // output->GetPointData()->PassData(input->GetPointData());
  // output->GetCellData()->CopyNormalsOff(); // distorted geometry
  // output->GetCellData()->PassData(input->GetCellData());

  // output->SetPoints(newPts);
  // newPts->Delete();

  // return 1;
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
