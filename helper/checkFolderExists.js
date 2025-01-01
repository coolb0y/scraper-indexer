const { exec } = require('child_process');
const logger = require('./loggerProject');
const path = require('path');

async function checkFolderExists(folderPath) {
  
    let scriptPath = process.cwd() + "\\..\\" + 'folderexists.bat';
    return new Promise((resolve, reject) => {
        // Execute the batch script to check if the folder exists
        exec(`${scriptPath} "${folderPath}"`, (error, stdout, stderr) => {
            if (error) {
                // An error occurred while executing the script
                logger.error("Error executing batch script. We are not able to find if folder exists");
                //console.error(`exec error: ${error}`);
                const jsonError = JSON.stringify(error);
                logger.debug(jsonError);
                reject(error);
            } else {
                // Check if the output contains the folder name
                logger.info("Batch script executed successfully to finder folder exits. Result: Folder exists");
                //console.log('folder exists')
                const folderExists = stdout.includes("ankur1455h5j44h34");
                resolve(folderExists);
            }
        });
    });
}
exports.checkFolderExists = checkFolderExists;
