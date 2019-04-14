'use strict';

require('dotenv').config();
const fs           = require('fs');
const zlib         = require('zlib');
const parser       = require('vpc-flow-log-parser');
const readline     = require('readline');
const ipRangeCheck = require("ip-range-check");
const pretty       = require('prettysize');

var file ='aws-flow-log.log.gz'

let lineReader = readline.createInterface({
    input: fs.createReadStream('flowlogs/' + file)
        .pipe(zlib.createGunzip())
});

let line_count = 0;
let i = 0;
let bytes  = [];
let datatransferOut=[];

lineReader.on('line', (line) => {

    //skip headers csv
    if (0 == line_count ){
        line_count = line_count + 1;
        return;
    }

    var parsed = parser(line.toString('utf8')); 
    
    //check if is comming from ours servers
    if (!ipRangeCheck(parsed['srcaddr'], process.env.AWS_CIDR) ){
        return;
    }

    // checking if is data transfer out 
    if ( ipRangeCheck(parsed['dstaddr'], process.env.AWS_CIDR)) {
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
        const sum = value.reduce((partial_sum, a) => parseInt(partial_sum) + parseInt(a));
        datatransferOut[key] = pretty( sum );
    }

    console.log(datatransferOut);
});