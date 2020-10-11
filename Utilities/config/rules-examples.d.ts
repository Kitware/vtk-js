declare const _RulesExamples: Array<_RulesExamples.T100 | _RulesExamples.T101>;
declare namespace _RulesExamples {
  export interface T100 {
    test: RegExp;
    use: string;
  }
  export interface T101 {
    test: RegExp;
    loader: string;
  }
}
export = _RulesExamples;
