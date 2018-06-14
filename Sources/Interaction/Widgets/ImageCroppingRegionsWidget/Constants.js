const WidgetState = {
  IDLE: 0,
  CROPPING: 1,
};

const CropWidgetEvents = ['CroppingPlanesChanged'];

// first 6 are face handles,
// next 12 are edge handles,
// last 8 are corner handles.
const TOTAL_NUM_HANDLES = 26;

export default { TOTAL_NUM_HANDLES, WidgetState, CropWidgetEvents };
