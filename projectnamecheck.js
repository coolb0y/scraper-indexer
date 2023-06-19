const { exec } = require('child_process');

function checkFolderExists(folderPath) {
  return new Promise((resolve, reject) => {
    // Execute the batch script to check if the folder exists
    exec(`checkFolderExistence.bat "${folderPath}"`, (error, stdout, stderr) => {
      if (error) {
        // An error occurred while executing the script
        reject(error);
      } else {
        // Check if the output contains the folder name
        const folderExists = stdout.includes(folderPath);
        resolve(folderExists);
      }
    });
  });
}

// Usage example
const folderPath = 'C:\\path\\to\\folder';

checkFolderExists(folderPath)
  .then((folderExists) => {
    if (folderExists) {
      console.log(`Folder "${folderPath}" exists.`);
    } else {
      console.log(`Folder "${folderPath}" does not exist.`);
    }
  })
  .catch((error) => {
    console.error('An error occurred:', error);
  });
