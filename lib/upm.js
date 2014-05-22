// upm.js
"use strict"

/* DISCLAIMER:
This is my first attempt at building any Node.JS module, so this first revision
might require some additional refactoring in future releases. Some of the code might
be sub-optimal, but it's currently built to be a functional prototype (version 0.x).
 */

//var common = require('./common');

var log = require('npmlog');
log.heading = 'upm';
log.level = 'info';

var fs = require('fs');
var nodefs = require('node-fs');
var path = require('path');
var http = require('http');
var https = require('https');
var async = require('async');
var readline = require('readline');
var cli = require("inquirer");

var settings = {};
var libraries = {};
var packageFileName = "upm.json";
var htmlFileName = "index.html";
var projectFileName = "project.json";

function initialize()
{
	log.info('init', 'Starting upm - Micro Package Manager.');

	if (process.argv.length > 2)
	{
		var cmd = process.argv[2];

		if (cmd == '?')
		{
			log.level = 'verbose';
			log.info('help', 'upm command line parameters');
			log.info('help', '\"upm -verbose\"');
			log.info('help', '	enables verbose logging (shortcut: -v).');
			log.info('help', '\"upm ?\"');
			log.info('help', '	show this help info.');
			log.info('help', 'instructions:');
			log.info('help', 'to use upm, navigate to your source repository');
			log.info('help', 'and run the \"upm\" command.');
			return;
		}

		if (cmd == '-verbose' || cmd == '-v')
		{
			log.level = 'verbose';
			log.info('init', 'Verbose logging enabled.');
		}

		if (cmd == '-html')
		{
			generateHtml();
			return;
		}
	}

	// Start reading package.
	readPackage();	
}

function createDefaultSettings()
{
	settings.download = {
		original: true,
		minified: true,
		version: false,
		license: false
	};
}

function generateHtml()
{
	if (fs.existsSync(htmlFileName)) {
		log.info('info',  'File \"' + htmlFileName + '\" already exists. Exiting.');
	}
	else
	{
		var content = '<!DOCTYPE html>\n' +
		'<html lang="en">\n' +
		'<head>\n' +
		'		<meta charset="utf-8">\n' +
		'		<title></title>\n' +
		'		<meta name="description" content="">\n' +
		'		<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
		'		<link href="css/styles.css" rel="stylesheet">\n' +
		'</head>\n' +
		'<body>\n\n' +
		'	<header role="banner">\n' + 
		'		<h1>Headline</h1>\n' +
		'		<nav role="navigation"></nav>\n' +
		'	</header>\n\n' +
		'	<div class="content">\n' +
		'		<main role="main">\n' +
		'		</main>\n' +
		'	</div>\n\n' +
		'	<footer></footer>\n\n' +
		'	<script src="js/app.js" media="all"></script>\n\n' +
		'</body>\n' +
		'</html>';

		fs.writeFileSync(htmlFileName, content, null);

		log.info('info', 'File \"' + htmlFileName + '\" created.');
	}
}

function generatePackage(cb)
{
	var content = {
	    "app/js/":
	    {
	        "jquery": ""
	    }
	};

	fs.writeFile(packageFileName, JSON.stringify(content, null, "\t"), null, cb);

	log.info('info', 'File \"" + packageFileName + "\" created. Modify and re-run \"upm\".');
}

function generateSamplePackage(cb)
{
	// filenames: stripped/original.

	var content = {
	    "original": true,
	    "minified": true,
	    "version": false,
	    "license": false,
	    "./app/js/":
	    {
	        "jquery": "",
	        "jquery-signalr": "",
	        "angular": "",
	        "angular-animate": ""
	    },
	    "./service/js/":
	    {
	        "jquery": ""
	    }
	};

	fs.writeFile(packageFileName, JSON.stringify(content, null, "\t"), null, cb);

	log.info('info', 'File \"upm.json\" created. Modify and re-run \"upm\".');
}

// Raised when all sections have been processed and files have been downloaded.
function packageProcessed()
{
	log.info('status', 'Package Completely Processed.');
}

function downloadCompleted(sections, cb)
{
	// Get the first element.
	var sect = sections.shift();
	
	if (sect != null)
	{
		confirmCreate(sect, sections, cb);
	}
	else
	{
		// We are done, raise the call back.
		cb();
	}	
}

function createFolder(path, callback)
{
	if (!fs.existsSync(path)) {
	    
		cli.prompt(
		{
			type: "confirm",
			name: "create",
			message: "The " + path + " folder does not exists. Create it?"
			}, function( answer ) 
			{
				if (!answer.create)
				{
					log.verbose("Exiting", "Exiting upm... user choose to not create destination folder. Goodbye!");
					return;
				}

				nodefs.mkdirSync(path, null, true);

				log.verbose('filesystem', 'Destination folder created');

				callback();	
		});
	}
	else
	{
		callback();
	}
}

// Downloads the library catalog from GitHub, includes the path to libraries for downloading.
function downloadLibraryCatalog(callback)
{
	var filename = 'libraries.json';

	// If the user have a local copy, we'll use that instead as it clearly indicates the user
	// wants to override the global catalog.
	if (fs.existsSync(filename))
	{
		var content = fs.readFileSync(filename, 'utf8');
		libraries = JSON.parse(content);
		callback();
	}
	else
	{
		/* Important that this URL does not return a redirect action. */
		var url = 'https://raw.githubusercontent.com/sondreb/upm/master/libraries.json';

		https.get(url, function(res) {
		    var body = '';

		    res.on('data', function(chunk) {
		        body += chunk;
		    });

		    res.on('end', function() {

		        libraries = JSON.parse(body);
		        callback();
		    });
		}).on('error', function(err) {
			log.error('catalog', 'Unable to download and parse the catalog. Fatal error.');
			
			if (err != null)
			{
				return err;
			}
			else
			{
				return;	
			}
		});
	}
}

function download(url, dest, callback) {

	var file = fs.createWriteStream(dest);

	file.on('error', function(err)
	{
		console.log("IO ERROR!" + err);
	});

	// Important to ensure the file is opened before starting downloading.
	file.on('open', function(fd) {

		if (url.indexOf('https://') > -1)
		{
			var request = https.get(url, function(response) {
				response.pipe(file);
				file.on('finish', function() {
					file.close(callback);
				});
			}).on('error', function(err) {
				log.error('download', 'Unable to download. Fatal error: ' + err);
				file.close();
				if (err != null)
				{
					return err;
				}
				else
				{
					return;	
				}
			});;
		}
		else
		{
			var request = http.get(url, function(response) {
				response.pipe(file);
				file.on('finish', function() {
					file.close(callback);
				});
			}).on('error', function(err) {
				log.error('download', 'Unable to download. Fatal error:' + err);
				file.close();
				if (err != null)
				{
					return err;
				}
				else
				{
					return;	
				}
			});;	
		}

	});
}

function downloadFiles(section, cb)
{
	log.verbose("download", "Starting to download packages...");

	// Download individual files in parallell for improved performance.
	// Limit to 2 downloads at the same time.
	async.eachSeries(Object.keys(section.items), function(key, callback) { 

	    var version = section.items[key];

	    var lib = libraries[key];

	    // If the specified library does not exists in the catalog, notify user and continue.
	    if (lib == null)
	    {
	    	log.error('download', '\"' + key + '\" library does not exists in catalog.');
	    	callback();
	    	return;
	    }

	    // If set to stripped (default), we will remove file version from file written to disk.
	    // If set to 'original' or something else, we'll write the versioned files to disk.

	    var downloadUrls = new Array();

	    if (settings.download.minified)
	    {
	    	if (lib.minified != '')
	    	{
		    	var downloadUrl = lib.minified.replace('{version}', lib.version);
		    	downloadUrls.push({ url: downloadUrl, version: lib.version});	    		
	    	}
	    	else if (!settings.download.original) // Only if original is not enabled.
	    	{
				var downloadUrl = lib.original.replace('{version}', lib.version);
				downloadUrls.push({ url: downloadUrl, version: lib.version});

	    		log.info('download', 'There is no minified version of \"' + key + '\" available, downloading original.');
	    	}
	    	else
	    	{
	    		log.verbose('download', 'There is no minified version of \"' + key + '\".');
	    	}
	    }

		if (settings.download.original)
		{
			if (lib.original != '')
			{
				var downloadUrl = lib.original.replace('{version}', lib.version);
				downloadUrls.push({ url: downloadUrl, version: lib.version});
			}
			else if (!settings.download.minified) // Only if minified is not enabled.
			{
				log.info('download', 'There is no original version of \"' + key + '\" available, downloading minified.');

		    	var downloadUrl = lib.minified.replace('{version}', lib.version);
		    	downloadUrls.push({ url: downloadUrl, version: lib.version});
			}
			else
			{
				log.verbose('download', 'There is no original version of \"' + key + '\".');
			}
		}

		if (settings.download.license)
		{
			var downloadUrl = lib.license;
			downloadUrls.push({ url: downloadUrl, version: lib.version, type: 'license', name: key});
		}

		// We have to do this in series, or else we sometimes get 0kb written.
		async.eachSeries(downloadUrls, function(item, download_callback)
		{			
			var filename = path.basename(item.url);

			if (item.type == 'license')
			{
				filename = item.name + '.license';
			}
			else if (settings.download.version)
			{
				// If the oriinal filename does not contain version, we'll add it.
				if(filename.indexOf(item.version) == -1) {
				
					// Get the file extension.
					var extension = path.extname(filename);

					// Get name without extension.
					var basename = path.basename(filename, extension);

					if (basename.indexOf('.min') > -1)
					{
						// First we need to remove the existing .min.
						basename = basename.replace('.min', '');
						filename = basename + '-' + item.version + '.min' + extension;
					}
					else
					{
						filename = basename + '-' + item.version + extension;
					}
				}
			}
			else
			{
				filename = filename.replace('-' + item.version, '');
				filename = filename.replace(item.version, '');
			}

			// Resolve to absolute path.
			var destinationPath = path.join(section.path, filename);
			destinationPath = path.resolve(destinationPath);

			log.info('download', 'Downloading: ' + destinationPath);

			download(item.url, destinationPath, download_callback);	
		}
		, function(err)
		{
			if (err) return err;
			callback();
		});

	}, function(err) {
		if (err) return err;
		cb();
	});
}

function readPackage()
{
	// Create the default settings object.
	createDefaultSettings();

	log.info('package', 'Reading Package Description...');

	var foundProjectFile = false;
	var pckg = null;

	// If there exists a project.json (used by ASP.NET vNext), we'll
	// parse the "libraries" section, which is a section not built into the 
	// file standard by Microsoft, but a custom one used by upm.
	if (fs.existsSync(projectFileName))
	{
		var content = fs.readFileSync(projectFileName, 'utf8');

		var tmp = JSON.parse(content);

		// Check if the user have manually edited his project.json with
		// a libraries section that is used by upm.
		if (tmp.libraries != null)
		{
			pckg = tmp.libraries;
		}
	}
	
	if (pckg != null || fs.existsSync(packageFileName))
	{
		if (pckg == null)
		{		
			var content = fs.readFileSync(packageFileName, 'utf8');
			pckg = JSON.parse(content);
		}

		var sections = new Array();

		// Fill up array with all sections.
		for(var key in pckg) {

			if (key.indexOf("./") != -1)
	 		{
	 			sections.push({ path: key, items: pckg[key] });
	 		}
		}

		// Get the first element.
		/*var section = sections.shift();

		if (section == null)
		{
			log.info('package', 'Package Contains Zero Sections.');
			return;
		}*/
		
		settings.download.original = (pckg.original);
		settings.download.minified = (pckg.minified);
		settings.download.version = (pckg.version);
		settings.download.license = (pckg.license);

		// For future reference:
		/*
			var trafficLightActions = {
			    red: 'Stop',
			    yellow: 'Wait',
			    green: 'Go'
			}

			async.forEach(Object.keys(trafficLightActions), function(color, callback) { //The second argument (callback) is the "task callback" for a specific messageId
			    var action = trafficLightActions[color];
			    //Play around with the color and action
			}, function(err) {
			    //When done
			});
		*/

		// Download and parse the packackage catalog containing all URLs to libraries.
		downloadLibraryCatalog(function() {


			// First make sure user creates all required folders.
			// We won't download until after folders have been created,
			// simply to get done with the user interaction.
			async.eachSeries(sections, function(item, callback) {

				// Resolve to absolute path.
				var folder = path.resolve(item.path);

				// Async call
				createFolder(folder, function() { 
					callback(); 
				});

			}, function(err)
			{
				if (err) return err;

				async.eachSeries(sections, function(item, cb) {

					downloadFiles(item, function() { 
						cb(); 
					});

				}, function(err)
				{
					if (err) return err;

					packageProcessed();

				});

			});

			
		});


	}
	else
	{
		cli.prompt(
		{
			type: "list",
			name: "create",
			message: "The " + packageFileName + " package does not exists. Create it?",
			choices: [ "Create Sample Package", "Create Empty Package", "Exit" ]
			}, function( answers ) 
			{

				var packageCreated = "The " + 
									packageFileName + 
									" file was created. Please modify the file according to your project, " + 
									"then rerun the upm command.";

				switch(answers.create)
				{
					case "Create Empty Package":
						generatePackage(function() {displayMessage(packageCreated)});
					break;

					case "Create Sample Package":
						generateSamplePackage(function() {displayMessage(packageCreated)});
					break;

					case "Exit":
						log.verbose("Exiting", "Exiting upm... user choose to not create package. Goodbye!");
						return;
					break;
				}
		});
	}
}

function displayMessage(text)
{
	console.log(text);
}

/* Defines all the public exposed functions */
module.exports.init = initialize;



/*
	Development Notes:
	
	Work Flow:
	
	Find and Parse upm.json
	Read Options
	Parse Through All Sections
	Create/Verify Folder for Sections
	Download Files to Folders
	Exit
	
*/