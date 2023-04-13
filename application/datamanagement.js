const { logger } = require('@nlpjs/logger');
//Importing MongoClient
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv')

// Connection URL
const client = new MongoClient(process.env.MONGODB_URL);

//database name
const DATABASENAME = 'Quickblox';
const PROJECTS_COLLECTION_NAME='chatbot_projects'
const USERS_COLLECTION_NAME='users'
const CONVERSATIONS_COLLECTION_NAME='conversations'


async function getConnectionObject() {
  
    // Use connect method to connect to the server
  return (await client.connect()).db(DATABASENAME);
}

function closeConnection(){
  logger.info('connection closed')
    client.close()
}

module.exports={getConnectionObject,PROJECTS_COLLECTION_NAME,USERS_COLLECTION_NAME,DATABASENAME,CONVERSATIONS_COLLECTION_NAME,closeConnection}