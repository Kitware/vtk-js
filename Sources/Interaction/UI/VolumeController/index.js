import macro from 'vtk.js/Sources/macro';
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkPiecewiseGaussianWidget from 'vtk.js/Sources/Interaction/Widgets/PiecewiseGaussianWidget';

import svgLogo from 'vtk.js/Sources/Interaction/UI/Icons/Logo.svg';
import svgEdge from 'vtk.js/Sources/Interaction/UI/Icons/Contrast.svg';
import svgSpacing from 'vtk.js/Sources/Interaction/UI/Icons/Spacing.svg';

import style from 'vtk.js/Sources/Interaction/UI/VolumeController/VolumeController.module.css';

// ----------------------------------------------------------------------------
// Global structures
// ----------------------------------------------------------------------------

const PRESETS_OPTIONS = vtkColorMaps.rgbPresetNames.map(
  (name) => `<option value="${name}">${name}</option>`
);

// ----------------------------------------------------------------------------
// vtkVolumeController methods
// ----------------------------------------------------------------------------

function vtkVolumeController(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkVolumeController');

  model.el = document.createElement('div');
  model.el.setAttribute('class', style.container);

  model.widget = vtkPiecewiseGaussianWidget.newInstance({
    numberOfBins: 256,
    size: model.size,
  });

  function updateUseShadow() {
    const useShadow = !!Number(model.el.querySelector('.js-shadow').value);
    model.actor.getProperty().setShade(useShadow);
    model.renderWindow.render();
  }

  function updateColorMapPreset() {
    const sourceDS = model.actor.getMapper().getInputData();
    const dataArray =
      sourceDS.getPointData().getScalars() ||
      sourceDS.getPointData().getArrays()[0];
    const dataRange = model.rescaleColorMap
      ? model.colorDataRange
      : dataArray.getRange();
    const preset = vtkColorMaps.getPresetByName(
      model.el.querySelector('.js-color-preset').value
    );
    const lookupTable = model.actor.getProperty().getRGBTransferFunction(0);
    lookupTable.applyColorMap(preset);
    lookupTable.setMappingRange(...dataRange);
    lookupTable.updateRange();
    model.renderWindow.render();
  }

  function updateSpacing() {
    const value = Number(model.el.querySelector('.js-spacing').value);
    const sourceDS = model.actor.getMapper().getInputData();
    const sampleDistance =
      0.7 *
      Math.sqrt(
        sourceDS
          .getSpacing()
          .map((v) => v * v)
          .reduce((a, b) => a + b, 0)
      );
    model.actor
      .getMapper()
      .setSampleDistance(sampleDistance * 2 ** (value * 3.0 - 1.5));
    model.renderWindow.render();
  }

  function updateEdgeGradient() {
    const value = Number(model.el.querySelector('.js-edge').value);
    if (value === 0) {
      model.actor.getProperty().setUseGradientOpacity(0, false);
    } else {
      const sourceDS = model.actor.getMapper().getInputData();
      const dataArray =
        sourceDS.getPointData().getScalars() ||
        sourceDS.getPointData().getArrays()[0];
      const dataRange = dataArray.getRange();
      model.actor.getProperty().setUseGradientOpacity(0, true);
      const minV = Math.max(0.0, value - 0.3) / 0.7;
      model.actor
        .getProperty()
        .setGradientOpacityMinimumValue(
          0,
          (dataRange[1] - dataRange[0]) * 0.2 * minV * minV
        );
      model.actor
        .getProperty()
        .setGradientOpacityMaximumValue(
          0,
          (dataRange[1] - dataRange[0]) * 1.0 * value * value
        );
    }
    model.renderWindow.render();
  }

  publicAPI.setupContent = (
    renderWindow,
    actor,
    isBackgroundDark,
    useShadow = '1',
    presetName = 'erdc_rainbow_bright'
  ) => {
    publicAPI.setActor(actor);
    publicAPI.setRenderWindow(renderWindow);

    const sourceDS = model.actor.getMapper().getInputData();
    const dataArray =
      sourceDS.getPointData().getScalars() ||
      sourceDS.getPointData().getArrays()[0];
    const lookupTable = model.actor.getProperty().getRGBTransferFunction(0);
    const piecewiseFunction = model.actor.getProperty().getScalarOpacity(0);

    const stylePostFix = isBackgroundDark ? 'DarkBG' : 'BrightBG';
    const localStyle = {};
    ['button', 'presets', 'shadow'].forEach((name) => {
      localStyle[name] = style[`${name}${stylePostFix}`];
    });
    model.el.innerHTML = `
      <div class="${style.line}">
        <div class="${localStyle.button} js-button">${svgLogo}</div>
        <select class="${localStyle.shadow} js-shadow js-toggle">
          <option value="1">Use Shadow</option>
          <option value="0">No Shadow</option>
        </select>
        <select class="${localStyle.presets} js-color-preset js-toggle">
          ${PRESETS_OPTIONS}
        </select>
      </div>
      <div class="${style.line} js-toggle">
        <div class="${style.sliderEntry}">
          <div class="${style.sliderIcon}">${svgSpacing}</div>
          <input type="range" min="0" max="1" value="0.4" step="0.01" class="${
            style.slider
          } js-spacing" />
        </div>
        <div class="${style.sliderEntry}">
          <div class="${style.sliderIcon}">${svgEdge}</div>
          <input type="range" min="0" max="1" value="0.2" step="0.01" class="${
            style.slider
          } js-edge" />
        </div>
      </div>
      <div class="${style.piecewiseEditor} js-pwf js-toggle"></div>
    `;

    // DOM elements
    const domToggleButton = model.el.querySelector('.js-button');
    const domShadow = model.el.querySelector('.js-shadow');
    const domPreset = model.el.querySelector('.js-color-preset');
    const domSpacing = model.el.querySelector('.js-spacing');
    const domEdge = model.el.querySelector('.js-edge');
    const widgetContainer = model.el.querySelector('.js-pwf');

    // Piecewise editor widget
    model.widget.updateStyle({
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
      histogramColor: 'rgba(100, 100, 100, 0.5)',
      strokeColor: 'rgb(0, 0, 0)',
      activeColor: 'rgb(255, 255, 255)',
      handleColor: 'rgb(50, 150, 50)',
      buttonDisableFillColor: 'rgba(255, 255, 255, 0.5)',
      buttonDisableStrokeColor: 'rgba(0, 0, 0, 0.5)',
      buttonStrokeColor: 'rgba(0, 0, 0, 1)',
      buttonFillColor: 'rgba(255, 255, 255, 1)',
      strokeWidth: 2,
      activeStrokeWidth: 3,
      buttonStrokeWidth: 1.5,
      handleWidth: 3,
      iconSize: 0,
      padding: 10,
    });
    model.widget.addGaussian(0.5, 1.0, 0.5, 0.5, 0.4);
    model.widget.setDataArray(dataArray.getData());
    model.widget.setColorTransferFunction(lookupTable);
    model.widget.applyOpacity(piecewiseFunction);
    model.widget.setContainer(widgetContainer);
    model.widget.bindMouseListeners();
    model.colorDataRange = model.widget.getOpacityRange();

    // Attach listeners
    domToggleButton.addEventListener('click', publicAPI.toggleVisibility);
    domShadow.addEventListener('change', updateUseShadow);
    domPreset.addEventListener('change', updateColorMapPreset);
    domSpacing.addEventListener('input', updateSpacing);
    domEdge.addEventListener('input', updateEdgeGradient);

    model.widget.onOpacityChange(() => {
      model.widget.applyOpacity(piecewiseFunction);
      model.colorDataRange = model.widget.getOpacityRange();
      if (model.rescaleColorMap) {
        updateColorMapPreset();
      }

      if (!model.renderWindow.getInteractor().isAnimating()) {
        model.renderWindow.render();
      }
    });

    model.widget.onAnimation((start) => {
      if (start) {
        model.renderWindow.getInteractor().requestAnimation(model.widget);
      } else {
        model.renderWindow.getInteractor().cancelAnimation(model.widget);
        model.renderWindow.render();
      }
    });

    lookupTable.onModified(() => {
      model.widget.render();
      if (!model.renderWindow.getInteractor().isAnimating()) {
        model.renderWindow.render();
      }
    });

    // Set default values
    domShadow.value = Number(useShadow) ? '1' : '0';
    domPreset.value = presetName;

    // Apply values
    updateUseShadow();
    updateColorMapPreset();
    updateSpacing();
    updateEdgeGradient();
  };

  publicAPI.setContainer = (el) => {
    if (model.container && model.container !== el) {
      model.container.removeChild(model.el);
    }
    if (model.container !== el) {
      model.container = el;
      if (model.container) {
        model.container.appendChild(model.el);
      }
      publicAPI.modified();
    }
  };

  const rescaleColorMap = publicAPI.setRescaleColorMap;
  publicAPI.setRescaleColorMap = (value) => {
    if (rescaleColorMap(value)) {
      updateColorMapPreset();
      return true;
    }
    return false;
  };

  publicAPI.toggleVisibility = () => {
    publicAPI.setExpanded(!publicAPI.getExpanded());
  };

  publicAPI.setExpanded = (expanded) => {
    const elements = model.el.querySelectorAll('.js-toggle');
    let count = elements.length;
    model.expanded = expanded;
    if (model.expanded) {
      while (count--) {
        elements[count].style.display = 'flex';
      }
    } else {
      while (count--) {
        elements[count].style.display = 'none';
      }
    }
  };

  publicAPI.getExpanded = () => model.expanded;

  publicAPI.setSize = model.widget.setSize;
  publicAPI.render = model.widget.render;
  publicAPI.onAnimation = model.widget.onAnimation;

  // Trigger rendering for any modified event
  publicAPI.onModified(publicAPI.render);
  publicAPI.setSize(...model.size);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  size: [600, 300],
  expanded: true,
  rescaleColorMap: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['actor', 'renderWindow', 'rescaleColorMap']);
  macro.get(publicAPI, model, ['widget']);

  // Object specific methods
  vtkVolumeController(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkVolumeController');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
