/**
 * Even when the EXT_texture_norm16 extension is present, linear filtering
 * might not be supported for normalized fixed point textures.
 *
 * This is a driver bug. See https://github.com/KhronosGroup/WebGL/issues/3706
 * @return {boolean}
 */
function supportsNorm16Linear() {
  try {
    const canvasSize = 4;
    const texWidth = 2;
    const texHeight = 1;
    const texData = new Int16Array([0, 2 ** 15 - 1]);
    const pixelToCheck = [1, 1];

    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const gl = canvas.getContext('webgl2');
    if (!gl) {
      return false;
    }

    const ext = gl.getExtension('EXT_texture_norm16');
    if (!ext) {
      return false;
    }

    const vs = `#version 300 es
    void main() {
      gl_PointSize = ${canvasSize.toFixed(1)};
      gl_Position = vec4(0, 0, 0, 1);
    }
  `;
    const fs = `#version 300 es
    precision highp float;
    precision highp int;
    precision highp sampler2D;

    uniform sampler2D u_image;

    out vec4 color;

    void main() {
        vec4 intColor = texture(u_image, gl_PointCoord.xy);
        color = vec4(vec3(intColor.rrr), 1);
    }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vs);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      return false;
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fs);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      return false;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return false;
    }

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      ext.R16_SNORM_EXT,
      texWidth,
      texHeight,
      0,
      gl.RED,
      gl.SHORT,
      texData
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.useProgram(program);
    gl.drawArrays(gl.POINTS, 0, 1);

    const pixel = new Uint8Array(4);
    gl.readPixels(
      pixelToCheck[0],
      pixelToCheck[1],
      1,
      1,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixel
    );
    const [r, g, b] = pixel;

    const webglLoseContext = gl.getExtension('WEBGL_lose_context');
    if (webglLoseContext) {
      webglLoseContext.loseContext();
    }

    return r === g && g === b && r !== 0;
  } catch (e) {
    return false;
  }
}

/**
 * @type {boolean | undefined}
 */
let supportsNorm16LinearCache;

function supportsNorm16LinearCached() {
  // Only create a canvas+texture+shaders the first time
  if (supportsNorm16LinearCache === undefined) {
    supportsNorm16LinearCache = supportsNorm16Linear();
  }

  return supportsNorm16LinearCache;
}

export default supportsNorm16LinearCached;
