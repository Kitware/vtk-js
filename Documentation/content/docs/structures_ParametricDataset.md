title: ParametricDataset
---

A ParametricDataset is a set of datasets which may change based on a set of parameters.

## Structure 

```js
{
  type: 'Parametric',
  metadata: {
    name: 'MultiVarExample',
    size: 2345,
  },
  parameters: {
    contour: ['0.09', '0.092', '0.094', '0.096', '0.098'],
    clip: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    time: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  },
  refs: {
    volume: {
      id: '{time}/volume',
      pattern: true,
      basepath: '',
      encode: 'JSON',
    },
    clip: {
      id: '{time}/{clip}',
      pattern: true,
      basepath: '',
      encode: 'JSON',
    },
    contour: {
      id: '{time}/{contour}',
      pattern: true,
      basepath: '',
      encode: 'JSON',
    }
  },
  QueryDataModelControl: { // Optional information
    arguments_order: [ 'contour', 'clip', 'time' ],
    arguments: {
      contours: { 
        ui: 'slider',
        loop: 'modulo'
      },
      time: {
        ui: 'slider',
        loop: 'modulo'
      },
      clip: {
        ui: 'slider',
        loop: 'modulo'
      }
    }
  },
  Parametric: {
    Volume: {
      Clip: {},
      Contour: {},
    }
  }
}
```
