title: StringArray
---

A String array is meant to keep track of String values. It is basically a standard JavaScript array where each value is expected to be a String.

## String array in memory

```js
{
  vtkClass: 'vtkStringArray',
  name: 'Players',
  numberOfComponents: 1,
  size: 1024,
  dataType: 'string',
  values: [ 'Player 1', 'Player 2', 'Palyer 3', ...],
}
``` 

## String array reference

Reference array are used within dataset that needs to be fetch on the network
or that written on disk.
The __ref__ section provide the information needed to download the array and fill
it in memory like the previously described ones.

```js
{
  type: 'vtkStringArray',
  name: 'Players',
  numberOfComponents: 1,
  size: 1024,
  values: null,
  dataType: 'string',
  ref: {
    id: '57b161d50afcda9eee221d6a5190075e',
    basepath: 'data',
    encode: 'JSON',
  },
}
``` 

<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-90338862-1', 'auto');
  ga('send', 'pageview');

</script>
