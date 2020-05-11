export function createBuilder(): Builder;
declare namespace _default {
    export { createBuilder };
}
export default _default;
declare class Builder {
    publicAPI: {};
    model: {};
    addDynamicMixinState({ labels, mixins, name, initialValues }: {
        labels: any;
        mixins: any;
        name: any;
        initialValues: any;
    }): Builder;
    addStateFromMixin({ labels, mixins, name, initialValues }: {
        labels: any;
        mixins: any;
        name: any;
        initialValues: any;
    }): Builder;
    addStateFromInstance({ labels, name, instance }: {
        labels: any;
        name: any;
        instance: any;
    }): Builder;
    addField({ name, initialValue }: {
        name: any;
        initialValue: any;
    }): Builder;
    build(...mixins: any[]): Readonly<{}>;
}
