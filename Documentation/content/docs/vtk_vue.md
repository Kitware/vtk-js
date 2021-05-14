title: Using vtk.js with vue.js
---

This is a quickstart tutorial for using vtk.js with vue.js.

## Initialize your project

Install the vue-cli [as per the vue-cli docs](https://cli.vuejs.org/guide/installation.html).
Then, create and initialize your project with `vue create`.
For this example, we will be using Vue 3 and npm.

```sh
$ vue create my-vtkjs-app
> Select Vue 3 defaults

$ cd my-vtkjs-app
```

Now install vtk.js as a dependency.

```sh
$ npm install @kitware/vtk.js
```

## Using vtk.js in your app

To add a minimal vtk.js example to your app, replace `src/components/HelloWorld.vue` with the following contents.

```js src/components/HelloWorld.vue
<template>
  <div>
    <div ref="vtkContainer" />
    <table class="controls">
      <tbody>
        <tr>
          <td>
            <select
              style="width: 100%"
              :value="representation"
              @change="setRepresentation($event.target.value)"
            >
              <option value="0">Points</option>
              <option value="1">Wireframe</option>
              <option value="2">Surface</option>
            </select>
          </td>
        </tr>
        <tr>
          <td>
            <input
              type="range"
              min="4"
              max="80"
              :value="coneResolution"
              @input="setConeResolution($event.target.value)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { ref, unref, onMounted, onBeforeUnmount, watchEffect } from 'vue';

import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';

import vtkActor           from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper          from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkConeSource      from '@kitware/vtk.js/Filters/Sources/ConeSource';

export default {
  name: 'HelloWorld',

  setup() {
    const vtkContainer = ref(null);
    const context = ref(null);
    const coneResolution = ref(6);
    const representation = ref(2);

    function setConeResolution(res) {
      coneResolution.value = Number(res);
    }

    function setRepresentation(rep) {
      representation.value = Number(rep);
    }

    watchEffect(() => {
      const res = unref(coneResolution);
      const rep = unref(representation);
      if (context.value) {
        const { actor, coneSource, renderWindow } = context.value;
        coneSource.setResolution(res);
        actor.getProperty().setRepresentation(rep);
        renderWindow.render();
      }
    });

    onMounted(() => {
      if (!context.value) {
        const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
          rootContainer: vtkContainer.value,
        });
        const coneSource = vtkConeSource.newInstance({ height: 1.0 });

        const mapper = vtkMapper.newInstance();
        mapper.setInputConnection(coneSource.getOutputPort());

        const actor = vtkActor.newInstance();
        actor.setMapper(mapper);

        const renderer = fullScreenRenderer.getRenderer();
        const renderWindow = fullScreenRenderer.getRenderWindow();

        renderer.addActor(actor);
        renderer.resetCamera();
        renderWindow.render();

        context.value = {
          fullScreenRenderer,
          renderWindow,
          renderer,
          coneSource,
          actor,
          mapper,
        };
      }
    });

    onBeforeUnmount(() => {
      if (context.value) {
        const { fullScreenRenderer, coneSource, actor, mapper } = context.value;
        actor.delete();
        mapper.delete();
        coneSource.delete();
        fullScreenRenderer.delete();
        context.value = null;
      }
    });

    return {
      vtkContainer,
      setRepresentation,
      setConeResolution,
      coneResolution,
      representation,
    };
  }
}
</script>

<style scoped>
.controls {
  position: absolute;
  top: 25px;
  left: 25px;
  background: white;
  padding: 12px;
}
</style>
```

## Running the app

You can run the app using the project's built-in dev server.

```sh
$ npm run start
```

Navigate to `http://localhost:8080`, and you should have an interactive 3D visualization of a cone, similar to the [SimpleCone](../examples/SimpleCone.html) example.

## Where to go next

Check out the [tutorials](./tutorial.html), or if you know what you want but need API docs, check out the [API](../api).
