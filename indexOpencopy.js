const logger = require("./loggerProject");
const { exec } = require("child_process");
const scriptPath = "copydata.bat";

const indexandcopy = async (projectname) => {
  const destinationPath = `..\\Projects\\${projectname}\\data`;

  exec(`${scriptPath} "${destinationPath}"`, (error, stdout, stderr) => {
    if (error) {
      logger.error("Error in copying folder to project " + projectname);
      const jsonError = JSON.stringify(error);
      logger.debug(jsonError);
      throw new Error(
        "Failed to copy folder to project path. Please do it manually"
      );
    }

    if (stderr) {
      logger.error("Script Stdout error take place no action required");
      const jsonError = JSON.stringify(error);
      logger.debug(jsonError);
    }
  });
};

module.exports = indexandcopy;
