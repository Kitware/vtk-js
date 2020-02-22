title: Contributing
---

We welcome you to join the development of vtk.js. This document will help you through the process.

## Before You Start

Please follow the coding style:

- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript).
- Use soft-tabs with a two space indent.
- Don't put commas first.

## Workflow

1. The vtk.js source is maintained [on GitHub](https://github.com/kitware/vtk-js).
2. [Fork vtk.js](https://help.github.com/articles/fork-a-repo/) into your user's namespace on GitHub.
3. Clone the repository to your computer.

    ```sh
    $ git clone https://github.com/<username>/vtk-js.git
    $ cd vtk-js
    ```

4. Run the install script for vtk.js dependencies:
    ```sh
    $ npm install
    ```

5. Create a feature branch.

    ```
    $ git checkout -b new_feature
    ```

4. Start hacking. Additional information on how to create class/test/example can be found
   [here](https://kitware.github.io/vtk-js/docs/) in the __Development__ section.

    ```sh
    $ edit file1 file2 file3
    $ git add file1 file2 file3
    ```

5. Use Commitizen to create commits

    ```sh
    $ npm run commit
    ```

6. Push commits in your feature branch to your fork in GitHub:

    ```sh
    $ git push origin new_feature
    ```

7. Visit your fork in Github, browse to the "**Pull Requests**" link on the left, and use the 
   "**New Pull Request**" button in the upper right to create a Pull Request.

    For more information see: 
    [Create a Pull Request](https://help.github.com/articles/creating-a-pull-request/)

8. vtk.js uses GitHub for code review and Travis-CI to test proposed patches before they are merged.

## Notice

- Don't modify the version number in `package.json`.
- Your pull request will only get merged when tests passed. Don't forget to run tests before 
  submission.

    ```
    $ npm test
    ```

## Updating Documentation

The vtk.js documentation is part of the code repository and is entirely written in 
[markdown](https://daringfireball.net/projects/markdown/).

## Reporting Issues

If you encounter problems using vtk.js you may be able to find the solutions in the
[troubleshooting docs](https://kitware.github.io/vtk-js/docs/misc_troubleshooting.html), in an 
existing [GitHub issue](https://github.com/kitware/vtk-js/issues), or via the 
[mailing list](http://www.vtk.org/VTK/help/mailing.html).
If you can't find the answer, please 
[report a new issue on GitHub](https://github.com/Kitware/vtk-js/issues/new).
