export declare const SelectionContent: {
  readonly GLOBALIDS: 0;
  readonly PEDIGREEIDS: 1;
  readonly VALUES: 2;
  readonly INDICES: 3;
  readonly FRUSTUM: 4;
  readonly LOCATIONS: 5;
  readonly THRESHOLDS: 6;
  readonly BLOCKS: 7;
  readonly QUERY: 8;
};

export type SelectionContent =
  (typeof SelectionContent)[keyof typeof SelectionContent];

export declare const SelectionField: {
  readonly CELL: 0;
  readonly POINT: 1;
  readonly FIELD: 2;
  readonly VERTEX: 3;
  readonly EDGE: 4;
  readonly ROW: 5;
};

export type SelectionField =
  (typeof SelectionField)[keyof typeof SelectionField];

declare const _default: {
  SelectionContent: typeof SelectionContent;
  SelectionField: typeof SelectionField;
};

export default _default;
