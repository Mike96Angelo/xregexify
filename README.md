# xRegexify #

A require/browserify plug-in for free-space regular expression files.

## Installation ##

```bash
npm install xregexify
```

## Usage ##

### NodeJS register with require ###

```javascript
require('xregexify').registerWithRequire(['.re', '.whatever']);

```

### Browserify Command Line ###

```bash
browserify -t xregexify myfile.js
```

### Browserify Middleware ###

```javascript
var browserify = require('browserify'),
		xregexify = require('xregexify');

var bundle = browserify()
		.transform(xregexify(['.re', '.whatever']))
		.add('my_app_main.js');

app.use(bundle);
```

### gulp and gulp-browserify

To incorporate xregexify into a `gulp` build process using `gulp-browserify`, register `xregexify` as a transform as follows:

```javascript
gulp.task('js', function() {
	return gulp.src('src/main.js', { read: false })
		.pipe(browserify({
			transform: xregexify({
				extensions: ['.re', '.whatever']
			})
		}))
		.pipe(gulp.dest(paths.build));
});
```

## Free-space regular expression

### White-space:

All white-space characters are ignored, if you want to match a white-space character you will need to escape it using `\`.

```
[ ]  # this does not match a space character!
[\ ] # this does match a space character!
```

### Comments:

Comments start with a `#` character and go to the end of the line, if you want to match a `#` character you will need to escape it `\#`.

```
 # this is a comment!
\# this is not!
```

## Examples

### RegExp:

email.re:

```
# email pattern
^
# username
(
	[_A-Za-z0-9\-\.]*
)
@
# domain
(
	(
		[_A-Za-z0-9\-\.]*
	)
	[.]
	(?:
		[A-Za-z]
	)
)
$
```

main.js:

```javascript
var emailPattern = new RegExp(require('./email.re'));

console.log(emailPattern.test('not an email bro!')); // false
console.log(emailPattern.test('john-doe@mail.com')); // true
```

### XRegExp:

email.re:

```
# email pattern
^
# username
(?<username>
	[_A-Za-z0-9\-\.]*
)
@
# domain
(?<domain>
	(?<domainName>
		[_A-Za-z0-9\-\.]*
	)
	[.]
	(?:
		[A-Za-z]
	)
)
$
```

main.js:

```javascript
var XRegExp = require('xregexp');
var emailPattern = XRegExp(require('./email.re'));

var match = XRegExp.exec('john-doe@mail.com', emailPattern);

console.log(match.username);   // john-doe
console.log(match.domain);     // mail.com
console.log(match.domainName); // mail

```

### Partials:

word.re:

```
# word
[A-Za-z]
```

two-words.re:

```
# two words
^\s*
(
	{{./word.re}}
	\s+
	{{./word.re}}
)
\s*$
```

main.js

```javascript
var twoWords = new RegExp(require('./two-words.re'));

console.log(twoWords.test('one'));           // false
console.log(twoWords.test('one two'));       // true
console.log(twoWords.test('one two three')); // false
```

## Author:
	Michaelangelo Jong

## License:
	The MIT License (MIT)

	Copyright (c) 2015 Michaelangelo Jong

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
