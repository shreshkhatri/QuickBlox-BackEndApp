const { logger } = require('@nlpjs/logger');

//Importing MongoClient
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv')

// Connection URL
const client = new MongoClient(process.env.MONGODB_URL);

async function getConnectionObject() {
  
    // Use connect method to connect to the server
  return (await client.connect()).db(process.env.DATABASENAME);
}

function closeConnection(){
  logger.info('connection closed')
    client.close()
}

module.exports={getConnectionObject,closeConnection}