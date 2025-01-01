const host = 'localhost';
exports.host = host;
const protocol = 'http';
exports.protocol = protocol;
const port = 9200;
exports.port = port;
const auth = 'admin:admin'; // For testing only. Don't store credentials in code.

exports.auth = auth;
const indexName = 'chipsterindex';
exports.indexName = indexName;
const batchSize = 500;
exports.batchSize = batchSize;
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
exports.mapping = mapping;
