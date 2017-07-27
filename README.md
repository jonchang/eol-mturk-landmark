# eol-mturk-landmark

A web-based image landmarking tool intended for use with Amazon Mechanical Turk. Currently this is not very general and will actually only work for one specific set of images, but it would not be too difficult to adapt it to your own uses.

## Citation

Code and data from this repository should be cited as:

Chang, J. and Alfaro, M. E. (2015), Crowdsourced geometric morphometrics enable rapid large-scale collection and analysis of phenotypic data. Methods Ecol Evol, 7: 472–482. [doi:10.1111/2041-210X.12508](https://doi.org/10.1111/2041-210X.12508)

Additional data is [available on Dryad (doi:10.5061/dryad.gh4k7)](https://doi.org/10.5061/dryad.gh4k7).

## Organization

* app.html - entry point into the application.
* js/ - JavaScript files. Includes Bootstrap, jQuery, the JSON library, and the Amazon mTurk library.
    * js/base.js - all custom JavaScript functionality.
* css/ - CSS sheets, including Bootstrap.
    * css/base.css - all custom CSS style information.
* img/ - images for context-sensitive help. If these change then helpimgs.js needs to be updated as well.
* protocol/ - files that generate the full help file that contains instructions for landmarkers

## Building

You can deploy these files to Amazon as-is, though you will need to use the [Amazon Mechanical Turk Command Line Tools](http://aws.amazon.com/developertools/694), or the [API](http://aws.amazon.com/documentation/mturk/), to format these HITs as an [ExternalQuestion](http://docs.aws.amazon.com/AWSMechTurk/latest/AWSMturkAPI/ApiReference_ExternalQuestionArticle.html). They are too large (>128kb or so) to be inlined on the mTurk site.

For extra speed, you can compress and inline the app file. This requires [node.js](http://nodejs.org/), [inliner](https://github.com/remy/inliner) (via [npm](https://npmjs.org/)), and all its dependencies. Then, execute `compress.sh`, or run `inliner -vi app.html > app_small.html` in your Terminal.

To build the help instructions, you'll need [pandoc](http://johnmacfarlane.net/pandoc/). Navigate to the `protocol/` directory and execute either `build.sh` or `build.ps1`, depending on your operating system. This will create a HTML and PDF file of the landmarking protocol.

## TODO

* Better review interface
* Rip out dependencies on jQuery and bootstrap
* Streamline HIT posting

## Acknowledgements

This research is supported by an [Encyclopedia of Life Rubenstein Fellowship](http://eol.org/info/fellows) to Jonathan Chang.
