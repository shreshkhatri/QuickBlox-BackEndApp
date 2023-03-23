const { logger } = require('@nlpjs/logger');
//Importing MongoClient
const { MongoClient } = require('mongodb');

// Connection URL
const url = 'mongodb+srv://shresh:QuickBlox2468@cluster0.aczk7.mongodb.net';
const client = new MongoClient(url);

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