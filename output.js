'use strict';

const fs = require('fs');
const pretty = require('prettysize');

const FILE_NAME='output-datatransferOut.log';

function readLines(input, func) {
    var remaining = '';

    input.on('data', function (data) {
        remaining += data;
        var index = remaining.indexOf('\n');
        var last = 0;
        while (index > -1) {
            var line = remaining.substring(last, index);
            last = index + 1;
            func(line);
            index = remaining.indexOf('\n', last);
        }

        remaining = remaining.substring(last);
    });

    input.on('end', function () {
        if (remaining.length > 0) {
            func(remaining);
        }
    });
}
let bytes = [];
function showonconsole(line) {
    var parsed = JSON.parse(line);
    for (var key in parsed) {
        if (parsed.hasOwnProperty(key)) {
            bytes[key] = parseInt( (bytes[key]) ? bytes[key] : 0) + parseInt(parsed[key]); 
        }
    }

    console.log('----------------------');
    for (var key in bytes) {
        if (bytes.hasOwnProperty(key)) {
            console.log(key + " -> " + pretty( bytes[key]));
        }
    }
    console.log('----------------------');
}

var input = fs.createReadStream(FILE_NAME);
readLines(input, showonconsole);