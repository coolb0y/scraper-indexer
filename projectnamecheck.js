
const router = require('express').Router();
const { exec } = require('child_process');
const path = require('path');
const logger = require('./loggerProject');
const scriptPath = 'folderexist.bat';


async function checkFolderExists(folderPath) {
    return new Promise((resolve, reject) => {
      // Execute the batch script to check if the folder exists
      exec(`${scriptPath} "${folderPath}"`, (error, stdout, stderr) => {
        if (error) {
          // An error occurred while executing the script
          logger.error("Error executing batch script. We are not able to find if folder exists")
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


router.get('/',async (req,res)=>{
    const path = req.query.projectPath;
    // check if folder exists
    const finalPath = `..\\Projects\\${path}`;
   
   await checkFolderExists(finalPath)
      .then((folderExists) => {
        if (folderExists) {
          logger.info(`Folder ${finalPath} exists`);
          
         // console.log(`Folder "${finalPath}" exists.`);
          return res.status(200).json({
            ans: 'true'
          })
        } else {
            logger.info(`Folder "${finalPath}" does not exist`);
            //console.log(`Folder "${finalPath}" does not exist.`)
            return res.status(200).json({
                ans: 'false'
            })
          
        }
      })
      .catch((error) => {
        logger.error("An error has occured in checking if Folder exits. Ignoring error Process will continue..");
        const jsonError = JSON.stringify(error);
        logger.debug(jsonError);
       // console.error('An error occurred:', error);
        return res.status(500).json({
            ans: 'false'
        })
      });
  

})

module.exports = router;