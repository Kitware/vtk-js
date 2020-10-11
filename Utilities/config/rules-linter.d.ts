declare const _RulesLinter: _RulesLinter.T101[];
declare namespace _RulesLinter {
  export interface T100 {
    configFile: string;
  }
  export interface T101 {
    test: RegExp;
    loader: string;
    exclude: RegExp;
    enforce: string;
    options: _RulesLinter.T100;
  }
}
export = _RulesLinter;
