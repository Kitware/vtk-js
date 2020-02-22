title: Tools
---

vtk.js is an Open Source Framework for building Web application for Scientific Visualization.

The following guide explain our software process and tools use to build and develop this framework.

## Commitizen

We rely on Semantic-release to manage our change log, tagging and publishing
to NPM via Travis.

In order to maintain that process each commit message should follow a specific
formatting. To ensure that formatting, we use Commitizen which can be triggered
via the following command. Additional information can be found
[here](https://gist.github.com/stephenparish/9941e89d80e2bc58a153).

    $ npm run commit

Then a set of questions will be presented to you:

    $ npm run commit
    cz-cli@2.4.6, cz-conventional-changelog@1.1.5

    Line 1 will be cropped at 100 characters. All other lines will be wrapped
    after 100 characters.

    ? Select the type of change that you're committing: (Use arrow keys)
      feat:     A new feature
      fix:      A bug fix
      docs:     Documentation only changes
    ❯ style:    Changes that do not affect the meaning of the code
                (white-space, formatting, missing semi-colons, etc)
      refactor: A code change that neither fixes a bug or adds a feature
      perf:     A code change that improves performance
    (Move up and down to reveal more choices)

    ? Denote the scope of this change ($location, $browser, $compile, etc.):
    ESLint

    ? Write a short, imperative tense description of the change:
    Update code formatting to comply with our ESLint specification

    ? Provide a longer description of the change:

    ? List any breaking changes or issues closed by this change:

This process will generate the following commit message:

    commit 1a31ecfcc2f6f4283e51187a24ce0e9d9c17ae54
    Author: Sebastien Jourdain <sebastien.jourdain@kitware.com>
    Date:   Mon Dec 21 09:29:21 2015 -0700

        style(ESLint): Update code formatting to comply with our ESLint specification


[Full convention](https://gist.github.com/stephenparish/9941e89d80e2bc58a153)

## Code editing

Any code editor should be more than sufficient, however the recommended plugins listed below may not be as well supported or you may have to find alternative workarounds. The most important ones such as [ES6/Babel syntax highlighting](https://babeljs.io/docs/editors), [ESLint](http://eslint.org/docs/user-guide/integrations) are supported by multiple code editors which you may already use.

Otherwise, we highly recommend [Sublime Text 3](http://www.sublimetext.com) with the following set of plugins.
To install plugins you will have to first install [Package control](https://packagecontrol.io/installation).

Then installing new plugins should start with: `Ctrl/Cmd + Shift + p` > Install Package

### Git + GitGutter

With GitGutter, you can see which lines have been added, deleted or modified in the gutter.

### Babel

This plugin adds proper syntax highlighting to your ES6/2015 and React JSX code.

### JsPrettier

[More information available here](https://packagecontrol.io/packages/JsPrettier)

### SublimeLinter + SublimeLinter-contrib-eslint

[More information available here](https://github.com/roadhump/SublimeLinter-eslint).

    $ npm install -g eslint

### EditorConfig

[More information available here](https://github.com/sindresorhus/editorconfig-sublime#readme)
