## Introduction

define API for picking subclasses

vtkAbstractPicker is an abstract superclass that defines a minimal API for its concrete subclasses.
The minimum functionality of a picker is to return the x-y-z global coordinate position of a pick (the pick itself is defined in display coordinates).

The API to this class is to invoke the Pick() method with a selection point (in display coordinates - pixels)
and a renderer. Then get the resulting pick position in global coordinates with the GetPickPosition() method.

## See also

[vtkPointPicker]

## pickPosition (get Array) 

Get the picked position

## pickFromList (set/get boolean)

Determine if the picking will be processed on all the actors of the renderer or
from a list of actors

## pickList (set/get array)

Define the list of actors that will be tested for the picking (if pickFromList === true)

## initializePickList

Reset the pick list to 0 element

## addPickList(actor)

Add an actor to the pickList

## deletePickList(actor)

Remove an actor to the pickList
