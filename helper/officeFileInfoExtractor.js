const officeParser = require('officeparser');
let mime = require("mime-types");

const officeInfoExtractor = (filePath) => {
    // Create and return a promise
    return new Promise((resolve, reject) => {
        officeParser.parseOfficeAsync(filePath)
            .then(data => {
                console.log('Extracted Data:', data);
                resolve(data); // Resolve the promise with the extracted data
            })
            .catch(err => {
                console.error('Error:', err);
                reject(err); // Reject the promise with the error
            });
    });
};

module.exports = officeInfoExtractor;
