const ffmpeg = require('fluent-ffmpeg');
const path = require('path');



// Function to maintain aspect ratio
function maintainAspectRatio(height, aspectRatio = 16 / 9) {
  const width = Math.round(height * aspectRatio);
  return `${width}:${height}`;
}

const aspectRatioSize = maintainAspectRatio(360);
for(let i = 1; i <= 8;i++){
  const inputVideoPath = path.resolve(`sample${i}.mp4`);
  const outputThumbnailPath = path.resolve(`thumbnail${i}.png`);
  ffmpeg(inputVideoPath)
    // .output(outputThumbnailPath)
    .outputOptions('-vf', `thumbnail,scale=${aspectRatioSize}`, '-frames:v',`1`,'thumbnail.jpg')
  //  .output(outputThumbnailPath)
    .on('end', () => {
      console.log('Thumbnail extracted successfully');
    })
    .on('error', (err) => {
      console.error('Error extracting thumbnail:', err.message);
    })
    .save(outputThumbnailPath);
}

