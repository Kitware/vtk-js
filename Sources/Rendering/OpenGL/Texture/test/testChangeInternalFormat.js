import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkOpenGLTexture from 'vtk.js/Sources/Rendering/OpenGL/Texture';

import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

const { VtkDataTypes } = vtkDataArray;

test.onlyIfWebGL('Changing internal format', (t) => {
  const gc = testUtils.createGarbageCollector(t);

  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  glwindow.initialize();

  const oglTex = vtkOpenGLTexture.newInstance({
    openGLRenderWindow: glwindow,
  });

  const gl = glwindow.get3DContext();
  let format = null;

  format = oglTex.getInternalFormat(VtkDataTypes.UNSIGNED_CHAR, 1);
  t.ok(format === gl.R8);

  format = oglTex.getInternalFormat(VtkDataTypes.FLOAT, 1);
  t.ok(format === gl.R16F);
});
