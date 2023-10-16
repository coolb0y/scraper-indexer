
const router = require("express").Router();
const fs = require("fs-extra");
var gracefulFs = require('graceful-fs')
gracefulFs.gracefulify(fs)
const path = require('path');
let mime = require('mime-types')
const { convert } = require('html-to-text');
const pdf = require('pdf-parse');
require('dotenv').config();
const { 
    v4: uuidv4,
  } = require('uuid');
const cheerio = require('cheerio');
const WordExtractor = require("word-extractor"); 

// const ExifParser = require('exif-parser');
const ExifReader = require('exifreader');
var ffmpeg = require('ffmpeg');
const Data = require("./models/data");
const indexandcopy = require("./indexOpencopy");
const logger  = require('./logger');
// Read Word document

let doccount = 0;

const options = {
    ignoreHref: true, // ignore <a> tags and their content
    ignoreImage: true, // ignore <img> tags and their content
    noLinkBrackets: true, // do not add square brackets around links
    preserveNewlines: false, // preserve newlines in the text
    noLinkBrackets: true,
    ignoreHref: true,
    wordwrap: 1,
    ignoreImage: true,
    encodeCharacters:{"\n":" ",
    "\n\n":" ",
    "\n\n\n":" ",
    "\n\n\n\n":" ",
    "\n\n\n\n\n":" ",
    "\n\n\n\n\n\n":" ",
    "\n\n\n\n\n\n\n":" ",
    "\n\n\n\n\n\n\n\n":" ",
    "/":" ",
    "\\": " ",
    "(": " ",
    ")": " ",
    "[": " ",
    "]": " ",
    "\r":" ",
    "\t":" ",
    "\f":" ",
    "\v":" ",
    "\u00A0":" ",
    "*":" "},
    whitespaceCharacters: '\t\r\n',
    selectors: [
        { selector: 'a', format: 'skip'},
        { selector: 'img', format: 'skip'},
        { selector: 'script', format: 'skip'},
        { selector: 'style', format: 'skip'},
        { selector: 'br', options:{itemPrefix: " "} },
        {selector:'header',format:'skip'},
        {selector:'footer',format:'skip'},
        { selector: 'ul', options: { itemPrefix: " " }},
        { selector: 'ol', options: { itemPrefix: " " }},
       // { selector: 'li', options: { itemPrefix: " " }},
        { selector: 'p', options: { itemPrefix: " " }},
        { selector: 'h1', options: { itemPrefix: " " }},
        { selector: 'h2', options: { itemPrefix: " " }},
        { selector: 'h3', options: { itemPrefix: " " }},
        { selector: 'h4', options: { itemPrefix: " " }},
        { selector: 'h5', options: { itemPrefix: " " }},
        { selector: 'h6', options: { itemPrefix: " " }},
        { selector: 'table', options: { itemPrefix: " " }},
       // { selector: 'tr', options: { itemPrefix: "" }},
        //{ selector: 'td', options: { itemPrefix: "" }},
        //{ selector: 'th', options: { itemPrefix: "" }},
        //{ selector: 'title', options: { itemPrefix: "" }},
      ],
      decodeEntities: true,


  
   
  };




// Recursive function to scan directory
async function scanDirectory(dirPath,lastdirname,dirlength) {

    const stack = [dirPath];
    while(stack.length) {
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
                  scandataval.nofolders=scandataval.nofolders+1;
                 
                    stack.push(filePath);
                    logger.debug(`${filePath} is added to queue`);
                } else {
                  // Handle file here
                  
                  let fileName = file;
                  let fileDetails = "";
                  let filetype = "";
                  let filesize= stats.size;
                  let id = uuidv4();
                 
                  logger.info(`${filePath} is being scanned`);
                  //console.log(filePath,'filepath');
                  const index = filePath.indexOf(lastdirname);
                  //console.log(index,'index');
                  const hostname = filePath.slice(index + dirlength+1).split('\\')[0];
                  baseurl = "http://"+hostname;
                  //console.log(hostname,baseurl,'hostname','baseurl')
                 
                  const startIndex = filePath.indexOf(hostname) + hostname.length;
                  const pathAfterDomain = filePath.substring(startIndex).replace(/\\/g, '/');
                
                  let url= baseurl + pathAfterDomain;
                 
                  try {
                    filetype = mime.lookup(filePath);
                    logger.debug(`We have figured filetype as: ${filetype}`);
                   
                  } catch (err) {
                   
                      logger.error(`Not able to find the file type of ${filetype}. Scanning will progress`);
                      const jsonError = JSON.stringify(err);
                      logger.debug(`The below error took place" :- ${jsonError}`);
                    
                  }
        
                  if (filetype === "text/html") {
                    try {
                      const html = fs.readFileSync(filePath, 'utf-8');
                      const $ = cheerio.load(html);
      
                      // Extract the title
                      let title = $('title').text().replace(/[\n\/\\><-]+|\s+/g, ' ');
                     if(title===undefined|| title==null || title==""){
                          title=""
                     }
      
                      
                      const text = convert(html, options);
                      let cleanedText = text.replace(/[\n\/\\><-]+|\s+/g, ' ');
                     
                      //console.log(text);
                      const data = new Data({
                          
                          id:id,
                          title:title,
                          filename: fileName,
                          filetype: "html",
                          filesize:filesize,
                          url:url,
                          
                          filedetails: cleanedText,
                          baseurl:baseurl,
                      })
      
                      try{
                         
                          await data.save();
                          scandataval.nofiles=scandataval.nofiles+1;
                          doccount++;
                          logger.info(`${filePath} scanned and saved to database`);
                          logger.debug(`Number of Document scanned are ${doccount}`);
                          
                      }
                      catch(err){
                      
                          logger.error(`Failed to save data to databse ${filePath}. Skipping file. Scanning will continue`);
                          const jsonError = JSON.stringify(err);
                          logger.debug(jsonError);
                          
                          
                      }
      
                     } catch (err) {
                    
                      logger.error(`Failed to read HTML file ${filePath}. Skipping file. Scanning will continue`);
                      const jsonError = JSON.stringify(err);
                      logger.debug(jsonError);
                      

                      
                      
                    }
                  }
                   else if (filetype === "image/jpeg" || filetype === "image/png" || filetype==="image/jpg") {
                   
                    // this code works as well it is able to extract metadata height and stuff as well as advance things
                    try{
                    
      
                    
                    const imageBuffer = fs.readFileSync(filePath)
                      const result =  ExifReader.load(imageBuffer);
                    
                      let imgtitle="";
                      let imgtags="";
                      let imageWidth= result?result["Image Width"]?result["Image Width"].value:0:0;
                      let imageLength=result?result["Image Height"]?result["Image Height"].value:0:0;
                      let imageDescription="";
      
                      if(result){
                        if(result.ImageDescription && result.ImageDescription.description){
                         
                          imageDescription =result.ImageDescription.description.replace(/[\n\/\\><-]+|\s+/g, ' ');
                        }
      
                        if(result.title && result.title.description){
                         
                          imgtitle = result.title.description.replace(/[\n\/\\><-]+|\s+/g, ' ');
                        }
                       if(result.subject && result.title.description){
                       
                        imgtags = result.subject.description.replace(/[\n\/\\><-]+|\s+/g, ' ');
                       }
                       
                      
                       
                      }
      
                      const data = new Data({
                        id:id,
                          title:imgtitle,
                          filename: fileName,
                          filetype: "image",
                          filesize:filesize,
                          url:url,
                          filedetails: imageDescription,
                          length:imageLength,
                          width:imageWidth,
                          imgtags:imgtags,
                          baseurl:baseurl,
      
                      })
      
                      try{
                       // console.log(data.filedetails)
                          await data.save();
                          scandataval.nofiles=scandataval.nofiles+1;
                          doccount++;
                          logger.info(`${filePath} scanned and saved to database`);
                          logger.debug(`Number of Document scanned are ${doccount}`);
                          
                      }
                       catch(e){
                          // console.log(e);
                          logger.error(`Failed to save data to databse ${filePath}. Skipping file. Scanning will continue`);
                          const jsonError = JSON.stringify(e);
                          logger.debug(`Error:- ${jsonError}`);
                          
                        }
                     
                       
                      }
      
                     catch(e){
                      //console.log(e);
                      logger.error(`Failed to scan file data ${filePath}`);
                      const jsonError = JSON.stringify(e);
                      logger.debug(jsonError);
                      
                      
                      
                    }
                      
            
                  }
      
      
                  else if(filetype=="video/x-matroska"){
                    try {
                      var process = new ffmpeg(filePath);
                      process.then(async function (video) {
                        // Video metadata
                       
                        let title="";
                        let artist="";
                        let album="";
                        let track="";
                        let codec="";
                        let duration=0;
                        let bitrate=0;
                        let length=0;
                        let width=0;
                       
                        if(video.metadata){
                          title=video.metadata.title?video.metadata.title:"";
                          artist=video.metadata.artist?video.metadata.artist:"";
                          album=video.metadata.album?video.metadata.album:"";
                          track=video.metadata.track?video.metadata.track:"";
                          codec=video.metadata.video.codec?video.metadata.video.codec:"";
                          duration=video.metadata.duration.seconds?video.metadata.duration.seconds:0;
                          bitrate=video.metadata.video.bitrate?video.metadata.video.bitrate:0;
                          length=video.metadata.video.resolution?video.metadata.video.resolution.h:0;
                          width=video.metadata.video.resolution?video.metadata.video.resolution.w:0;
                         
      
                          const data = new Data({
                            id:id,
                              title:title,
                              filename: fileName,
                              artist:artist,
                              album:album,
                              track:track,
                              filetype: "video",  
                              filesize:filesize,
                              url:url,
                              codec:codec,
                              duration:duration,
                              length:length,
                              width:width,
                              baseurl:baseurl,
      
                          });
      
                          try{
                            // console.log(data.filedetails)
                              await data.save();
                              scandataval.nofiles=scandataval.nofiles+1;
                              doccount++;
                             logger.info(`${filePath} File scanned and data saved successfully to database`)
                              
                              
                          }
                          catch(e){
                              
                              logger.error(`Failed to save data to databse ${filePath}. Skipping file. Scanning will continue`);
                              const jsonError = JSON.stringify(e);
                              logger.debug(jsonError);
                          }
                        
                         // fileNames.push({id:id,title:title, fileName: fileName,artist:artist,album:album,track:track, fileType: "video",fileSize:filesize,url:url, codec:codec,duration:duration,bitrate:bitrate,resoultion:resoultion,fps:fps,audiocodec:audiocodec,audiochannels:audiochannels,audiobitrate:audiobitrate,audiosamplerate:audiosamplerate });
                       }
                       }, function (err) {
                       
                        logger.error(`Failed to scan file data ${filePath}`);
                        const jsonError = JSON.stringify(err);
                        logger.debug(jsonError);

                      });
                    } catch (e) {
                    
                      logger.error(`Failed to scan file data ${filePath}`);
                      const jsonError = JSON.stringify(e);
                      logger.debug(jsonError);

                     
                    }
                  }
                   else if (filetype === "application/pdf") {
                    try{
                      let dataBuffer = fs.readFileSync(filePath);
                      const data = await pdf(dataBuffer)
                      let title="";
                     
                     
                    
                      const titletemp = data.info.Title;
                     

                      let cleanedData = data.text.replace(/[\n\/\\><-]+|\s+/g, ' ');
                      if(titletemp && titletemp!=="Untitled"){
                        title = titletemp;
                      }
                      else{
                        const firstLineRegex = /^(?!\\{0,2}n$|\\{1,2}n$).+$/m;
                        const matches = data.text.match(firstLineRegex);
                        const firstLine = matches ? matches[0].trim() : null;
  
                      
                         if(firstLine){
                          title = firstLine;
                         }
                         else{
                        
                           title = firstLine?firstLine:cleanedData.substring(0, 30);
                         }
                         
                      }
                    
                     const datavl = new Data({
                      id:id,
                      title:title,
                      filename: fileName,
                      filetype: "pdf",
                      filesize:filesize,
                      url:url,
                      filedetails: cleanedData,
                      baseurl:baseurl,
                  
                     })
      
                     try{
                     // console.log(data.filedetails)
                      await datavl.save();
                      scandataval.nofiles=scandataval.nofiles+1;
                      doccount++;
                      logger.info(`${filePath} scanned and saved to database`);
                      logger.debug(`Number of Document scanned are ${doccount}`);
                     
                      
                      }
                      catch(e){
                        logger.error(`Failed to save data to databse ${filePath}. Skipping file. Scanning will continue`);
                        const jsonError = JSON.stringify(e);
                        logger.debug(jsonError);
                      
                   }
                     // fileNames.push({id:id,title:title, fileName: fileName, filetype: "pdf",fileSize:filesize,url:url, fileDetails: cleanedData }); 
                  
                    }
                    catch(e){
               
                      logger.error(`Failed to scan file data ${filePath}`);
                      const jsonError = JSON.stringify(e);
                      logger.debug(jsonError);

                     
                    }
                  }
                   else if (filetype === "text/plain") {
                    if (filetype === "text/plain") {
                      fs.readFile(filePath, 'utf8', function (err, data) {
                        if (err) {
                          logger.error(`Failed to read file data ${filePath}`);
                          const jsonError = JSON.stringify(err);
                          logger.debug(jsonError);
                        } else {
                          try {
                            let cleanedData = data.replace(/[\n\/\\><-]+|\s+/g, ' ');
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
                    
                            dataval.save()
                              .then((data) => {
                                scandataval.nofiles = scandataval.nofiles + 1;
                                doccount++;
                                logger.info(`${filePath} scanned and saved to the database`);
                                logger.debug(`Number of Documents scanned is ${doccount}`);
                              })
                              .catch((e) => {
                                logger.error(`Failed to save data to the database ${filePath}. Skipping file. Scanning will continue`);
                                const jsonError = JSON.stringify(e);
                                logger.debug(jsonError);
                              });
                          } catch (e) {
                            logger.error(`Failed to clean data of the file ${filePath}. Skipping file. Scanning will continue`);
                            const jsonError = JSON.stringify(e);
                            logger.debug(`Error:- ${jsonError}`);
                          }
                        }
                      });
                    }
                  }
                   else if (filetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || filetype === "application/msword") {
                   
                    try{
                      
                      const extractor = new WordExtractor();
                      const extracted = extractor.extract(filePath);
                      await extracted.then(async (doc) => {
                         
                          let cleanedData = doc.getBody().replace(/[\n\/\\><-]+|\s+/g, ' ');
                          let title = cleanedData.substring(0, 30);
                          
                          const data = new Data({
                               id:id,
                              title:title,
                              filename: fileName,
                              filetype: "doc-docx",
                              filesize:filesize,
                              url:url,
                              filedetails: cleanedData,
                              baseurl:baseurl,
      
                          })
      
                          try{
                           // console.log(data.fileDetails)
                              await data.save();
                              scandataval.nofiles=scandataval.nofiles+1;
                              doccount++;
                              logger.info(`${filePath} scanned and saved to database`);
                              logger.debug(`Number of Document scanned are ${doccount}`);
                          }
                          catch(e){
                             // console.log(e);
                             logger.error(`Failed to save data to databse ${filePath}. Skipping file. Scanning will continue`);
                             const jsonError = JSON.stringify(e);
                             logger.debug(`Error:- ${jsonError}`);
                             
                          }
                         
                        })
                        
                    }
                    catch(e){
                      logger.error(`Failed to scan file data ${filePath}`);
                      const jsonError = JSON.stringify(e);
                      logger.debug(`Error:- ${jsonError}`);

                      
                     
                    }
                   
      
                  }
      
                }
              })
          )
      
          
          } catch (err) {
            logger.error(`Promise to scan all files of ${dirPath} Failed. Most of files might have scanned successfully`);
            logger.error(`Some file might not be readable or It might be possible the dirPath is corrupt or cannot be read by tool`);
            const jsonError = JSON.stringify(err);
            logger.debug(`Error:- ${jsonError}`);
            
          }
    }
  
  }


router.get("/", async (req, res) => {
  logger.info(`Scanning req received`);
  let dirPath = req.query.dirPath;
  const projectname = req.query.indexPath;
  let tempdir = dirPath.split('\\');
  let lastdirname = tempdir[tempdir.length-1];
 
  let dirlength= lastdirname.length;
 
  scandataval.nofiles=0;
  scandataval.nofolders=0;
  
  doccount=0;
  await Data.deleteMany({});
  logger.info("All documents are deleted");
  scanDirectory(dirPath,lastdirname,dirlength)
    .then(async () => {
      // Directory scanning completed
      logger.info("Directory scanning completed");
      try{ 
        logger.info("Indexing to Opensearch has Started...");
        await indexandcopy(projectname);
        logger.info("Indexing to Opensearch has Finished and Data folder is copied to location...");
      }
      catch(e){
        //console.log(e);
        logger.error("Failed to index to Opensearch or failed to copy the data folder");
        logger.error("Please check if Opensearch is running");
        const jsonError = JSON.stringify(e);
        logger.debug(`Error:- ${jsonError}`);
        return res.status(500).json({
          message:"Indexing done but Failed to copy folder to project path. Please do it manually"
        })
      }
      logger.info("Scanning and Indexing is completed successfully");
      return res.status(200).json({
            message:"Directory scanned and Indexed documents Successful",
            doccount:doccount
    })


    })
    .catch((err) => {
      logger.error("Failed to Scan the directory. Please check if directory is correct");
      logger.error("Failed to Scan the directory. Please check if Mongodb and Opensearch is Running")

      return res.status(500).json({
        message:"Unable to scan directory"
      });
    });
});

module.exports = router;
