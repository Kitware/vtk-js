The vtkElevationReader aims to read a text file formated as below and create a bumpy plane based on the elevation defined in that file. If a line has 10 elevation values, that means the plane will have 10 points along the X axis. If the file has 5 lines, that means the plane will have 5 points along the Y axis.

```
1 2 3 4 5
5 4 3 2 1
1 2 3 4 5
5 4 3 2 1
1 2 3 4 5
```

Each number represente an elevation on a uniform grid where a line (horizontal) define the elevations along the X axis.
With that in mind, new lines (vertical) define the elevations along the Y axis and the actual number is the elevation along Z.

In order to properly represent that in world coordinates, you can provide an `origin` which will define the coordinate of the first point without its elevation. 
Then you need to discribe how much you should move along X and Y between two elevations definition. For that we use `xSpacing` and `ySpacing`.
Since the elevation is given to us as a number, we can scale it via `zScaling`.
Finally you may decide that your grid should move along positive X and negative Y while reading the file. The `xDirection` and `yDirection` are meant to give you control on that end.

