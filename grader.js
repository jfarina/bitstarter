#!/usr/bin/env node

//Automatically grade files for the presence of specified HTML tags/attributes.
//Uses commander.js and cheerio.  Teaches command line application development
//and basic DOM parsing.
//
//References:
//
//
//  + cheerio
//    - https://github.com/MathewMueller/cheerio
//    - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
//    - http://maxogden.com/scraping-with-node.html
//
//  + commander.js
//    - https://github.com/visionmedia/commander.js
//    - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-
//      interfaces-made-easy
//
//  + JSON
//    - http://en.wikipedia.org/wiki/JSON
//    - https://developer.mozilla.org/en-US/docs/JSON
//    - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2


var fs = require('fs');
var util = require('util');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT ="checks.json";
var URL_DEFAULT = "https://www.google.com";
var URL_OUT_FILE = "url_out.html";
var CHECK_RESULTS = "check_results.txt";
console.log("URL_DEFAULT is %s.", URL_DEFAULT);

var assertFileExists = function(infile){
    var instr = infile.toString();
    if(!fs.existsSync(instr)){
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1);
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var buildfn = function(output_file) {
    var writeRestler2File = function(result, response) {
	var done = false;
	if (result instanceof Error) {
	    console.error('Error: ' + util.format(response.message));
	} else {
	    console.error("Wrote %s", URL_OUT_FILE);
	    fs.writeFileSync(output_file, result);
	    done = true;
	}
	return done;
    };
    return writeRestler2File;
};

var completeChecks = function(output_file, checks_file) {
    var checkJson = checkHtmlFile(output_file, checks_file);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
    fs.writeFileSync(CHECK_RESULTS, outJson);
};

if(require.main == module) {
    program
	.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
	.option('-f, --file <html_files>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
	.option('-u, --url <website_url>', 'URL of website to check', URL_DEFAULT)
	.parse(process.argv);
    console.log("Check file is %s.\nHTML file is %s.\nURL is %s.", program.checks, program.file, program.url);
    if(program.url != URL_DEFAULT){
	console.log("Using url.");
	program.file = URL_OUT_FILE;
	var writeRestler2File = buildfn(URL_OUT_FILE);
	restler.get(program.url).on('complete', writeRestler2File);
	completeChecks(program.file, program.checks);
	
//	setTimeout(completeChecks(program.file, program.checks), 5000);
//	while(!done) {
//Wait for reslter.get to complete before moving on.
//	}
//    var checkJson = checkHtmlFile(URL_OUT_FILE, program.checks);
    } else {
	completeChecks(program.file, program.checks);
//	var checkJson = checkHtmlFile(program.file, program.checks);
    }
//    var outJson = JSON.stringify(checkJson, null, 4);
//    console.log(outJson);
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
