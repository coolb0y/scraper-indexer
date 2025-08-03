const router = require("express").Router();
const fs = require("fs-extra");
var gracefulFs = require("graceful-fs");
gracefulFs.gracefulify(fs);
const path = require("path");
require("dotenv").config();
const ffmpeg = require("fluent-ffmpeg");
const Data = require("./models/data");
const indexandcopy = require("./indexOpencopy");
const logger = require("./helper/loggerProject");
const pathToFfmpeg = require("ffmpeg-static");
const pathToFfprobe = require("ffprobe-static");
const { scanDirectory } = require("./controllers/scanDirectory");
const { transferDataToSQLite } = require('./helper/ingestFTS');
path.join(__dirname, `./ffprobe.exe`);
ffmpeg.setFfmpegPath(pathToFfmpeg);
ffmpeg.setFfprobePath("./ffprobe.exe");

router.get("/", async (req, res) => {
  logger.info(`Scanning req received`);
  let dirPath = req.query.dirPath;
  //taking project name from arguments
  const projectname = process.argv[2] || "defaultNameChipster";

  let tempdir = dirPath.split("\\");
  let lastdirname = tempdir[tempdir.length - 1];

  let dirlength = lastdirname.length;

  scandataval.nofiles = 0;
  scandataval.nofolders = 0;

  doccount = 0;
  await Data.deleteMany({});
  logger.info("All documents are deleted");
  scanDirectory(dirPath, lastdirname, dirlength)
    .then(async () => {
      // Directory scanning completed
      logger.info("Directory scanning completed");
      try {
        logger.info("Indexing to Opensearch has Started...");
        await indexandcopy(projectname);
        logger.info(
          "Indexing to Opensearch has Finished and Data folder is copied to location..."
        );
      } catch (e) {
        //console.log(e);
        logger.error(
          "Failed to index to Opensearch or failed to copy the data folder"
        );
        logger.error("Please check if Opensearch is running");
        const jsonError = JSON.stringify(e);
        logger.debug(`Error:- ${jsonError}`);
        return res.status(500).json({
          message:
            "Indexing done but Failed to copy folder to project path. Please do it manually",
        });
      }

      transferDataToSQLite(projectname)
      .then(() => {
        console.log('✅ Indexing to SQLITE has Finished');
       })
      .catch((err) => {
        console.error('❌ Indexing to SQLITE has Failed', err);
      });

      logger.info("Scanning and Indexing is completed successfully");
      return res.status(200).json({
        message: "Directory scanned and Indexed documents Successful",
        doccount: doccount,
      });
    })
    .catch((err) => {
      logger.error(
        "Failed to Scan the directory. Please check if directory is correct"
      );
      logger.error(
        "Failed to Scan the directory. Please check if Mongodb and Opensearch is Running"
      );

      return res.status(500).json({
        message: "Unable to scan directory",
      });
    });
});

module.exports = router;
