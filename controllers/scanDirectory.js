const fs = require("fs-extra");
const path = require("path");
let mime = require("mime-types");
const { convert } = require("html-to-text");
const pdf = require("pdf-parse");
const { v4: uuidv4 } = require("uuid");
const cheerio = require("cheerio");
const WordExtractor = require("word-extractor");
const ExifReader = require("exifreader");
const Data = require("../models/data");
const logger = require("../helper/loggerProject");
const { findVideoInfo } = require("../helper/findVideoInfo");
const { checkThumbnailExists } = require("../helper/checkThumbnailExists");
const { options } = require("../config/options");

async function scanDirectory(dirPath, lastdirname, dirlength) {
    const stack = [dirPath];
    while (stack.length) {
        try {
            const currentPath = stack.pop();
            logger.info(`Scanning ${currentPath}`);
            const files = fs.readdirSync(currentPath);
            await Promise.all(
                files.map(async function(file) {
                    // console.log(file,'file');
                    let filePath = path.join(currentPath, file);
                    let stats = fs.statSync(filePath);
                    if (stats.isDirectory()) {
                        logger.debug(`${filePath} found`);
                        scandataval.nofolders = scandataval.nofolders + 1;

                        stack.push(filePath);
                        logger.debug(`${filePath} is added to queue`);
                    } else {
                        // Handle file here
                        let fileName = file;
                        let fileDetails = "";
                        let filetype = "";
                        let filesize = stats.size;
                        let id = uuidv4();

                        logger.info(`${filePath} is being scanned`);
                        //console.log(filePath,'filepath');
                        const index = filePath.indexOf(lastdirname);
                        //console.log(index,'index');
                        const hostname = filePath
                            .slice(index + dirlength + 1)
                            .split("\\")[0];
                        baseurl = "http://" + hostname;
                        //console.log(hostname,baseurl,'hostname','baseurl')
                        const startIndex = filePath.indexOf(hostname) + hostname.length;
                        const pathAfterDomain = filePath
                            .substring(startIndex)
                            .replace(/\\/g, "/");

                        let url = baseurl + pathAfterDomain;

                        try {
                            filetype = mime.lookup(filePath);
                            logger.debug(`We have figured filetype as: ${filetype}`);
                        } catch (err) {
                            logger.error(
                                `Not able to find the file type of ${filetype}. Scanning will progress`
                            );
                            const jsonError = JSON.stringify(err);
                            logger.debug(`The below error took place" :- ${jsonError}`);
                        }

                        if (filetype === "text/html") {
                            try {
                                const html = fs.readFileSync(filePath, "utf-8");
                                const $ = cheerio.load(html);

                                // Extract the title
                                let title = $("title")
                                    .text()
                                    .replace(/[\n\/\\><-]+|\s+/g, " ");
                                if (title === undefined || title == null || title == "") {
                                    title = "";
                                }

                                const text = convert(html, options);
                                let cleanedText = text.replace(/[\n\/\\><-]+|\s+/g, " ");

                                //console.log(text);
                                const data = new Data({
                                    id: id,
                                    title: title,
                                    filename: fileName,
                                    filetype: "webpage",
                                    filesize: filesize,
                                    url: url,
                                    filedetails: cleanedText,
                                    baseurl: baseurl,
                                });

                                try {
                                    await data.save();
                                    scandataval.nofiles = scandataval.nofiles + 1;
                                    doccount++;
                                    logger.info(`${filePath} scanned and saved to database`);
                                    logger.debug(`Number of Document scanned are ${doccount}`);
                                } catch (err) {
                                    logger.error(
                                        `Failed to save data to database ${filePath}. Skipping file. Scanning will continue`
                                    );
                                    const jsonError = JSON.stringify(err);
                                    logger.debug(jsonError);
                                }
                            } catch (err) {
                                logger.error(
                                    `Failed to read HTML file ${filePath}. Skipping file. Scanning will continue`
                                );
                                const jsonError = JSON.stringify(err);
                                logger.debug(jsonError);
                            }
                        }
                        else if (filetype === "image/jpeg" ||
                            filetype === "image/png" ||
                            filetype === "image/jpg" ||
                            filetype === "image/tiff" ||
                            filetype === "image/tif") {
                            // this code works as well it is able to extract metadata height and stuff as well as advance things
                            try {
                                const dirPath = path.dirname(filePath);
                                // Split the directory path and get the last folder
                                const folders = dirPath.split(path.sep);
                                const lastFolder = folders[folders.length - 1];

                                if (lastFolder !== "chipsterthumbs") {
                                    const imageBuffer = fs.readFileSync(filePath);
                                    const result = ExifReader.load(imageBuffer);

                                    let imgtitle = "";
                                    let imgtags = "";
                                    let imageWidth = result
                                        ? result["Image Width"]
                                            ? result["Image Width"].value
                                            : 0
                                        : 0;
                                    let imageLength = result
                                        ? result["Image Height"]
                                            ? result["Image Height"].value
                                            : 0
                                        : 0;
                                    let imageDescription = "";

                                    if (result) {
                                        if (result.ImageDescription &&
                                            result.ImageDescription.description) {
                                            imageDescription =
                                                result.ImageDescription.description.replace(
                                                    /[\n\/\\><-]+|\s+/g,
                                                    " "
                                                );
                                        }

                                        if (result.title && result.title.description) {
                                            imgtitle = result.title.description.replace(
                                                /[\n\/\\><-]+|\s+/g,
                                                " "
                                            );
                                        }
                                        if (result.subject && result.title.description) {
                                            imgtags = result.subject.description.replace(
                                                /[\n\/\\><-]+|\s+/g,
                                                " "
                                            );
                                        }
                                    }

                                    const data = new Data({
                                        id: id,
                                        title: imgtitle,
                                        filename: fileName,
                                        filetype: "image",
                                        filesize: filesize,
                                        url: url,
                                        filedetails: imageDescription,
                                        length: imageLength,
                                        width: imageWidth,
                                        imgtags: imgtags,
                                        baseurl: baseurl,
                                    });

                                    try {
                                        // console.log(data.filedetails)
                                        await data.save();
                                        scandataval.nofiles = scandataval.nofiles + 1;
                                        doccount++;
                                        logger.info(`${filePath} scanned and saved to database`);
                                        logger.debug(`Number of Document scanned are ${doccount}`);
                                    } catch (e) {
                                        // console.log(e);
                                        logger.error(
                                            `Failed to save data to database ${filePath}. Skipping file. Scanning will continue`
                                        );
                                        const jsonError = JSON.stringify(e);
                                        logger.debug(`Error:- ${jsonError}`);
                                    }
                                }
                            } catch (e) {
                                //console.log(e);
                                logger.error(`Failed to scan file data ${filePath}`);
                                const jsonError = JSON.stringify(e);
                                logger.debug(jsonError);
                            }
                        } else if (filetype === "image/gif" ||
                            filetype === "image/webp" ||
                            filetype === "image/avif") {
                            try {
                                const imageBuffer = fs.readFileSync(filePath);
                                const result = ExifReader.load(imageBuffer);
                                let imageWidth = 0;
                                let imageLength = 0;
                                let imgtitle = "";
                                let imgtags = "";
                                let imageDescription = "";

                                if (filetype === "image/webp") {
                                    imageWidth = result
                                        ? result["ImageWidth"]
                                            ? result["ImageWidth"].value
                                            : 0
                                        : 0;
                                    imageLength = result
                                        ? result["ImageHeight"]
                                            ? result["ImageHeight"].value
                                            : 0
                                        : 0;

                                    if (result) {
                                        console.log(result);
                                        if (result.ImageDescription &&
                                            result.ImageDescription.description) {
                                            imageDescription =
                                                result.ImageDescription.description.replace(
                                                    /[\n\/\\><-]+|\s+/g,
                                                    " "
                                                );
                                        }

                                        if (result.title && result.title.description) {
                                            imgtitle = result.title.description.replace(
                                                /[\n\/\\><-]+|\s+/g,
                                                " "
                                            );
                                        }
                                        if (result.subject && result.title.description) {
                                            imgtags = result.subject.description.replace(
                                                /[\n\/\\><-]+|\s+/g,
                                                " "
                                            );
                                        }
                                    }
                                } else if (filetype === "image/gif") {
                                    imageWidth = result
                                        ? result["Image Width"]
                                            ? result["Image Width"].value
                                            : 0
                                        : 0;
                                    imageLength = result
                                        ? result["Image Height"]
                                            ? result["Image Height"].value
                                            : 0
                                        : 0;

                                    if (result) {
                                        console.log(result);
                                        if (result.ImageDescription &&
                                            result.ImageDescription.description) {
                                            imageDescription =
                                                result.ImageDescription.description.replace(
                                                    /[\n\/\\><-]+|\s+/g,
                                                    " "
                                                );
                                        }

                                        if (result.title && result.title.description) {
                                            imgtitle = result.title.description.replace(
                                                /[\n\/\\><-]+|\s+/g,
                                                " "
                                            );
                                        }
                                        if (result.subject && result.title.description) {
                                            imgtags = result.subject.description.replace(
                                                /[\n\/\\><-]+|\s+/g,
                                                " "
                                            );
                                        }
                                    }
                                }

                                const data = new Data({
                                    id: id,
                                    title: imgtitle,
                                    filename: fileName,
                                    filetype: "image",
                                    filesize: filesize,
                                    url: url,
                                    filedetails: imageDescription,
                                    length: imageLength,
                                    width: imageWidth,
                                    imgtags: imgtags,
                                    baseurl: baseurl,
                                });

                                try {
                                    // console.log(data.filedetails)
                                    await data.save();
                                    scandataval.nofiles = scandataval.nofiles + 1;
                                    doccount++;
                                    logger.info(`${filePath} scanned and saved to database`);
                                    logger.debug(`Number of Document scanned are ${doccount}`);
                                } catch (e) {
                                    // console.log(e);
                                    logger.error(
                                        `Failed to save data to database ${filePath}. Skipping file. Scanning will continue`
                                    );
                                    const jsonError = JSON.stringify(e);
                                    logger.debug(`Error:- ${jsonError}`);
                                }
                            } catch (e) {
                                logger.error(
                                    `Failed to save data to database ${filePath}. Skipping file. Scanning will continue`
                                );
                            }
                        }

                        if (filetype === "video/x-matroska" ||
                            filetype === "video/mp4" ||
                            filetype === "video/quicktime" ||
                            filetype === "video/webm" ||
                            filetype === "video/x-msvideo" ||
                            filetype === "video/x-ms-wmv" ||
                            filetype === "video/ogg") {
                            try {
                                let thumbnailExists = checkThumbnailExists(filePath);

                                const fileNameWithoutExtension = path.basename(
                                    filePath,
                                    path.extname(filePath)
                                );
                                let thumbnailFilePath = "http://chipstersearch/images/defaultthumbnail.png";

                                if (thumbnailExists) {
                                    let indexOfFileName = filePath.lastIndexOf(
                                        fileNameWithoutExtension
                                    );
                                    let thumbnailPathTemp = filePath
                                        .slice(index + dirlength + 1, indexOfFileName)
                                        .replace(/\\/g, "/");

                                    thumbnailFilePath =
                                        "http://" +
                                        thumbnailPathTemp +
                                        "chipsterthumbs/" +
                                        fileNameWithoutExtension +
                                        ".png";

                                    thumbnailFilePath = thumbnailFilePath.replaceAll(" ", "%20");
                                }

                                logger.debug("file path: " + filePath);
                                findVideoInfo(filePath)
                                    .then(async (metadata) => {
                                        let title = "";
                                        let artist = "";
                                        let album = "";
                                        let track = "";
                                        let codec = "";
                                        var duration = "";
                                        let length = 0;
                                        let width = 0;
                                        const indexvideo = filePath.indexOf(lastdirname);
                                        //console.log(index,'index');
                                        const hostnamevideo = filePath
                                            .slice(indexvideo + dirlength + 1)
                                            .split("\\")[0];
                                        let baseurlvideo = "http://" + hostnamevideo;
                                        //console.log(hostname,baseurl,'hostname','baseurl')
                                        const startIndexvideo = filePath.indexOf(hostnamevideo) + hostnamevideo.length;
                                        const pathAfterDomainvideo = filePath
                                            .substring(startIndexvideo)
                                            .replace(/\\/g, "/");

                                        let urlvideo = baseurlvideo + pathAfterDomainvideo;
                                        if (metadata.format) {
                                            duration = metadata.format.duration || 0;
                                            codec = metadata.format.format_name || "";
                                        }

                                        if (metadata.format && metadata.format.tags) {
                                            title = metadata.format.tags.title || "";
                                            artist = metadata.format.tags.artist || "";
                                            album = metadata.format.tags.album || "";
                                            track = metadata.format.tags.track || "";
                                        }

                                        if (metadata.streams && metadata.streams.length > 0) {
                                            // Assuming the first video stream holds resolution information
                                            const videoStream = await metadata.streams.find(
                                                (stream) => stream.codec_type === "video"
                                            );
                                            if (videoStream) {
                                                length = videoStream.height || 0;
                                                width = videoStream.width || 0;
                                            }
                                        }

                                        const data = new Data({
                                            id: id,
                                            title: title,
                                            filename: fileName,
                                            artist: artist,
                                            album: album,
                                            track: track,
                                            filetype: "video",
                                            filesize: filesize,
                                            url: urlvideo,
                                            codec: codec,
                                            duration: duration,
                                            length: length,
                                            width: width,
                                            thumbnailPath: thumbnailFilePath,
                                            baseurl: baseurlvideo,
                                        });

                                        try {
                                            await data.save();
                                            scandataval.nofiles = scandataval.nofiles + 1;
                                            doccount++;
                                            logger.info(
                                                `${filePath} File scanned and data saved successfully to database`
                                            );
                                        } catch (e) {
                                            logger.error(
                                                `Failed to save data to database ${filePath}. Skipping file. Scanning will continue`
                                            );
                                            logger.debug(JSON.stringify(e));
                                        }
                                        // Handle the video info (metadata)
                                        console.log("Video Info:", info);
                                    })
                                    .catch((error) => {
                                        // Handle errors
                                        console.error("Error fetching video info:", error);
                                    });

                                // });
                            } catch (e) {
                                logger.error(`Failed to scan file data ${filePath}`);
                                logger.debug(JSON.stringify(e));
                            }
                        } else if (filetype === "application/pdf") {
                            try {
                                let dataBuffer = fs.readFileSync(filePath);
                                const data = await pdf(dataBuffer);
                                let title = "";
                                const titletemp = data.info.Title;
                                let cleanedData = data.text.replace(/[\n\/\\><-]+|\s+/g, " ");
                                if (titletemp && titletemp !== "Untitled") {
                                    title = titletemp;
                                } else {
                                    const firstLineRegex = /^(?!\\{0,2}n$|\\{1,2}n$).+$/m;
                                    const matches = data.text.match(firstLineRegex);
                                    const firstLine = matches ? matches[0].trim() : null;

                                    if (firstLine) {
                                        title = firstLine;
                                    } else {
                                        title = firstLine
                                            ? firstLine
                                            : cleanedData.substring(0, 30);
                                    }
                                }

                                const datavl = new Data({
                                    id: id,
                                    title: title,
                                    filename: fileName,
                                    filetype: "pdf",
                                    filesize: filesize,
                                    url: url,
                                    filedetails: cleanedData,
                                    baseurl: baseurl,
                                });

                                try {
                                    // console.log(data.filedetails)
                                    await datavl.save();
                                    scandataval.nofiles = scandataval.nofiles + 1;
                                    doccount++;
                                    logger.info(`${filePath} scanned and saved to database`);
                                    logger.debug(`Number of Document scanned are ${doccount}`);
                                } catch (e) {
                                    logger.error(
                                        `Failed to save data to database ${filePath}. Skipping file. Scanning will continue`
                                    );
                                    const jsonError = JSON.stringify(e);
                                    logger.debug(jsonError);
                                }
                                // fileNames.push({id:id,title:title, fileName: fileName, filetype: "pdf",fileSize:filesize,url:url, fileDetails: cleanedData });
                            } catch (e) {
                                logger.error(`Failed to scan file data ${filePath}`);
                                const jsonError = JSON.stringify(e);
                                logger.debug(jsonError);
                            }
                        } else if (filetype === "text/plain") {
                            if (filetype === "text/plain") {
                                fs.readFile(filePath, "utf8", function(err, data) {
                                    if (err) {
                                        logger.error(`Failed to read file data ${filePath}`);
                                        const jsonError = JSON.stringify(err);
                                        logger.debug(jsonError);
                                    } else {
                                        try {
                                            let cleanedData = data.replace(/[\n\/\\><-]+|\s+/g, " ");
                                            let title = cleanedData.substring(0, 30);

                                            const dataval = new Data({
                                                id: id,
                                                title: title,
                                                filename: fileName,
                                                filetype: "text",
                                                filesize: filesize,
                                                url: url,
                                                filedetails: cleanedData,
                                                baseurl: baseurl,
                                            });

                                            dataval
                                                .save()
                                                .then((data) => {
                                                    scandataval.nofiles = scandataval.nofiles + 1;
                                                    doccount++;
                                                    logger.info(
                                                        `${filePath} scanned and saved to the database`
                                                    );
                                                    logger.debug(
                                                        `Number of Documents scanned is ${doccount}`
                                                    );
                                                })
                                                .catch((e) => {
                                                    logger.error(
                                                        `Failed to save data to the database ${filePath}. Skipping file. Scanning will continue`
                                                    );
                                                    const jsonError = JSON.stringify(e);
                                                    logger.debug(jsonError);
                                                });
                                        } catch (e) {
                                            logger.error(
                                                `Failed to clean data of the file ${filePath}. Skipping file. Scanning will continue`
                                            );
                                            const jsonError = JSON.stringify(e);
                                            logger.debug(`Error:- ${jsonError}`);
                                        }
                                    }
                                });
                            }
                        } else if (filetype ===
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                            filetype === "application/msword") {
                            try {
                                const extractor = new WordExtractor();
                                const extracted = extractor.extract(filePath);
                                await extracted.then(async (doc) => {
                                    let cleanedData = doc
                                        .getBody()
                                        .replace(/[\n\/\\><-]+|\s+/g, " ");
                                    let title = cleanedData.substring(0, 30);

                                    const data = new Data({
                                        id: id,
                                        title: title,
                                        filename: fileName,
                                        filetype: "doc-docx",
                                        filesize: filesize,
                                        url: url,
                                        filedetails: cleanedData,
                                        baseurl: baseurl,
                                    });

                                    try {
                                        // console.log(data.fileDetails)
                                        await data.save();
                                        scandataval.nofiles = scandataval.nofiles + 1;
                                        doccount++;
                                        logger.info(`${filePath} scanned and saved to database`);
                                        logger.debug(`Number of Document scanned are ${doccount}`);
                                    } catch (e) {
                                        // console.log(e);
                                        logger.error(
                                            `Failed to save data to database ${filePath}. Skipping file. Scanning will continue`
                                        );
                                        const jsonError = JSON.stringify(e);
                                        logger.debug(`Error:- ${jsonError}`);
                                    }
                                });
                            } catch (e) {
                                logger.error(`Failed to scan file data ${filePath}`);
                                const jsonError = JSON.stringify(e);
                                logger.debug(`Error:- ${jsonError}`);
                            }
                        }
                    }
                })
            );
        } catch (err) {
            logger.error(
                `Promise to scan all files of ${dirPath} Failed. Most of files might have scanned successfully`
            );
            logger.error(
                `Some file might not be readable or It might be possible the dirPath is corrupt or cannot be read by tool`
            );
            const jsonError = JSON.stringify(err);
            logger.debug(`Error:- ${jsonError}`);
        }
    }
}
exports.scanDirectory = scanDirectory;
