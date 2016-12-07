Contributing to vtk.js
======================

This page documents at a very high level how to contribute to vtk.js.
Please check our [developer instructions] for a more detailed guide to
developing and contributing to the project, and our [vtk.js Git README](README.md)
for additional information.

1. The vtk.js source is maintained on Github
    at https://github.com/kitware/vtk-js<br/>

2. [Fork VTK] into your user's namespace on Github.

3. Follow the [download instructions] to create a
    local clone of the main VTK repository:

        $ git clone https://github.com/kitware/vtk-js.git VTK
        $ cd vtk-js
    The main repository will be configured as your `origin` remote.

    For more information see: [Setup]

4. Run the [developer setup script] to prepare your vtk.js work tree:

        $ npm install

5. Edit files and create commits (repeat as needed):

        $ edit file1 file2 file3
        $ git add file1 file2 file3
        $ git cz

    For more information see: [Create a Topic]

6. Push commits in your topic branch to your fork in Github:

        $ git push

    For more information see: [Share a Topic]

7. Visit your fork in Github, browse to the "**Merge Requests**" link on the
    left, and use the "**New Merge Request**" button in the upper right to
    create a Merge Request.

    For more information see: [Create a Merge Request]


VTK uses Github for code review and Travis-CI to test proposed
patches before they are merged.

Our [DevSite] is used to document features, flesh out designs and host other
documentation as well as API. We have several [Mailing Lists]
to coordinate development and to provide support.

[VTK Git README]: Documentation/dev/git/README.md
[developer instructions]: Documentation/dev/git/develop.md
[Create an account]: https://gitlab.kitware.com/users/sign_in
[Fork VTK]: https://gitlab.kitware.com/vtk/vtk/fork/new
[download instructions]: Documentation/dev/git/download.md#clone
[developer setup script]: /Utilities/SetupForDevelopment.sh
[Setup]: Documentation/dev/git/develop.md#Setup
[Create a Topic]: Documentation/dev/git/develop.md#create-a-topic
[Share a Topic]: Documentation/dev/git/develop.md#share-a-topic
[Create a Merge Request]: Documentation/dev/git/develop.md#create-a-merge-request

[DevSite]: http://kitware.github.io/vtk-js
[Mailing Lists]: http://www.vtk.org/VTK/help/mailing.html
