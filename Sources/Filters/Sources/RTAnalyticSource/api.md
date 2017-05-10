vtkRTAnalyticSource just produces images with pixel values determined
by a 

Maximum*Gaussian 
+ mag0*sin(freq0*x) 
+ mag1*sin(freq1*y) 
+ mag2*cos(freq2*z) 
+ offset

## wholeExtent (get/set) 

The extent of the whole output image, default is [0, 255, 0, 255, 0, 0]

## center (get/set)

The center of the function 

## maximum (get/set)

maximum value of the gaussian function

## standardDeviation (get/set)

## frequency[3] (get/set)

Natural frequency of the function on X Y Z

## magnitude[3] (get/set)

Magnitude of the function on X Y Z
