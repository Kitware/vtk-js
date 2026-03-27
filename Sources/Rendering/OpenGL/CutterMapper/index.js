import { mat4 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macros';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkShaderProgram from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';
import vtkOpenGLPolyDataMapper from 'vtk.js/Sources/Rendering/OpenGL/PolyDataMapper';
import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';

import { IDENTITY } from 'vtk.js/Sources/Common/Core/Math/Constants';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkOpenGLCutterMapper methods
// ----------------------------------------------------------------------------

function vtkOpenGLCutterMapper(publicAPI, model) {
  model.classHierarchy.push('vtkOpenGLCutterMapper');

  const superClass = { ...publicAPI };

  publicAPI.replaceShaderClip = (shaders, ren, actor) => {
    let VSSource = shaders.Vertex;
    let FSSource = shaders.Fragment;
    const functionName = model.renderable.getSupportedImplicitFunctionName();

    if (!functionName) {
      vtkErrorMacro(`No cut function set.`);
      return;
    }

    if (model.renderable.getNumberOfClippingPlanes()) {
      const numClipPlanes = model.renderable.getNumberOfClippingPlanes();
      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Clip::Dec', [
        'uniform int numClipPlanes;',
        `uniform vec4 clipPlanes[${numClipPlanes}];`,
        `varying float clipDistancesVSOutput[${numClipPlanes}];`,
        '//VTK::Clip::Dec',
      ]).result;

      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Clip::Impl', [
        `for (int planeNum = 0; planeNum < ${numClipPlanes}; planeNum++)`,
        '    {',
        '    if (planeNum >= numClipPlanes)',
        '        {',
        '        break;',
        '        }',
        '    clipDistancesVSOutput[planeNum] = dot(clipPlanes[planeNum], vertexMC);',
        '    }',
        '//VTK::Clip::Impl',
      ]).result;

      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Clip::Dec', [
        'uniform int numClipPlanes;',
        `varying float clipDistancesVSOutput[${numClipPlanes}];`,
        '//VTK::Clip::Dec',
      ]).result;

      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Clip::Impl', [
        `for (int planeNum = 0; planeNum < ${numClipPlanes}; planeNum++)`,
        '    {',
        '    if (planeNum >= numClipPlanes)',
        '        {',
        '        break;',
        '        }',
        '    if (clipDistancesVSOutput[planeNum] < 0.0) discard;',
        '    }',
        '//VTK::Clip::Impl',
      ]).result;
    }

    let cutDistanceDec = [];
    let cutDistanceImpl = [];

    switch (functionName) {
      case 'vtkPlane':
        cutDistanceDec = [
          'uniform vec3 cutPlaneOrigin;',
          'uniform vec3 cutPlaneNormal;',
          'uniform float cutValue;',
        ];
        cutDistanceImpl = [
          'cutDistanceVSOutput = dot(cutPlaneNormal, cutFunctionPoint - cutPlaneOrigin) - cutValue;',
        ];
        break;
      case 'vtkSphere':
        cutDistanceDec = [
          'uniform vec3 cutSphereCenter;',
          'uniform vec3 cutSphereRadius;',
          'uniform int cutSphereUsesAxisRadii;',
        ];
        cutDistanceImpl = [
          'vec3 cutSphereDelta = cutFunctionPoint - cutSphereCenter;',
          'if (cutSphereUsesAxisRadii == 1) {',
          '  vec3 cutSphereNormalizedDelta = cutSphereDelta / cutSphereRadius;',
          '  cutDistanceVSOutput = dot(cutSphereNormalizedDelta, cutSphereNormalizedDelta) - 1.0;',
          '} else {',
          '  cutDistanceVSOutput = dot(cutSphereDelta, cutSphereDelta) - cutSphereRadius.x * cutSphereRadius.x;',
          '}',
        ];
        break;
      case 'vtkBox':
        cutDistanceDec = [
          'uniform vec3 cutBoxMinPoint;',
          'uniform vec3 cutBoxMaxPoint;',
        ];
        cutDistanceImpl = [
          'float cutBoxMinDistance = -1.0e20;',
          'float cutBoxDistance = 0.0;',
          'bool cutBoxInside = true;',
          'bool cutBoxIsDegenerate = false;',
          'for (int i = 0; i < 3; ++i) {',
          '  float cutBoxLength = cutBoxMaxPoint[i] - cutBoxMinPoint[i];',
          '  float cutBoxDist = 0.0;',
          '  if (cutBoxLength != 0.0) {',
          '    float cutBoxT = (cutFunctionPoint[i] - cutBoxMinPoint[i]) / cutBoxLength;',
          '    if (cutBoxT < 0.0) {',
          '      cutBoxInside = false;',
          '      cutBoxDist = cutBoxMinPoint[i] - cutFunctionPoint[i];',
          '    } else if (cutBoxT > 1.0) {',
          '      cutBoxInside = false;',
          '      cutBoxDist = cutFunctionPoint[i] - cutBoxMaxPoint[i];',
          '    } else if (cutBoxT <= 0.5) {',
          '      cutBoxDist = cutBoxMinPoint[i] - cutFunctionPoint[i];',
          '      cutBoxMinDistance = max(cutBoxMinDistance, cutBoxDist);',
          '    } else {',
          '      cutBoxDist = cutFunctionPoint[i] - cutBoxMaxPoint[i];',
          '      cutBoxMinDistance = max(cutBoxMinDistance, cutBoxDist);',
          '    }',
          '  } else {',
          '    // Degenerate axis: box has zero thickness along this dimension',
          '    cutBoxIsDegenerate = true;',
          '    cutBoxDist = abs(cutFunctionPoint[i] - cutBoxMinPoint[i]);',
          '    if (cutBoxDist > 0.0) {',
          '      cutBoxInside = false;',
          '    }',
          '  }',
          '  if (cutBoxDist > 0.0) {',
          '    cutBoxDistance += cutBoxDist * cutBoxDist;',
          '  }',
          '}',
          '// Guard against degenerate boxes (zero size on one or more axes)',
          'if (cutBoxIsDegenerate && cutBoxInside) {',
          '  cutDistanceVSOutput = 0.0;',
          '} else if (cutBoxInside) {',
          '  cutDistanceVSOutput = cutBoxMinDistance;',
          '} else {',
          '  cutDistanceVSOutput = sqrt(cutBoxDistance);',
          '}',
        ];
        break;
      case 'vtkCylinder':
        cutDistanceDec = [
          'uniform vec3 cutCylinderCenter;',
          'uniform vec3 cutCylinderAxis;',
          'uniform float cutCylinderRadius;',
        ];
        cutDistanceImpl = [
          'vec3 cutCylinderDelta = cutFunctionPoint - cutCylinderCenter;',
          'float cutCylinderAxisLengthSq = dot(cutCylinderAxis, cutCylinderAxis);',
          'float cutCylinderProjection = dot(cutCylinderAxis, cutCylinderDelta);',
          'cutDistanceVSOutput = cutCylinderAxisLengthSq > 0.0 ? dot(cutCylinderDelta, cutCylinderDelta) - cutCylinderProjection * cutCylinderProjection / cutCylinderAxisLengthSq - cutCylinderRadius * cutCylinderRadius : dot(cutCylinderDelta, cutCylinderDelta) - cutCylinderRadius * cutCylinderRadius;',
        ];
        break;
      case 'vtkCone':
        cutDistanceDec = ['uniform float cutConeTanThetaSquared;'];
        cutDistanceImpl = [
          'cutDistanceVSOutput = cutFunctionPoint.y * cutFunctionPoint.y + cutFunctionPoint.z * cutFunctionPoint.z - cutFunctionPoint.x * cutFunctionPoint.x * cutConeTanThetaSquared;',
        ];
        break;
      default:
        vtkErrorMacro(`No cut function set.`);
        break;
    }

    VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Clip::Dec', [
      'uniform mat4 cutFunctionMatrix;',
      'varying float cutDistanceVSOutput;',
      ...cutDistanceDec,
    ]).result;

    VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Clip::Impl', [
      'vec3 cutFunctionPoint = (cutFunctionMatrix * vertexMC).xyz;',
      ...cutDistanceImpl,
    ]).result;

    FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Clip::Dec', [
      'varying float cutDistanceVSOutput;',
      'uniform float cutWidth;',
    ]).result;

    FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Clip::Impl', [
      'if (abs(cutDistanceVSOutput) > max(fwidth(cutDistanceVSOutput) * cutWidth, 1e-6)) discard;',
    ]).result;

    shaders.Vertex = VSSource;
    shaders.Fragment = FSSource;
  };

  publicAPI.replaceShaderValues = (shaders, ren, actor) => {
    superClass.replaceShaderValues(shaders, ren, actor);

    if (model.renderable.getSupportedImplicitFunctionName()) {
      shaders.Fragment = vtkShaderProgram.substitute(
        shaders.Fragment,
        '//VTK::UniformFlow::Impl',
        [
          '  float cutterDistanceDx = dFdx(cutDistanceVSOutput);',
          '  float cutterDistanceDy = dFdy(cutDistanceVSOutput);',
          '  float cutterDistanceGradient = length(vec2(cutterDistanceDx, cutterDistanceDy));',
          '  if (cutterDistanceGradient <= 0.0 && abs(cutDistanceVSOutput) > 1e-6) discard;',
        ]
      ).result;
    }
  };

  publicAPI.setMapperShaderParameters = (cellBO, ren, actor) => {
    superClass.setMapperShaderParameters(cellBO, ren, actor);

    const cutFunction = model.renderable.getCutFunction();
    const functionName = model.renderable.getSupportedImplicitFunctionName();
    if (!cutFunction || !functionName) {
      return;
    }

    const shiftScaleEnabled = cellBO.getCABO().getCoordShiftAndScaleEnabled();
    const inverseShiftScaleMatrix = shiftScaleEnabled
      ? cellBO.getCABO().getInverseShiftAndScaleMatrix()
      : null;
    if (shiftScaleEnabled && !inverseShiftScaleMatrix) {
      vtkErrorMacro(
        'Failed to retrieve inverse shift and scale matrix for cut function'
      );
    }
    const cutFunctionTransform = cutFunction.getTransform?.();
    const transformMatrix = cutFunctionTransform?.getMatrix
      ? Array.from(cutFunctionTransform.getMatrix())
      : IDENTITY;
    const cutFunctionMatrix = inverseShiftScaleMatrix
      ? mat4.multiply(model.tmpMat4, transformMatrix, inverseShiftScaleMatrix)
      : transformMatrix;

    const program = cellBO.getProgram();
    if (program.isUniformUsed('cutFunctionMatrix')) {
      program.setUniformMatrix('cutFunctionMatrix', cutFunctionMatrix);
    }

    switch (functionName) {
      case 'vtkPlane':
        if (program.isUniformUsed('cutPlaneOrigin')) {
          program.setUniform3fArray('cutPlaneOrigin', cutFunction.getOrigin());
        }
        if (program.isUniformUsed('cutPlaneNormal')) {
          program.setUniform3fArray('cutPlaneNormal', cutFunction.getNormal());
        }
        if (program.isUniformUsed('cutValue')) {
          program.setUniformf('cutValue', model.renderable.getCutValue());
        }
        break;
      case 'vtkSphere': {
        const radius = cutFunction.getRadius();
        if (program.isUniformUsed('cutSphereCenter')) {
          program.setUniform3fArray('cutSphereCenter', cutFunction.getCenter());
        }
        if (program.isUniformUsed('cutSphereRadius')) {
          const radiusArray = model.tmpVec3A;
          if (Array.isArray(radius)) {
            radiusArray[0] = radius[0];
            radiusArray[1] = radius[1];
            radiusArray[2] = radius[2];
          } else {
            radiusArray[0] = radius;
            radiusArray[1] = radius;
            radiusArray[2] = radius;
          }
          program.setUniform3fArray('cutSphereRadius', radiusArray);
        }
        if (program.isUniformUsed('cutSphereUsesAxisRadii')) {
          program.setUniformi(
            'cutSphereUsesAxisRadii',
            Array.isArray(radius) ? 1 : 0
          );
        }
        break;
      }
      case 'vtkBox': {
        const bounds = cutFunction.getBounds();
        if (program.isUniformUsed('cutBoxMinPoint')) {
          const minPoint = model.tmpVec3A;
          minPoint[0] = bounds[0];
          minPoint[1] = bounds[2];
          minPoint[2] = bounds[4];
          program.setUniform3fArray('cutBoxMinPoint', minPoint);
        }
        if (program.isUniformUsed('cutBoxMaxPoint')) {
          const maxPoint = model.tmpVec3B;
          maxPoint[0] = bounds[1];
          maxPoint[1] = bounds[3];
          maxPoint[2] = bounds[5];
          program.setUniform3fArray('cutBoxMaxPoint', maxPoint);
        }
        break;
      }
      case 'vtkCylinder':
        if (program.isUniformUsed('cutCylinderCenter')) {
          program.setUniform3fArray(
            'cutCylinderCenter',
            cutFunction.getCenter()
          );
        }
        if (program.isUniformUsed('cutCylinderAxis')) {
          program.setUniform3fArray('cutCylinderAxis', cutFunction.getAxis());
        }
        if (program.isUniformUsed('cutCylinderRadius')) {
          program.setUniformf('cutCylinderRadius', cutFunction.getRadius());
        }
        break;
      case 'vtkCone':
        if (program.isUniformUsed('cutConeTanThetaSquared')) {
          const tanTheta = Math.tan(
            vtkMath.radiansFromDegrees(cutFunction.getAngle())
          );
          program.setUniformf('cutConeTanThetaSquared', tanTheta * tanTheta);
        }
        break;
      default:
        vtkErrorMacro(`No cut function set.`);
        break;
    }

    if (program.isUniformUsed('cutWidth')) {
      program.setUniformf('cutWidth', model.renderable.getCutWidth());
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  tmpVec3A: null,
  tmpVec3B: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkOpenGLPolyDataMapper.extend(publicAPI, model, initialValues);

  model.tmpVec3A = [0.0, 0.0, 0.0];
  model.tmpVec3B = [0.0, 0.0, 0.0];

  vtkOpenGLCutterMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLCutterMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to OpenGL backend if imported
registerOverride('vtkCutterMapper', newInstance);
