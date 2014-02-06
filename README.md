Micro Package Manager (µpm) (0.0.2)
============
- a (very) tiny package manager

## Description:

Small, Simple and Tiny (Micro) Package Manager, that does not get in your way.

Wikipedia: Micro (µ) is a prefix in the metric system denoting a factor of 10-6 (one millionth). Confirmed in 1960, the prefix comes from the Greek μικρός (mikrós), meaning "small".

## Features:
- Built for simplicity, with few features.
- The key in the JSON value, is the destination folder for dependencies.
- Support semver syntax for package versions.
- Define depdencies in a upm.json file.
- Allows download of licenses in separate folder. Disabled by default.
- Multiple projects in the same package file.
- As the key is the path, the .json file can be located outside of deployment code.
- Will by default remove version number from files. This removes requirement to update script links.
- The package repository contains nothing but link to CDN-versions of libraries and files.
- A package can contain multiple files.
- Does not support dependencies, and won't support dependencies.

## Installation:

	npm install upm -g

## Help:

- https://github.com/sondreb/upm/issues

## Contribute:

Create a pull request on: https://github.com/sondreb/upm/pulls

## Credits:

Developed by Sondre Bjellås: http://sondreb.com/

## License (MIT):

Copyright (C) 2007-2014 Sondre Bjellås - http://sondreb.com/

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.