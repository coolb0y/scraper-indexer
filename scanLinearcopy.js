const router = require("express").Router();
const fs = require("fs-extra");
var gracefulFs = require("graceful-fs");
gracefulFs.gracefulify(fs);
const path = require("path");
let mime = require("mime-types");
const { convert } = require("html-to-text");
const pdf = require("pdf-parse");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const cheerio = require("cheerio");
const WordExtractor = require("word-extractor");
const ExifReader = require("exifreader");
const ffmpeg = require("fluent-ffmpeg");
const indexandcopy = require("./indexOpencopy");
const logger = require("./loggerProject");
const { Client } = require("@opensearch-project/opensearch");
const processs = require("process");
const getFormattedDateTime = require("./helper/formattedDateTime");
const thumbnailCreator = require("./createThumbnail");
ffmpeg.setFfmpegPath("./ffmpeg.exe");
ffmpeg.setFfprobePath("./ffprobe.exe");

let doccount = 0;

const host = "127.0.0.1";
const protocol = "http";
const port = 9200;
const auth = "admin:admin"; // For testing only. Don't store credentials in code.
let client;
const indexName = "chipsterindex";
const mapping = {
  properties: {
    title: {
      type: "text", // Make the "title" field text searchable
    },
    imagetags: {
      type: "text", // Make the "title" field text searchable
    },
    baseurl: {
      type: "keyword", // Make the "category" field filterable
    },
    filetype: {
      type: "keyword", // Make the "category" field filterable
    },
  },
};

async function deleteAndCreateIndex() {
  try {
    const ifExists = await client.indices.exists({ index: indexName });
    logger.info("Checking if Index exists...");
    if (ifExists && ifExists.body) {
      logger.info("Index exists trying to delete...");
      await client.indices.delete({ index: indexName });
      logger.info("Index deleted successfully");
    }

    const response = await client.indices.create({
      index: indexName,
      body: {
        settings: {
          number_of_shards: 1, // Set the desired number of primary shards
          number_of_replicas: 0, // Set the desired number of replica shards
        },
        mappings: {
          properties: mapping.properties,
        },
      },
    });

    logger.info("Index created successfully");
    console.log(JSON.stringify(response));
  } catch (error) {
    logger.error("Failed to create index or update index");
    logger.error(
      "Failed to create index or update index Please check if Opensearch is running"
    );
    throw new Error("Failed to create index or update index");
  }
}

const options = {
  ignoreHref: true, // ignore <a> tags and their content
  ignoreImage: true, // ignore <img> tags and their content
  noLinkBrackets: true, // do not add square brackets around links
  preserveNewlines: false, // preserve newlines in the text
  noLinkBrackets: true,
  ignoreHref: true,
  wordwrap: 1,
  ignoreImage: true,
  encodeCharacters: {
    "\n": " ",
    "\n\n": " ",
    "\n\n\n": " ",
    "\n\n\n\n": " ",
    "\n\n\n\n\n": " ",
    "\n\n\n\n\n\n": " ",
    "\n\n\n\n\n\n\n": " ",
    "\n\n\n\n\n\n\n\n": " ",
    "/": " ",
    "\\": " ",
    "(": " ",
    ")": " ",
    "[": " ",
    "]": " ",
    "\r": " ",
    "\t": " ",
    "\f": " ",
    "\v": " ",
    "\u00A0": " ",
    "*": " ",
  },
  whitespaceCharacters: "\t\r\n",
  selectors: [
    { selector: "a", format: "skip" },
    { selector: "img", format: "skip" },
    { selector: "script", format: "skip" },
    { selector: "style", format: "skip" },
    { selector: "br", options: { itemPrefix: " " } },
    { selector: "header", format: "skip" },
    { selector: "footer", format: "skip" },
    { selector: "ul", options: { itemPrefix: " " } },
    { selector: "ol", options: { itemPrefix: " " } },
    // { selector: 'li', options: { itemPrefix: " " }},
    { selector: "p", options: { itemPrefix: " " } },
    { selector: "h1", options: { itemPrefix: " " } },
    { selector: "h2", options: { itemPrefix: " " } },
    { selector: "h3", options: { itemPrefix: " " } },
    { selector: "h4", options: { itemPrefix: " " } },
    { selector: "h5", options: { itemPrefix: " " } },
    { selector: "h6", options: { itemPrefix: " " } },
    { selector: "table", options: { itemPrefix: " " } },
    // { selector: 'tr', options: { itemPrefix: "" }},
    //{ selector: 'td', options: { itemPrefix: "" }},
    //{ selector: 'th', options: { itemPrefix: "" }},
    //{ selector: 'title', options: { itemPrefix: "" }},
  ],
  decodeEntities: true,
};

const findVideoInfo = async (videofilepath) => {
  return new Promise((resolve, reject) => {
    try {
      ffmpeg.ffprobe(videofilepath, function (err, info) {
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

// Recursive function to scan directory
async function scanDirectory(dirPath, lastdirname, dirlength) {
  const stack = [dirPath];
  while (stack.length) {
    try {
      const currentPath = stack.pop();
      logger.info(`Scanning ${currentPath}`);
      const files = fs.readdirSync(currentPath);
      await Promise.all(
        files.map(async function (file) {
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
                const data = {
                  id: id,
                  title: title,
                  filename: fileName,
                  filetype: "webpage",
                  filesize: filesize,
                  url: url,
                  filedetails: cleanedText,
                  baseurl: baseurl,
                };

                try {
                  await client.index({
                    index: indexName,
                    body: data,
                  });
                  // await data.save();
                  scandataval.nofiles = scandataval.nofiles + 1;
                  doccount++;
                  logger.info(`${filePath} scanned and saved to opensearch`);
                  logger.debug(`Number of Document scanned are ${doccount}`);
                } catch (err) {
                  logger.error(
                    `Failed to save data to opensearch ${filePath}. Skipping file. Scanning will continue`
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
            } else if (
              filetype === "image/jpeg" ||
              filetype === "image/png" ||
              filetype === "image/jpg" ||
              filetype === "image/tiff" ||
              filetype === "image/tif"
            ) {
              // this code works as well it is able to extract metadata height and stuff as well as advance things
              try {
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
                  if (
                    result.ImageDescription &&
                    result.ImageDescription.description
                  ) {
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

                const data = {
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
                };

                try {
                  // console.log(data.filedetails)
                  await client.index({
                    index: indexName,
                    body: data,
                  });
                  // await data.save();
                  scandataval.nofiles = scandataval.nofiles + 1;
                  doccount++;
                  logger.info(`${filePath} scanned and saved to opensearch`);
                  logger.debug(`Number of Document scanned are ${doccount}`);
                } catch (e) {
                  // console.log(e);
                  logger.error(
                    `Failed to save data to opensearch ${filePath}. Skipping file. Scanning will continue`
                  );
                  const jsonError = JSON.stringify(e);
                  logger.debug(`Error:- ${jsonError}`);
                }
              } catch (e) {
                //console.log(e);
                logger.error(`Failed to scan file data ${filePath}`);
                const jsonError = JSON.stringify(e);
                logger.debug(jsonError);
              }
            } else if (
              filetype === "image/gif" ||
              filetype === "image/webp" ||
              filetype === "image/avif"
            ) {
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
                    if (
                      result.ImageDescription &&
                      result.ImageDescription.description
                    ) {
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
                  const data = {
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
                  };

                  try {
                    // console.log(data.filedetails)
                    await client.index({
                      index: indexName,
                      body: data,
                    });
                    scandataval.nofiles = scandataval.nofiles + 1;
                    doccount++;
                    logger.info(`${filePath} scanned and saved to opensearch`);
                    logger.debug(`Number of Document scanned are ${doccount}`);
                  } catch (e) {
                    // console.log(e);
                    logger.error(
                      `Failed to save data to opensearch ${filePath}. Skipping file. Scanning will continue`
                    );
                    const jsonError = JSON.stringify(e);
                    logger.debug(`Error:- ${jsonError}`);
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
                    if (
                      result.ImageDescription &&
                      result.ImageDescription.description
                    ) {
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

                const data = {
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
                };

                try {
                  // console.log(data.filedetails)
                  await client.index({
                    index: indexName,
                    body: data,
                  });
                  scandataval.nofiles = scandataval.nofiles + 1;
                  doccount++;
                  logger.info(`${filePath} scanned and saved to opensearch`);
                  logger.debug(`Number of Document scanned are ${doccount}`);
                } catch (e) {
                  // console.log(e);
                  logger.error(
                    `Failed to save data to opensearch ${filePath}. Skipping file. Scanning will continue`
                  );
                  const jsonError = JSON.stringify(e);
                  logger.debug(`Error:- ${jsonError}`);
                }
              } catch (e) {
                logger.error(
                  `Failed to save data to opensearch ${filePath}. Skipping file. Scanning will continue`
                );
              }
            }

            if (
              filetype === "video/x-matroska" ||
              filetype === "video/mp4" ||
              filetype === "video/quicktime" ||
              filetype === "video/webm" ||
              filetype === "video/x-msvideo" ||
              filetype === "video/x-ms-wmv" ||
              filetype === "video/ogg"
            ) {
              try {
                logger.debug("file path: " + filePath);
                let retry = 1;
                let timeValue = getFormattedDateTime();
                let thumbnailFileName = `${timeValue}${id}.jpg`;
                let outputFolderPath = processs.cwd() + `\\..\\Projects\\${rootProjectName}\\thumbnails\\`;
                fs.mkdirSync(outputFolderPath, { recursive: true });
                let outputPath = outputFolderPath + thumbnailFileName;
                // logger.error("Output ankursingh File path: " + outputPath);
                let thumbnailUrl = `http://chipstersearch/opensearch/thumbnails/${thumbnailFileName}`;
                try {
                  thumbnailCreator(filePath, outputPath);
                } catch (e) {
                  while (retry <= 3) {
                    try {
                      thumbnailCreator(filePath, thumbnailFileName);
                      break;
                    } catch (e) {
                      logger.error(
                        `Error creating thumbnail, Trial Number: ${retry}`
                      );
                    }
                    retry++;
                  }
                }
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

                    const startIndexvideo =
                      filePath.indexOf(hostnamevideo) + hostnamevideo.length;
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

                    const data = {
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
                      baseurl: baseurlvideo,
                      thumbnailUrl: thumbnailUrl,
                    };

                    try {
                      // await data.save();
                      await client.index({
                        index: indexName,
                        body: data,
                      });
                      scandataval.nofiles = scandataval.nofiles + 1;
                      doccount++;
                      logger.info(
                        `${filePath} File scanned and data saved successfully to opensearch`
                      );
                    } catch (e) {
                      logger.error(
                        `Failed to save data to opensearch ${filePath}. Skipping file. Scanning will continue`
                      );
                      logger.debug(JSON.stringify(e));
                    }
                    // Handle the video info (metadata)
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

                const datavl = {
                  id: id,
                  title: title,
                  filename: fileName,
                  filetype: "pdf",
                  filesize: filesize,
                  url: url,
                  filedetails: cleanedData,
                  baseurl: baseurl,
                };

                try {
                  // console.log(data.filedetails)
                  await client.index({
                    index: indexName,
                    body: datavl,
                  });
                  scandataval.nofiles = scandataval.nofiles + 1;
                  doccount++;
                  logger.info(`${filePath} scanned and saved to opensearch`);
                  logger.debug(`Number of Document scanned are ${doccount}`);
                } catch (e) {
                  logger.error(
                    `Failed to save data to opensearch ${filePath}. Skipping file. Scanning will continue`
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
                fs.readFile(filePath, "utf8", function (err, data) {
                  if (err) {
                    logger.error(`Failed to read file data ${filePath}`);
                    const jsonError = JSON.stringify(err);
                    logger.debug(jsonError);
                  } else {
                    try {
                      let cleanedData = data.replace(/[\n\/\\><-]+|\s+/g, " ");
                      let title = cleanedData.substring(0, 30);

                      const dataval = {
                        id: id,
                        title: title,
                        filename: fileName,
                        filetype: "text",
                        filesize: filesize,
                        url: url,
                        filedetails: cleanedData,
                        baseurl: baseurl,
                      };
                      client
                        .index({
                          index: indexName,
                          body: dataval,
                        })
                        .then(() => {
                          scandataval.nofiles = scandataval.nofiles + 1;
                          doccount++;
                          logger.info(
                            `${filePath} scanned and saved to the opensearch`
                          );
                          logger.debug(
                            `Number of Documents scanned is ${doccount}`
                          );
                        })
                        .catch((e) => {
                          logger.error(
                            `Failed to save data to the opensearch ${filePath}. Skipping file. Scanning will continue`
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
            } else if (
              filetype ===
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
              filetype === "application/msword"
            ) {
              try {
                const extractor = new WordExtractor();
                const extracted = extractor.extract(filePath);
                await extracted.then(async (doc) => {
                  let cleanedData = doc
                    .getBody()
                    .replace(/[\n\/\\><-]+|\s+/g, " ");
                  let title = cleanedData.substring(0, 30);

                  const data = {
                    id: id,
                    title: title,
                    filename: fileName,
                    filetype: "doc-docx",
                    filesize: filesize,
                    url: url,
                    filedetails: cleanedData,
                    baseurl: baseurl,
                  };

                  try {
                    // console.log(data.fileDetails)
                    await client.index({
                      index: indexName,
                      body: data,
                    });
                    scandataval.nofiles = scandataval.nofiles + 1;
                    doccount++;
                    logger.info(`${filePath} scanned and saved to opensearch`);
                    logger.debug(`Number of Document scanned are ${doccount}`);
                  } catch (e) {
                    // console.log(e);
                    logger.error(
                      `Failed to save data to opensearch ${filePath}. Skipping file. Scanning will continue`
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

let connectOpensearch = () => {
  return new Promise((resolve, reject) => {
    try {
      client = new Client({
        node: `${protocol}://${auth}@${host}:${port}`,
        ssl: {
          rejectUnauthorized: false, // if you're using self-signed certificates with a hostname mismatch.
        },
      });
      resolve();
    } catch (error) {
      logger.error(
        `Failed to connect to Opensearch. Please check if Opensearch is running`
      );
      logger.error(
        `Failed to connect and Please check if Opensearch is reachable`
      );
      const jsonError = JSON.stringify(error);
      logger.debug(jsonError);
      reject(error);
    }
  });
};

router.get("/", async (req, res) => {
  logger.info(`Scanning req received`);

  connectOpensearch()
    .then(async () => {
      logger.info("Client Created for opensearch");
      let dirPath = req.query.dirPath;
      //taking project name from arguments
      const projectname = process.argv[2] || "chipsterProject";

      let tempdir = dirPath.split("\\");
      let lastdirname = tempdir[tempdir.length - 1];
      let dirlength = lastdirname.length;

      scandataval.nofiles = 0;
      scandataval.nofolders = 0;

      doccount = 0;
      // await Data.deleteMany({});
      // logger.info("All documents are deleted");
      await deleteAndCreateIndex()
        .then(() => {
          logger.info("Created index");
          scanDirectory(dirPath, lastdirname, dirlength)
            .then(async () => {
              // Directory scanning completed
              logger.info("Directory scanning completed");
              try {
                logger.info(
                  "Copying of data folder to project location has Started..."
                );
                await indexandcopy(projectname);
                logger.info("Data folder is copied to location...");
              } catch (e) {
                //console.log(e);
                logger.error("Failed to copy the data folder");
                const jsonError = JSON.stringify(e);
                logger.debug(`Error:- ${jsonError}`);
                return res.status(500).json({
                  message:
                    "Failed to copy folder to project path. Please do it manually",
                });
              }
              logger.info("Scanning and Indexing is completed successfully");
              return res.status(200).json({
                message: "Directory scanned and Indexed documents Successfully",
                doccount: doccount,
              });
            })
            .catch((err) => {
              logger.error(
                "Failed to Scan the directory. Please check if directory is correct"
              );
              logger.error(
                "Failed to Scan the directory. Please check if Opensearch is Running"
              );

              return res.status(500).json({
                message: "Unable to scan directory",
              });
            });
        })
        .catch((error) => {
          logger.error("Failed to created or update index");
          const jsonError = JSON.stringify(error);
          logger.debug(jsonError);
          return res.status(500).json({
            message:
              "Failed to create or update index,check if opensearch is running",
          });
        });
    })
    .catch((err) => {
      logger.error(
        "Failed to connect to Opensearch. Please check if Opensearch is running"
      );
      return res.status(500).json({
        message:
          "Failed to connect to Opensearch. Please check if Opensearch is running on 9200",
      });
    });
});

module.exports = router;
