const router = require('express').Router();
const path = require('path');
const logger = require('./helper/loggerProject');
const { checkFolderExists } = require('./helper/checkFolderExists');

router.get('/', async (req, res) => {
    const path = req.query.projectPath;
    // check if folder exists
    const finalPath = `..\\Projects\\${path}`;

    await checkFolderExists(finalPath)
        .then((folderExists) => {
            if (folderExists) {
                logger.info(`Folder ${finalPath} exists`);

                // console.log(`Folder "${finalPath}" exists.`);
                return res.status(200).json({
                    ans: 'true'
                })
            } else {
                logger.info(`Folder "${finalPath}" does not exist`);
                //console.log(`Folder "${finalPath}" does not exist.`)
                return res.status(200).json({
                    ans: 'false'
                })
            }
        })
        .catch((error) => {
            logger.error("An error has occured in checking if Folder exits. Ignoring error Process will continue..");
            const jsonError = JSON.stringify(error);
            logger.debug(jsonError);
            // console.error('An error occurred:', error);
            return res.status(500).json({
                ans: 'false'
            })
        });


})

module.exports = router;