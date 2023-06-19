
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

const ExifParser = require('exif-parser');
const ExifReader = require('exifreader');
var ffmpeg = require('ffmpeg');
const Data = require("./models/data");
const indexandcopy = require("./indexOpencopy1");
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
             
             const files = fs.readdirSync(currentPath);
          await Promise.all(
              files.map(async function (file) {
          
              console.log(file,'file');
                let filePath = path.join(currentPath, file);
                let stats = fs.statSync(filePath);
                if (stats.isDirectory()) {
                  
                  scandataval.nofolders=scandataval.nofolders+1;
                 
                    stack.push(filePath);
                } else {
                  // Handle file here
                  
                  let fileName = file;
                  let fileDetails = "";
                  let filetype = "";
                  let filesize= stats.size;
                  let id = uuidv4();
                 
                  
                  console.log(filePath,'filepath');
                  const index = filePath.indexOf(lastdirname);
                  console.log(index,'index');
                  const hostname = filePath.slice(index + dirlength+1).split('\\')[0];
                  baseurl = "http://"+hostname;
                  console.log(hostname,baseurl,'hostname','baseurl')
                 
                  const startIndex = filePath.indexOf(hostname) + hostname.length;
                  const pathAfterDomain = filePath.substring(startIndex).replace(/\\/g, '/');
                
                  let url= baseurl + pathAfterDomain;
                 
                  try {
                    filetype = mime.lookup(filePath);
                    
                   
                  } catch (err) {
                      console.log(err);
                    
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
                          fileName: fileName,
                          fileType: "html",
                          fileSize:filesize,
                          url:url,
                          
                          filedetails: cleanedText,
                          baseurl:baseurl,
                      })
      
                      try{
                        console.log(data.filedetails)
                          await data.save();
                          scandataval.nofiles=scandataval.nofiles+1;
                          doccount++;
                         
                          
                      }
                      catch(err){
                          console.log(err);
                          
                      }
      
                      //fileNames.push({id:id,title:title, fileName: fileName, fileType: "html",fileSize:filesize,url:url, fileDetails: cleanedText });
                      
                    } catch (err) {
                      console.error('Failed to read HTML file:', err);
                      
                      
                    }
                  }
                   else if (filetype === "image/jpeg" || filetype === "image/png" || filetype==="image/jpg") {
                   
                    // this code works as well it is able to extract metadata height and stuff as well as advance things
                    try{
                      // const imageBuffer = fs.readFileSync(filePath);
      
                      // // Create ExifParser instance and parse image buffer
                      // const parser = ExifParser.create(imageBuffer);
                      // const result = parser.parse();
                      // //console.log(result,'result');
                    const imageBuffer = fs.readFileSync(filePath)
                      const result =  ExifReader.load(imageBuffer);
                      //console.log(result);
                       let imgtitle="";
                      let imgtags="";
                      let imageWidth= result?result.ImageWidth?result.ImageWidth.value:0:0;
                      let imageLength=result?result.ImageLength?result.ImageLength.value:0:0;
                      let imageDescription="";
      
                      if(result){
                        if(result.ImageDescription){
                         
                          imageDescription =result.ImageDescription.value.toString('utf16le').replace(/[\n\/\\><-]+|\s+/g, ' ');
                        }
      
                        if(result.title){
                         
                          imgtitle = result.title.description.replace(/[\n\/\\><-]+|\s+/g, ' ');
                        }
                       if(result.subject){
                       
                        imgtags = result.subject.description.replace(/[\n\/\\><-]+|\s+/g, ' ');
                       }
                       
                      
                       
                      }
      
                      const data = new Data({
                        id:id,
                          title:imgtitle,
                          fileName: fileName,
                          fileType: "image",
                          fileSize:filesize,
                          url:url,
                          filedetails: imageDescription,
                          length:imageLength,
                          width:imageWidth,
                          imgtags:imgtags,
                          baseurl:baseurl,
      
                      })
      
                      try{
                        console.log(data.filedetails)
                          await data.save();
                          scandataval.nofiles=scandataval.nofiles+1;
                          doccount++;
                        
                          
                      }
                      catch(e){
                          console.log(e);
                          
                      }
                     
                       //fileNames.push({id:id,title:imgtitle, fileName: fileName, fileType: "image",fileSize:filesize,url:url, fileDetails: imageDescription,imagesize:{imageLength,imageWidth},imgtags:imgtags })
                       
                    }
      
                    catch(e){
                      console.log(e);
                    
                      
                    }
                      
            
                  }
      
                  // else if(filetype==="image/gif"){
                  //   try{
                                
                  
      
                  //   }
                  // catch(e){
                  //   console.log(e);
                  //   throw new Error("Something went wrong with image");
                  // }
                  // }
      
                  else if(filetype=="video/x-matroska"){
                    try {
                      var process = new ffmpeg(filePath);
                      process.then(async function (video) {
                        // Video metadata
                       console.log(video.metadata);
                        // FFmpeg configuration
                       
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
                              fileName: fileName,
                              artist:artist,
                              album:album,
                              track:track,
                              fileType: "video",  
                              fileSize:filesize,
                              url:url,
                              codec:codec,
                              duration:duration,
                              length:length,
                              width:width,
                              baseurl:baseurl,
      
                          });
      
                          try{
                            console.log(data.filedetails)
                              await data.save();
                              scandataval.nofiles=scandataval.nofiles+1;
                              doccount++;
                              
                              
                          }
                          catch(e){
                              console.log(e);
                            
                          }
                        
                         // fileNames.push({id:id,title:title, fileName: fileName,artist:artist,album:album,track:track, fileType: "video",fileSize:filesize,url:url, codec:codec,duration:duration,bitrate:bitrate,resoultion:resoultion,fps:fps,audiocodec:audiocodec,audiochannels:audiochannels,audiobitrate:audiobitrate,audiosamplerate:audiosamplerate });
                       }
                      }, function (err) {
                        console.log('Error: ' + err);
                        
                      });
                    } catch (e) {
                      console.log(e);
                      
                     
                    }
                  }
                   else if (filetype === "application/pdf") {
                    try{
                      let dataBuffer = fs.readFileSync(filePath);
                      const data = await pdf(dataBuffer)
                      let cleanedData = data.text.replace(/[\n\/\\><-]+|\s+/g, ' ');
                      //console.log(cleanedData);
                      let title="";
                      //const dataobj ={id:id,title:title, fileName: fileName, filetype: filetype,fileSize:filesize,url:url, fileDetails: cleanedData };
                     
                     const datavl = new Data({
                      id:id,
                      title:title,
                      fileName: fileName,
                      fileType: "pdf",
                      fileSize:filesize,
                      url:url,
                      filedetails: cleanedData,
                      baseurl:baseurl,
                  
                     })
      
                     try{
                      console.log(data.filedetails)
                      await datavl.save();
                      scandataval.nofiles=scandataval.nofiles+1;
                      doccount++;
                     
                      
                      }
                      catch(e){
                      console.log(e);
                      
                   }
                     // fileNames.push({id:id,title:title, fileName: fileName, filetype: "pdf",fileSize:filesize,url:url, fileDetails: cleanedData }); 
                  
                    }
                    catch(e){
                      console.log(e);
                      
                     
                    }
                  }
                   else if (filetype === "text/plain") {
                  try{
                    fs.readFile(filePath, 'utf8',function (err, data) {
                      if (err) throw err;
                      else{
                        let cleanedData = data.replace(/[\n\/\\><-]+|\s+/g, ' ');
                        let title = cleanedData.substring(0, 30);
                       
                       const dataval = new Data({
                        id:id,
                          title:title,
                          fileName: fileName,
                          fileType: "text",
                          fileSize:filesize,
                          url:url,
                          filedetails: cleanedData,
                          baseurl:baseurl,
      
                       })
      
                       try{
                        console.log(data.filedetails)
                       dataval.save().then((data)=>{
                        scandataval.nofiles=scandataval.nofiles+1;
                        doccount++;
                       }).catch((e)=>console.log(e))
                       
                        
                      }
                      catch(e){
                          console.log(e);
                        
                      }
                       // fileNames.push({id:id,title:title, fileName: fileName, filetype: "text",fileSize:filesize,url:url, fileDetails: cleanedData });
                       // console.log(data);
                      }
                      
                    });  
                  }
      
                  catch(e){
                    console.log(e);
                    
                    
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
                              fileName: fileName,
                              fileType: "doc-docx",
                              fileSize:filesize,
                              url:url,
                              filedetails: cleanedData,
                              baseurl:baseurl,
      
                          })
      
                          try{
                            console.log(data.fileDetails)
                              await data.save();
                              scandataval.nofiles=scandataval.nofiles+1;
                              doccount++;
                              
                          }
                          catch(e){
                              console.log(e);
                            
                          }
                          //fileNames.push({id:id,title:title, fileName: fileName, filetype: "doc-docx",fileSize:filesize,url:url, fileDetails: cleanedData });
                         
                        })
                        
                    }
                    catch(e){
                      console.log(e);
                      
                     
                    }
                   
      
                  }
      
                }
              })
          )
      
          
          } catch (err) {
            console.error('Failed to read directory:', err);
        
            
          }
    }
  
  }


router.get("/", async (req, res) => {
  let dirPath = req.query.dirPath;
  const projectname = req.query.indexPath;
  let tempdir = dirPath.split('\\');
  let lastdirname = tempdir[tempdir.length-1];
 
  let dirlength= lastdirname.length;
 
  scandataval.nofiles=0;
  scandataval.nofolders=0;
  
  doccount=0;
  await Data.deleteMany({})
  scanDirectory(dirPath,lastdirname,dirlength)
    .then(async () => {
      // Directory scanning completed
      try{
        await indexandcopy(projectname);
      }
      catch(e){
        console.log(e);
        return res.status(500).json({
          message:"Indexing done but Failed to copy folder to project path. Please do it manually"
        })
      }
      
      return res.status(200).json({
            message:"Directory scanned successfully and file names written to json file",
            doccount:doccount
    })


    })
    .catch((err) => {
      console.error("Unable to scan directory", err);
      return res.status(500).json({
        message:"Unable to scan directory"
      });
    });
});

module.exports = router;
