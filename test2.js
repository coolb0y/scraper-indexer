const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

// Function to maintain aspect ratio
function maintainAspectRatio(height, aspectRatio = 16 / 9) {
  const width = Math.round(height * aspectRatio);
  return `${width}:${height}`;
}

const aspectRatioSize = maintainAspectRatio(360);

// Function to detect scene changes and create a thumbnail
function detectScenesAndCreateThumbnail(inputVideoPath, outputThumbnailPath) {
  const tempSceneFilePath = path.resolve(`scenes_${path.basename(inputVideoPath, '.mp4')}.txt`);

  ffmpeg(inputVideoPath)
    .outputOptions([
      '-vf', 'select=gt(scene\\,0.2),metadata=print:key=lavfi.scene_score', // Detect scene changes
      '-vsync', 'vfr',
      '-f', 'null'
    ])
    .on('start', function(commandLine) {
      console.log(`Spawned FFmpeg with command: ${commandLine}`);
    })
    .on('stderr', function(stderrLine) {
      fs.appendFileSync(tempSceneFilePath, stderrLine);
    })
    .on('end', function() {
      fs.readFile(tempSceneFilePath, 'utf8', (err, data) => {
        if (err) {
          console.error(`Error reading scene file for ${path.basename(inputVideoPath)}:`, err.message);
          createThumbnail(inputVideoPath, outputThumbnailPath, true); // Fallback to simple thumbnail
        } else {
          const hasSceneChanges = data.includes('scene_score');
          createThumbnail(inputVideoPath, outputThumbnailPath, !hasSceneChanges);
        }
        fs.unlink(tempSceneFilePath, () => {}); // Clean up temporary file
      });
    })
    .on('error', function(err) {
      console.error(`Error detecting scenes in ${path.basename(inputVideoPath)}:`, err.message);
      createThumbnail(inputVideoPath, outputThumbnailPath, true); // Fallback to simple thumbnail
    })
    .saveToFile('/dev/null'); // Specify a dummy output to satisfy ffmpeg requirements
}

// Function to create a thumbnail
function createThumbnail(inputVideoPath, outputThumbnailPath, fallback = false) {
  const vfFilter = fallback 
    ? `thumbnail,scale=${aspectRatioSize}` 
    : `select=gt(scene\\,0.2),scale=${aspectRatioSize}`;

  ffmpeg(inputVideoPath)
    .outputOptions([
      '-vf', vfFilter, // Scene detection and scaling or fallback
      '-frames:v', '1', // Extract one frame
      '-vsync', 'vfr' // Variable frame rate to handle selected frames
    ])
    .on('end', () => {
      console.log(`Thumbnail for ${path.basename(inputVideoPath)} extracted successfully`);
    })
    .on('error', (err) => {
      if (!fallback) {
        console.log(`Scene detection failed for ${path.basename(inputVideoPath)}, retrying with thumbnail filter...`);
        createThumbnail(inputVideoPath, outputThumbnailPath, true);
      } else {
        console.error(`Error extracting thumbnail for ${path.basename(inputVideoPath)}:`, err.message);
      }
    })
    .save(outputThumbnailPath);
}

// Loop through the videos
for (let i = 1; i <= 15; i++) {
  const inputVideoPath = path.resolve(`sample${i}.mp4`);
  const outputThumbnailPath = path.resolve(`thumbnail${i}.jpg`);

  detectScenesAndCreateThumbnail(inputVideoPath, outputThumbnailPath);
}