export const SHIFT_SCALE_METHOD = {
  DISABLE_SHIFT_SCALE: 0,   // Do not shift/scale point coordinates. Ever!
  AUTO_SHIFT_SCALE: 1,      // The default, automatic computation.
  MANUAL_SHIFT_SCALE: 2,    // Manual shift/scale provided (for use with AppendVBO)
};

export default { SHIFT_SCALE_METHOD };
