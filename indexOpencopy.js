const router = require('express').Router();
const { Client } = require('@opensearch-project/opensearch');
const Data = require('./models/data');
const logger = require("./helper/loggerProject");
const { exec } = require("child_process");
const { indexName, mapping, batchSize, protocol, auth, host, port } = require('./config/opensearchConfig');
const scriptPath = 'copydata.bat';

let client;
async function deleteAndCreateIndex() {

    try {

        const ifExists = await client.indices.exists({ index: indexName });
        logger.info("Checking if Index exists...")
        if (ifExists && ifExists.body) {
            logger.info("Index exists trying to delete...");
            await client.indices.delete({ index: indexName });
            logger.info("Index deleted successfully");
        }

        const response = await client.indices.create({
            index: indexName,
            body: {
                settings: {
                    number_of_shards: 1,  // Set the desired number of primary shards
                    number_of_replicas: 0,  // Set the desired number of replica shards
                },
                mappings: {
                    properties: mapping.properties,
                },
            },
        });

        logger.info("Index created successfully");
        console.log(JSON.stringify(response));
    }
    catch (error) {
        logger.error("Failed to create index or update index");
        logger.error("Failed to create index or update index Please check if Opensearch is running")
        throw new Error('Failed to create index or update index');
    }
}

function processBatchOfDocuments(cursor) {
    return new Promise(async (resolve, reject) => {
        try {
            let document = await cursor.next();
            let count = 0;
            logger.info("Processing batch of documents");

            while (document) {
                // Process the document here

                await client.index({
                    index: indexName,
                    body: document,
                });
                indexdataval = indexdataval + 1;
                count++;
                logger.debug(`${indexdataval} documents are processed`);

                if (count === batchSize) {
                    logger.info(`Documents of Batch size ${batchSize} are processed`);
                    break;
                }

                document = await cursor.next();
            }

            if (count === batchSize) {
                processBatchOfDocuments(cursor)
                    .then(resolve)
                    .catch(reject);
            } else {
                logger.info(`All documents are processed are processed successfully`);
                resolve();
            }
        } catch (error) {
            logger.error("Error receiving documents or indexing documents");
            const jsonError = JSON.stringify(error);
            logger.debug(jsonError);

            reject(error);
        }
    });
}

const indexandcopy = async (projectname) => {
    // console.log(req.query);
    //const projectname = req.query.indexPath;
    const destinationPath = `..\\Projects\\${projectname}\\data`
    indexdataval = 0;
    logger.info("Indexing has started...");
    try {
        client = new Client({
            node: `${protocol}://${auth}@${host}:${port}`,
            ssl: {
                rejectUnauthorized: false, // if you're using self-signed certificates with a hostname mismatch.
            },
        });
    }
    catch (error) {
        logger.error(`Failed to connect to Opensearch. Please check if Opensearch is running`);
        logger.error(`Failed to connect and Please check if Opensearch is reachable`);
        const jsonError = JSON.stringify(error);
        logger.debug(jsonError);
        throw new Error('Failed to connect to opensearch Please check if it is running');

    }

    //console.log('Creating index:');
    logger.info("Creating index...");

    const createIndex = async () => {
        try {
            const indexExists = await client.indices.exists({ index: indexName });

            if (indexExists) {
                logger.info("Index already exists. Updating mapping...");
                await deleteAndCreateIndex();
                logger.info("Index already exists. Updating mapping...");
            } else {

                logger.info('Creating index...');
                const response = await client.indices.create({

                    index: indexName,
                    body: {
                        settings: {
                            number_of_shards: 1,  // Set the desired number of primary shards
                            number_of_replicas: 0,  // Set the desired number of replica shards
                        },
                        mappings: {
                            properties: mapping.properties,
                        },
                    },
                });

                logger.info('Created index');
                const jsonResponse = JSON.stringify(response);
                logger.debug(jsonResponse);
            }
        } catch (err) {
            logger.error('Failed to create or update index');
            const jsonError = JSON.stringify(err);
            logger.debug(jsonError);

            throw new Error('Failed to create or update index');
        }
    };

    // Uncomment the following line to create or update the index
    await createIndex()
        .then(() => {
            logger.info('Created index');
        })
        .catch((error) => {
            logger.error('Failed to created or update index');
            const jsonError = JSON.stringify(error);
            logger.debug(jsonError);
            //console.error('Error during index creation/update:', error);
            throw new Error('Failed to create or update index');

        });

    const cursor = Data.find({}, { __v: 0, _id: 0 }).select().cursor();
    await processBatchOfDocuments(cursor)
        .then(async () => {
            //console.log('Indexing completed');
            logger.info('Indexing completed');
            exec(`${scriptPath} "${destinationPath}"`, (error, stdout, stderr) => {
                if (error) {
                    logger.error("Error in copying folder to project " + projectname);
                    const jsonError = JSON.stringify(error);
                    logger.debug(jsonError);

                    //console.error(`Error executing the script: ${error}`);
                    throw new Error('Failed to copy folder to project path. Please do it manually');

                }
                // console.log(`Script output: ${stdout}`);
                if (stderr) {
                    logger.error("Script Stdout error take place no action required");
                    const jsonError = JSON.stringify(error);
                    logger.debug(jsonError);

                    // console.error(`Script error: ${stderr}`);
                }
            });
        })
        .catch((error) => {
            logger.error(`Error executing the script`);
            const jsonError = JSON.stringify(error);
            logger.debug(jsonError);

            // console.error('Failed to iterate over documents:', error);
            throw new Error('Failed to iterate over documents');

        });
}


module.exports = indexandcopy;

