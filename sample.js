const ExifReader = require("exifreader");
const fs = require("fs-extra");
var gracefulFs = require("graceful-fs");
gracefulFs.gracefulify(fs);
const filePath = "C:/Users/gameS/OneDrive/Desktop/Chipsterankur4/Chipster4Imagetest/swimming boy.webp";
const filePath2 = "C:/Users/gameS/OneDrive/Desktop/Chipsterankur4/Chipster4Imagetest/typing.gif";
const filePath3 = "C:/Users/gameS/OneDrive/Desktop/Chipsterankur4/Chipster4Imagetest/fox.avif";
const exiftool = require("exiftool-vendored").exiftool;
// this is written to test some new formats we are considering
const vendorFunc = ()=>{
    exiftool
  .read(filePath2)
  .then((tags /*: Tags */) =>
    console.log(
      `Make: ${tags.Make}, Model: ${tags.Model}, Errors: ${tags.errors}`
    )
  )
  .catch((err) => console.error("Something terrible happened: ", err))
}

const SomeFunc = async ()=>{

    const imageBuffer = fs.readFileSync(filePath2);
    const result = ExifReader.load(imageBuffer);
    console.log(result);
    
    // let imgtitle = "";
    // let imgtags = "";
    // let imageWidth = result
    //   ? result["Image Width"]
    //     ? result["Image Width"].value
    //     : 0
    //   : 0;
    // let imageLength = result
    //   ? result["Image Height"]
    //     ? result["Image Height"].value
    //     : 0
    //   : 0;
    // let imageDescription = "";
    
    // if (result) {
    //   if (
    //     result.ImageDescription &&
    //     result.ImageDescription.description
    //   ) {
    //     imageDescription =
    //       result.ImageDescription.description.replace(
    //         /[\n\/\\><-]+|\s+/g,
    //         " "
    //       );
    //   }
    
    //   if (result.title && result.title.description) {
    //     imgtitle = result.title.description.replace(
    //       /[\n\/\\><-]+|\s+/g,
    //       " "
    //     );
    //   }
    //   if (result.subject && result.title.description) {
    //     imgtags = result.subject.description.replace(
    //       /[\n\/\\><-]+|\s+/g,
    //       " "
    //     );
    //   }
    // }
    
    // const data = new Data({
    //   id: id,
    //   title: imgtitle,
    //   filename: fileName,
    //   filetype: "image",
    //   filesize: filesize,
    //   url: url,
    //   filedetails: imageDescription,
    //   length: imageLength,
    //   width: imageWidth,
    //   imgtags: imgtags,
    //   baseurl: baseurl,
    // });
    
    // try {
    //   // console.log(data.filedetails)
    //   await data.save();
    //   scandataval.nofiles = scandataval.nofiles + 1;
    //   doccount++;
    //   logger.info(`${filePath} scanned and saved to database`);
    //   logger.debug(`Number of Document scanned are ${doccount}`);
    // } catch (e) {
    //   // console.log(e);
    //   logger.error(
    //     `Failed to save data to database ${filePath}. Skipping file. Scanning will continue`
    //   );
    //   const jsonError = JSON.stringify(e);
    //   logger.debug(`Error:- ${jsonError}`);
    // }
}


SomeFunc();
//vendorFunc();