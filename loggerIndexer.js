const {createLogger,transports,format } = require('winston');
const moment = require('moment');

const customFormat = format.combine(format.timestamp(),format.printf((info)=>{
    return `${info.timestamp} - [${info.level.toUpperCase().padEnd(7)}] - ${info.message}`
}))

const currentDateTime = moment().format('YYYY-MM-DD_HH-mm-ss');
let projectName = process.argv[2] || 'defaultNameChipster';
let loggingMode = process.argv[3];


let loggingNumber =0; 
if(loggingMode==="i" || loggingMode===" i" || loggingMode===" i " || loggingMode==="i " || loggingMode==="info" || loggingMode==="Info" || loggingMode==="INFO"){
    loggingNumber = 1;
}
else if(loggingMode==="v" || loggingMode===" v" || loggingMode===" v " || loggingMode==="v " || loggingMode==="verbose" || loggingMode==="Verbose" || loggingMode==="VERBOSE" ){
   loggingNumber = 2;
}


let transportsArr = [
    new transports.Console({
    level:"silly"
   })
]


if(loggingNumber===0){
transportsArr = [
    new transports.Console({
    level:"silly"
   }),
   new transports.File({
    filename:`Logs/${projectName}/indexer-${currentDateTime}-error.log`,
    level: 'error',
    maxsize: 10485760
})
]
}


else if(loggingNumber===1){
    transportsArr = [
        new transports.Console({
            level:"silly"
           }),
           new transports.File({
            filename:`Logs/${projectName}/indexer-${currentDateTime}-info.log`,
            level: 'info',
            maxsize: 10485760
        })

    ]
}
else if(loggingNumber===2){
    transportsArr = [
        new transports.Console({
            level:"silly"
           }),
           new transports.File({
            filename:`Logs/${projectName}/indexer-${currentDateTime}-debug.log`,
            level: 'silly',
            maxsize: 10485760
        }),
    ]
}


const logger = createLogger({
        format:customFormat,
        transports:transportsArr
    });


module.exports = logger;