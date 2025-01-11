const fs = require("fs-extra");
const path = require("path");

function checkThumbnailExists(filePath) {
    // Get the directory and file name
    const directory = path.dirname(filePath);
    const fileNameWithoutExtension = path.basename(
        filePath,
        path.extname(filePath)
    );

    // Construct the thumbnail folder path
    const thumbnailFolderPath = path.join(directory, "chipsterthumbs");

    // Construct the PNG file path within the thumbnail folder
    const thumbnailFilePath = path.join(
        thumbnailFolderPath,
        `${fileNameWithoutExtension}.png`
    );

    // Check if the thumbnail folder exists and the corresponding PNG file exists
    const thumbnailExists = fs.existsSync(thumbnailFolderPath) && fs.existsSync(thumbnailFilePath);

    // Return both the existence boolean and the thumbnail file path
    return thumbnailExists;
}
exports.checkThumbnailExists = checkThumbnailExists;
