const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const secretLength = 128;

// Generate a random alphanumeric string
const generateRandomString = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Check if .env file exists, and create it with a new `SECRET` variable if it doesn't
if (!fs.existsSync(envPath)) {
  const newSecret = generateRandomString(secretLength);
  const envContents = `
  SECRET = "${newSecret}"\n
  MONGODB_URL = ""\n
  FRONTEND_URL = ""\n
  KEY_PATH = "" #Empty if http\n
  CERT_PATH = "" #Empty if http\n
  DATABASENAME = "Quickblox"\n
  PROJECTS_COLLECTION_NAME = "chatbot_projects"\n
  USERS_COLLECTION_NAME = "users"\n
  CONVERSATIONS_COLLECTION_NAME = "conversations"\n`;
  fs.writeFileSync(envPath, envContents);
}