var fs      = require('fs'),
    path    = require('path'),
    through = require('through');

var DEFAULT_EXTENSIONS = [
    '.re'
];

/**
 * Requires and reads in file and xregexifies the contents.
 * @param  {String} filepath
 * @param  {String} [parentpath]
 * @return {String}
 */
function requireRegex(filepath, parentpath) {
    parentpath = parentpath || '';
    var content;

    try {
        content = fs.readFileSync(path.resolve(parentpath, filepath), 'utf8');
    } catch (error) {
        throw new Error('Cannot find module \'' + filepath + '\'');
    }

    return xregexify(filepath, content);
}

/**
 * Returns a xregexified string of the content.
 * @param  {String} filepath
 * @param  {String} content
 * @return {String}
 */
function xregexify(filepath, content) {
    return content
    .replace(/(^|[^\\])(#.*\n?)/mg, '$1')
    .replace(/(^|[^\\])(\s+)/mg, '$1')
    .replace(/\{\{([$_A-Za-z0-9\-.\/]*)\}\}/g, function (match, $1, offset, string) {
        return '(?:' + requireRegex($1, path.dirname(filepath)) + ')';
    });
}

/**
 * Function that gets registered with node require.
 * @param  {Module} module   Module to export.
 * @param  {String} filepath Path to the file to require
 * @return {void}
 */
function require_regex(module, filepath) {
    module.exports = requireRegex(filepath);
}

/**
 * Registers the given extensions with node require.
 * @param  {Object|Array} options
 * @param  {Object.Array} options.extensions
 * @return {void}
 */
function registerWithRequire(options) {
    exts = getExtensions(options);
    for (var i = 0; i < exts.length; i++) {
        require.extensions[ exts[i] ] = require_regex;
    }
}

/**
 * Module exports for browserify.
 * @param   {String} content
 * @returns {String}
 */
function moduleExport (content) {
    return 'module.exports = ' + JSON.stringify(content) + ';\n';
}

/**
 * Gets the spesified extensions from `options` or `DEFAULT_EXTENSIONS`.
 * @param  {Object|Array} options
 * @param  {Object.Array} options.extensions
 * @return {Array}
 */
function getExtensions (options) {
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
 * Return whether or not the `filename` extension is in `extensions`.
 * @param  {String}    filename
 * @param  {String[]}  extensions
 * @return {Boolean}
 */
function hasExtension (filename, extensions) {
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
 * @param   {String}          file
 * @param   {Object|Array}    options
 * @param   {Object.Array}    options.extensions
 * @returns {Stream|Function} depending on if first argument is string.
 */
module.exports = function (file, options) {

    /**
     * The function Browserify will use to transform the input.
     * @param   {String} file
     * @returns {Stream}
     */
    function browserifyTransform (file) {
        var extensions = getExtensions(options);

        if (!hasExtension(file, extensions)) {
            return through();
        }
        var chunks = [];

        var write = function (buffer) {
            chunks.push(buffer);
        };

        var end = function () {
            var contents = Buffer.concat(chunks).toString('utf8');

            this.queue(moduleExport(xregexify(file, contents)));
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
module.exports.DEFAULT_EXTENSIONS  = DEFAULT_EXTENSIONS;
