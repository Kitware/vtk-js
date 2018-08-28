import macro from 'vtk.js/Sources/macro';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

const { vtkErrorMacro } = macro;

class SegmentAgregator {
  constructor() {
    this.segmentMapping = {};
    this.segments = [null]; // to force first id to be 1
    this.faces = [];
  }

  addSegment(segment) {
    const first = segment[0];
    const last = segment[segment.length - 1];
    if (first === last || segment.length < 2) {
      return;
    }
    const mappingFirst = this.segmentMapping[first];
    const mappingLast = this.segmentMapping[last];
    if (mappingFirst !== undefined && mappingLast !== undefined) {
      if (Math.abs(mappingFirst) === Math.abs(mappingLast)) {
        // This make a closing loop
        const idx = mappingFirst < mappingLast ? mappingLast : mappingFirst;
        const seg = this.segments[idx];

        if (mappingFirst > 0) {
          for (let i = 1; i < segment.length - 1; i++) {
            seg.push(segment[i]);
          }
        } else {
          for (let i = 1; i < segment.length - 1; i++) {
            seg.push(segment[segment.length - 1 - i]);
          }
        }

        this.faces.push(seg);
        this.segments[idx] = null;
        this.segmentMapping[first] = undefined;
        this.segmentMapping[last] = undefined;
      } else {
        // we need to merge segments
        // strategie:
        // => remove and add them again in special order to induce merge
        const idxHead = Math.abs(mappingFirst);
        const idxTail = Math.abs(mappingLast);
        const segHead = this.segments[idxHead];
        const segTail = this.segments[idxTail];
        this.segments[idxHead] = null;
        this.segments[idxTail] = null;
        this.segmentMapping[segHead[0]] = undefined;
        this.segmentMapping[segTail[0]] = undefined;
        this.segmentMapping[segHead[segHead.length - 1]] = undefined;
        this.segmentMapping[segTail[segTail.length - 1]] = undefined;

        // This will lead to a single segment
        this.addSegment(segment);
        this.addSegment(segHead);
        this.addSegment(segTail);
      }
    } else if (mappingFirst !== undefined) {
      if (mappingFirst > 0) {
        // The head of our segment match the tail of the existing one
        const seg = this.segments[mappingFirst];
        for (let i = 1; i < segment.length; i++) {
          seg.push(segment[i]);
        }
        // record new tail
        this.segmentMapping[last] = mappingFirst;
      } else {
        // our segment should be reverted and put on the front of the existing one
        const seg = this.segments[-mappingFirst];
        // record new head
        this.segmentMapping[last] = -mappingFirst;

        for (let i = 1; i < segment.length; i++) {
          seg.unshift(segment[i]);
        }
      }
      // Erase used connection
      this.segmentMapping[first] = undefined;
    } else if (mappingLast !== undefined) {
      if (mappingLast > 0) {
        // The tail of our segment match the tail of the existing one
        const seg = this.segments[mappingLast];
        for (let i = 1; i < segment.length; i++) {
          seg.push(segment[segment.length - 1 - i]);
        }
        // record new tail
        this.segmentMapping[first] = mappingLast;
      } else {
        // our segment should be reverted and put on the front of the existing one
        const seg = this.segments[-mappingLast];

        // record new head
        this.segmentMapping[first] = -mappingLast;

        for (let i = 1; i < segment.length; i++) {
          seg.unshift(segment[segment.length - i - 1]);
        }
      }
      // Erase used connection
      this.segmentMapping[last] = undefined;
    } else {
      // store segment for now
      const id = this.segments.length;
      this.segments.push(segment);
      this.segmentMapping[first] = -id;
      this.segmentMapping[last] = id;
    }
  }
}

// ----------------------------------------------------------------------------
// vtkClosedPolyLineToSurfaceFilter methods
// ----------------------------------------------------------------------------

function vtkClosedPolyLineToSurfaceFilter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkClosedPolyLineToSurfaceFilter');

  // --------------------------------------------------------------------------

  publicAPI.requestData = (inData, outData) => {
    // implement requestData
    const input = inData[0];
    const output = vtkPolyData.newInstance();
    output.shallowCopy(input);

    if (!input) {
      vtkErrorMacro('Invalid or missing input');
      return;
    }

    // Extract faces
    const agregator = new SegmentAgregator();
    const lines = input.getLines().getData();
    let offset = 0;
    while (offset < lines.length) {
      const lineSize = lines[offset++];
      const lineSegment = [];
      for (let i = 0; i < lineSize; i++) {
        lineSegment.push(lines[offset + i]);
      }
      agregator.addSegment(lineSegment);
      offset += lineSize;
    }

    // Create CellArray for polys
    const { faces } = agregator;
    let cellArraySize = faces.length;
    for (let i = 0; i < faces.length; i++) {
      cellArraySize += faces[i].length;
    }
    const cellArray = new Uint16Array(cellArraySize);
    offset = 0;
    for (let i = 0; i < faces.length; i++) {
      const face = faces[i];
      cellArray[offset++] = face.length;
      for (let j = 0; j < face.length; j++) {
        cellArray[offset++] = face[j];
      }
    }
    output.setPolys(
      vtkCellArray.newInstance({ values: cellArray, name: 'faces' })
    );

    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  // Object specific methods
  vtkClosedPolyLineToSurfaceFilter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkClosedPolyLineToSurfaceFilter'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
