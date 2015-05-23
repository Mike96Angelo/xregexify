var fs      = require('fs'),
    path    = require('path'),
    through = require('through');

var DEFAULT_EXTENSIONS = [
    '.re'
];

/**
 * [requireRegex description]
 * @param  {string} filepath    [description]
 * @param  {sting} [parentpath] [description]
 * @return {string}             [description]
 */
function requireRegex(filepath, parentpath) {
    parentpath = parentpath || '';
    var content;

    try {
        content = fs.readFileSync(path.resolve(parentpath, filepath), 'utf8');
    } catch (error) {
        throw new Error('Cannot find module \'' + filepath + '\'');
    }

    return regexify(filepath, content);
}

/**
 * [regexify description]
 * @param  {string} filepath [description]
 * @param  {string} content  [description]
 * @return {string}          [description]
 */
function regexify(filepath, content) {
    return content
    .replace(/(^|[^\\])(#.*\n?)/mg, '$1')
    .replace(/(^|[^\\])(\s+)/mg, '$1')
    .replace(/\{\{([$_A-Za-z0-9\-.\/]*)\}\}/g, function (match, $1, offset, string) {
        return requireRegex($1, path.dirname(filepath));
    });
}

/**
 * [require_regex description]
 * @param  {Module} module   [description]
 * @param  {string} filepath [description]
 * @return {void}            [description]
 */
function require_regex(module, filepath) {
    module.exports = requireRegex(filepath);
}

/**
 * [registerWithRequire description]
 * @param   {object | array}    options
 * @param   {object}            options.extensions
 * @return  {void}              [description]
 */
function registerWithRequire(options) {
    exts = getExtensions(options);
    for (var i = 0; i < exts.length; i++) {
        require.extensions[ exts[i] ] = require_regex;
    }
}

/**
 * moduleExport the content
 * @param   {string}    content
 * @returns {string}
 */
function moduleExport (content) {
    return 'module.exports = ' + JSON.stringify(content) + ';\n';
}

/**
 * Takes a set of user-supplied options, and determines which set of file-
 * extensions to run regexify on.
 * @param   {object | array}    options
 * @param   {object}            options.extensions
 * @returns {string[]}
 */
function getExtensions (options) {
    /**
     * The file extensions which are stringified by default.
     * @type    {string[]}
     */
    var extensions = DEFAULT_EXTENSIONS;

    if (options) {
        if ((Array.isArray && Array.isArray(options)) || options instanceof Array) {
            extensions = options;
        } else if (options.extensions) {
            extensions = options.extensions;
        }
    }

    // Lowercase all file extensions for case-insensitive matching.
    extensions = extensions.map(function (ext) {
        return ext.toLowerCase();
    });

    return extensions;
}

/**
 * Returns whether the filename ends in a regexifiable extension. Case
 * insensitive.
 * @param   {string} filename
 * @return  {boolean}
 */
function hasRegexifiableExtension (filename, extensions) {
    var file_extension = path.extname(filename).toLowerCase();

    return extensions.indexOf(file_extension) > -1;
}

/**
 * Exposes the Browserify transform function.
 *
 * This handles two use cases:
 * - Factory: given no arguments or options as first argument it returns
 *   the transform function
 * - Standard: given file (and optionally options) as arguments a stream is
 *   returned. This follows the standard pattern for browserify transformers.
 *
 * @param   {string}            file
 * @param   {object | array}    options
 * @returns {stream | function} depending on if first argument is string.
 */
module.exports = function (file, options) {

    /**
     * The function Browserify will use to transform the input.
     * @param   {string} file
     * @returns {stream}
     */
    function browserifyTransform (file) {
        var extensions = getExtensions(options);

        if (!hasRegexifiableExtension(file, extensions)) {
            return through();
        }
        var chunks = [];

        var write = function (buffer) {
            chunks.push(buffer);
        };

        var end = function () {
            var contents = Buffer.concat(chunks).toString('utf8');

            this.queue(moduleExport(regexify(file, contents)));
            this.queue(null);
        };

        return through(write, end);
    }

    if (typeof file !== 'string') {
        // Factory: return a function.
        // Set options variable here so it is ready for when browserifyTransform
        // is called. Note: first argument is the options.
        options = file;
        return browserifyTransform;
    } else {
        return browserifyTransform(file);
    }
};

module.exports.registerWithRequire = registerWithRequire;
module.exports.getExtensions       = getExtensions;
module.exports.DEFAULT_EXTENSIONS  = DEFAULT_EXTENSIONS;
