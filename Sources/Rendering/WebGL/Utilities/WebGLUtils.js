// Show GL informations
export function showGlInfo(gl) {
  const vertexUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
  const fragmentUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
  const combinedUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
  console.log('vertex texture image units:', vertexUnits);
  console.log('fragment texture image units:', fragmentUnits);
  console.log('combined texture image units:', combinedUnits);
}

// Compile a shader
function compileShader(gl, src, type) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, src);

  // Compile and check status
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // Something went wrong during compilation; get the error
    const lastError = gl.getShaderInfoLog(shader);
    console.error(`Error compiling shader '${shader}': ${lastError}`);
    gl.deleteShader(shader);

    return null;
  }

  return shader;
}

// Create a shader program
function createShaderProgram(gl, shaders) {
  const program = gl.createProgram();

  for (let i = 0; i < shaders.length; i++) {
    gl.attachShader(program, shaders[i]);
  }

  gl.linkProgram(program);

  // Check the link status
  const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    // something went wrong with the link
    const lastError = gl.getProgramInfoLog(program);
    console.error('Error in program linking:', lastError);
    gl.deleteProgram(program);

    return null;
  }

  program.shaders = shaders;
  gl.useProgram(program);

  return program;
}

// Apply new mapping to a program
export function applyProgramDataMapping(gl, programName, mappingName, glConfig, glResources) {
  const program = glResources.programs[programName];
  const mapping = glConfig.mappings[mappingName];

  mapping.forEach((bufferMapping) => {
    const glBuffer = glResources.buffers[bufferMapping.id];

    gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
    program[bufferMapping.name] = gl.getAttribLocation(program, bufferMapping.attribute);
    gl.enableVertexAttribArray(program[bufferMapping.name]);
    gl.vertexAttribPointer.apply(gl, [program[bufferMapping.name]].concat(bufferMapping.format));
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  });
}

// Create a shader program
function buildShaderProgram(gl, name, config, resources) {
  const progConfig = config.programs[name];
  const compiledVertexShader = compileShader(gl, progConfig.vertexShader, gl.VERTEX_SHADER);
  const compiledFragmentShader = compileShader(gl, progConfig.fragmentShader, gl.FRAGMENT_SHADER);
  const program = createShaderProgram(gl, [compiledVertexShader, compiledFragmentShader]);

  // Store the created program in the resources
  resources.programs[name] = program;

  // Handle mapping if any
  if (progConfig.mapping) {
    applyProgramDataMapping(gl, name, progConfig.mapping, config, resources);
  }

  // Return program
  return program;
}

// Bind texture to Framebuffer
export function bindTextureToFramebuffer(gl, fbo, texture) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texImage2D(gl.TEXTURE_2D,
                0, gl.RGBA, fbo.width, fbo.height,
                0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                          gl.TEXTURE_2D, texture, 0);

  // Check fbo status
  const fbs = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (fbs !== gl.FRAMEBUFFER_COMPLETE) {
    console.log('ERROR: There is a problem with the framebuffer:', fbs);
  }

  // Clear the bindings we created in this function.
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

// Free GL resources
function freeGLResources(glResources) {
  const gl = glResources.gl;

  // Delete each program
  Object.keys(glResources.programs).forEach(programName => {
    const program = glResources.programs[programName];
    const shaders = program.shaders;

    let count = shaders.length;

    // Delete shaders
    while (count--) {
      gl.deleteShader(shaders[count]);
    }

    // Delete program
    gl.deleteProgram(program);
  });

  // Delete framebuffers
  Object.keys(glResources.framebuffers).forEach(fbName => {
    gl.deleteFramebuffer(glResources.framebuffers[fbName]);
  });

  // Delete textures
  Object.keys(glResources.textures).forEach(textureName => {
    gl.deleteTexture(glResources.textures[textureName]);
  });

  // Delete buffers
  Object.keys(glResources.buffers).forEach(bufferName => {
    gl.deleteBuffer(glResources.buffers[bufferName]);
  });
}

// Create GL resources
export function createGLResources(gl, glConfig) {
  const resources = { gl, buffers: {}, textures: {}, framebuffers: {}, programs: {} };
  const buffers = glConfig.resources.buffers || [];
  const textures = glConfig.resources.textures || [];
  const framebuffers = glConfig.resources.framebuffers || [];

  // Create Buffer
  buffers.forEach((buffer) => {
    const glBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffer.data, gl.STATIC_DRAW);
    resources.buffers[buffer.id] = glBuffer;
  });

  // Create Texture
  textures.forEach((texture) => {
    const glTexture = gl.createTexture();
    const pixelStore = texture.pixelStore || [];
    const texParameter = texture.texParameter || [];

    gl.bindTexture(gl.TEXTURE_2D, glTexture);

    pixelStore.forEach((option) => {
      gl.pixelStorei(gl[option[0]], option[1]);
    });

    texParameter.forEach((option) => {
      gl.texParameteri(gl.TEXTURE_2D, gl[option[0]], gl[option[1]]);
    });

    resources.textures[texture.id] = glTexture;
  });

  // Create Framebuffer
  framebuffers.forEach((framebuffer) => {
    const glFramebuffer = gl.createFramebuffer();
    glFramebuffer.width = framebuffer.width;
    glFramebuffer.height = framebuffer.height;

    resources.framebuffers[framebuffer.id] = glFramebuffer;
  });

  // Create programs
  Object.keys(glConfig.programs).forEach(programName => {
    buildShaderProgram(gl, programName, glConfig, resources);
  });

  // Add destroy function
  resources.destroy = () => { freeGLResources(resources); };

  return resources;
}

//----------------------------------------------------------------------------

export function transformShader(shaderContent, variableDict, config) {
  let match = null;
  let unrolledContents = null;
  let shaderString = shaderContent;

  // First do all the variable replacements
  Object.keys(variableDict).forEach(vname => {
    const value = variableDict[vname];
    const r = new RegExp(`\\$\\{${vname}\\}`, 'g');
    shaderString = shaderString.replace(r, value);
  });

  // Now check if any loops need to be inlined
  if (config.inlineLoops) {
    const loopRegex = /\/\/@INLINE_LOOP([\s\S]+?)(?=\/\/@INLINE_LOOP)\/\/@INLINE_LOOP/;

    match = shaderString.match(loopRegex);
    while (match) {
      const capture = match[1];
      const infoRegex = /^\s*\(([^\),]+)\s*,\s*([^\),]+)\s*,\s*([^\)]+)\)/;
      const infoRegexMatch = capture.match(infoRegex);
      const loopVariableName = infoRegexMatch[1];
      const loopMin = infoRegexMatch[2];
      const loopCount = infoRegexMatch[3];
      const forLoop = capture.replace(infoRegex, '');
      const loopContentsRegex = /^\s*[^\{]+\{([\s\S]+?)\s*\}\s*$/;
      const forLoopMatch = forLoop.match(loopContentsRegex);
      const loopBody = forLoopMatch[1];
      const loopBodyReplacer = new RegExp(loopVariableName, 'g');

      unrolledContents = '';
      for (let i = loopMin; i < loopCount; ++i) {
        unrolledContents += loopBody.replace(loopBodyReplacer, i);
        unrolledContents += '\n';
      }

      shaderString = shaderString.replace(loopRegex, unrolledContents);
      match = shaderString.match(loopRegex);
    }
  }

  if (config.debug) {
    console.log('Transformed shader string:');
    console.log(shaderString);
  }

  return shaderString;
}

//----------------------------------------------------------------------------

export default {
  applyProgramDataMapping,
  bindTextureToFramebuffer,
  createGLResources,
  showGlInfo,
  transformShader,
};
