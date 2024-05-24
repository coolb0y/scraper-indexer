const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

// Function to maintain aspect ratio
function maintainAspectRatio(height, aspectRatio = 16 / 9) {
  const width = Math.round(height * aspectRatio);
  return `${width}:${height}`;
}

const aspectRatioSize = maintainAspectRatio(360);
for(let i = 1; i <= 15;i++){
  const inputVideoPath = path.resolve(`sample${i}.mp4`);
  const outputThumbnailPath = path.resolve(`thumbnail${i}.jpg`);
  ffmpeg(inputVideoPath)
    .outputOptions('-vf', `thumbnail,scale=${aspectRatioSize}`, '-frames:v',`1`)
    .on('end', () => {
      console.log('Thumbnail extracted successfully');
    })
    .on('error', (err) => {
      console.error('Error extracting thumbnail:', err.message);
    })
    .save(outputThumbnailPath);
}

