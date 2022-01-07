# Contributing to vtk.js
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

If committing changes to `vtk.js@next` or `vtk.js@next-major`, then set your base branch to be `next`
or `next-major`, respectively. For more info see the section on release channels below.

8. vtk.js uses GitHub for code review and Github Actions to validate proposed patches before they are merged.

## Release Channels

vtk.js currently has semantic-release configured with three release channels:
- `master` publishes to `vtk.js` on npm
- `next` publishes to `vtk.js@next` on npm
- `next-major` publishes to `vtk.js@next-major` on npm

When creating a Pull Request, it is recommended to understand which base branch you choose to merge into.
That way, code that needs more testing in downstream projects can pull from one of the `next` or `next-major`
channels without impacting the primary `master` release channel.

If you are unsure as to which branch you want to merge into, below outlines some general tips.
- If you are committing bug fixes or other minor fixes, then you can merge into `master`.
- If you are committing features that you want to test before merging into the primary release, then
  use `next`.
- If you are committing breaking changes, then it is best to merge into `next-major`. That way you
  can test any relevant downstream applications by targeting `vtk.js@next-major` before merging those
  changes into master.

For folks with merge permissions: when you are satisfied with `next` or `next-major`, you can merge the
branch into `master`. This will simply make the version at `vtk.js@next` or `vtk.js@next-major` available
via `npm install vtk.js`.

### Merging and handling multiple PRs

If you are merging multiple PRs, but you only want to increment the major/minor/patch number by one,
then you should *not* merge into any of `master`, `next`, or `next-major`. Instead, create a staging
branch off of master, and then merge the PRs into that staging branch. (Note semantic-release will not
run for the staging branch, since it is only configured to run for the three aforementioned branches.) Once
you are satisfied with the staging branch changes, you can then merge into either `master`, `next`, or
`next-major` as you see fit.

## Notice

- Don't modify the version number in `package.json`.
- Your pull request will only get merged when tests passed. Don't forget to run tests before 
  submission.

    ```
    $ npm run test
    ```

## Tests

To create and debug a test:
- Create a testFuncNameToTest.js in a "test" folder of the class to test.
- If you want to run just your test, use `test.only(...)` instead of `test(...)`.
- Run `npm run test:debug`
- In the opened window, click the Debug button and place breakpoints in browser debugger.

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
