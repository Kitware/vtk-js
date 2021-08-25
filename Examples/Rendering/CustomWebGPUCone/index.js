import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for WebGPU)
import 'vtk.js/Sources/Rendering/WebGPU/Profiles/Geometry';

import * as macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkWebGPUPolyDataMapper from 'vtk.js/Sources/Rendering/WebGPU/PolyDataMapper';

import controlPanel from './controller.html';

// ----------------------------------------------------------------------------
// This example shows how to extend the rendering capabilities in vtk.js. It
// assumes you have an understanding of grapics concepts and classes in
// vtk.js
//
// vtk.js uses a data-view model where data and properties are stored in
// classes such as vtkActor and vtkMapper and then an api specific view is
// created to view the data. That view uses a factory mechanism to create
// api specific classes to render the data classes. WebGL and WebGPU are two
// such APIs.
//
// This example shows how to create your own data class named
// vtkCustomMapper that has a new wonkyness property. The new class inherits
// from vtkMapper. This example also creates a WebGPU specific
// implementaiton for that class called vtkWebGPUCustomMapper that inherits
// from vtkWebGPUPolyDataMapper. That class adds a wonkyness uniform to the
// UBO and some shader code to use it. Then it shows how to get the factory
// form the api sepcific render window, check that it is for WebGPU and then
// add the oevrride. While this example only shows adding an override for WebGPU
// it could also add a WebGL override as well. You would need to create a
// vtkWebGLCustomMapper and do the same basic steps.
//
// This approach gives you the ability to really customize and control almost
// every aspect of the mapper (or other classes) api specific implementatoons
// but you will have to look through the exisiting classes for WebGPU or WebGL
// to see how to implement the specific feature you are interested in.
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Setup our custom class that extends Mapper
// ----------------------------------------------------------------------------
const newCustomMapper = macro.newInstance(
  (publicAPI, model, initialValues = {}) => {
    Object.assign(model, { wonkyness: 0.05 }, initialValues);

    // Inheritance
    vtkMapper.extend(publicAPI, model, initialValues);
    macro.setGet(publicAPI, model, ['wonkyness']);

    // Set our className
    model.classHierarchy.push('vtkCustomMapper');
  },
  'vtkCustomMapper'
);

// ----------------------------------------------------------------------------
// Setup our custom class that implements it in WebGPU
// ----------------------------------------------------------------------------
const newWebGPUCustomMapper = macro.newInstance(
  (publicAPI, model, initialValues = {}) => {
    Object.assign(model, {}, initialValues);

    // Inheritance
    vtkWebGPUPolyDataMapper.extend(publicAPI, model, initialValues);

    // update the Shader code template so we can add in our own stuff
    publicAPI.setFragmentShaderTemplate(
      model.fragmentShaderTemplate.replace(
        '//VTK::Normal::Impl',
        '//VTK::Normal::Impl\n\n//VTK::Wonkyness::Impl'
      )
    );

    // add a new entry into the UBO
    model.UBO.addEntry('Wonkyness', 'f32');

    // Set our className
    model.classHierarchy.push('vtkWebGPUCustomMapper');

    // override methods
    const superClass = { ...publicAPI };

    // set our new UBO entry from the generic class value
    publicAPI.updateUBO = () => {
      model.UBO.setValue('Wonkyness', model.renderable.getWonkyness());
      superClass.updateUBO();
    };

    // add some new shader code
    publicAPI.replaceShaderWonkyness = (hash, pipeline, vertexInput) => {
      const vDesc = pipeline.getShaderDescription('vertex');
      // our wonkyness only works on thinsg with normals so handle it
      // gracefully. This makes it safe to use input.normalVC in our shader
      // code.
      if (vDesc.hasOutput('normalVC')) {
        const fDesc = pipeline.getShaderDescription('fragment');
        let code = fDesc.getCode();
        code = code.replace(
          '//VTK::Wonkyness::Impl',
          `
            diffuseColor = (1.0 - mapperUBO.Wonkyness) * diffuseColor
            + vec4<f32>(mapperUBO.Wonkyness*input.normalVC, 1.0);
            `
        );
        fDesc.setCode(code);
      }
    };
    publicAPI.setShaderReplacement(
      'replaceShaderWonkyness',
      publicAPI.replaceShaderWonkyness
    );
  },
  'vtkWebGPUCustomMapper'
);

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.2, 0.2, 0.3],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Register our class as an override if it is a WebGPU factory
// If we wrote a WebGL version then we could have an else clause
// below where we check for webGL and add that version if so.
// ----------------------------------------------------------------------------
const apiRW = fullScreenRenderer.getApiSpecificRenderWindow();
const vnfactory = apiRW.getViewNodeFactory();
if (vnfactory.getClassName().includes('WebGPU')) {
  vnfactory.registerOverride('vtkCustomMapper', newWebGPUCustomMapper);
}

const coneSource = vtkConeSource.newInstance({ height: 1.0, resolution: 20 });

const mapper = newCustomMapper();
mapper.setInputConnection(coneSource.getOutputPort());

const actor = vtkActor.newInstance();
actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);
const wonkynessChange = document.querySelector('.wonkyness');
const representationSelector = document.querySelector('.representations');

representationSelector.addEventListener('change', (e) => {
  const newRepValue = Number(e.target.value);
  actor.getProperty().setRepresentation(newRepValue);
  renderWindow.render();
});

wonkynessChange.addEventListener('input', (e) => {
  const resolution = Number(e.target.value);
  mapper.setWonkyness(resolution / 100.0);
  renderWindow.render();
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = coneSource;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
