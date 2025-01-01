const { v4: uuidv4 } = require("uuid");
const ffmpeg = require("fluent-ffmpeg");
const logger = require("./loggerProject");

const findVideoInfo = async (videofilepath) => {
    return new Promise((resolve, reject) => {
        try {
            ffmpeg.ffprobe(videofilepath, function(err, info) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        } catch (error) {
            logger.error(JSON.stringify(err));
            reject(error);
        }
    });
};
exports.findVideoInfo = findVideoInfo;
