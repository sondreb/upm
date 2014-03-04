// upm.js
"use strict"

/* DISCLAIMER:
This is my first attempt at building any Node.JS module, so this first revision
might require some additional refactoring in future releases. Some of the code might
be sub-optimal, but it's currently built to be a functional prototype (version 0.x).
 */

var common = require('./common');

var log = require('npmlog');
log.heading = 'upm';
log.level = 'info';

//var async = require('async');
var fs = require('fs');
var nodefs = require('node-fs');
var path = require('path');

var pkg = require('pkginfo');
var readline = require('readline');
var cli = require("inquirer");

var settings = {};
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
		licenses: false,
		minified: true,
		original: true,
		names: 'stripped'
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
	var content = {
	    "licenses": "licenses/",
	    "filenames": "original",
	    "minified": true,
	    "original": true,
	    "./app/js/":
	    {
	        "jquery": "",
	        "jquery-signalr": "",
	        "angular": "",
	        "asdf": "http://adsf/asdf.js",
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

function confirmCreate(destination, destinations, cb)
{
	// Resolve to absolute path.
	destination = path.resolve(destination);
	
	if (!fs.existsSync(destination)) {
	    
		cli.prompt(
		{
			type: "confirm",
			name: "create",
			message: "The " + destination + " folder does not exists. Create it?"
			}, function( answer ) 
			{
				if (!answer.create)
				{
					log.verbose("Exiting", "Exiting upm... user choose to not create destination folder. Goodbye!");
				}

				nodefs.mkdirSync(destination, null, true);

				log.verbose('filesystem', 'Destination folder created');


		});
	}

	// Get the first element.
	var dest = destinations.shift();
	
	if (dest != null)
	{
		confirmCreate(dest, destinations, cb);
	}
	else
	{
		// We are done, raise the call back.
		cb();
	}
}

function readPackage()
{
	// Create the default settings object.
	createDefaultSettings();

	log.info('package', 'Reading Package Description...');

	if (fs.existsSync(packageFileName))
	{
		var content = fs.readFileSync(packageFileName, 'utf8');
		var pckg = JSON.parse(content, 
			function(k, v){

				// It's very important that folders for dependencies contains a minimum of 1 instance
				// of a forward-slash (/). This could be "./app" or "app/".
				if (k.indexOf("/") != -1)
				{
					//console.log(v);
				}

				return v;

		});

		var destinations = new Array();

		// Fill up array with all destinations.
		for(var k in pckg) {

			if (k.indexOf("./") != -1)
	 		{
	 			var dest = k;

	 			//dest = path.resolve(destination);

	 			destinations.push(dest);
	 		}
		}

		// Get the first element.
		var destination = destinations.shift();

		if (destination == null)
		{
			log.info('package', 'Package Contains Zero Destinations.');
			return;
		}

		// Run the first confirm which will iterate until all have been created.
		confirmCreate(destination, destinations, function() { 
			// Continue working after folder creation completed.
			log.info('download', 'Downloading files...');
		 });

		if (pckg.licenses != undefined)
		{
			settings.download.licenses = pckg.licenses;
		}

		if (pckg.filenames != undefined)
		{
			settings.download.names = pckg.filenames;
		}

		if (pckg.minified != undefined)
		{
			settings.download.minified = pckg.minified;
		}

		if (pckg.original != undefined)
		{
			settings.download.original = pckg.original;
		}

		//console.log(settings);
	}
	else
	{
		cli.prompt(
		{
			type: "list",
			name: "create",
			message: "The " + packageFileName + " package does not exists. Create it?",
			choices: [ "Create Empty Package", "Create Sample Package", "Exit" ]
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