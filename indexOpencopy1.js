const router = require('express').Router();
const { Client } = require('@opensearch-project/opensearch');
const Data = require('./models/data');

const {exec} =require("child_process")
const scriptPath = 'copydata.bat';

const host = 'localhost';
const protocol = 'http';
const port = 9200;
const auth = 'admin:admin'; // For testing only. Don't store credentials in code.
let client;
const indexName = 'chipsterindex';
const batchSize = 500;
const mapping = {
  properties: {
    title: {
      type: 'text', // Make the "title" field text searchable
    },
    imagetags: {
      type: 'text', // Make the "title" field text searchable
    },
    baseurl: {
      type: 'keyword', // Make the "category" field filterable
    },
    filetype: {
      type: 'keyword', // Make the "category" field filterable
    },
  },
};

async function deleteAndCreateIndex() {

  

  try{

    const ifExists = await client.indices.exists({ index: indexName });
    if (ifExists && ifExists.body) {
      await client.indices.delete({ index: indexName });
      console.log('Index deleted successfully');
    }

   const response = await client.indices.create({
    index: indexName,
    body: {
      mappings: {
        properties: mapping.properties,
      },
    },
  });
  
  console.log('Index created successfully:', response);
  }
  catch(error){
    console.log(error);
    throw new Error('Failed to create index or update index');
  }
  
}

function processBatchOfDocuments(cursor) {
  return new Promise(async (resolve, reject) => {
    try {
      let document = await cursor.next();
      let count = 0;

      while (document) {
        // Process the document here
        await client.index({
          index: indexName,
          body: document,
        });
        indexdataval.noindexed = indexdataval.noindexed + 1;
        count++;

        if (count === batchSize) {
          break;
        }

        document = await cursor.next();
      }

      if (count === batchSize) {
        processBatchOfDocuments(cursor)
          .then(resolve)
          .catch(reject);
      } else {
        console.log('All documents processed.');
        resolve();
      }
    } catch (error) {
      console.error('Error retrieving or indexing document:', error);
      reject(error);
    }
  });
}

const indexandcopy = async (projectname)=>{
 // console.log(req.query);
  //const projectname = req.query.indexPath;
  const destinationPath = `..\\Projects\\${projectname}\\data`
  indexdataval.noindexed = 0;
  try{
    client = new Client({
      node: `${protocol}://${auth}@${host}:${port}`,
      ssl: {
        rejectUnauthorized: false, // if you're using self-signed certificates with a hostname mismatch.
      },
    });
  }
  catch(e){
    console.log(e);
    throw new Error('Failed to connect to opensearch Please check if it is running');
    // return res.status(500).json({
    //   message: 'Failed to connect to opensearch Please check if it is running',
    // });
  }
 

  console.log('Creating index:');

  const createIndex = async () => {
    try {
      const indexExists = await client.indices.exists({ index: indexName });

      if (indexExists) {
        console.log('Index already exists. Updating mapping...');
        await deleteAndCreateIndex();
      } else {
        console.log('Creating index...');
        const response = await client.indices.create({
          index: indexName,
          body: {
            mappings: {
              properties: mapping,
            },
          },
        });
        console.log(response);
      }
    } catch (err) {
      console.log(err);
      throw new Error('Failed to create or update index');
    }
  };

  // Uncomment the following line to create or update the index
  await createIndex()
    .then(() => {
      console.log('Index creation/update completed');
    })
    .catch((error) => {
      console.error('Error during index creation/update:', error);
      throw new Error('Failed to create or update index');
      // return res.status(500).json({
      //   message: 'Failed to create or update index',
      // });
    });

  const cursor = Data.find({}, { __v: 0, _id: 0 }).select().cursor();
  await processBatchOfDocuments(cursor)
    .then(async() => {
      console.log('Indexing completed');
      // Continue with the rest of the code or return the response
      //add a timer of 10 seconds to wait for the indexing to complete
     // console.log(__dirname+"\\..\\opensearch\\data")
      //await copydata(__dirname+"\\..\\opensearch\\data",__dirname+ `\\..\\Projects\\${projectname}\\data`);
      exec(`${scriptPath} "${destinationPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing the script: ${error}`);
          throw new Error('Failed to copy folder to project path. Please do it manually');
          // return res.status(500).json({
          //   message: 'Indexing done but Failed to copy folder to project path. Please do it manually'
          // });
        }

        // console.log(`Script output: ${stdout}`);
        if (stderr) {
          console.error(`Script error: ${stderr}`);
        }
      });

      // return res.status(200).json({
      //   message: 'Indexing completed',
      // });
    })
    .catch((error) => {
      console.error('Failed to iterate over documents:', error);
      throw new Error('Failed to iterate over documents');
      // return res.status(500).json({
      //   message: 'Iteration Failed',
      // });
      // Handle the error or return an error response
    });
}


module.exports = indexandcopy;

