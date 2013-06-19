# eol-mturk-landmark

A web-based image landmarking tool intended for use with Amazon Mechanical Turk. Currently this is not very general and will actually only work for one specific set of images, but it would not be too difficult to adapt it to your own uses.

## Organization

* app.html - entry point into the application.
* js/ - JavaScript files. Includes Bootstrap, jQuery, the JSON library, and the Amazon mTurk library.
    * js/base.js - all custom JavaScript functionality.
    * js/helpimgs.js - base64-encoded images used for inline context-sensitive help.
* css/ - CSS sheets, including Bootstrap.
    * css/base.css - all custom CSS style information.
* img/ - images for context-sensitive help. If these change then helpimgs.js needs to be updated as well.
* protocol/ - files that generate the full help file that contains instructions for landmarkers

## Building

You can deploy these files to Amazon as-is, though you will need to use the Amazon Mechanical Turk Command Line Tools, or the API, to format these HITs as an ExternalQuestion. They are too large (>128kb or so) to be inlined on the mTurk site.

For extra speed, you can compress and inline the app file. This requires node.js, inliner (via npm), and all its dependencies. Then, execute `compress.sh`, or run `inliner -vi app.html > app_small.html` in your Terminal.

To build the help instructions, navigate to the `protocol/` directory and execute either `build.sh` or `build.ps1`, depending on your operating system. This will create a HTML and PDF file of the landmarking protocol, with images base64-encoded and inlined.

## Acknowledgements

This research is supported by the Encyclopedia of Life Rubenstein Fellowship <http://eol.org/info/fellows>
