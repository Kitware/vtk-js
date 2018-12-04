import macro from 'vtk.js/Sources/macro';
import Constants from 'vtk.js/Sources/Rendering/OpenGL/HardwareSelector/Constants';
import vtkOpenGLFramebuffer from 'vtk.js/Sources/Rendering/OpenGL/Framebuffer';
import vtkSelectionNode from 'vtk.js/Sources/Common/DataModel/SelectionNode';
import vtkDataSet from 'vtk.js/Sources/Common/DataModel/DataSet';

const { PassTypes } = Constants;
const { SelectionContent, SelectionField } = vtkSelectionNode;
const { FieldAssociations } = vtkDataSet;
const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkOpenGLHardwareSelector methods
// ----------------------------------------------------------------------------

function vtkOpenGLHardwareSelector(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLHardwareSelector');

  //----------------------------------------------------------------------------
  publicAPI.releasePixBuffers = () => {
    model.pixBuffer = [];
  };

  //----------------------------------------------------------------------------
  publicAPI.beginSelection = () => {
    model.openGLRenderer = model.openGLRenderWindow.getViewNodeFor(
      model.renderer
    );
    model.maxAttributeId = 0;

    const size = model.openGLRenderWindow.getSize();
    if (!model.framebuffer) {
      model.framebuffer = vtkOpenGLFramebuffer.newInstance();
      model.framebuffer.setOpenGLRenderWindow(model.openGLRenderWindow);
      model.framebuffer.saveCurrentBindingsAndBuffers();
      model.framebuffer.create(size[0], size[1]);
      model.framebuffer.populateFramebuffer();
    } else {
      model.framebuffer.setOpenGLRenderWindow(model.openGLRenderWindow);
      model.framebuffer.saveCurrentBindingsAndBuffers();
      const fbSize = model.framebuffer.getSize();
      if (fbSize[0] !== size[0] || fbSize[1] !== size[1]) {
        model.framebuffer.create(size[0], size[1]);
        model.framebuffer.populateFramebuffer();
      }
    }

    model.openGLRenderer.clear();
    model.openGLRenderer.setSelector(publicAPI);
    model.hitProps = {};
    model.props = [];
    publicAPI.releasePixBuffers();
  };

  //----------------------------------------------------------------------------
  publicAPI.endSelection = () => {
    model.hitProps = {};
    model.openGLRenderer.setSelector(null);
    model.framebuffer.restorePreviousBindingsAndBuffers();
  };

  publicAPI.preCapturePass = () => {};

  publicAPI.postCapturePass = () => {};

  //----------------------------------------------------------------------------
  publicAPI.select = () => {
    let sel = null;
    if (publicAPI.captureBuffers()) {
      sel = publicAPI.generateSelection(
        model.area[0],
        model.area[1],
        model.area[2],
        model.area[3]
      );
      publicAPI.releasePixBuffers();
    }
    return sel;
  };

  //----------------------------------------------------------------------------
  publicAPI.captureBuffers = () => {
    if (!model.renderer || !model.openGLRenderWindow) {
      vtkErrorMacro('Renderer and view must be set before calling Select.');
      return false;
    }

    model.openGLRenderer = model.openGLRenderWindow.getViewNodeFor(
      model.renderer
    );

    // int rgba[4];
    // rwin.getColorBufferSizes(rgba);
    // if (rgba[0] < 8 || rgba[1] < 8 || rgba[2] < 8) {
    //   vtkErrorMacro("Color buffer depth must be atleast 8 bit. "
    //     "Currently: " << rgba[0] << ", " << rgba[1] << ", " <<rgba[2]);
    //   return false;
    // }
    publicAPI.invokeEvent({ type: 'StartEvent' });

    // Initialize renderer for selection.
    // change the renderer's background to black, which will indicate a miss
    model.originalBackground = model.renderer.getBackgroundByReference();
    model.renderer.setBackground(0.0, 0.0, 0.0);

    publicAPI.beginSelection();
    for (
      model.currentPass = PassTypes.MIN_KNOWN_PASS;
      model.currentPass <= PassTypes.COMPOSITE_INDEX_PASS;
      model.currentPass++
    ) {
      console.log(`in pass ${model.currentPass}`);
      if (publicAPI.passRequired(model.currentPass)) {
        publicAPI.preCapturePass(model.currentPass);
        model.openGLRenderWindow.traverseAllPasses();
        publicAPI.postCapturePass(model.currentPass);

        publicAPI.savePixelBuffer(model.currentPass);
      }
    }
    publicAPI.endSelection();

    // restore original background
    model.renderer.setBackground(model.originalBackground);
    publicAPI.invokeEvent({ type: 'EndEvent' });

    // restore image, not needed?
    // model.openGLRenderWindow.traverseAllPasses();
    return true;
  };

  //----------------------------------------------------------------------------
  publicAPI.passRequired = (pass) => true;

  //----------------------------------------------------------------------------
  publicAPI.savePixelBuffer = (passNo) => {
    model.pixBuffer[passNo] = model.openGLRenderWindow.getPixelData(
      model.area[0],
      model.area[1],
      model.area[2],
      model.area[3]
    );
    if (passNo === PassTypes.ACTOR_PASS) {
      publicAPI.buildPropHitList(model.pixBuffer[passNo]);
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.buildPropHitList = (pixelbuffer) => {
    for (let yy = 0; yy <= model.area[3] - model.area[1]; yy++) {
      for (let xx = 0; xx <= model.area[2] - model.area[0]; xx++) {
        let val = publicAPI.convert(xx, yy, pixelbuffer);
        if (val > 0) {
          val--;
          if (!(val in model.hitProps)) {
            model.hitProps[val] = true;
          }
        }
      }
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.renderProp = (prop) => {
    if (model.currentPass === PassTypes.ACTOR_PASS) {
      publicAPI.setPropColorValueFromInt(model.props.length + model.idOffset);
      model.props.push(prop);
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.renderCompositeIndex = (index) => {
    if (model.currentPass === PassTypes.COMPOSITE_INDEX_PASS) {
      publicAPI.setPropColorValueFromInt(index + model.idOffset);
    }
  };

  //----------------------------------------------------------------------------
  // TODO: make inline
  publicAPI.renderAttributeId = (attribid) => {
    if (attribid < 0) {
      // negative attribid is valid. It happens when rendering higher order
      // elements where new points are added for rendering smooth surfaces.
      return;
    }

    model.maxAttributeId =
      attribid > model.maxAttributeId ? attribid : model.maxAttributeId;

    // if (model.currentPass < PassTypes.ID_LOW24) {
    //   return; // useless...
    // }
  };

  //----------------------------------------------------------------------------
  publicAPI.getPropFromID = (id) => {
    if (id >= 0 && id < model.props.length) {
      return model.props[id];
    }
    return null;
  };

  //----------------------------------------------------------------------------
  publicAPI.passTypeToString = (type) => macro.enumToString(PassTypes, type);

  //----------------------------------------------------------------------------
  publicAPI.isPropHit = (id) => Boolean(model.hitProps[id]);

  publicAPI.convert = (xx, yy, pb) => {
    if (!pb) {
      return 0;
    }
    const offset = (yy * (model.area[2] - model.area[0] + 1) + xx) * 4;
    const rgb = [];
    rgb[0] = pb[offset];
    rgb[1] = pb[offset + 1];
    rgb[2] = pb[offset + 2];
    let val = rgb[2];
    val *= 256;
    val += rgb[1];
    val *= 256;
    val += rgb[0];
    return val;
  };

  publicAPI.setPropColorValueFromInt = (val) => {
    model.propColorValue[0] = (val % 256) / 255.0;
    model.propColorValue[1] = ((val / 256) % 256) / 255.0;
    model.propColorValue[2] = ((val / 65536) % 256) / 255.0;
  };

  // info has
  //   valid
  //   propId
  //   prop
  //   compositeID
  //   attributeID

  //----------------------------------------------------------------------------
  publicAPI.getPixelInformation = (
    inDisplayPosition,
    maxDistance,
    outSelectedPosition
  ) => {
    // Base case
    const maxDist = maxDistance < 0 ? 0 : maxDistance;
    if (maxDist === 0) {
      outSelectedPosition[0] = inDisplayPosition[0];
      outSelectedPosition[1] = inDisplayPosition[1];
      if (
        inDisplayPosition[0] < model.area[0] ||
        inDisplayPosition[0] > model.area[2] ||
        inDisplayPosition[1] < model.area[1] ||
        inDisplayPosition[1] > model.area[3]
      ) {
        return null;
      }

      // offset inDisplayPosition based on the lower-left-corner of the Area.
      const displayPosition = [
        inDisplayPosition[0] - model.area[0],
        inDisplayPosition[1] - model.area[1],
      ];

      const actorid = publicAPI.convert(
        displayPosition[0],
        displayPosition[1],
        model.pixBuffer[PassTypes.ACTOR_PASS]
      );
      if (actorid <= 0) {
        // the pixel did not hit any actor.
        return null;
      }

      const info = {};
      info.valid = true;

      info.propID = actorid - model.idOffset;
      info.prop = publicAPI.getPropFromID(info.propID);

      let compositeID = publicAPI.convert(
        displayPosition[0],
        displayPosition[1],
        model.pixBuffer[PassTypes.COMPOSITE_INDEX_PASS]
      );
      if (compositeID < 0 || compositeID > 0xffffff) {
        compositeID = 0;
      }
      info.compositeID = compositeID - model.idOffset;

      // const low24 = publicAPI.convert(
      //   displayPosition[0], displayPosition[1], model.pixBuffer[PassTypes.ID_LOW24]);

      // // id 0 is reserved for nothing present.
      // info.attributeID = low24 - model.idOffset;
      // if (info.attributeID < 0) {
      //   // the pixel did not hit any cell.
      //   return null;
      // }
      return info;
    }

    // Iterate over successively growing boxes.
    // They recursively call the base case to handle single pixels.
    const dispPos = [inDisplayPosition[0], inDisplayPosition[1]];
    const curPos = [0, 0];
    let info = publicAPI.getPixelInformation(
      inDisplayPosition,
      0,
      outSelectedPosition
    );
    if (info && info.valid) {
      return info;
    }
    for (let dist = 1; dist < maxDist; ++dist) {
      // Vertical sides of box.
      for (
        let y = dispPos[1] > dist ? dispPos[1] - dist : 0;
        y <= dispPos[1] + dist;
        ++y
      ) {
        curPos[1] = y;
        if (dispPos[0] >= dist) {
          curPos[0] = dispPos[0] - dist;
          info = publicAPI.getPixelInformation(curPos, 0, outSelectedPosition);
          if (info && info.valid) {
            return info;
          }
        }
        curPos[0] = dispPos[0] + dist;
        info = publicAPI.getPixelInformation(curPos, 0, outSelectedPosition);
        if (info && info.valid) {
          return info;
        }
      }
      // Horizontal sides of box.
      for (
        let x = dispPos[0] >= dist ? dispPos[0] - (dist - 1) : 0;
        x <= dispPos[0] + (dist - 1);
        ++x
      ) {
        curPos[0] = x;
        if (dispPos[1] >= dist) {
          curPos[1] = dispPos[1] - dist;
          info = publicAPI.getPixelInformation(curPos, 0, outSelectedPosition);
          if (info && info.valid) {
            return info;
          }
        }
        curPos[1] = dispPos[1] + dist;
        info = publicAPI.getPixelInformation(curPos, 0, outSelectedPosition);
        if (info && info.valid) {
          return info;
        }
      }
    }

    // nothing hit.
    outSelectedPosition[0] = inDisplayPosition[0];
    outSelectedPosition[1] = inDisplayPosition[1];
    return null;
  };

  //-----------------------------------------------------------------------------
  publicAPI.convertSelection = (fieldassociation, dataMap) => {
    const sel = [];

    let count = 0;
    dataMap.forEach((value, key) => {
      const child = vtkSelectionNode.newInstance();
      child.setContentType(SelectionContent.INDICES);
      switch (fieldassociation) {
        case FieldAssociations.FIELD_ASSOCIATION_CELLS:
          child.setFieldType(SelectionField.CELL);
          break;
        case FieldAssociations.FIELD_ASSOCIATION_POINTS:
          child.setFieldType(SelectionField.POINT);
          break;
        default:
          vtkErrorMacro('Unknown field association');
      }
      child.getProperties().propID = value.info.propID;
      child.getProperties().prop = value.info.prop;
      child.getProperties().compositeID = value.info.compositeID;
      child.getProperties().pixelCount = value.pixelCount;

      child.setSelectionList(value.attributeIDs);
      sel[count] = child;
      count++;
    });

    return sel;
  };

  publicAPI.getInfoHash = (info) => `${info.propID} ${info.compositeID}`;

  //----------------------------------------------------------------------------
  publicAPI.generateSelection = (x1, y1, x2, y2) => {
    const dataMap = new Map();

    const outSelectedPosition = [0, 0];

    for (let yy = y1; yy <= y2; yy++) {
      for (let xx = x1; xx <= x2; xx++) {
        const pos = [xx, yy];
        const info = publicAPI.getPixelInformation(pos, 0, outSelectedPosition);
        if (info && info.valid) {
          const hash = publicAPI.getInfoHash(info);
          if (!dataMap.has(hash)) {
            dataMap.set(hash, {
              info,
              pixelCount: 1,
              attributeIDs: [info.attributeID],
            });
          } else {
            dataMap.get(hash).pixelCount++;
            if (
              dataMap.get(hash).attributeIDs.indexOf(info.attributeID) === -1
            ) {
              dataMap.get(hash).attributeIDs.push(info.attributeID);
            }
          }
        }
      }
    }
    return publicAPI.convertSelection(model.fieldAssociation, dataMap);
  };

  publicAPI.attach = (w, r) => {
    model.openGLRenderWindow = w;
    model.renderer = r;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  fieldAssociation: FieldAssociations.FIELD_ASSOCIATION_CELLS,
  renderer: null,
  area: null,
  openGLRenderWindow: null,
  openGLRenderer: null,
  currentPass: -1,
  propColorValue: null,
  props: null,
  idOffset: 1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  model.area = [0, 0, 0, 0];
  model.propColorValue = [0, 0, 0];
  model.props = [];

  macro.setGet(publicAPI, model, [
    'fieldAssociation',
    'renderer',
    'currentPass',
  ]);

  macro.setGetArray(publicAPI, model, ['area'], 4);
  macro.setGetArray(publicAPI, model, ['propColorValue'], 3);
  macro.event(publicAPI, model, 'event');

  // Object methods
  vtkOpenGLHardwareSelector(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkOpenGLHardwareSelector'
);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, Constants);
