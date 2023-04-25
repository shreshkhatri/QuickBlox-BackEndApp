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
  const envContents = `SECRET = "${newSecret}"\nMONGODB_URL = ""\nFRONTEND_URL = ""\nKEY_PATH = "" #Empty if http\nCERT_PATH = "" #Empty if http\n`;
  fs.writeFileSync(envPath, envContents);
}