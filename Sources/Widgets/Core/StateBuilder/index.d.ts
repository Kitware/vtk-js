import vtkWidgetState from '../WidgetState';

export interface StateBuilder {
  addDynamicMixinState(buildInfo: {
    labels: string[];
    mixins: string[];
    name: string;
    initialValues?: object;
  }): StateBuilder;
  addStateFromMixin(buildInfo: {
    labels: string[];
    mixins: string[];
    name: string;
    initialValues?: object;
  }): StateBuilder;
  addStateFromInstance(stateInfo: {
    labels: string[];
    name: string;
    instance: vtkWidgetState;
  });
  addField(field: { name: string; initialValue: any });
  build(...mixins: string[]): vtkWidgetState;
}

export function createBuilder(): StateBuilder;

export declare const vtkStateBuilder: {
  createBuilder: typeof createBuilder;
};
