import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '../../macros.js';
import vtkColorTransferFunction from './ColorTransferFunction.js';
import vtkPiecewiseFunction from '../../Common/DataModel/PiecewiseFunction.js';
import Constants from './VolumeProperty/Constants.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var InterpolationType = Constants.InterpolationType,
    OpacityMode = Constants.OpacityMode;
var vtkErrorMacro = macro.vtkErrorMacro;
var VTK_MAX_VRCOMP = 4; 
// ----------------------------------------------------------------------------
// vtkVolumeProperty methods
// ----------------------------------------------------------------------------

function vtkVolumeProperty(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkVolumeProperty');

  publicAPI.getMTime = function () {
    var mTime = model.mtime;
    var time;

    for (var index = 0; index < VTK_MAX_VRCOMP; index++) {
      
      // Color MTimes 
      if (model.componentData[index].colorChannels === 1) {
        if (model.componentData[index].grayTransferFunction) {
          // time that Gray transfer function was last modified
          time = model.componentData[index].grayTransferFunction.getMTime();
          mTime = mTime > time ? mTime : time;
        }
      } else if (model.componentData[index].colorChannels === 3) {
        if (model.componentData[index].rGBTransferFunction) {
          // time that RGB transfer function was last modified
          time = model.componentData[index].rGBTransferFunction.getMTime();
          mTime = mTime > time ? mTime : time;
        }
      } // Opacity MTimes


      if (model.componentData[index].scalarOpacity) {
        // time that Scalar opаacity transfer function was last modified
        time = model.componentData[index].scalarOpacity.getMTime();
        mTime = mTime > time ? mTime : time;
      }

      if (model.componentData[index].gradientOpacity) {
        if (!model.componentData[index].disableGradientOpacity) {
          // time that Gradient opacity transfer function was last modified
          time = model.componentData[index].gradientOpacity.getMTime();
          mTime = mTime > time ? mTime : time;
        }
      }


    }

    return mTime;
  };

  publicAPI.getDisableGradientOpacity = function (index) {
    return model.componentData[index].DisableGradientOpacity;
  }

  publicAPI.getGradientOpacity = function (index) {
    if (model.componentData[index].disableGradientOpacity) {
      if (!model.componentData[index].defaultGradientOpacity) {
        publicAPI.createDefaultGradientOpacity(index);
      }
      return publicAPI.defaultGradientOpacity[index]; 
    }
    return publicAPI.getStoredGradientOpacity(index); 
  }

  publicAPI.getStoredGradientOpacity = function (index) {
    if (model.componentData[index]) {
      model.componentData[index].gradientOpacity = vtkPiecewiseFunction.newInstance(); 
      model.componentData[index].gradientOpacity.addPoint(0, 1.0);
      model.componentData[index].gradientOpacity.addPoint(255, 1.0);
    }

    return model.componentData[index].gradientOpacity;
  }

  publicAPI.setDisableGradientOpacity = function (index, value) {
    if (model.componentData[index].disableGradientOpacity == value) {
      return;
    }
    
    model.componentData[index].disableGradientOpacity = value; 

    if (value) {
      publicAPI.createDefaultGradientOpacity(index);
    } 
    
    
    /*
     if (this->DisableGradientOpacity[index] == value)
      {
        return;
      }

      this->DisableGradientOpacity[index] = value;

      // Make sure the default function is up-to-date (since the user
      // could have modified the default function)

      if (value)
      {
        this->CreateDefaultGradientOpacity(index);
      }

      // Since this Ivar basically "sets" the gradient opacity function to be
      // either a default one or the user-specified one, update the MTime
      // accordingly

      this->GradientOpacityMTime[index].Modified();

      this->Modified();
    */
  }
  
  publicAPI.createDefaultGradientOpacity = function (index) {
    if (!model.componentData[index].defaultGradientOpacity) {
      model.componentData[index].defaultGradientOpacity = vtkPiecewiseFunction.newInstance();
      // research about register. 
    }

    model.componentData[index].defaultGradientOpacity.removeAllPoints();
    model.componentData[index].defaultGradientOpacity.addPoint(0, 1.0);
    model.componentData[index].defaultGradientOpacity.addPoint(255, 1.0);
  }

  publicAPI.getColorChannels = function (index) {
    if (index < 0 || index > 3) {
      vtkErrorMacro('Bad index - must be between 0 and 3');
      return 0;
    }

    return model.componentData[index].colorChannels;
  }; // Set the color of a volume to a gray transfer function


  publicAPI.setGrayTransferFunction = function (index, func) {
    var modified = false;

    if (model.componentData[index].grayTransferFunction !== func) {
      model.componentData[index].grayTransferFunction = func;
      modified = true;
    }

    if (model.componentData[index].colorChannels !== 1) {
      model.componentData[index].colorChannels = 1;
      modified = true;
    }

    if (modified) {
      publicAPI.modified();
    }

    return modified;
  }; // Get the currently set gray transfer function. Create one if none set.


  publicAPI.getGrayTransferFunction = function (index) {
    if (model.componentData[index].grayTransferFunction === null) {
      model.componentData[index].grayTransferFunction = vtkPiecewiseFunction.newInstance();
      model.componentData[index].grayTransferFunction.addPoint(0, 0.0);
      model.componentData[index].grayTransferFunction.addPoint(1024, 1.0);

      if (model.componentData[index].colorChannels !== 1) {
        model.componentData[index].colorChannels = 1;
      }

      publicAPI.modified();
    }

    return model.componentData[index].grayTransferFunction;
  }; // Set the color of a volume to an RGB transfer function


  publicAPI.setRGBTransferFunction = function (index, func) {
    var modified = false;

    if (model.componentData[index].rGBTransferFunction !== func) {
      model.componentData[index].rGBTransferFunction = func;
      modified = true;
    }

    if (model.componentData[index].colorChannels !== 3) {
      model.componentData[index].colorChannels = 3;
      modified = true;
    }

    if (modified) {
      publicAPI.modified();
    }

    return modified;
  }; // Get the currently set RGB transfer function. Create one if none set.


  publicAPI.getRGBTransferFunction = function (index) {
    if (model.componentData[index].rGBTransferFunction === null) {
      model.componentData[index].rGBTransferFunction = vtkColorTransferFunction.newInstance();
      model.componentData[index].rGBTransferFunction.addRGBPoint(0, 0.0, 0.0, 0.0);
      model.componentData[index].rGBTransferFunction.addRGBPoint(1024, 1.0, 1.0, 1.0);

      if (model.componentData[index].colorChannels !== 3) {
        model.componentData[index].colorChannels = 3;
      }

      publicAPI.modified();
    }

    return model.componentData[index].rGBTransferFunction;
  }; // Set the scalar opacity of a volume to a transfer function


  publicAPI.setScalarOpacity = function (index, func) {
    if (model.componentData[index].scalarOpacity !== func) {
      model.componentData[index].scalarOpacity = func;
      publicAPI.modified();
      return true;
    }

    return false;
  }; // Get the scalar opacity transfer function. Create one if none set.


  publicAPI.getScalarOpacity = function (index) {
    if (model.componentData[index].scalarOpacity === null) {
      model.componentData[index].scalarOpacity = vtkPiecewiseFunction.newInstance();
      model.componentData[index].scalarOpacity.addPoint(0, 1.0);
      model.componentData[index].scalarOpacity.addPoint(1024, 1.0);
      publicAPI.modified();
    }

    return model.componentData[index].scalarOpacity;
  };

  publicAPI.setComponentWeight = function (index, value) {
    if (index < 0 || index >= VTK_MAX_VRCOMP) {
      vtkErrorMacro('Invalid index');
      return false;
    }

    var val = Math.min(1, Math.max(0, value));

    if (model.componentData[index].componentWeight !== val) {
      model.componentData[index].componentWeight = val;
      publicAPI.modified();
      return true;
    }

    return false;
  };

  publicAPI.getComponentWeight = function (index) {
    if (index < 0 || index >= VTK_MAX_VRCOMP) {
      vtkErrorMacro('Invalid index');
      return 0.0;
    }

    return model.componentData[index].componentWeight;
  };

  publicAPI.setInterpolationTypeToNearest = function () {
    return publicAPI.setInterpolationType(InterpolationType.NEAREST);
  };

  publicAPI.setInterpolationTypeToLinear = function () {
    return publicAPI.setInterpolationType(InterpolationType.LINEAR);
  };

  publicAPI.setInterpolationTypeToFastLinear = function () {
    return publicAPI.setInterpolationType(InterpolationType.FAST_LINEAR);
  };

  publicAPI.getInterpolationTypeAsString = function () {
    return macro.enumToString(InterpolationType, model.interpolationType);
  };

  var sets = ['useGradientOpacity', 'scalarOpacityUnitDistance', 'gradientOpacityMinimumValue', 'gradientOpacityMinimumOpacity', 'gradientOpacityMaximumValue', 'gradientOpacityMaximumOpacity', 'opacityMode'];
  sets.forEach(function (val) {
    var cap = macro.capitalize(val);

    publicAPI["set".concat(cap)] = function (index, value) {
      if (model.componentData[index]["".concat(val)] !== value) {
        model.componentData[index]["".concat(val)] = value;
        publicAPI.modified();
        return true;
      }

      return false;
    };
  });
  var gets = ['useGradientOpacity', 'scalarOpacityUnitDistance', 'gradientOpacityMinimumValue', 'gradientOpacityMinimumOpacity', 'gradientOpacityMaximumValue', 'gradientOpacityMaximumOpacity', 'opacityMode'];
  gets.forEach(function (val) {
    var cap = macro.capitalize(val);

    publicAPI["get".concat(cap)] = function (index) {
      return model.componentData[index]["".concat(val)];
    };
  });
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  independentComponents: true,
  interpolationType: InterpolationType.FAST_LINEAR,
  shade: false,
  ambient: 0.1,
  diffuse: 0.7,
  specular: 0.2,
  specularPower: 10.0,
  useLabelOutline: false,
  labelOutlineThickness: 1,
  labelOutlineOpacity: 1.0
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Build VTK API

  macro.obj(publicAPI, model);

  if (!model.componentData) {
    model.componentData = [];

    for (var i = 0; i < VTK_MAX_VRCOMP; ++i) {
      model.componentData.push({
        colorChannels: 1,
        grayTransferFunction: null,
        rGBTransferFunction: null, 
        scalarOpacity: null,
        scalarOpacityUnitDistance: 1.0,
        opacityMode: OpacityMode.FRACTIONAL,
        gradientOpacityMinimumValue: 0,
        gradientOpacityMinimumOpacity: 0.0,
        gradientOpacityMaximumValue: 1.0,
        gradientOpacityMaximumOpacity: 1.0,
        useGradientOpacity: false,
        componentWeight: 1.0,
        disableGradientOpacity: 0,
        gradientOpacity: null,
        defaultGradientOpacity: null,
      });
    }
  }

  macro.setGet(publicAPI, model, ['independentComponents', 'interpolationType', 'shade', 'ambient', 'diffuse', 'specular', 'specularPower', 'useLabelOutline', 'labelOutlineThickness', 'labelOutlineOpacity']); // Object methods

  vtkVolumeProperty(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkVolumeProperty'); // ----------------------------------------------------------------------------

var vtkVolumeProperty$1 = _objectSpread({
  newInstance: newInstance,
  extend: extend
}, Constants);

export { vtkVolumeProperty$1 as default, extend, newInstance };
