title: VTK data structures
---

The JavaScript language is obviously less rigid than C++. Therefore instead of following a one to one class mapping between C++ and JavaScript, we rather use generic JavaScript object which does not contain any method and provide helper functions to decorate those datastructures with methods when usefull.

Therefore the role of that documentation is to provide a description of those datastructures for each of the associated vtk classes.

Those JSON structure could be converted into actual vtk instances like demonstrated in that [example](../examples/Actor.html).

Where a JSON file in which we captured an actor [state](https://github.com/Kitware/vtk-js/blob/master/Examples/Serialization/Actor/actor.json) by calling `actor.getState()` and then loading it back using the `vtk()` function.
