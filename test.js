const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

// Function to maintain aspect ratio
function maintainAspectRatio(height, aspectRatio = 16 / 9) {
  const width = Math.round(height * aspectRatio);
  return `${width}:${height}`;
}

const aspectRatioSize = maintainAspectRatio(360);

// Function to detect scene changes
function detectScenes(inputVideoPath, callback) {
    const sceneTimestampsFile = path.resolve(`scenes_${path.basename(inputVideoPath, '.mp4')}.txt`);
  
    ffmpeg(inputVideoPath)
      .outputOptions([
        '-vf', 'select=gt(scene\\,0.2)',
        '-vsync', 'vfr',
        '-f', 'null',
        // '-'
      ])
      .output(sceneTimestampsFile)
      .on('end', () => {
        fs.readFile(sceneTimestampsFile, 'utf8', (err, data) => {
          if (err) {
            console.error(`Error reading scene timestamps file for ${inputVideoPath}:`, err.message);
            callback(false);
          } else {
            console.log("Scene timestamps detected");
            const hasSceneChanges = data.trim().length > 0;
            callback(hasSceneChanges);
          }
        //   fs.unlink(sceneTimestampsFile, () => {}); // Clean up the temporary file
        });
      })
      .on('error', (err) => {
        console.error(`Error detecting scenes in ${inputVideoPath}:`, err.message);
        callback(false);
      })
      .run();
  }

// Function to create a thumbnail
function createThumbnail(inputVideoPath, outputThumbnailPath, useFallback) {
  const vfFilter = useFallback
    ? `thumbnail,scale=${aspectRatioSize}`
    : `select=gt(scene\\,0.2),scale=${aspectRatioSize}`;

  ffmpeg(inputVideoPath)
    .outputOptions([
      '-vf', vfFilter,
      '-frames:v', '1',
      '-vsync', 'vfr'
    ])
    .on('end', () => {
      console.log(`Thumbnail for ${path.basename(inputVideoPath)} extracted successfully`);
    })
    .on('error', (err) => {
      console.error(`Error extracting thumbnail for ${path.basename(inputVideoPath)}:`, err.message);
    })
    .save(outputThumbnailPath);
}

// Loop through the videos
for (let i = 1; i <= 15; i++) {
  const inputVideoPath = path.resolve(`sample${i}.mp4`);
  const outputThumbnailPath = path.resolve(`thumbnail${i}.jpg`);

  detectScenes(inputVideoPath, (hasSceneChanges) => {
    if (hasSceneChanges) {
      createThumbnail(inputVideoPath, outputThumbnailPath, false);
    } else {
      console.log(`No significant scene changes detected for ${inputVideoPath}, using fallback.`);
      createThumbnail(inputVideoPath, outputThumbnailPath, true);
    }
  });
}
