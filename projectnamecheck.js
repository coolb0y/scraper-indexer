
const router = require('express').Router();
const { exec } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, "folderexist.bat");


async function checkFolderExists(folderPath) {
    return new Promise((resolve, reject) => {
      // Execute the batch script to check if the folder exists
      exec(`${scriptPath} "${folderPath}"`, (error, stdout, stderr) => {
        if (error) {
          // An error occurred while executing the script
          console.error(`exec error: ${error}`);
          reject(error);
        } else {

          // Check if the output contains the folder name
          console.log('folder exists')
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
          console.log(`Folder "${finalPath}" exists.`);
          return res.status(200).json({
            ans: 'true'
          })
        } else {
            console.log(`Folder "${finalPath}" does not exist.`)
            return res.status(200).json({
                ans: 'false'
            })
          
        }
      })
      .catch((error) => {
        console.error('An error occurred:', error);
        return res.status(500).json({
            ans: 'false'
        })
      });
  

})

module.exports = router;