declare const _RulesTests: Array<_RulesTests.T100 | _RulesTests.T101 | _RulesTests.T104 | _RulesTests.T109>;
declare namespace _RulesTests {
  export interface T100 {
    test: RegExp;
    loader: string;
  }
  export interface T101 {
    test: RegExp;
    use: string;
  }
  export interface T102 {
    inline: boolean;
    fallback: boolean;
  }
  export interface T103 {
    loader: string;
    options: _RulesTests.T102;
  }
  export interface T104 {
    test: RegExp;
    use: _RulesTests.T103[];
  }
  export interface T105 {
    loader: string;
  }
  export interface T106 {
    search: string;
    replace: string;
    flags: string;
  }
  export interface T107 {
    multiple: _RulesTests.T106[];
  }
  export interface T108 {
    loader: string;
    options: _RulesTests.T107;
  }
  export interface T109 {
    test: RegExp;
    use: Array<_RulesTests.T105 | _RulesTests.T108>;
  }
}
export = _RulesTests;
