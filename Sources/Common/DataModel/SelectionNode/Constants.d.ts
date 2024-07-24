export declare enum SelectionContent {
  GLOBALIDS = 0,
  PEDIGREEIDS = 1,
  VALUES = 2,
  INDICES = 3,
  FRUSTUM = 4,
  LOCATIONS = 5,
  THRESHOLDS = 6,
  BLOCKS = 7,
  QUERY = 8,
}

export declare enum SelectionField {
  CELL = 0,
  POINT = 1,
  FIELD = 2,
  VERTEX = 3,
  EDGE = 4,
  ROW = 5,
}

declare const _default: {
  SelectionContent: typeof SelectionContent;
  SelectionField: typeof SelectionField;
};

export default _default;
