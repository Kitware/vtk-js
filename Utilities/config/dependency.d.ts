declare const _Dependency: _Dependency.T118;
declare namespace _Dependency {
  export interface T100 {
    test: RegExp;
    include: RegExp;
    loader: string;
  }
  export interface T101 {
    presets: string[];
  }
  export interface T102 {
    loader: string;
    options: _Dependency.T101;
  }
  export interface T103 {
    test: RegExp;
    include: RegExp;
    use: _Dependency.T102[];
  }
  export interface T104 {
    inline: boolean;
    fallback: boolean;
  }
  export interface T105 {
    loader: string;
    options: _Dependency.T104;
  }
  export interface T106 {
    test: RegExp;
    include: RegExp;
    use: _Dependency.T105[];
  }
  export interface T107 {
    rules: Array<_Dependency.T100 | _Dependency.T103 | _Dependency.T106>;
  }
  export interface T108 {
    plugins: () => any[];
  }
  export interface T109 {
    loader: string;
    options: _Dependency.T108;
  }
  export interface T110 {
    test: RegExp;
    exclude: RegExp;
    use: Array<string | _Dependency.T109>;
  }
  export interface T111 {
    loader: string;
  }
  export interface T112 {
    localIdentName: string;
  }
  export interface T113 {
    modules: _Dependency.T112;
  }
  export interface T114 {
    loader: string;
    options: _Dependency.T113;
  }
  export interface T115 {
    test: RegExp;
    include: RegExp;
    use: Array<_Dependency.T111 | _Dependency.T114 | _Dependency.T109>;
  }
  export interface T116 {
    rules: Array<_Dependency.T110 | _Dependency.T115>;
  }
  export interface T117 {
    core: _Dependency.T107;
    css: _Dependency.T116;
  }
  export interface T118 {
    webpack: _Dependency.T117;
  }
}
export = _Dependency;
