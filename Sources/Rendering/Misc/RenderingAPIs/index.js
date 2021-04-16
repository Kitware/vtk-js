// register default rendering backends. Currently
// WebGL and WebGPU. To use this just import this
// file and then call something like
//   const apiview = myRenderWindow.newAPISpecificView();
//   apiview.setContainer(renderWindowContainer);
//   myRenderWindow.addView(apiview);
//
import 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import 'vtk.js/Sources/Rendering/WebGPU/RenderWindow';
