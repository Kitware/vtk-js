title: Contributing
---

We welcome you to join the development of vtk.js. This document will help you through the process.

## Before You Start

Please follow the coding style:

- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript).
- Use soft-tabs with a two space indent.
- Don't put commas first.

## Workflow

1. Fork [kitware/vtk-js].
2. Clone the repository to your computer and install dependencies.

    {% code %}
    $ git clone https://github.com/<username>/vtk-js.git
    $ cd vtk-js
    $ npm install
    $ npm install -g commitizen
    {% endcode %}

3. Create a feature branch.

    {% code %}
    $ git checkout -b new_feature
    {% endcode %}

4. Start hacking.
5. Use Commitizen for commit message

    {% code %}
    $ git cz
    {% endcode %}

6. Push the branch:

    {% code %}
    $ git push origin new_feature
    {% endcode %}

6. Create a pull request and describe the change.

## Notice

- Don't modify version number in `package.json`.
- Your pull request will only get merged when tests passed. Don't forget to run tests before submission.

    {% code %}
    $ npm test
    {% endcode %}

## Updating Documentation

The vtk.js documentation is part of the code repository and is entirely written in [markdown](https://daringfireball.net/projects/markdown/). The source for this page for example is located at [`Documentation/content/docs/misc_contributing.md`](https://github.com/Kitware/vtk-js/blob/master/Documentation/content/docs/misc_contributing.md).

## Reporting Issues

When you encounter problems using vtk.js you may be able to find the solutions in [Troubleshooting](troubleshooting.html), on[GitHub](https://github.com/kitware/vtk-js/issues), or via the [Mailing list](http://www.vtk.org/mailman/listinfo/vtk). If you can't find the answer, please report it on GitHub.

<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-90338862-1', 'auto');
  ga('send', 'pageview');

</script>
