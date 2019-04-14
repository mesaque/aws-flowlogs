'use strict';

require('dotenv').config();
const fs           = require('fs');
const zlib         = require('zlib');
const parser       = require('vpc-flow-log-parser');
const readline     = require('readline');
const ipRangeCheck = require('ip-range-check');
const pretty       = require('prettysize');

const FLOWLOGS_PATH = process.env.FLOWLOGS_PATH;
const AWS_CIDR      = process.env.AWS_CIDR;

fs.readdir(FLOWLOGS_PATH, (err, files) => {
    files.forEach(file => {
        main_handler(file);
    });
});

function main_handler( file_name ) {

    let lineReader = readline.createInterface({
        input: fs.createReadStream( FLOWLOGS_PATH + '/' + file_name )
            .pipe(zlib.createGunzip())
    });

    let line_count = 0;
    let i = 0;
    let bytes  = [];
    let datatransferOut={};

    lineReader.on('line', (line) => {

        //skip headers csv
        if (0 == line_count ){
            line_count = line_count + 1;
            return;
        }

        var parsed = parser(line.toString('utf8')); 
        
        //check if is comming from ours servers
        if (!ipRangeCheck(parsed['srcaddr'], AWS_CIDR) ){
            return;
        }

        // checking if is data transfer out 
        if (ipRangeCheck(parsed['dstaddr'], AWS_CIDR)) {
            return;
        }

        if (typeof bytes[parsed['srcaddr']] === 'undefined' ){
            bytes[parsed['srcaddr']] = [];
        }
        
        bytes[parsed['srcaddr']][i] = parsed['byte'];
        
        line_count++;
        i++;

    }).on('close', function (){

        for (const [key, value] of Object.entries(bytes)) {
            var sum = value.reduce((partial_sum, a) => parseInt(partial_sum) + parseInt(a));
            datatransferOut[key] = sum;
        }
        console.log( JSON.stringify( datatransferOut ) );

    });
}