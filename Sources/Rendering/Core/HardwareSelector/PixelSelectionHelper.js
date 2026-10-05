import macro from 'vtk.js/Sources/macros';
import vtkSelectionNode from 'vtk.js/Sources/Common/DataModel/SelectionNode';
import vtkDataSet from 'vtk.js/Sources/Common/DataModel/DataSet';

const { SelectionContent, SelectionField } = vtkSelectionNode;
const { FieldAssociations } = vtkDataSet;
const { vtkErrorMacro } = macro;

// These functions build selections from the pixels that a backend read back.
// The backend gives readPixel(displayPosition), which decodes one pixel and
// returns null when the pixel is outside the read area or hits no prop.
// Otherwise it returns { valid: true, prop, propID, compositeID,
// attributeID } and, with captured z values, zValue and displayPosition.

function readPixelAt(readPixel, position, outSelectedPosition) {
  outSelectedPosition[0] = position[0];
  outSelectedPosition[1] = position[1];
  const info = readPixel(position);
  if (info && info.valid) {
    return info;
  }
  return null;
}

// Look at the pixel, then at the sides of boxes that grow around it, up to
// maxDistance - 1 pixels. Returns the first hit. outSelectedPosition gets
// the position of that hit.
export function getPixelInformation(
  readPixel,
  inDisplayPosition,
  maxDistance,
  outSelectedPosition
) {
  let info = readPixelAt(readPixel, inDisplayPosition, outSelectedPosition);
  if (info || !(maxDistance > 0)) {
    return info;
  }

  const dispPos = [inDisplayPosition[0], inDisplayPosition[1]];
  const curPos = [0, 0];
  for (let dist = 1; dist < maxDistance; ++dist) {
    // Vertical sides of the box.
    for (let y = Math.max(dispPos[1] - dist, 0); y <= dispPos[1] + dist; ++y) {
      curPos[1] = y;
      if (dispPos[0] >= dist) {
        curPos[0] = dispPos[0] - dist;
        info = readPixelAt(readPixel, curPos, outSelectedPosition);
        if (info) {
          return info;
        }
      }
      curPos[0] = dispPos[0] + dist;
      info = readPixelAt(readPixel, curPos, outSelectedPosition);
      if (info) {
        return info;
      }
    }
    // Horizontal sides of the box.
    for (
      let x = Math.max(dispPos[0] - (dist - 1), 0);
      x <= dispPos[0] + (dist - 1);
      ++x
    ) {
      curPos[0] = x;
      if (dispPos[1] >= dist) {
        curPos[1] = dispPos[1] - dist;
        info = readPixelAt(readPixel, curPos, outSelectedPosition);
        if (info) {
          return info;
        }
      }
      curPos[1] = dispPos[1] + dist;
      info = readPixelAt(readPixel, curPos, outSelectedPosition);
      if (info) {
        return info;
      }
    }
  }

  // nothing hit.
  outSelectedPosition[0] = inDisplayPosition[0];
  outSelectedPosition[1] = inDisplayPosition[1];
  return null;
}

function getInfoHash(info) {
  return `${info.propID} ${info.compositeID}`;
}

function convertSelection(dataMap, options) {
  const sel = [];
  dataMap.forEach((value) => {
    const child = vtkSelectionNode.newInstance();
    child.setContentType(SelectionContent.INDICES);
    switch (options.fieldAssociation) {
      case FieldAssociations.FIELD_ASSOCIATION_CELLS:
        child.setFieldType(SelectionField.CELL);
        break;
      case FieldAssociations.FIELD_ASSOCIATION_POINTS:
        child.setFieldType(SelectionField.POINT);
        break;
      default:
        vtkErrorMacro('Unknown field association');
    }
    const properties = child.getProperties();
    properties.propID = value.info.propID;
    properties.prop = value.info.prop;
    properties.compositeID = value.info.compositeID;
    properties.attributeID = value.info.attributeID;
    properties.pixelCount = value.pixelCount;
    if (options.captureZValues) {
      const [x, y] = value.info.displayPosition;
      properties.displayPosition = [x, y, value.info.zValue];
      properties.worldPosition = options.displayToWorld(
        x,
        y,
        value.info.zValue
      );
    }
    child.setSelectionList(value.attributeIDs);
    sel.push(child);
  });
  return sel;
}

// Make one selection node for each prop and composite id that the pixels of
// the area fx1, fy1, fx2, fy2 hit. options has fieldAssociation,
// captureZValues and, with captureZValues, displayToWorld(x, y, z).
export function generateSelection(readPixel, fx1, fy1, fx2, fy2, options) {
  const x1 = Math.floor(fx1);
  const y1 = Math.floor(fy1);
  const x2 = Math.floor(fx2);
  const y2 = Math.floor(fy2);

  const dataMap = new Map();
  for (let yy = y1; yy <= y2; yy++) {
    for (let xx = x1; xx <= x2; xx++) {
      const info = readPixel([xx, yy]);
      if (info && info.valid) {
        const hash = getInfoHash(info);
        let dmv = dataMap.get(hash);
        if (!dmv) {
          dmv = { info, pixelCount: 0, attributeIDs: [] };
          dataMap.set(hash, dmv);
        } else if (options.captureZValues && info.zValue < dmv.info.zValue) {
          dmv.info = info;
        }
        dmv.pixelCount++;
        // A pixel can hit a prop with no attribute id: in point selection,
        // the WebGL backend writes ids only where it draws the points.
        if (
          info.attributeID !== undefined &&
          dmv.attributeIDs.indexOf(info.attributeID) === -1
        ) {
          dmv.attributeIDs.push(info.attributeID);
        }
      }
    }
  }
  return convertSelection(dataMap, options);
}

export default { getPixelInformation, generateSelection };
