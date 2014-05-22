# Micro Package Manager (µpm) (0.0.20)

- a (very) tiny package manager


## Prototype Warning:

upm is still an early prototype, don't expect all functionality to be working properly until 0.1 or higher release.


## Installation:

```sh
$ npm install upm -g
```


## Description:

Small, Simple and Tiny (Micro) Package Manager, that does not get in your way.

Wikipedia: Micro (µ) is a prefix in the metric system denoting a factor of 10-6
(one millionth). Confirmed in 1960, the prefix comes from the Greek μικρός
(mikrós), meaning "small".

When you simply want to download the JavaScript libraries you need, and nothing
else, you are out of luck with any of the other package managers.

While actively developing, you don't want to be disrupted by changing file names
in your dependencies. Whenever jQuery, AngularJS or another library updates,
you'll get the very latest version by running upm and the files will be deployed
where you want them, and with a static file name that does not change when new
versions are released. You also want dependencies to be put in the same folder,
and not in a structure with versioned folders.

*Example:* Instead of having "jquery-2.1.0.js" stored within a "packages" or
"components" folder, and having scripts that copies files, it can be deployed
directly to your "scripts" or "js" folder, and the version-number will be
stripped from the filename, so the file will always be "jquery.js" no matter
which version is installed. This way, you no longer need to update your scripts
element src attribute.

When you need a more stable update to your libraries, simply download and safe
the libraries.json from the GitHub repository and store it locally at the root
of your own repository. That way, you can manually control all dependencies.

Features: 
- Built for simplicity, with few features. 
- Does not support dependencies, and won't support dependencies. 
- Always retrieves the latest version, does not support different dependency versions. If this is a requirement, use another package manager for increase stability and dependency-control. 
- Define your dependencies in a upm.json file. 
- Allows download of licenses for individual libraries.
- Multiple projects in the same package file. 
- As the key is the path, the .json file can be located outside of deployment code. 
- Will by default remove version number from files. This removes requirement to update script links. 
- Downloads both regular and minified versions (by default). 
- The key in the JSON value, is the destination folder for dependencies. Requires to begin with a "./" key name.


## Instructions:

Beware that this utility will write folders and files to disk. These operations can potentially overwrite files unintentially. If you for instance have a JavaScript file called "app.js" and you put a dependency on "app" inside your upm.json, your custom code will be overwritten when upm is executed.


## Help:


- https://github.com/sondreb/upm/issues


## Contribute

Create a pull request on: https://github.com/sondreb/upm/pulls

### Code Syntax:

Indentation: Tabs  
Reason: http://lea.verou.me/2012/01/why-tabs-are-clearly-superior/


## Alternatives and Others:

- http://cdnjs.com/ is a great resource for libraries, but it's not always updated with the latest versions.


## Credits:

Developed by Sondre Bjellås: http://sondreb.com/


## License (MIT):

Copyright (C) 2014 Sondre Bjellås - http://sondreb.com/

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
