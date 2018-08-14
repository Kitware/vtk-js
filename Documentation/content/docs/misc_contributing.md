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

    ```
    $ git clone https://github.com/<username>/vtk-js.git
    $ cd vtk-js
    $ npm install
    ```

3. Create a feature branch.

    ```
    $ git checkout -b new_feature
    ```

4. Start hacking.
5. Use Commitizen for commit message

    ```
    $ npm run commit
    ```

6. Push the branch:

    ```
    $ git push origin new_feature
    ```

6. Create a pull request and describe the change.

## Notice

- Don't modify version number in `package.json`.
- Your pull request will only get merged when tests passed. Don't forget to run tests before submission.

    ```
    $ npm test
    ```

## Updating Documentation

The vtk.js documentation is part of the code repository and is entirely written in [markdown](https://daringfireball.net/projects/markdown/). The source for this page for example is located at [`Documentation/content/docs/misc_contributing.md`](https://github.com/Kitware/vtk-js/blob/master/Documentation/content/docs/misc_contributing.md).

## Reporting Issues

When you encounter problems using vtk.js you may be able to find the solutions in [Troubleshooting](troubleshooting.html), on[GitHub](https://github.com/kitware/vtk-js/issues), or via the [Mailing list](https://www.vtk.org/mailman/listinfo/vtkusers). If you can't find the answer, please report it on GitHub.
