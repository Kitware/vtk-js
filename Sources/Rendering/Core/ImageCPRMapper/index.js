import { mat4, quat, vec3 } from 'gl-matrix';
import CoincidentTopologyHelper from 'vtk.js/Sources/Rendering/Core/Mapper/CoincidentTopologyHelper';
import vtkAbstractImageMapper from 'vtk.js/Sources/Rendering/Core/AbstractImageMapper';
import macro from 'vtk.js/Sources/macros';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyLine from 'vtk.js/Sources/Common/DataModel/PolyLine';

const { vtkErrorMacro } = macro;

const { staticOffsetAPI, otherStaticMethods } = CoincidentTopologyHelper;

// ----------------------------------------------------------------------------
// vtkImageCPRMapper methods
// ----------------------------------------------------------------------------

function vtkImageCPRMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageCPRMapper');

  const superClass = { ...publicAPI };

  /**
   * Public methods
   */
  publicAPI.getBounds = () => {
    const imageWidth = publicAPI.getWidth();
    const imageHeight = publicAPI.getHeight();
    return [0, imageWidth, 0, imageHeight, 0, 0];
  };

  publicAPI.getOrientationDataArray = () => {
    const pointData = publicAPI.getInputData(1)?.getPointData();
    if (!pointData) {
      return null;
    }
    if (model.orientationArrayName !== null) {
      return pointData.getArrayByName(model.orientationArrayName) || null;
    }
    return (
      pointData.getArrayByName('Orientation') ||
      pointData.getArrayByName('Direction') ||
      pointData.getVectors() ||
      pointData.getTensors() ||
      pointData.getNormals() ||
      null
    );
  };

  publicAPI.getOrientedCenterline = () => {
    const inputPolydata = publicAPI.getInputData(1);
    if (!inputPolydata) {
      // No polydata: return previous centerline
      // Don't reset centerline as it could have been set using setOrientedCenterline
      return model._orientedCenterline;
    }

    // Get dependencies of centerline
    const orientationDataArray = publicAPI.getOrientationDataArray();
    const linesDataArray = inputPolydata.getLines();
    const pointsDataArray = inputPolydata.getPoints();

    if (!model.useUniformOrientation && !orientationDataArray) {
      vtkErrorMacro(
        'Failed to create oriented centerline from polydata: no orientation'
      );
      publicAPI._resetOrientedCenterline();
      return model._orientedCenterline;
    }

    // If centerline didn't change, don't recompute
    const centerlineTime = model._orientedCenterline.getMTime();
    if (
      centerlineTime >= publicAPI.getMTime() &&
      centerlineTime > linesDataArray.getMTime() &&
      centerlineTime > pointsDataArray.getMTime() &&
      (model.useUniformOrientation ||
        centerlineTime > orientationDataArray.getMTime())
    ) {
      return model._orientedCenterline;
    }

    // Get points of the centerline
    const linesData = linesDataArray.getData();
    if (linesData.length <= 0) {
      // No polyline
      publicAPI._resetOrientedCenterline();
      return model._orientedCenterline;
    }
    const nPoints = linesData[0];
    if (nPoints <= 1) {
      // Empty centerline
      publicAPI._resetOrientedCenterline();
      return model._orientedCenterline;
    }
    const pointIndices = linesData.subarray(1, 1 + nPoints);

    // Get orientations of the centerline
    const orientations = new Array(nPoints);
    // Function to convert from mat4, mat3, quat or vec3 to quaternion
    let convert = () => null;
    const numComps = model.useUniformOrientation
      ? model.uniformOrientation.length
      : orientationDataArray.getNumberOfComponents();
    switch (numComps) {
      case 16:
        convert = mat4.getRotation;
        break;
      case 9:
        convert = (outQuat, inMat) => {
          quat.fromMat3(outQuat, inMat);
          quat.normalize(outQuat, outQuat);
        };
        break;
      case 4:
        convert = quat.copy;
        break;
      case 3:
        convert = (a, b) => quat.rotationTo(a, model.tangentDirection, b);
        break;
      default:
        vtkErrorMacro('Orientation doesnt match mat4, mat3, quat or vec3');
        publicAPI._resetOrientedCenterline();
        return model._orientedCenterline;
    }
    // Function to get orientation from point index
    let getOrientation = () => null;
    if (model.useUniformOrientation) {
      const outQuat = new Float64Array(4);
      convert(outQuat, model.uniformOrientation);
      getOrientation = () => outQuat;
    } else {
      const temp = new Float64Array(16);
      getOrientation = (i) => {
        const outQuat = new Float64Array(4);
        orientationDataArray.getTuple(i, temp);
        convert(outQuat, temp);
        return outQuat;
      };
    }
    // Fill the orientation array
    for (let i = 0; i < nPoints; ++i) {
      const pointIdx = pointIndices[i];
      orientations[i] = getOrientation(pointIdx);
    }

    // Done recomputing
    model._orientedCenterline.initialize(pointsDataArray, pointIndices);
    model._orientedCenterline.setOrientations(orientations);
    return model._orientedCenterline;
  };

  publicAPI.setOrientedCenterline = (centerline) => {
    if (model._orientedCenterline !== centerline) {
      model._orientedCenterline = centerline;
      return true;
    }
    return false;
  };

  publicAPI._resetOrientedCenterline = () => {
    model._orientedCenterline.initialize(vtkPoints.newInstance());
    model._orientedCenterline.setOrientations([]);
  };

  publicAPI.getMTime = () => {
    let mTime = superClass.getMTime();
    if (!model._orientedCenterline) {
      return mTime;
    }

    mTime = Math.max(mTime, model._orientedCenterline.getMTime());
    return mTime;
  };

  publicAPI.getHeight = () => {
    const accHeights = publicAPI
      .getOrientedCenterline()
      .getDistancesToFirstPoint();
    if (accHeights.length === 0) {
      return 0;
    }
    return accHeights[accHeights.length - 1];
  };

  publicAPI.getCenterlinePositionAndOrientation = (distance) => {
    const centerline = publicAPI.getOrientedCenterline();
    const subId = centerline.findPointIdAtDistanceFromFirstPoint(distance);
    if (subId < 0) {
      return {};
    }
    const distances = centerline.getDistancesToFirstPoint();
    const pcoords = [
      (distance - distances[subId]) / (distances[subId + 1] - distances[subId]),
    ];
    const weights = new Array(2);

    const position = new Array(3);
    centerline.evaluateLocation(subId, pcoords, position, weights);

    const orientation = new Array(4);
    if (!centerline.evaluateOrientation(subId, pcoords, orientation, weights)) {
      // No orientation
      return { position };
    }
    return { position, orientation };
  };

  publicAPI.getCenterlineTangentDirections = () => {
    const centerline = publicAPI.getOrientedCenterline();
    const directionsTime = model._centerlineTangentDirectionsTime.getMTime();
    if (directionsTime < centerline.getMTime()) {
      const orientations = centerline.getOrientations();
      model._centerlineTangentDirections = new Float32Array(
        3 * orientations.length
      );
      const localDirection = new Array(3);
      for (let i = 0; i < orientations.length; ++i) {
        vec3.transformQuat(
          localDirection,
          model.tangentDirection,
          orientations[i]
        );
        model._centerlineTangentDirections.set(localDirection, 3 * i);
      }
      model._centerlineTangentDirectionsTime.modified();
    }
    return model._centerlineTangentDirections;
  };

  publicAPI.getUniformDirection = () =>
    vec3.transformQuat(
      new Array(3),
      model.tangentDirection,
      model.uniformOrientation
    );

  publicAPI.getDirectionMatrix = () => {
    const tangent = model.tangentDirection;
    const bitangent = model.bitangentDirection;
    const normal = model.normalDirection;
    return new Float64Array([
      tangent[0],
      tangent[1],
      tangent[2],
      bitangent[0],
      bitangent[1],
      bitangent[2],
      normal[0],
      normal[1],
      normal[2],
    ]);
  };

  publicAPI.setDirectionMatrix = (mat) => {
    if (mat4.equals(mat, publicAPI.getDirectionMatrix())) {
      return false;
    }
    model.tangentDirection = [mat[0], mat[1], mat[2]];
    model.bitangentDirection = [mat[3], mat[4], mat[5]];
    model.normalDirection = [mat[6], mat[7], mat[8]];
    publicAPI.modified();
    return true;
  };

  // Check if the rendering can occur
  publicAPI.preRenderCheck = () => {
    if (!publicAPI.getInputData(0)) {
      vtkErrorMacro('No image data input');
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

  // One can also call setOrientedCenterline and not provide a polydata centerline to input 1
  model._orientedCenterline = vtkPolyLine.newInstance();
  publicAPI._resetOrientedCenterline();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  width: 10,
  uniformOrientation: [0, 0, 0, 1],
  useUniformOrientation: false,
  preferSizeOverAccuracy: false,
  orientationArrayName: null,
  tangentDirection: [1, 0, 0],
  bitangentDirection: [0, 1, 0],
  normalDirection: [0, 0, 1],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkAbstractImageMapper.extend(publicAPI, model, initialValues);

  // Two inputs: one for the ImageData and one for the PolyData (centerline)
  macro.algo(publicAPI, model, 2, 0);

  model._centerlineTangentDirectionsTime = {};
  macro.obj(model._centerlineTangentDirectionsTime, { mtime: 0 });

  // Setters and getters
  macro.setGet(publicAPI, model, [
    'width',
    'uniformOrientation',
    'useUniformOrientation',
    'preferSizeOverAccuracy',
    'orientationArrayName',
    'tangentDirection',
    'bitangentDirection',
    'normalDirection',
  ]);
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
