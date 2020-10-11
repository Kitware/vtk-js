declare const _RulesVtk: Array<_RulesVtk.T100 | _RulesVtk.T104 | _RulesVtk.T106 | _RulesVtk.T110 | _RulesVtk.T113>;
declare namespace _RulesVtk {
  export interface T100 {
    test: RegExp;
    loader: string;
  }
  export interface T101 {
    debug: boolean;
    useBuiltIns: boolean;
  }
  export interface T102 {
    presets: Array<Array<string | _RulesVtk.T101>>;
  }
  export interface T103 {
    loader: string;
    options: _RulesVtk.T102;
  }
  export interface T104 {
    test: RegExp;
    use: _RulesVtk.T103[];
  }
  export interface T105 {
    loader: string;
  }
  export interface T106 {
    test: RegExp;
    exclude: RegExp;
    use: _RulesVtk.T105[];
  }
  export interface T107 {
    localIdentName: string;
  }
  export interface T108 {
    modules: _RulesVtk.T107;
  }
  export interface T109 {
    loader: string;
    options: _RulesVtk.T108;
  }
  export interface T110 {
    test: RegExp;
    use: Array<_RulesVtk.T105 | _RulesVtk.T109>;
  }
  export interface T111 {
    inline: boolean;
    fallback: boolean;
  }
  export interface T112 {
    loader: string;
    options: _RulesVtk.T111;
  }
  export interface T113 {
    test: RegExp;
    use: _RulesVtk.T112[];
  }
}
export = _RulesVtk;
