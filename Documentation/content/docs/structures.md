title: VTK data structures
---

The JavaScript language is obviously less rigid than C++. Therefore instead of following a one to one class mapping between C++ and JavaScript, we rather use generic JavaScript objects which do not contain any methods and instead provide helper functions which decorate those data structures with methods when useful.

Being JavaScript objects, we can export them and their state as JSON. This JSON could be converted back into actual vtk instances as demonstrated in this [example](https://kitware.github.io/vtk-js/examples/ActorSerialization.html). Or this example where a JSON file in which we captured an actor [state](https://github.com/Kitware/vtk-js/blob/master/Sources/Testing/Examples/ActorSerialization/example/actor.json) by calling `actor.getState()` and then loading it back using the `vtk()` function.

The role of this documentation is to provide a description of these data structures for each of the associated vtk classes.
