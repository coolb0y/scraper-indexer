const {createLogger,transports,format } = require('winston');
const moment = require('moment');

const customFormat = format.combine(format.timestamp(),format.printf((info)=>{
    return `${info.timestamp} - [${info.level.toUpperCase().padEnd(7)}] - ${info.message}`
}))

const currentDateTime = moment().format('YYYY-MM-DD_HH-mm-ss');
let projectName = process.argv[2] || 'defaultNameChipster';

const logger = createLogger({
        format:customFormat,
        transports:[
           new transports.Console({
            level:"silly"
           }),
            new transports.File({
                filename:`logs/${projectName}/scanner-${currentDateTime}-debug.log`,
                level: 'silly',
                maxsize: 10485760
            }),
            new transports.File({
                filename:`logs/${projectName}/scanner-${currentDateTime}-info.log`,
                level: 'info',
                maxsize: 10485760
            }),
            new transports.File({
                filename:`logs/${projectName}/scanner-${currentDateTime}-error.log`,
                level: 'error',
                maxsize: 10485760
            })

        ]
    });


module.exports = logger;