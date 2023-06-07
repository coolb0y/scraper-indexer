const router = require('express').Router();
const { Client } = require('@opensearch-project/opensearch');
const Data = require('../models/data');

const host = 'localhost';
const protocol = 'http';
const port = 9200;
const auth = 'admin:admin'; // For testing only. Don't store credentials in code.
let client;
const indexName='chipsterindex';
const batchSize = 500;

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
        console.log(document);

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

router.get('/', async (req, res) => {
  console.log(req.query);
 

  try {
    client = new Client({
      node: `${protocol}://${auth}@${host}:${port}`,
      ssl: {
        rejectUnauthorized: false, // if you're using self-signed certificates with a hostname mismatch.
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: 'Server error',
    });
  }

  console.log('Creating index:');
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

  const createIndex = async () => {
    try {
      const response = await client.indices.create({
        index: indexName,
        body: {
          mappings: mapping,
        },
      });
      console.log(response);
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Unable to create Index',
        error: err,
      });
    }
  };

  // Uncomment the following line to create the index
  // await createIndex();

  try {
    const cursor = Data.find({}, { __v: 0, _id: 0 }).select().cursor();
    processBatchOfDocuments(cursor)
      .then(() => {
        console.log('Indexing completed');
        // Continue with the rest of the code or return the response
      })
      .catch((error) => {
        console.error('Failed to iterate over documents:', error);
        // Handle the error or return an error response
      });
  } catch (err) {
    console.error('Error:', err);
    // Handle the error or return an error response
  }
});

module.exports = router;
