import CoincidentTopologyHelper from 'vtk.js/Sources/Rendering/Core/Mapper/CoincidentTopologyHelper';
import macro from 'vtk.js/Sources/macros';
import vtkAbstractMapper3D from 'vtk.js/Sources/Rendering/Core/AbstractMapper3D';
import { vec3 } from 'gl-matrix';

const { vtkErrorMacro } = macro;

const { staticOffsetAPI, otherStaticMethods } = CoincidentTopologyHelper;

// ----------------------------------------------------------------------------
// vtkImageCPRMapper methods
// ----------------------------------------------------------------------------

function vtkImageCPRMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageCPRMapper');

  /**
   * Private attributes and methods
   */

  // A list of pairs [pointIdxA, pointIdxB]
  model._segmentList = [];
  model._segmentListBuildTime = {};
  macro.obj(model._segmentListBuildTime, { mtime: 0 });

  model._setSegmentList = () => {
    const centerlinePolydata = publicAPI.getInputData(1);

    // Use cached segment list if possible
    const segmentListTime = model._segmentListBuildTime.getMTime();
    const centerlineTime = centerlinePolydata?.getMTime();
    if (segmentListTime > centerlineTime) {
      return;
    }

    model._segmentList = [];
    model._segmentListBuildTime.modified();
    publicAPI.modified();

    if (!centerlinePolydata) {
      return;
    }

    // For each line, add all the segments of the line to the list
    const linesData = centerlinePolydata.getLines().getData();
    for (let i = 0; i < linesData.length; ) {
      const nextLine = i + linesData[i] + 1;
      for (i += 2; i < nextLine; i++) {
        model._segmentList.push([linesData[i - 1], linesData[i]]);
      }
    }
  };

  // The accumulated height at index i is the sum of all segment heights between
  // index 0 to i (included) of the segments in model._segmentList
  model._accumulatedSegmentHeights = [];
  model._accumulatedSegmentHeightsBuildTime = {};
  macro.obj(model._accumulatedSegmentHeightsBuildTime, { mtime: 0 });

  model._setAccumulatedHeights = () => {
    const centerlinePolydata = publicAPI.getInputData(1);

    // Use cached height list if possible
    model._setSegmentList();
    const heightsTime = model._accumulatedSegmentHeightsBuildTime.getMTime();
    const segmentListTime = model._segmentListBuildTime.getMTime();
    const centerlineTime = centerlinePolydata?.getMTime();
    if (heightsTime > segmentListTime && heightsTime > centerlineTime) {
      return;
    }

    model._accumulatedSegmentHeights = [];
    model._accumulatedSegmentHeightsBuildTime.modified();
    publicAPI.modified();

    if (!centerlinePolydata) {
      return;
    }

    const pointsDataArray = centerlinePolydata.getPoints();
    let accumulatedHeight = 0;
    for (let i = 0; i < model._segmentList.length; i++) {
      const [ia, ib] = model._segmentList[i];
      const pa = pointsDataArray.getTuples(ia, ia + 1);
      const pb = pointsDataArray.getTuples(ib, ib + 1);
      accumulatedHeight += vec3.dist(pa, pb);
      model._accumulatedSegmentHeights[i] = accumulatedHeight;
    }
  };

  /**
   * Public methods
   */
  publicAPI.getBounds = () => {
    const imageWidth = publicAPI.getWidth();
    const imageHeight = publicAPI.getHeight();
    return [0, imageWidth, 0, imageHeight, 0, 0];
  };

  // An array of accumulated heights. The array at index i contains the sum of the height of all segments from 0 to i (included)
  publicAPI.getAccumulatedSegmentHeights = () => {
    model._setAccumulatedHeights();
    return model._accumulatedSegmentHeights;
  };

  publicAPI.getHeight = () => {
    const accHeights = publicAPI.getAccumulatedSegmentHeights();
    if (accHeights.length === 0) {
      return 0;
    }
    return accHeights[accHeights.length - 1];
  };

  // Update segments and return the internal segment list (do not mutate)
  publicAPI.getSegmentList = () => {
    model._setSegmentList();
    return model._segmentList;
  };

  publicAPI.getDirectionDataArray = () => {
    const pointData = publicAPI.getInputData(1)?.getPointData();
    if (!pointData) {
      return null;
    }
    if (model.directionArrayName !== null) {
      return pointData.getArrayByName(model.directionArrayName);
    }
    return (
      pointData.getArrayByName('Direction') ||
      pointData.getVectors() ||
      pointData.getTensors() ||
      pointData.getNormals()
    );
  };

  // Check if the rendering can occur
  publicAPI.preRenderCheck = () => {
    if (!publicAPI.getInputData(0)) {
      vtkErrorMacro('No image data input');
      return false;
    }
    if (!publicAPI.getInputData(1)) {
      vtkErrorMacro('No centerline input');
      return false;
    }
    return true;
  };

  publicAPI.setCenterlineData = (centerlineData) =>
    publicAPI.setInputData(centerlineData, 1);

  publicAPI.setCenterlineConnection = (centerlineConnection) =>
    publicAPI.setInputConnection(centerlineConnection, 1);

  publicAPI.setImageData = (imageData) => publicAPI.setInputData(imageData, 0);

  publicAPI.setImageConnection = (imageData) =>
    publicAPI.setInputConnection(imageData, 0);

  publicAPI.getIsOpaque = () => true;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  width: 10,
  uniformDirection: [1, 0, 0],
  useUniformDirection: false,
  preferSizeOverAccuracy: false,
  directionArrayName: null,
  directionArrayOffset: 0,
  outColor: [1, 0, 0, 1],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkAbstractMapper3D.extend(publicAPI, model, initialValues);

  // Two inputs: one for the ImageData and one for the PolyData (centerline)
  macro.algo(publicAPI, model, 2, 0);

  // Setters and getters
  macro.setGet(publicAPI, model, [
    'width',
    'useUniformDirection',
    'preferSizeOverAccuracy',
    'directionArrayName',
    'directionArrayOffset',
  ]);
  macro.setGetArray(publicAPI, model, ['uniformDirection'], 3);
  macro.setGetArray(publicAPI, model, ['outColor'], 4);
  CoincidentTopologyHelper.implementCoincidentTopologyMethods(publicAPI, model);

  // Object methods
  vtkImageCPRMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageCPRMapper');

// ----------------------------------------------------------------------------

export default {
  newInstance,
  extend,
  ...staticOffsetAPI,
  ...otherStaticMethods,
};
