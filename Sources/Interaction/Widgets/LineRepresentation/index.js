import Constants from 'vtk.js/Sources/Interaction/Widgets/LineRepresentation/Constants';
import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkBox from 'vtk.js/Sources/Common/DataModel/Box';
import vtkLine from 'vtk.js/Sources/Common/DataModel/Line';
import vtkLineSource from 'vtk.js/Sources/Filters/Sources/LineSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets/SphereHandleRepresentation';
import vtkWidgetRepresentation from 'vtk.js/Sources/Interaction/Widgets/WidgetRepresentation';
import { InteractionState } from '../HandleRepresentation/Constants';

const { State, Restrict } = Constants;

// ----------------------------------------------------------------------------
// vtkLineRepresentation methods
// ----------------------------------------------------------------------------

function vtkLineRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkLineRepresentation');

  const superClass = Object.assign({}, publicAPI);

  publicAPI.setResolution = (res) => {
    model.lineSource.setResolution(res);
  };

  publicAPI.setLineVisibility = (visibility) => {
    model.lineActor.setVisibility(visibility);
  };

  publicAPI.setPoint1Visibility = (visibility) => {
    model.point1Representation.getActors()[0].setVisibility(visibility);
  };

  publicAPI.setPoint2Visibility = (visibility) => {
    model.point2Representation.getActors()[0].setVisibility(visibility);
  };

  publicAPI.getResolution = () => model.lineSource.getResolution();

  publicAPI.getPoint1WorldPosition = () =>
    model.point1Representation.getWorldPosition();

  publicAPI.getPoint2WorldPosition = () =>
    model.point2Representation.getWorldPosition();

  publicAPI.getPoint1DisplayPosition = () =>
    model.point1Representation.getDisplayPosition();

  publicAPI.getPoint2DisplayPosition = () =>
    model.point2Representation.getDisplayPosition();

  publicAPI.setPoint1WorldPosition = (pos) => {
    model.point1Representation.setWorldPosition(pos);
    model.lineSource.setPoint1(...pos);
  };

  publicAPI.setPoint2WorldPosition = (pos) => {
    model.point2Representation.setWorldPosition(pos);
    model.lineSource.setPoint2(...pos);
  };

  publicAPI.setPoint1DisplayPosition = (pos) => {
    model.point1Representation.setDisplayPosition(pos);
    const p = model.point1Representation.getWorldPosition();
    model.point1Representation.setWorldPosition(p);
  };

  publicAPI.setPoint2DisplayPosition = (pos) => {
    model.point2Representation.setDisplayPosition(pos);
    const p = model.point2Representation.getWorldPosition();
    model.point2Representation.setWorldPosition(p);
  };

  publicAPI.setRenderer = (renderer) => {
    model.point1Representation.setRenderer(renderer);
    model.point2Representation.setRenderer(renderer);
    superClass.setRenderer(renderer);
  };

  publicAPI.startComplexWidgetInteraction = (startEventPos) => {
    // Store the start position
    model.startEventPosition[0] = startEventPos[0];
    model.startEventPosition[1] = startEventPos[1];
    model.startEventPosition[2] = 0.0;

    model.lastEventPosition[0] = startEventPos[0];
    model.lastEventPosition[1] = startEventPos[1];
    model.lastEventPosition[2] = 0.0;

    model.startP1 = model.point1Representation.getWorldPosition();
    model.startP2 = model.point2Representation.getWorldPosition();

    if (model.interactionState === State.SCALING) {
      const dp1 = model.point1Representation.getDisplayPosition();
      const dp2 = model.point2Representation.getDisplayPosition();
      model.length = Math.sqrt(
        (dp1[0] - dp2[0]) * (dp1[0] - dp2[0]) +
          (dp1[1] - dp2[1]) * (dp1[1] - dp2[1])
      );
    }
  };

  publicAPI.complexWidgetInteraction = (e) => {
    if (model.interactionState === State.ONP1) {
      if (model.restrictFlag !== 0) {
        const x = model.point1Representation.getWorldPosition();
        for (let i = 0; i < 3; i++) {
          x[i] = model.restrictFlag === i + 1 ? x[i] : model.startP1[i];
        }
        model.point1Representation.setWorldPosition(x);
      }
    } else if (model.interactionState === State.ONP2) {
      if (model.restrictFlag !== 0) {
        const x = model.point2Representation.getWorldPosition();
        for (let i = 0; i < 3; i++) {
          x[i] = model.restrictFlag === i + 1 ? x[i] : model.startP2[i];
        }
        model.point2Representation.setWorldPosition(x);
      }
    } else if (model.interactionState === State.ONLINE) {
      // TODO
    } else if (model.interactionState === State.SCALING) {
      // TODO
    } else if (model.interactionState === State.TRANSLATINGP1) {
      const x = model.point1Representation.getWorldPosition();
      const p2 = [];
      for (let i = 0; i < 3; i++) {
        p2[i] = model.startP2[i] + (x[i] - model.startP1[i]);
      }
      model.point1Representation.setWorldPosition(p2);
    } else if (model.interactionState === State.TRANSLATINGP2) {
      const x = model.point2Representation.getWorldPosition();
      const p2 = [];
      for (let i = 0; i < 3; i++) {
        p2[i] = model.startP1[i] + (x[i] - model.startP2[i]);
      }
      model.point2Representation.setWorldPosition(p2);
    }

    model.lastEventPosition[0] = e[0];
    model.lastEventPosition[1] = e[1];
    model.lastEventPosition[2] = 0.0;
    publicAPI.modified();
  };

  publicAPI.placeWidget = (...bounds) => {
    let boundsArray = [];

    if (Array.isArray(bounds[0])) {
      boundsArray = bounds[0];
    } else {
      for (let i = 0; i < bounds.length; i++) {
        boundsArray.push(bounds[i]);
      }
    }

    if (boundsArray.length !== 6) {
      return;
    }

    const placeFactorTemp = model.placeFactor;
    model.placeFactor = 1.0;
    const newBounds = [];
    const center = [];
    publicAPI.adjustBounds(boundsArray, newBounds, center);
    model.placeFactor = placeFactorTemp;

    for (let i = 0; i < 6; i++) {
      model.initialBounds[i] = newBounds[i];
    }
    model.initialLength = Math.sqrt(
      (newBounds[1] - newBounds[0]) * (newBounds[1] - newBounds[0]) +
        (newBounds[3] - newBounds[2]) * (newBounds[3] - newBounds[2]) +
        (newBounds[5] - newBounds[4]) * (newBounds[5] - newBounds[4])
    );

    // When PlaceWidget() is invoked, the widget orientation is preserved, but it
    // is allowed to translate and scale. This means it is centered in the
    // bounding box, and the representation scales itself to intersect the sides
    // of the bounding box. Thus we have to determine where Point1 and Point2
    // intersect the bounding box.
    const p1 = model.lineSource.getPoint1();
    const p2 = model.lineSource.getPoint2();

    const r = [
      model.initialLength * (p1[0] - p2[0]),
      model.initialLength * (p1[1] - p2[1]),
      model.initialLength * (p1[2] - p2[2]),
    ];
    const o = [center[0] - r[0], center[1] - r[1], center[2] - r[2]];

    const placedP1 = [];
    const t = [];
    vtkBox.intersectBox(boundsArray, o, r, placedP1, t);
    publicAPI.setPoint1WorldPosition(placedP1);

    r[0] = model.initialLength * (p2[0] - p1[0]);
    r[1] = model.initialLength * (p2[1] - p1[1]);
    r[2] = model.initialLength * (p2[2] - p1[2]);
    o[0] = center[0] - r[0];
    o[1] = center[1] - r[1];
    o[2] = center[2] - r[2];
    const placedP2 = [];
    vtkBox.intersectBox(boundsArray, o, r, placedP2, t);
    publicAPI.setPoint2WorldPosition(placedP2);

    model.placed = 1;
    model.validPick = 1;
    publicAPI.buildRepresentation();
  };

  publicAPI.computeInteractionState = (pos) => {
    const p1State = model.point1Representation.computeInteractionState(pos);
    const p2State = model.point2Representation.computeInteractionState(pos);
    if (p1State === InteractionState.SELECTING) {
      model.interactionState = State.ONP1;
      publicAPI.setRepresentationState(State.ONP1);
    } else if (p2State === InteractionState.SELECTING) {
      model.interactionState = State.ONP2;
      publicAPI.setRepresentationState(State.ONP2);
    } else {
      model.interactionState = State.OUTSIDE;
    }

    if (model.interactionState !== State.OUTSIDE) {
      return model.interactionState;
    }

    let pos1 = publicAPI.getPoint1DisplayPosition();
    let pos2 = publicAPI.getPoint2DisplayPosition();
    const xyz = [pos[0], pos[1], 0.0];
    const p1 = [pos1[0], pos1[1], 0.0];
    const p2 = [pos2[0], pos2[1], 0.0];
    const tol = model.tolerance * model.tolerance;

    const out = vtkLine.distanceToLine(xyz, p1, p2);
    const onLine = out.distance <= tol;
    if (onLine && out.t < 1.0 && out.t > 0.0) {
      model.interactionState = State.ONLINE;
      publicAPI.setRepresentationState(State.ONLINE);
      pos1 = publicAPI.getPoint1WorldPosition();
      pos2 = publicAPI.getPoint2WorldPosition();
      // TODO
      // model.linePicker.pick(pos[0], pos[1], 0.0, model.renderer);
      // const closest = model.linePicker.getPickPosition();
      // model.lineHandleRepresentation.setWorldPosition(closest);
    } else {
      model.interactionState = State.OUTSIDE;
      publicAPI.setRepresentationState(State.OUTSIDE);
    }

    return model.interactionState;
  };

  publicAPI.setRepresentationState = (state) => {
    if (model.representationState === state) {
      return;
    }
    model.representationState = state;
    publicAPI.modified();

    if (state === State.OUTSIDE) {
      publicAPI.highlightPoint(0, 0);
      publicAPI.highlightPoint(1, 0);
      publicAPI.highlightLine(0);
    } else if (state === State.ONP1) {
      publicAPI.highlightPoint(0, 1);
      publicAPI.highlightPoint(1, 0);
      publicAPI.highlightLine(0);
    } else if (state === State.ONP2) {
      publicAPI.highlightPoint(0, 0);
      publicAPI.highlightPoint(1, 1);
      publicAPI.highlightLine(0);
    } else if (state === State.ONLINE) {
      publicAPI.highlightPoint(0, 0);
      publicAPI.highlightPoint(1, 0);
      publicAPI.highlightLine(1);
    } else {
      publicAPI.highlightPoint(0, 1);
      publicAPI.highlightPoint(1, 1);
      publicAPI.highlightLine(1);
    }
  };

  publicAPI.sizeHandles = () => {
    // Removed because radius is always close to 0
    // let radius = publicAPI.sizeHandlesInPixels(1.35, model.lineSource.getPoint1());
    // model.point1Representation.setHandleSize(radius);
    // radius = publicAPI.sizeHandlesInPixels(1.35, model.lineSource.getPoint2());
    // model.point2Representation.setHandleSize(radius);
  };

  publicAPI.buildRepresentation = () => {
    model.point1Representation.buildRepresentation();
    model.point2Representation.buildRepresentation();

    if (model.initializeDisplayPosition === 0 && model.renderer) {
      publicAPI.setPoint1WorldPosition(model.lineSource.getPoint1());
      publicAPI.setPoint2WorldPosition(model.lineSource.getPoint2());
      model.validPick = 1;
      model.initializeDisplayPosition = 1;
    }

    model.point1Representation.setTolerance(model.tolerance);
    model.point2Representation.setTolerance(model.tolerance);
    // TODO
    // model.lineHandleRepresentation.setTolerance(model.tolerance);

    const x1 = publicAPI.getPoint1WorldPosition();
    model.lineSource.setPoint1(...x1);
    model.point1Representation.setWorldPosition(x1);

    const x2 = publicAPI.getPoint2WorldPosition();
    model.lineSource.setPoint2(...x2);
    model.point2Representation.setWorldPosition(x2);

    publicAPI.sizeHandles();
    publicAPI.modified();
  };

  publicAPI.highlightPoint = (pointId, highlight) => {
    if (pointId === 0) {
      if (highlight) {
        model.point1Representation.applyProperty(
          model.selectedEndPointProperty
        );
      } else {
        model.point1Representation.applyProperty(model.endPointProperty);
      }
    } else if (pointId === 1) {
      if (highlight) {
        model.point2Representation.applyProperty(
          model.selectedEndPoint2Property
        );
      } else {
        model.point2Representation.applyProperty(model.endPoint2Property);
      }
    } else {
      // TODO
      // if (highlight) {
      //   model.lineHandleRepresentation.setProperty(model.selectedEndPoint2Property);
      // } else {
      //   model.lineHandleRepresentation.setProperty(model.endPoint2Property);
      // }
    }
  };

  publicAPI.highlightLine = (highlight) => {
    if (highlight) {
      model.lineActor.setProperty(model.selectedLineProperty);
    } else {
      model.lineActor.setProperty(model.lineProperty);
    }
  };

  publicAPI.setLineColor = (...color) => {
    let col = [];

    if (Array.isArray(color[0])) {
      col = color[0];
    } else {
      for (let i = 0; i < color.length; i++) {
        col.push(color[i]);
      }
    }

    if (col.length !== 3) {
      return;
    }

    if (model.lineActor.getProperty()) {
      model.lineActor.getProperty().setColor(col[0], col[1], col[2]);
    }
  };

  publicAPI.clampPosition = (x) => {
    for (let i = 0; i < 3; i++) {
      if (x[i] < model.initialBounds[2 * i]) {
        x[i] = model.initialBounds[2 * i];
      }
      if (x[i] > model.initialBounds[2 * i + 1]) {
        x[i] = model.initialBounds[2 * i + 1];
      }
    }
  };

  publicAPI.getBounds = () => {
    model.boundingBox.setBounds(model.lineActor.getBounds());
    model.boundingBox.addBounds(model.point1Representation.getBounds());
    model.boundingBox.addBounds(model.point2Representation.getBounds());

    return model.boundingBox.getBounds();
  };

  publicAPI.getActors = () => {
    const actors = [];
    actors.push(...model.point1Representation.getActors());
    actors.push(...model.point2Representation.getActors());
    actors.push(model.lineActor);
    return actors;
  };

  publicAPI.getNestedProps = () => publicAPI.getActors();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  point1Representation: null,
  point2Representation: null,
  lineSource: null,
  lineMapper: null,
  lineActor: null,
  endPointProperty: null,
  selectedEndPointProperty: null,
  endPoint2Property: null,
  selectedEndPoint2Property: null,
  lineProperty: null,
  selectedLineProperty: null,
  tolerance: 5,
  placed: 0,
  representationState: State.OUTSIDE,
  startP1: [0.0, 0.0, 0.0],
  startP2: [0.0, 0.0, 0.0],
  length: 0.0,
  restrictFlag: Restrict.NONE,
  initializeDisplayPosition: 0,
  boundingBox: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkWidgetRepresentation.extend(publicAPI, model, initialValues);

  // Getters/Setters
  macro.get(publicAPI, model, [
    'point1Representation',
    'point2Representation',
    'endPointProperty',
    'selectedEndPointProperty',
    'endPoint2Property',
    'selectedEndPoint2Property',
    'lineProperty',
    'selectedLineProperty',
  ]);

  publicAPI.setHandleSize(5);
  model.boundingBox = vtkBox.newInstance();
  model.point1Representation = vtkSphereHandleRepresentation.newInstance();
  model.point2Representation = vtkSphereHandleRepresentation.newInstance();
  const handleSize = 10;
  model.point1Representation.setHandleSize(handleSize);
  model.point2Representation.setHandleSize(handleSize);
  // model.point1Representation.setSphereRadius(0.01);
  // model.point2Representation.setSphereRadius(0.01);

  // Line
  model.lineSource = vtkLineSource.newInstance({
    point1: [-0.5, 0, 0],
    point2: [0.5, 0, 0],
    resolution: 5,
  });
  model.lineSource.setResolution(5);
  model.lineMapper = vtkMapper.newInstance();
  model.lineMapper.setInputConnection(model.lineSource.getOutputPort());
  model.lineActor = vtkActor.newInstance();
  model.lineActor.setMapper(model.lineMapper);

  // Default properties
  model.endPointProperty = vtkProperty.newInstance();
  model.endPointProperty.setColor(1, 1, 1);
  model.selectedEndPointProperty = vtkProperty.newInstance();
  model.selectedEndPointProperty.setColor(0, 1, 0);
  model.endPoint2Property = vtkProperty.newInstance();
  model.endPoint2Property.setColor(1, 1, 1);
  model.selectedEndPoint2Property = vtkProperty.newInstance();
  model.selectedEndPoint2Property.setColor(0, 1, 0);
  model.lineProperty = vtkProperty.newInstance();
  model.lineProperty.setAmbient(1.0);
  model.lineProperty.setAmbientColor(1.0, 1.0, 1.0);
  model.lineProperty.setLineWidth(2.0);
  model.selectedLineProperty = vtkProperty.newInstance();
  model.selectedLineProperty.setAmbient(1.0);
  model.selectedLineProperty.setColor(0.0, 1.0, 0.0);
  model.selectedLineProperty.setLineWidth(2.0);

  // Pass the initial properties to the actor
  model.point1Representation.applyProperty(model.endPointProperty);
  model.point2Representation.applyProperty(model.endPoint2Property);
  model.point1Representation.setWorldPosition(model.lineSource.getPoint1());
  model.point2Representation.setWorldPosition(model.lineSource.getPoint2());
  model.lineActor.setProperty(model.lineProperty);

  // Object methods
  vtkLineRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkLineRepresentation');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
