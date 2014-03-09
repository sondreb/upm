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

function generatePackage(cb)
{
	var content = {
	    "app/js/":
	    {
	        "jquery": ""
	    }
	};

	fs.writeFile(packageFileName, JSON.stringify(content, null, "\t"), null, cb);

	log.info('info', 'File \"upm.json\" created. Modify and re-run \"upm\".');
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

	fs.writeFileSync(packageFileName, JSON.stringify(content, null, "\t"), null, cb);

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
function downloadLibraryCatalog()
{
	var filename = 'libraries.json';

	// If the user have a local copy, we'll use that instead as it clearly indicates the user
	// wants to override the global catalog.
	if (fs.existsSync(filename))
	{
		var content = fs.readFileSync(filename, 'utf8');
		libraries = JSON.parse(content);
	}
	else
	{
		var url = 'https://raw.github.com/sondreb/upm/master/libraries.json';

		https.get(url, function(res) {
		    var body = '';

		    res.on('data', function(chunk) {
		        body += chunk;
		    });

		    res.on('end', function() {
		        libraries = JSON.parse(body)
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

	// Verify if we really need to use different packages,
	// maybe https can be used for both?

	if (url.indexOf('https://') > -1)
	{
		var request = https.get(url, function(response) {
			response.pipe(file);
			file.on('finish', function() {
				file.close();
				callback();
			});
		});
	}
	else
	{
		var request = http.get(url, function(response) {
			response.pipe(file);
			file.on('finish', function() {
				file.close();
				callback();
			});
		});	
	}
}

function downloadFiles(section, cb)
{
	log.verbose("download", "Starting to download packages...");

	// Download individual files in parallell for improved performance.
	// Consider adding a limit to maximum files at a single time.

	async.forEach(Object.keys(section.items), function(key, callback) { 

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
	    }

		if (settings.download.original)
		{
			var downloadUrl = lib.original.replace('{version}', lib.version);
			downloadUrls.push({ url: downloadUrl, version: lib.version});
		}

		if (settings.download.license)
		{
			var downloadUrl = lib.license;
			downloadUrls.push({ url: downloadUrl, version: lib.version, type: 'license', name: key});
		}

		async.forEach(downloadUrls, function(item, download_callback)
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

	if (fs.existsSync(packageFileName))
	{
		var content = fs.readFileSync(packageFileName, 'utf8');

		var pckg = JSON.parse(content);

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
		downloadLibraryCatalog();

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