import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';

import {
  buildLidFaces,
  buildSideFaces,
  computeBevelVector,
  createShapePath,
  getBoundingSize,
  isClockWise,
  scalePoint,
  triangulateShape,
} from './Utils';

const { vtkErrorMacro, vtkWarningMacro } = macro;

// ----------------------------------------------------------------------------
// vtkVectorText methods
// ----------------------------------------------------------------------------

function vtkVectorText(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkVectorText');

  // -------------------------------------------------------------------------
  // Private methods
  // -------------------------------------------------------------------------

  /**
   * Process a shape into 3D geometry
   * @param {Object} shape - The shape to process
   * @param {Array} offsetSize - The offset size for positioning the shape
   * @param {Array} letterColor - The color for the shape
   */
  function addShape(shape, offsetSize, letterColor) {
    // extract contour + holes, offset them
    const curveSegments = model.curveSegments;
    const steps = model.steps;
    const depth = model.depth;

    // Calculate bevel parameters
    const bevelEnabled = model.bevelEnabled;
    let bevelThickness = model.bevelThickness;
    let bevelSize = bevelThickness - 0.1;
    let bevelOffset = model.bevelOffset;
    let bevelSegments = model.bevelSegments;

    if (!bevelEnabled) {
      bevelSegments = 0;
      bevelThickness = 0;
      bevelSize = 0;
      bevelOffset = 0;
    }

    // Extract points from shape
    const shapePoints = shape.extractPoints(curveSegments);
    let vertices = shapePoints.shape;
    const holes = shapePoints.holes;

    // Offset points to the correct position
    vertices.forEach((p) => {
      p[0] += offsetSize[0];
      p[1] += offsetSize[1];
    });
    holes.forEach((hole) => {
      hole.forEach((p) => {
        p[0] += offsetSize[0];
        p[1] += offsetSize[1];
      });
    });

    // Check if we have enough points to create a shape
    if (vertices.length < 3) {
      vtkWarningMacro('Not enough points to create a shape');
      return;
    }

    // Triangulate the shape
    const faces = triangulateShape(model.earcut, vertices, holes);
    const contour = vertices;

    // Combine all vertices (contour and holes)
    vertices = [...vertices, ...holes.flat()];
    const vlen = vertices.length;

    // Calculate bevel vectors for the contour
    const contourMovements = [];
    for (
      let i = 0, j = contour.length - 1, k = i + 1;
      i < contour.length;
      i++, j++, k++
    ) {
      if (j === contour.length) j = 0;
      if (k === contour.length) k = 0;
      contourMovements[i] = computeBevelVector(
        contour[i],
        contour[j],
        contour[k]
      );
    }

    // Calculate bevel vectors for the holes
    const holesMovements = [];
    let oneHoleMovements;
    let verticesMovements = [...contourMovements];
    for (let h = 0, hl = holes.length; h < hl; h++) {
      const ahole = holes[h];
      oneHoleMovements = [];
      for (
        let i = 0, j = ahole.length - 1, k = i + 1;
        i < ahole.length;
        i++, j++, k++
      ) {
        if (j === ahole.length) j = 0;
        if (k === ahole.length) k = 0;
        oneHoleMovements[i] = computeBevelVector(ahole[i], ahole[j], ahole[k]);
      }
      holesMovements.push(oneHoleMovements);
      verticesMovements = [...verticesMovements, ...oneHoleMovements];
    }

    // Generate all the layers of points
    const layers = [];

    // Bottom bevel layers
    for (let b = 0; b < bevelSegments; b++) {
      const t = b / bevelSegments;
      const z = bevelThickness * Math.cos((t * Math.PI) / 2);
      const bs = bevelSize * Math.sin((t * Math.PI) / 2) + bevelOffset;

      // Add points for contour and holes
      for (let i = 0; i < contour.length; i++) {
        const vert = scalePoint(contour[i], contourMovements[i], bs);
        layers.push(vert[0], vert[1], -z + offsetSize[2]);
      }

      for (let h = 0, hl = holes.length; h < hl; h++) {
        const ahole = holes[h];
        oneHoleMovements = holesMovements[h];
        for (let i = 0; i < ahole.length; i++) {
          const vert = scalePoint(ahole[i], oneHoleMovements[i], bs);
          layers.push(vert[0], vert[1], -z + offsetSize[2]);
        }
      }
    }

    // Base layer (z=0)
    const bs = bevelSize + bevelOffset;
    for (let i = 0; i < vlen; i++) {
      const vert = bevelEnabled
        ? scalePoint(vertices[i], verticesMovements[i], bs)
        : vertices[i];
      layers.push(vert[0], vert[1], 0 + offsetSize[2]);
    }

    // Middle layers
    for (let s = 1; s <= steps; s++) {
      for (let i = 0; i < vlen; i++) {
        const vert = bevelEnabled
          ? scalePoint(vertices[i], verticesMovements[i], bs)
          : vertices[i];
        layers.push(vert[0], vert[1], (depth / steps) * s + offsetSize[2]);
      }
    }

    // Top bevel layers
    for (let b = bevelSegments - 1; b >= 0; b--) {
      const t = b / bevelSegments;
      const z = bevelThickness * Math.cos((t * Math.PI) / 2);
      const topBevelSize =
        bevelSize * Math.sin((t * Math.PI) / 2) + bevelOffset;

      for (let i = 0, il = contour.length; i < il; i++) {
        const vert = scalePoint(contour[i], contourMovements[i], topBevelSize);
        layers.push(vert[0], vert[1], depth + z + offsetSize[2]);
      }

      for (let h = 0, hl = holes.length; h < hl; h++) {
        const ahole = holes[h];
        oneHoleMovements = holesMovements[h];
        for (let i = 0, il = ahole.length; i < il; i++) {
          const vert = scalePoint(ahole[i], oneHoleMovements[i], topBevelSize);
          layers.push(vert[0], vert[1], depth + z + offsetSize[2]);
        }
      }
    }

    // Build all the faces
    buildLidFaces(
      layers,
      faces,
      vlen,
      steps,
      bevelEnabled,
      bevelSegments,
      model.verticesArray,
      model.uvArray,
      model.colorArray,
      letterColor
    );
    buildSideFaces(
      layers,
      contour,
      holes,
      vlen,
      steps,
      bevelSegments,
      model.verticesArray,
      model.uvArray,
      model.colorArray,
      letterColor
    );
  }

  /**
   * Creates shape paths from the font and text
   */
  function buildShape() {
    model.shapes = [];
    if (!model.font || !model.text) {
      return;
    }

    const path = model.font.getPath(model.text, 0, 0, model.fontSize);
    if (!path || !path.commands || !path.commands.length) {
      return;
    }

    let first;
    let shapePath = createShapePath();
    const commands = path.commands;

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      // start a fresh shape if the previous one was closed
      shapePath = shapePath || createShapePath();

      switch (command.type) {
        case 'M': // Move to
          shapePath.moveTo(command.x, -command.y);
          first = command;
          break;

        case 'L': // Line to
          shapePath.lineTo(command.x, -command.y);
          break;

        case 'C': // Cubic bezier curve
          shapePath.bezierCurveTo(
            command.x1,
            -command.y1,
            command.x2,
            -command.y2,
            command.x,
            -command.y
          );
          break;

        case 'Q': // Quadratic bezier curve
          shapePath.quadraticCurveTo(
            command.x1,
            -command.y1,
            command.x,
            -command.y
          );
          break;

        case 'Z': // Close path
          // Close the contour
          shapePath.lineTo(first.x, -first.y);

          // Determine if this path is a clockwise contour (shape) or a counter-clockwise hole
          if (isClockWise(shapePath.getPoints(1))) {
            model.shapes.push(shapePath);
          } else {
            // Find which shape this hole belongs to
            for (let j = 0; j < model.shapes.length; j++) {
              const shape = model.shapes[j];
              if (shape.isIntersect(shapePath)) {
                shape.holes.push(shapePath);
                break;
              }
            }
          }

          // Mark for restart on next iteration
          shapePath = null;
          break;

        default:
          console.warn(`Unknown path command: ${command.type}`);
          break;
      }
    }

    // If there's an unclosed shape, add it
    if (shapePath) {
      model.shapes.push(shapePath);
    }
  }

  /**
   * Creates a vtkPolyData from the processed shapes
   * @returns {Object} vtkPolyData instance
   */
  function buildPolyData(polyData) {
    model.verticesArray = [];
    model.uvArray = [];
    model.colorArray = [];
    const cells = vtkCellArray.newInstance();
    const pointData = polyData.getPointData();

    // Calculate the bounding box to center the text
    const boundingSize = getBoundingSize(
      model.shapes,
      model.depth,
      model.curveSegments
    );
    const offsetSize = [0, 0, 0];
    vtkMath.subtract(boundingSize.min, boundingSize.max, offsetSize);

    // Process each shape
    let letterIndex = 0;
    model.shapes.forEach((shape) => {
      let color = null;
      if (model.perLetterFaceColors) {
        color = model.perLetterFaceColors(letterIndex) || [1, 1, 1];
      }
      addShape(shape, offsetSize, color);
      letterIndex++;
    });

    // Create triangle indices
    const vertexCount = model.verticesArray.length / 3;
    const indices = [];

    // Generate indices for triangles
    for (let i = 0; i < vertexCount; i += 3) {
      indices.push(i, i + 2, i + 1);
    }

    // Create cells for polydata
    const cellSize = indices.length;
    cells.resize(cellSize + cellSize / 3); // Allocate space for cells (+1 for size per cell)

    // Add triangles to cells
    for (let i = 0; i < indices.length; i += 3) {
      cells.insertNextCell([indices[i], indices[i + 1], indices[i + 2]]);
    }

    polyData.setPolys(cells);

    // Set points (vertices)
    polyData.getPoints().setData(Float32Array.from(model.verticesArray), 3);

    // Set texture coordinates
    const da = vtkDataArray.newInstance({
      numberOfComponents: 2,
      values: Float32Array.from(model.uvArray),
      name: 'TEXCOORD_0',
    });
    pointData.addArray(da);
    pointData.setActiveTCoords(da.getName());

    // Set color array if present
    if (model.colorArray && model.colorArray.length) {
      const ca = vtkDataArray.newInstance({
        numberOfComponents: 3,
        values: Uint8Array.from(model.colorArray),
        name: 'Colors',
      });
      pointData.addArray(ca);
      pointData.setActiveScalars(ca.getName());
    }

    return polyData;
  }

  // -------------------------------------------------------------------------
  // Public methods
  // -------------------------------------------------------------------------

  /**
   * Handles the request to generate vector text data
   * @param {Object} inData - Input data (not used)
   * @param {Object} outData - Output data target
   */
  publicAPI.requestData = (inData, outData) => {
    if (!model.font) {
      vtkErrorMacro(
        'Font object not set, make sure the TTF file is parsed using opentype.js.'
      );
      return;
    }

    if (!model.text) {
      vtkErrorMacro('Text not set. Cannot generate vector text.');
      return;
    }

    buildShape();
    const polyData = outData[0]?.initialize() || vtkPolyData.newInstance();
    buildPolyData(polyData);
    outData[0] = polyData;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

/**
 * Default values for the VectorText model
 * shapes: Array to store shape paths
 * verticesArray: Array of vertex coordinates
 * uvArray: Array of texture coordinates
 * font: Font object (from opentype.js)
 * earcut: Earcut module for triangulation
 * fontSize: Font size in points
 * depth: Depth of the extruded text
 * steps: Number of steps in extrusion (for curved surfaces)
 * bevelEnabled: Whether to add beveled edges
 * curveSegments: Number of segments for curved paths
 * bevelThickness: Thickness of the bevel
 * bevelSize: Size of the bevel
 * bevelOffset: Offset of the bevel
 * bevelSegments: Number of segments in the bevel
 * text: The text to render
 * perLetterFaceColors: Function to get per-letter face colors
 */
const DEFAULT_VALUES = {
  shapes: [],
  verticesArray: [],
  uvArray: [],
  font: null,
  earcut: null, // Earcut module for triangulation
  fontSize: 10,
  depth: 1,
  steps: 1,
  bevelEnabled: false,
  curveSegments: 12,
  bevelThickness: 0.2,
  bevelSize: 0.1,
  bevelOffset: 0,
  bevelSegments: 1,
  text: null,
  perLetterFaceColors: null, // (letterIndex: number) => [r,g,b]
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  macro.algo(publicAPI, model, 0, 1);

  // Build VTK API with automatic getters/setters
  macro.setGet(publicAPI, model, [
    'fontSize',
    'text',
    'depth',
    'steps',
    'bevelEnabled',
    'curveSegments',
    'bevelThickness',
    'bevelSize',
    'bevelOffset',
    'bevelSegments',
    'perLetterFaceColors',
  ]);

  macro.set(publicAPI, model, ['font']);

  vtkVectorText(publicAPI, model);
}

export const newInstance = macro.newInstance(extend, 'vtkVectorText');

export default { newInstance, extend };
