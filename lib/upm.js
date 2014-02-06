// upm.js
"use strict"
var fs = require('fs');

function readPackageDescription()
{
	console.log("Reading Package Description...");

	var packageFileName = "upm.json";

	if (fs.existsSync(packageFileName))
	{
		var content = fs.readFileSync(packageFileName, 'utf8');
		console.log(content);
	}
	else
	{
		console.log("Could not find the package file: " + packageFileName);
	}

	if (process.argv.length > 2)
	{
		var cmd = process.argv[2];
	}

	console.log("Done Reading Package Description.");
}

exports.read = readPackageDescription;