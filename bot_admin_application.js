const { logger } = require('@nlpjs/logger');
const fse = require('fs-extra');
//the folder where the template for the chatbot resides
const SOURCE_FOLDER = 'bot_template'

const bcrypt = require('bcrypt');
const saltRounds = 12;
const salt = bcrypt.genSaltSync(saltRounds)
const { exec } = require('child_process')
const cors = require('cors');
var cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv').config()
const express = require('express')

const app = express()
const port = 4000
const router = express.Router()
const { body, validationResult } = require('express-validator')
const Validator = require('jsonschema').Validator;
const { getConnectionObject, PROJECTS_COLLECTION_NAME, USERS_COLLECTION_NAME, CONVERSATIONS_COLLECTION_NAME, closeConnection } = require('./application/datamanagement')
const {
  schema_qanda_data,
  schema_qanda_data_with_action,
  schema_qanda_entity_synonym,
  schema_qanda_entity_regex,
  schema_script_data,
  schema_project_data,
  schema_intent_data } = require('./application/dataschemas')
const {
  pipelineActionCode,
  pipelineQandAdataWithStaticResponse,
  pipelineTrainingDataAndSettings,
  pipelinetListOfEntities,
  pipelinetListOfEntityNames,
  pipelineIntentName,
  piplineListOfScriptNames,
  queryFindActionName,
  getQndAdataCount,
  getScriptsCount,
  searchQandAData,
  searchScript,
  piplineModelTrainingLog,
  piplineListOfIntentToLinkNames,
  pipelineScriptData,
  pipelineQandAdataWithDynamicResponse,
  pipelineIntentData } = require('./application/pipelines')
const {
  copyBotTemplateFiles,
  updateBotConfigurationOnFile,
  prepareTrainingData
} = require('./application/FileHandle');

const jsonSchemaValidator = new Validator();
const entityType = ['synonym', 'regex']
const qandaDataType = ['static', 'dynamic']

//Array object for holding the bot process created during run time
const allBotProcesses = []

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser())

//for implementing CORS policy on local machine
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));


//function to initialize and run bot sever

function initializeAndRunBotServer(useremail, projectName, projectFolderName) {

  //server being launched
  const bot_server_process = exec(`cd ../${projectFolderName} && node index.js`, async (err, stdout, stderr) => {
    if (err) {
      console.log(`Bot Server could not start for the DIR : ${projectFolderName}, Error : ${err}`)
      await getConnectionObject()
        .then(async (connectionObject) => {
          const searchQuery = { useremail, projectName }
          //updating currently active port and bot-online status for the chatbtot
          const r = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(searchQuery, {
            $push: {
              "trainingLog": { log: new Date().toLocaleString() + ' ' + err }
            }
          })
        })
        .catch(error => {
          logger.log(error)
        })
        .finally(() => {

        })
    }

    if (stdout) {
      console.info(`BOT SERVER [DIR : ${projectFolderName}] : Stdout initialized`)
    }

    if (stderr) {

      console.log(`BOT SERVER [DIR : ${projectFolderName}]: Stderr initialized`)
    }
  });

  logger.log(`Bot Server for the DIR ${projectFolderName} started with the process ID ${bot_server_process.pid}`)

  //process shell will show the output when message is received
  bot_server_process.stdout.on('data', async data => {
    console.log(`BOT STDOUT SERVER [DIR : ${projectFolderName}] : ${data}`)
    await getConnectionObject()
      .then(async (connectionObject) => {
        const searchQuery = { useremail, projectName }
        //updating currently active port and bot-online status for the chatbtot
        const r = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(searchQuery, {
          $push: {
            "trainingLog": { log: new Date().toLocaleString() + ' ' + data }
          }
        })
      })
      .catch(error => {
        logger.log(error)
      })
      .finally(() => {

      })
  })


  //listening for errors occuring in child process
  bot_server_process.stderr.on('data', async data => {
    console.log(`BOT STDERR SERVER [DIR : ${projectFolderName}] : ${data}`)
    await getConnectionObject()
      .then(async (connectionObject) => {
        const searchQuery = { useremail, projectName }
        //updating currently active port and bot-online status for the chatbtot
        const r = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(searchQuery, {
          $push: {
            "trainingLog": { log: new Date().toLocaleString() + ' ' + data }
          }
        })
      })
      .catch(error => {
        logger.log(error)
      })
      .finally(() => {

      })
  })

  //listening for close event in child process
  bot_server_process.stderr.on('close', async message => {
    console.log(`BOT SERVER [DIR : ${projectFolderName}]: SERVER CLOSED `)

    await getConnectionObject()
      .then(async (connectionObject) => {
        const searchQuery = { useremail, projectName }
        //updating currently active port and bot-online status for the chatbtot
        const r = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(searchQuery, {
          $set: {
            "settings.isBotServerOnline": false
          }
        })
      })
      .catch(error => {
        logger.log(error)
      })
      .finally(() => {

      })
  })

  //listening for disconnect event inside child process
  bot_server_process.stderr.on('disconnect', async message => {
    console.log(`BOT SERVER [DIR : ${projectFolderName}] : SERVER DISCONNECTED`)

    await getConnectionObject()
      .then(async (connectionObject) => {
        const searchQuery = { useremail, projectName }
        //updating currently active port and bot-online status for the chatbtot
        const r = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(searchQuery, {
          $set: {
            "settings.isBotServerOnline": false
          }
        })
      })
      .catch(error => {
        logger.log(error)
      })
      .finally(() => {

      })
  })

  return bot_server_process
}


router.post('/login',
  body('useremail').isEmail().trim().escape(),
  body('password').notEmpty().trim().escape()
  , async (req, res) => {
    const { access_token, useremail } = req.cookies

    //checking if user is already logged in
    if (access_token && useremail) {
      jwt.verify(access_token, process.env.SECRET, (error, payload) => {
        if (payload && payload.useremail == useremail) {
          logger.log('Existing user login:')
          return res.sendStatus(200)
        }
      })
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ severity: 'error', message: 'Required properties[useremail/password] validation failed' });
    }
    else {
      const { useremail, password } = req.body
      await getConnectionObject()
        .then(async (connectionObject) => {
          const response = await connectionObject.collection(USERS_COLLECTION_NAME).findOne(
            { useremail: useremail },
            { projection: { _id: 0, useremail: 1, password: 1 } }
          )
          //user is found
          if (response) {
            const passwordMatched = bcrypt.compareSync(password, response.password)
            if (passwordMatched) {
              logger.log('password matched')
              const signinToken = jwt.sign(
                {
                  useremail: useremail
                }, process.env.SECRET)
              res.cookie('useremail', useremail);
              res.cookie('access_token', signinToken);
              logger.log('New user login')
              return res.status(200).json({ severity: 'success', message: 'Login Successful' })
            }
            else {

              return res.status(401).json({ severity: 'error', message: 'Invalid Password' })
            }

          }
          else {
            return res.status(401).json({ severity: 'error', message: 'Useremail does not exist' })
          }
        })
        .catch(error => {
          //internal server error
          logger.log(error)
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while signing in the user.' })
        })
        .finally(() => {

        })

    }
  })


router.post('/create-chatbot-project',
  body('useremail').notEmpty().isEmail().trim().escape(),
  body('password').notEmpty().trim().escape(),
  body('confirmPassword').notEmpty().trim().escape(),
  body('projectName').notEmpty().isString().trim().escape(),
  body('languages').notEmpty().isArray(),
  body('settings').isObject().notEmpty()
  , async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.log(errors.array())
      return res.status(400).json({ severity: 'error', message: 'Required properties validation failed during Project Creation' });
    }
    else {
      const { useremail, password, projectName, languages, settings } = req.body;
      const passwordHash = bcrypt.hashSync(password, salt)
      await getConnectionObject()
        .then(async (connectionObject) => {

          const finalEmailAvailabilityCheck = await connectionObject.collection(USERS_COLLECTION_NAME).findOne({ useremail: useremail },
            { projection: { _id: 0, useremail: 1 } })

          if (finalEmailAvailabilityCheck && finalEmailAvailabilityCheck.hasOwnProperty('useremail')) {
            return res.status(500).json({ severity: 'error', message: 'Email already exists. Please use different email' })
          }

          const userInsertResponse = await connectionObject.collection(USERS_COLLECTION_NAME).insertOne({
            'useremail': useremail,
            'password': passwordHash
          })

          if (!userInsertResponse.insertedId) {
            return res.status(500).json({ severity: 'error', message: 'User information could not be insertd.' })
          }
          const conversationObjectCreationResponse = await connectionObject.collection(CONVERSATIONS_COLLECTION_NAME).insertOne({
            'useremail': useremail,
            'conversations': []
          })
          if (!conversationObjectCreationResponse.insertedId) {
            return res.status(500).json({ severity: 'error', message: 'Conversation Object could not be created' })
          }

          // the folder where the bot template files will be copied for each users
          const projectFolderName = Math.round(new Date().getTime()).toString()

          const response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).insertOne(
            {
              'useremail': useremail,
              'projectFolderName': projectFolderName,
              'trainingLog': [],
              'projectName': projectName,
              'languages': languages,
              'settings': settings,
              'modelTrainable': false,
              'projectSettingsEditable': false,
              'selectedLanguage': languages[0],
              'datasets': [{
                'locale': languages[0].locale,
                'intents': [],
                'scripts': [],
                'entities': [],
                'responseVariables': [],
                'actions': []
              }]
            })
          if (response.insertedId) {
            const DESTINATION_FOLDER = `../${projectFolderName}`

            //creating project folder and copying the bot template files from source folder to the destination folder 
            copyBotTemplateFiles(SOURCE_FOLDER, DESTINATION_FOLDER)
              .then(() => {
                logger.log(`Bot Template files copied to the priject folder ${projectFolderName} successfully.`)
                if (settings.hasOwnProperty('botServerPort')) {

                  //updating the bot server port inside the template file with the port number specified during the project signup
                  updateBotConfigurationOnFile(DESTINATION_FOLDER, settings)
                    .then(async (resposne) => {
                      logger.info(resposne)
                      const query1 = { useremail, projectName }

                      //updating the 'modelTrainable' and 'projectSettingsEditable' indicatin that the project settings can be changed and modified
                      const responseModelTrainable = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(query1, {
                        $set: {
                          modelTrainable: true,
                          projectSettingsEditable: true
                        }
                      }
                      )
                      if (responseModelTrainable.modifiedCount == 1) {
                        logger.info(`The chatbot for the project: ${projectName} can be trained and its configuration can be changed.`)
                      }
                    })
                    .catch(error => {
                      logger.error(error)
                    })
                }
              })
              .catch(error => {
                logger.error(`The Bot template files could not be copied to the project folder ${projectFolderName}`)
              })

            const signinToken = jwt.sign(
              {
                useremail: useremail
              }, process.env.SECRET)
            res.cookie('useremail', useremail);
            res.cookie('access_token', signinToken);
            return res.status(200).json({ severity: 'success', message: 'Project created successfully.' })
          }
          else {
            return res.status(500).json({ severity: 'error', message: 'Project could not be created.' })
          }
        })
        .catch(error => {
          logger.log(error)
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while creating the project. Please try again later' })
        })
        .finally(() => {

        })
    }
  })


//check if email exists during the user creation process
router.post('/check-email-usability',
  body('useremail').isEmail().trim().escape()
  , async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(401).json({ severity: 'error', message: 'Email validation error occured while chekcing email availability.' })
    }
    else {
      const { useremail } = req.body

      await getConnectionObject()
        .then(async (connectionObject) => {
          const response = await connectionObject.collection(USERS_COLLECTION_NAME).findOne(
            { useremail: useremail },
            { projection: { _id: 0, useremail: 1 } }
          )
          //email is found
          if (response) {
            logger.log('email alrady exists')
            return res.status(200).json({ severity: 'error', message: 'Email already exists' })
          }
          else {
            logger.log('email available for use')
            return res.status(200).json({ severity: 'success', message: 'Email usable' })
          }
        })
        .catch(error => {
          logger.log(error)
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while checking the email usability. Please try again later' })
        })
        .finally(() => {

        })

    }
  })

// middleware for authenticating the token
router.use((req, res, next) => {
  const { access_token, useremail } = req.cookies

  //checking if user is already logged in
  if (access_token && useremail) {
    jwt.verify(access_token, process.env.SECRET, (error, payload) => {
      if (payload && payload.useremail == useremail) {
        next()
      }
      else if (error) {
        return res.status(400).json({ severity: 'error', message: 'Invalid cookies' })
      }
    })
  }
  else {
    return res.status(400).json({ severity: 'error', message: 'Required cookies missing, Please relogin' })
  }
})


//route for training the model
router.post('/trainmodel',
  body('projectName').notEmpty().isString().trim().escape(),
  body('locale').notEmpty().isString()
  , async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {

      return res.status(400).json({ severity: 'error', message: 'Required properties[projectName/locale] validation failed while training the model' });
    }
    else {
      const { useremail } = req.cookies
      const { projectName, locale } = req.body
      const pipeline = pipelineTrainingDataAndSettings(useremail, projectName, locale)

      await getConnectionObject()
        .then(async (connectionObject) => {

          const response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).aggregate(pipeline).toArray()
          console.log(response)

          if (response.length != 0 && response[0].hasOwnProperty('intents') && response[0]['intents'].length > 0) {
            const projectFolderName = response[0].projectFolderName
            const botServerPort = parseInt(response[0].settings.botServerPort)
            const currentBotServerPort = response[0].settings.hasOwnProperty('currentBotServerPort') && response[0].settings.currentBotServerPort || null
            const isBotServerOnline = response[0].settings.isBotServerOnline;

            //setting working directory equal to the project folder of the application
            const WORKING_DIRECTORY = `../${projectFolderName}`

            if (prepareTrainingData(WORKING_DIRECTORY, response[0])) {
              const searchQuery = { useremail, projectName }

              if (isBotServerOnline && currentBotServerPort) {
                exec(`npx kill-port ${currentBotServerPort}`, async (err, stdout, stderr) => {
                  if (err) {
                    return
                  }
                  if (stdout) {
                    logger.log(stdout)
                    const botProcess = initializeAndRunBotServer(useremail, projectName, projectFolderName)
                    allBotProcesses.push({
                      processID: botProcess.pid,
                      projectName: projectName,
                      projectFolderName: projectFolderName,
                      processPort: botServerPort,
                      process: botProcess
                    })

                    //updating currently active port and bot-online status for the chatbtot
                    const r = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(searchQuery, {
                      $set: {
                        "settings.currentBotServerPort": botServerPort,
                        "settings.isBotServerOnline": true
                      }
                    })

                    return res.status(200).json({ currentBotServerPort: botServerPort, severity: 'success', message: `Bot is trained and the model is restarted successfully.` })
                  }

                });
              }
              else {
                const botProcess = initializeAndRunBotServer(useremail, projectName, projectFolderName)
                allBotProcesses.push({
                  processID: botProcess.pid,
                  projectName: projectName,
                  projectFolderName: projectFolderName,
                  processPort: botServerPort,
                  process: botProcess
                })

                //updating currently active port and bot-online status for the chatbtot
                const r = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(searchQuery, {
                  $set: {
                    "settings.currentBotServerPort": botServerPort,
                    "settings.isBotServerOnline": true
                  }
                })

                return res.status(200).json({ currentBotServerPort: botServerPort, severity: 'success', message: `Bot is trained and the model is started successfully.` })
              }
            }


          }
          else {
            return res.status(400).json({ severity: 'error', message: 'No any dataset found for the project, please add training data first before training the model.' })
          }
        })
        .catch(error => {
          logger.log(error)
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while training the chatbot model. Please try again later' })
        })
        .finally(() => {

        })
    }
  })


//Route to update the status of the chatbot server for the project
router.post('/update-botserver-status',
  body('projectName').notEmpty().isString().trim().escape(),
  body('isBotServerOnline').notEmpty().isBoolean()
  , async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {

      return res.status(400).json({ severity: 'error', message: 'Required properties[projectName,status type] validation failed.' });
    }
    else {
      console.log(req.body)
      const { projectName, isBotServerOnline } = req.body
      const { useremail } = req.cookies
      const searchQuery = { useremail, projectName }
      const options = {
        projection: {
          _id: 0,
          'settings.isBotServerOnline': 1,
          'settings.currentBotServerPort': 1,
          'projectFolderName': 1
        }
      }

      await getConnectionObject()
        .then(async (connectionObject) => {

          const response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).findOne(searchQuery, options)
          console.log(response)

          if (response && response.hasOwnProperty('settings') && response.settings.hasOwnProperty('currentBotServerPort')) {
            if (!isBotServerOnline) {
              console.log(response.settings.currentBotServerPort)
              
              exec(`npx kill-port ${response.settings.currentBotServerPort}`, async (err, stdout, stderr) => {
                if (err) {
                  return res.status(500).json({ severity: 'error', message: 'Model could not be deactivated at the moment. Please try again later.' })
                }
                if (stdout) {
                  const r = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(searchQuery, {
                    $set: {
                      "settings.isBotServerOnline": false
                    }
                  })
                  return res.status(200).json({ isBotServerOnline:false,severity: 'success', message: 'Model deactivated successfully' })
                }

              });
            }
            else if (isBotServerOnline) {
              console.log('Turning on model')
              initializeAndRunBotServer(useremail, projectName, response.projectFolderName)
              //updating currently active port and bot-online status for the chatbtot
              const r = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(searchQuery, {
                $set: {
                  "settings.isBotServerOnline": true
                }
              })
              
              return res.status(200).json({ isBotServerOnline:true,severity: 'success', message: 'Model is restarting...' })
            }

          }

        })
        .catch(error => {
          logger.log(error)
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while obtaining the model status' })
        })
        .finally(() => {

        })
    }
  })

//REVIEWED REMOVE THIS ONE
router.post('/insert-qana-data/:type', async (req, res) => {
  var query, qnaType, schemaValidationResult, dataToPush;
  logger.log(req.body)
  if (req.params['type'] && req.params['type'] == qandaDataType[0]) {
    qnaType = 0
    schemaValidationResult = jsonSchemaValidator.validate(req.body, schema_qanda_data);
  }
  else if (req.params['type'] && req.params['type'] == qandaDataType[1]) {
    qnaType = 1
    schemaValidationResult = jsonSchemaValidator.validate(req.body, schema_qanda_data_with_action);
  }

  if (!schemaValidationResult.valid) {
    logger.log(schemaValidationResult)
    return res.status(400).json({ severity: 'error', message: schemaValidationResult.errors[0].path[schemaValidationResult.errors[0].path.length - 1] + ' ' + schemaValidationResult.errors[0].message })
  }
  else if (schemaValidationResult.valid) {

    query = {
      'useremail': req.cookies.useremail,
      'projectName': req.body.projectName,
      'datasets.locale': req.body.locale,
      'datasets.intents.intent': { $ne: req.body.payload.intent } //to ensure that no duplicate intents will be written for a locale
    }


    if (qnaType == 0) {
      dataToPush = {
        "datasets.$.intents": {
          'intent': req.body.payload.intent,
          'description': req.body.payload.description,
          'utterances': req.body.payload.utterances,
          'answers': req.body.payload.answers
        }
      }
    }
    else if (qnaType == 1) {
      //if response is dynamic type then we need to modify query and payload as well
      query = {
        ...query,
        'datasets.actions.actionName': { $ne: req.body.payload.actionName }
      }

      dataToPush = {
        "datasets.$.intents": {
          'intent': req.body.payload.intent,
          'description': req.body.payload.description,
          'utterances': req.body.payload.utterances,
          'actionName': req.body.payload.actionName,
          'actionCode': req.body.payload.actionCode
        },
        "datasets.$.actions": {
          'actionName': req.body.payload.actionName,
        }
      }
    }


    await getConnectionObject()
      .then(async (connectionObject) => {
        const response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(query, {
          $push: dataToPush
        }, { upsert: true }
        )
        logger.log(response)

        if (response.modifiedCount == 1) {
          return res.status(200).json({ severity: 'success', message: 'Q&A data saved successfully.' })
        }
        else {
          return res.status(500).json({ severity: 'error', message: 'Q&A data could not be saved. May be different intent name and/or Action Name should be specified.' })
        }

      })
      .catch(error => {
        logger.log(error)
        return res.status(500).json({ severity: 'error', message: 'Database error has occured while inserting QandA data. Please try again later or may be different intent name and/or Action Name should be specified.' })
      })
      .finally(() => {
        //closeConnection()
      })
  }

})


//REVIEWED
//route for getting the project data for a project
router.get('/get-project-data', async (req, res) => {

  //finding project for the email
  const query = { useremail: req.cookies.useremail }

  const options = {
    projection: {
      _id: 0, projectName: 1,
      selectedLanguage: 1,
      settings: 1,
      projectFoldername: 1,
      modelTrainable: 1,
      projectSettingsEditable: 1
    },
  }


  await getConnectionObject()
    .then(async (connectionObject) => {
      const response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).findOne(query, options)
      if (response) {
        return res.status(200).json(response)
      }
      else {
        return res.status(400).json({ severity: 'error', message: 'No Project data found associated with the useremail' })
      }
    })
    .catch(error => {
      logger.log(error)
      return res.status(500).json({ severity: 'error', message: 'Database error has occured while reading the project data. Please try again later' })
    })
    .finally(() => {

    })

})




//Routes for saving the project data
router.post('/save-project-data'
  , async (req, res) => {
    const schemaValidationResult = jsonSchemaValidator.validate(req.body, schema_project_data);
    if (!schemaValidationResult.valid) {
      logger.log(schemaValidationResult)
      return res.status(400).json({ severity: 'error', message: schemaValidationResult.errors[0].path[schemaValidationResult.errors[0].path.length - 1] + ' ' + schemaValidationResult.errors[0].message })
    }
    else if (schemaValidationResult.valid) {
      query = {
        'useremail': req.cookies.useremail
      }
      const { projectName, settings } = req.body
      logger.log(req.body)
      await getConnectionObject()
        .then(async (connectionObject) => {
          const response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(query, {
            $set: {
              "projectName": projectName,
              "settings.nlu": settings.nlu,
              "settings.botName": settings.botName,
              "settings.botServerPort": settings.botServerPort
            }
          })
          if (response.modifiedCount == 1) {

            //retrieving projectFolder for the project
            const projectFolder = await connectionObject.collection(PROJECTS_COLLECTION_NAME).findOne(
              { useremail: req.cookies.useremail },
              { projection: { _id: 0, projectFolderName: 1 } }
            )

            if (projectFolder.hasOwnProperty('projectFolderName')) {
              const DESTINATION_FOLDER = `../${projectFolder.projectFolderName}`
              //updating the bot server port inside the template file with the port number specified during the project signup
              updateBotConfigurationOnFile(DESTINATION_FOLDER, settings)
                .then((resposne) => {
                  logger.info(resposne)
                  return res.status(200).json({ severity: 'success', message: 'Project data updated successfully. Please retrain the model in order for changes to make effect.' })
                })
                .catch(error => {
                  logger.error(error)
                })
            }
          }
          else {
            return res.status(500).json({ severity: 'error', message: 'Project data could not be updated.' })
          }

        })
        .catch(error => {
          logger.error(error)
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while trying to update project data' })
        })
        .finally(() => {

        })
    }
  })



//Route to get project status
router.post('/get-project-status',
  body('projectName').notEmpty().isString().trim().escape()
  , async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {

      return res.status(400).json({ severity: 'error', message: 'Required properties[projectName] validation failed.' });
    }
    else {
      //finding project for the email
      const query = { useremail: req.cookies.useremail, projectName: req.body.projectName }

      const options = {
        projection: {
          _id: 0,
          modelTrainable: 1,
          projectSettingsEditable: 1,
          trainingLog: 1,
          'settings.isBotServerOnline': 1,

        },
      }

      await getConnectionObject()
        .then(async (connectionObject) => {
          const pipeline = piplineModelTrainingLog(req.cookies.useremail, req.body.projectName)
          const responseTrainingLog = await connectionObject.collection(PROJECTS_COLLECTION_NAME).aggregate(pipeline).toArray()
          const responseProjectStatus = await connectionObject.collection(PROJECTS_COLLECTION_NAME).findOne(query, options)

          if (responseProjectStatus && responseTrainingLog) {
            return res.status(200).json({ ...responseProjectStatus, trainingLog: responseTrainingLog })
          }
          else {
            return res.status(400).json({ severity: 'error', message: 'No data for project status found.' })
          }
        })
        .catch(error => {
          logger.log(error)
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while retrieving the project status for the project.' })
        })
        .finally(() => {

        })
    }
  })



//REVIEWED
//Routes for handling QandA dataset
router.post('/get-qana-data',
  body('projectName').notEmpty().isString().trim().escape(),
  body('locale').notEmpty().isString().trim().escape(),
  body('currentPage').notEmpty().isNumeric(),
  body('batchSize').notEmpty().isNumeric()
  , async (req, res) => {

    //making pipeline object ready for retrieving the qand a dataset
    const pipeline = pipelineQandAdataWithStaticResponse(req.cookies.useremail, req.body.projectName, req.body.locale)
    //const pipeline_dynamic = pipelineQandAdataWithDynamicResponse(req.cookies.useremail, req.body.projectName, req.body.locale)

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.log(errors.array())
      return res.status(400).json({ severity: 'error', message: 'Required properties validation failed while obtaining QandA dataset' });
    }
    else {
      const { currentPage, batchSize } = req.body

      await getConnectionObject()
        .then(async (connectionObject) => {
          const response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).aggregate(pipeline)
            .skip((currentPage - 1) * batchSize)
            .limit(batchSize)
            .toArray()
          //const response_dynamic = await connectionObject.collection(COLLECTION_NAME).aggregate(pipeline_dynamic).toArray()
          if (response) return res.status(200).json(response)

        })
        .catch(error => {
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while reading QandA data. Please try again later' })
        })
        .finally(() => {

        })
    }
  })


//Routes for handling QandA dataset search
router.post('/search-qana-data',
  body('projectName').notEmpty().isString().trim().escape(),
  body('locale').notEmpty().isString().trim().escape(),
  body('searchText').notEmpty().isString().escape()
  , async (req, res) => {

    const { useremail } = req.cookies
    const { projectName, locale, searchText } = req.body

    //making pipeline object ready for searching the qand a dataset
    const pipeline_search = searchQandAData(useremail, projectName, locale, searchText)

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.log(errors.array())
      return res.status(400).json({ severity: 'error', message: 'Required properties validation failed while searching QandA data' });
    }
    else {

      await getConnectionObject()
        .then(async (connectionObject) => {
          const response_search = await connectionObject.collection(PROJECTS_COLLECTION_NAME).aggregate(pipeline_search)
            .toArray()
          if (response_search) return res.status(200).json(response_search)
        })
        .catch(error => {
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while searching for data. Please try again later' })
        })
        .finally(() => {

        })
    }
  })

//Routes for handling scripts search
router.post('/search-script-data',
  body('projectName').notEmpty().isString().trim().escape(),
  body('locale').notEmpty().isString().trim().escape(),
  body('searchText').notEmpty().isString().escape()
  , async (req, res) => {

    //making pipeline object ready for searching the qand a dataset
    const pipeline = searchScript(
      req.cookies.useremail,
      req.body.projectName,
      req.body.locale,
      req.body.searchText)

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.log(errors.array())
      return res.status(400).json({ severity: 'error', message: 'Required properties validation failed while searching script data.' });
    }
    else {
      logger.log(req.body)
      await getConnectionObject()
        .then(async (connectionObject) => {
          const response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).aggregate(pipeline).toArray()
        
            return res.status(200).json(response)
        })
        .catch(error => {
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while searching script data. Please try again later' })
        })
        .finally(() => {

        })
    }
  })


//Route for checking action Name availabiltiy
router.post('/check-acitonName-availability',
  body('projectName').notEmpty().isString().trim().escape(),
  body('locale').notEmpty().isString().trim().escape(),
  body('actionName').isString().trim().escape()
  , async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.log(errors.array())
      return res.status(400).json({ severity: 'error', message: 'Required properties validation failed while checking action name availability.' });
    }
    else {

      const query = queryFindActionName(
        req.cookies.useremail,
        req.body.projectName,
        req.body.locale,
        req.body.actionName)
      await getConnectionObject()
        .then(async (connectionObject) => {
          const response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).find(
            query,
            { projection: { _id: 0, useremail: 1 } }
          ).toArray();
          if (response.length == 1) {
            return res.status(200).json({ actionNameExists: true })
          }
          else if (response.length == 0) {
            return res.status(200).json({ actionNameExists: false })
          }
        }
        )
        .catch(error => {
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while checking action name availability. Please try again later' })
        })
        .finally(() => {

        })
    }
  })


//REVIEWED
router.post('/insert-qana-data/:type', async (req, res) => {
  var query, qnaType, schemaValidationResult, dataToPush;
  logger.log(req.body)
  if (req.params['type'] && req.params['type'] == qandaDataType[0]) {
    qnaType = 0
    schemaValidationResult = jsonSchemaValidator.validate(req.body, schema_qanda_data);
  }
  else if (req.params['type'] && req.params['type'] == qandaDataType[1]) {
    qnaType = 1
    schemaValidationResult = jsonSchemaValidator.validate(req.body, schema_qanda_data_with_action);
  }

  if (!schemaValidationResult.valid) {
    logger.log(schemaValidationResult)
    return res.status(400).json({ severity: 'error', message: schemaValidationResult.errors[0].path[schemaValidationResult.errors[0].path.length - 1] + ' ' + schemaValidationResult.errors[0].message })
  }
  else if (schemaValidationResult.valid) {

    query = {
      'useremail': req.cookies.useremail,
      'projectName': req.body.projectName,
      'datasets.locale': req.body.locale,
      'datasets.intents.intent': { $ne: req.body.payload.intent } //to ensure that no duplicate intents will be written for a locale
    }


    if (qnaType == 0) {
      dataToPush = {
        "datasets.$.intents": {
          'intent': req.body.payload.intent,
          'description': req.body.payload.description,
          'utterances': req.body.payload.utterances,
          'answers': req.body.payload.answers
        }
      }
    }
    else if (qnaType == 1) {
      //if response is dynamic type then we need to modify query and payload as well
      query = {
        ...query,
        'datasets.actions.actionName': { $ne: req.body.payload.actionName }
      }

      dataToPush = {
        "datasets.$.intents": {
          'intent': req.body.payload.intent,
          'description': req.body.payload.description,
          'utterances': req.body.payload.utterances,
          'actionName': req.body.payload.actionName,
          'actionCode': req.body.payload.actionCode
        },
        "datasets.$.actions": {
          'actionName': req.body.payload.actionName,
        }
      }
    }


    await getConnectionObject()
      .then(async (connectionObject) => {
        const response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(query, {
          $push: dataToPush
        }, { upsert: true }
        )
        logger.log(response)

        if (response.modifiedCount == 1) {
          return res.status(200).json({ severity: 'success', message: 'Q&A data saved successfully.' })
        }
        else {
          return res.status(500).json({ severity: 'error', message: 'Q&A data could not be saved. May be different intent name and/or Action Name should be specified.' })
        }

      })
      .catch(error => {
        logger.log(error)
        return res.status(500).json({ severity: 'error', message: 'Database error has occured while inserting QandA data. Please try again later or may be different intent name and/or Action Name should be specified.' })
      })
      .finally(() => {
        //closeConnection()
      })
  }

})

//REVIEWED
router.post('/update-qana-data/:type', async (req, res) => {
  var query, qnaType, schemaValidationResult, dataToPush, dataToPull, filterForPull;
  logger.log(req.body)
  if (req.params['type'] && req.params['type'] == qandaDataType[0]) {
    qnaType = 0
    schemaValidationResult = jsonSchemaValidator.validate(req.body, schema_qanda_data);
  }
  else if (req.params['type'] && req.params['type'] == qandaDataType[1]) {
    qnaType = 1
    schemaValidationResult = jsonSchemaValidator.validate(req.body, schema_qanda_data_with_action);

  }

  if (!schemaValidationResult.valid) {
    logger.log(schemaValidationResult)
    return res.status(400).json({ severity: 'error', 'message': schemaValidationResult.errors[0].path[schemaValidationResult.errors[0].path.length - 1] + ' ' + schemaValidationResult.errors[0].message })
  }
  else if (schemaValidationResult.valid) {
    query = {
      'useremail': req.cookies.useremail,
      'projectName': req.body.projectName,
      'datasets.locale': req.body.locale
    }

    filterForPull = {
      'useremail': req.cookies.useremail,
      'projectName': req.body.projectName,
      'datasets.locale': req.body.locale
    }

    //the existing data has to be removed first before the updatd version can be saved
    dataToPull = {
      "datasets.$.intents": {
        'intent': req.body.payload.intent
      }
    }
    //if response is static type then we need to modify query and payload as well
    if (qnaType == 0) {
      dataToPush = {
        "datasets.$.intents": {
          'intent': req.body.payload.intent,
          'description': req.body.payload.description,
          'utterances': req.body.payload.utterances,
          'answers': req.body.payload.answers
        }
      }
    }
    else if (qnaType == 1) {

      dataToPush = {
        "datasets.$.intents": {
          'intent': req.body.payload.intent,
          'description': req.body.payload.description,
          'utterances': req.body.payload.utterances,
          'actionName': req.body.payload.actionName,
          'actionCode': req.body.payload.actionCode
        }
      }
    }


    await getConnectionObject()
      .then(async (connectionObject) => {

        //first of all the existing entry has to be pulled out from the store
        const pullResponse = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(filterForPull, {
          $pull: dataToPull
        })

        const response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(query, {
          $push: dataToPush
        }, { upsert: true }
        )
        logger.log(response)

        if (response.modifiedCount == 1) {
          return res.status(200).json({ severity: 'success', message: 'Data updated successfully.' })
        }
        else {
          return res.status(400).json({ severity: 'error', message: 'Data updating failed.' })
        }
      })
      .catch(error => {
        logger.log(error)
        return res.status(500).json({ severity: 'error', message: 'Database error has occured while updating QandA data. Please try again later' })
      })
      .finally(() => {
        //closeConnection()
      })
  }

})


//route for deleting intent
router.post('/delete-intent',
  body('projectName').notEmpty().isString().trim().escape(),
  body('locale').notEmpty().isString().trim().escape(),
  body('intent').notEmpty().isString().trim().escape()
  , async (req, res) => {

    const filter = {
      'useremail': req.cookies.useremail,
      'projectName': req.body.projectName,
      'datasets.locale': req.body.locale
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.log(errors.array())
      return res.status(400).json({ severity: 'error', message: 'Required properties validation failed while deleting the intent' });
    }
    else {
      await getConnectionObject()
        .then(async (connectionObject) => {
          const response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(filter, {
            $pull: {
              "datasets.$.intents": { "intent": req.body.intent }
            }
          })

          if (response.matchedCount == 1) {
            return res.status(200).json({ severity: 'success', message: 'Intent deleted successfully' })
          }
          else {
            return res.status(400).json({ severity: 'error', message: 'Intent deleted failed !' })
          }
        })
        .catch(error => {
          logger.log(error)
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while deleting the intent. Please try again later' })
        })
        .finally(() => {

        })
    }
  })


//route for deleting script
router.post('/delete-script',
  body('projectName').notEmpty().isString().trim().escape(),
  body('locale').notEmpty().isString().trim().escape(),
  body('scriptName').notEmpty().isString().trim().escape()
  , async (req, res) => {
    
    const filter = {
      'useremail': req.cookies.useremail,
      'projectName': req.body.projectName,
      'datasets.locale': req.body.locale
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.log(errors.array())
      return res.status(400).json({ severity: 'error', message: 'Required properties validation failed while deleting the script' });
    }
    else {
      
      await getConnectionObject()
        .then(async (connectionObject) => {
          const response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(filter, {
            $pull: {
              "datasets.$.scripts": { "scriptName": req.body.scriptName }
            }
          })
          logger.log(response)
          if (response.modifiedCount==1) {
            return res.status(200).json({})
          }
          else {
            return res.status(500).json({ severity: 'error', message: 'Script not deleted from the database.' })
          }
        })
        .catch(error => {
          logger.log(error)
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while deleting the script. Please try again later' })
        })
        .finally(() => {

        })
    }
  })



router.put('/update-entity-data/:entityType', async (req, res) => {
  var schemaValidationResult;
  logger.log(req.body)
  if (req.body.payload.type && req.body.payload.type == entityType[0]) {
    schemaValidationResult = jsonSchemaValidator.validate(req.body, schema_qanda_entity_synonym);
  }
  else if (req.body.payload.type && req.body.payload.type == entityType[1]) {
    schemaValidationResult = jsonSchemaValidator.validate(req.body, schema_qanda_entity_regex);
  }
  logger.log(schemaValidationResult)
  if (!schemaValidationResult.valid) {
    logger.log(schemaValidationResult)
    return res.status(400).json({ 'code': 400, 'message': schemaValidationResult.errors[0].path[schemaValidationResult.errors[0].path.length - 1] + ' ' + schemaValidationResult.errors[0].message })
  }
  else if (schemaValidationResult.valid) {

    logger.log(req.body)
    const query = {
      'useremail': req.cookies.useremail,
      'projectName': req.body.projectName,
      'datasets.locale': req.body.locale,
      'datasets.entities.entity': { $eq: req.body.payload.entity } //to ensure that no duplicate intents will be written for a locale
    }

    await getConnectionObject()
      .then(async (connectionObject) => {
        const response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).update(query, {
          $set: {
            "datasets.$[locale].entities.$[entity].value": req.body.payload.value
          }
        }, {
          arrayFilters: [
            { 'locale.locale': req.body.locale },
            { 'entity.entity': req.body.payload.entity }
          ]
        }
        )
        logger.log(response)

        if (response.modifiedCount == 1) {
          res.status(200).json({ 'code': 200, 'message': '' })
        }
        else throw new Error()
      })
      .catch(error => {
        logger.log(error)
        return res.status(500).json({ severity: 'error', message: 'Database error has occured while updating entity data. Please try again later' })
      })
      .finally(() => {
        //closeConnection()
      })
  }

})

router.post('/insert-entity-data/:entityType', async (req, res) => {

  var schemaValidationResult;
  logger.log(req.params)
  if (req.params['entityType'] && req.params['entityType'] == entityType[0]) {
    schemaValidationResult = jsonSchemaValidator.validate(req.body, schema_qanda_entity_synonym);
  }
  else if (req.params['entityType'] && req.params['entityType'] == entityType[1]) {
    schemaValidationResult = jsonSchemaValidator.validate(req.body, schema_qanda_entity_regex);
  }
  logger.log(schemaValidationResult)
  if (!schemaValidationResult.valid) {
    logger.log(schemaValidationResult)
    return res.status(400).json({ 'code': 400, 'message': schemaValidationResult.errors[0].path[schemaValidationResult.errors[0].path.length - 1] + ' ' + schemaValidationResult.errors[0].message })
  }
  else if (schemaValidationResult.valid) {

    logger.log(req.body)
    const query = {
      'useremail': req.cookies.useremail,
      'projectName': req.body.projectName,
      'datasets.locale': req.body.locale,
      'datasets.entities.entity': { $ne: req.body.payload.entity } //to ensure that no duplicate intents will be written for a locale
    }

    await getConnectionObject()
      .then(async (connectionObject) => {
        const response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(query, {
          $push: {
            "datasets.$.entities": { ...req.body.payload }
          }
        }, { upsert: true }
        )
        logger.log(response)

        if (response.modifiedCount == 1) {
          res.status(200).json({ 'code': 200, 'message': '' })
        }
        else throw new Error()
      })
      .catch(error => {
        logger.log(error)
        return res.status(500).json({ severity: 'error', message: 'Database error has occured while inserting entity data. Please try again later' })
      })
      .finally(() => {
        //closeConnection()
      })
  }

})

router.post('/testbot', async (req, res) => {
  var result = await nlp.process(req.body.incoming_message)
  logger.log(result)
  res.status(200).json(
    {
      locale: result.locale,
      utterance: result.utterance,
      intent: result.intent,
      classifications: result.classifications,
      score: result.score,
      entities: result.entities,
      answer: result.answer,
      sentiment: result.sentiment
    }
  )
})

router.post('/get-entity-list',
  body('projectName').notEmpty().isString().trim().escape(),
  body('locale').notEmpty().isString().trim().escape()
  , async (req, res) => {

    //making pipeline object ready for retrieving the qand a dataset
    const pipeline = pipelinetListOfEntities(req.cookies.useremail, req.body.projectName, req.body.locale)

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.log(errors.array())
      return res.status(400).json({ severity: 'error', message: 'Required properties validation failed while retrieving entity list' });
    }
    else {
      await getConnectionObject()
        .then(async (connectionObject) => {
          const response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).aggregate(pipeline).toArray()
          logger.log(response)
          if (response) {
            res.status(200).json(response)
          }
          else {
            res.sendStatus(400)
          }
        })
        .catch(error => {
          logger.log(error)
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while reading entity list. Please try again later' })
        })
        .finally(() => {

        })
    }
  })

router.post('/get-entity-name-list',
  body('projectName').notEmpty().isString().trim().escape(),
  body('locale').notEmpty().isString().trim().escape()
  , async (req, res) => {

    //making pipeline object ready for retrieving the qand a dataset
    const pipeline = pipelinetListOfEntityNames(req.cookies.useremail, req.body.projectName, req.body.locale)

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.log(errors.array())
      return res.status(400).json({ severity: 'error', message: 'Required properties validation failed while retrieving entity name list.' });
    }
    else {
      await getConnectionObject()
        .then(async (connectionObject) => {
          const response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).aggregate(pipeline).toArray()
          logger.log(response)
          return res.status(200).json(response)
        })
        .catch(error => {
          logger.log(error)
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while reading entity name list. Please try again later' })
        })
        .finally(() => {

        })
    }
  })


//Routes for handling Intent data
router.post('/get-intent-data',
  body('projectName').notEmpty().isString().trim().escape(),
  body('locale').notEmpty().isString().trim().escape()
  , async (req, res) => {

    //making pipeline object ready for retrieving intents data
    const pipeline = pipelineIntentData(req.cookies.useremail, req.body.projectName, req.body.locale)

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.log(errors.array())
      return res.status(400).json({ severity: 'error', message: 'Required properties validation failed while retrieving intent data' });
    }
    else {
      await getConnectionObject()
        .then(async (connectionObject) => {
          var response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).aggregate(pipeline).toArray()
          if (response) {
            res.status(200).json(response)
          }
          else {
            res.sendStatus(400)
          }
        })
        .catch(error => {
          logger.log(error)
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while reading the intent data. Please try again later' })
        })
        .finally(() => {

        })
    }
  })

//REVIEWED
//route for sending count of qanda data 
router.post('/get-qandadata-count',
  body('projectName').notEmpty().isString().trim().escape(),
  body('locale').notEmpty().isString().trim().escape()
  , async (req, res) => {

    //making pipeline object ready for retrieving intents data
    const pipeline = getQndAdataCount(req.cookies.useremail, req.body.projectName, req.body.locale)

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.log(errors.array())
      return res.status(400).json({ severity: 'error', message: 'Required properties validation failed while retrieving the count for QandA dataset.' });
    }
    else {
      await getConnectionObject()
        .then(async (connectionObject) => {
          var response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).aggregate(pipeline).toArray()

          if (response.length > 0) {
            return res.status(200).json(response[0])
          }
          else {
            return res.status(200).json({ datasetCount: 0 })
          }
        })
        .catch(error => {
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while retrieving QandA data count. Please try again later' })
        })
        .finally(() => {

        })
    }
  })

//route for sending count of script data
router.post('/get-scripts-count',
  body('projectName').notEmpty().isString().trim().escape(),
  body('locale').notEmpty().isString().trim().escape()
  , async (req, res) => {

    //making pipeline object ready for retrieving intents data
    const pipeline = getScriptsCount(req.cookies.useremail, req.body.projectName, req.body.locale)

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.log(errors.array())
      return res.status(400).json({ severity: 'error', message: 'Required properties validation failed while retrieving the count for the script data.' });
    }
    else {
      await getConnectionObject()
        .then(async (connectionObject) => {
          var response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).aggregate(pipeline).toArray()
          console.log(response)
          if (response.length > 0) {
            return res.status(200).json(response[0])
          }
          else {
            return res.status(200).json({ scriptsCount: 0 })
          }
        })
        .catch(error => {
          logger.log(error)
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while obtaining script count. Please try again later' })
        })
        .finally(() => {

        })
    }
  })


//Routes for geting action code
router.post('/get-actionCode',
  body('projectName').notEmpty().isString().trim().escape(),
  body('locale').notEmpty().isString().trim().escape(),
  body('actionName').notEmpty().isString().trim().escape()
  , async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.log(errors.array())
      return res.status(400).json({ severity: 'error', message: 'Required properties validation failed while retrieving the action code.' });
    }
    else {
      //pipeline for geting actionCode
      const pipeline = pipelineActionCode(req.cookies.useremail, req.body.projectName, req.body.locale, req.body.actionName)
      await getConnectionObject()
        .then(async (connectionObject) => {
          var response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).aggregate(pipeline).toArray()
          if (response) {
            res.status(200).json(response[0])
          }
          else {
            res.sendStatus(400)
          }
        })
        .catch(error => {
          logger.log(error)
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while reading action code. Please try again later' })
        })
        .finally(() => {

        })
    }
  })



//Routes for handling Intent data
router.post('/get-script-names',
  body('projectName').notEmpty().isString().trim().escape(),
  body('locale').notEmpty().isString().trim().escape()
  , async (req, res) => {

    //making pipeline object ready for retrieving intents data
    const pipeline = piplineListOfScriptNames(req.cookies.useremail, req.body.projectName, req.body.locale)

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.log(errors.array())
      return res.status(400).json({ severity: 'error', message: 'Required properties validation failed while retrieving the script names' });
    }
    else {
      await getConnectionObject()
        .then(async (connectionObject) => {
          var response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).aggregate(pipeline).toArray()
          if (response) {
            res.status(200).json(response)
          }
          else {
            res.sendStatus(400)
          }
        })
        .catch(error => {
          logger.log(error)
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while reading script names. Please try again later' })
        })
        .finally(() => {

        })
    }
  })


//Routes for sending list of intents name that can be triggered via script
// those intents with either static response or dynamic response will be retrieved 
router.post('/get-intent-to-link-names',
  body('projectName').notEmpty().isString().trim().escape(),
  body('locale').notEmpty().isString().trim().escape()
  , async (req, res) => {

    //making pipeline object ready for retrieving intents data
    const pipeline = piplineListOfIntentToLinkNames(req.cookies.useremail, req.body.projectName, req.body.locale)

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.log(errors.array())
      return res.status(400).json({ severity: 'error', message: 'Required properties validation failed while retrieving the intent names to link' });
    }
    else {
      await getConnectionObject()
        .then(async (connectionObject) => {
          var response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).aggregate(pipeline).toArray()
          if (response) {
            res.status(200).json(response)
          }
          else {
            res.sendStatus(400)
          }
        })
        .catch(error => {
          logger.log(error)
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while reading unlinked intents. Please try again later' })
        })
        .finally(() => {

        })
    }
  })


//Routes for sending Intent names only
router.post('/get-intent-only-names',
  body('projectName').notEmpty().isString().trim().escape(),
  body('locale').notEmpty().isString().trim().escape()
  , async (req, res) => {

    //making pipeline object ready for retrieving intents data
    const pipeline = pipelineIntentName(req.cookies.useremail, req.body.projectName, req.body.locale)

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.log(errors.array())
      return res.status(400).json({ severity: 'error', message: 'Required properties validation failed while retrieving the list of intent names' });
    }
    else {
      await getConnectionObject()
        .then(async (connectionObject) => {
          var response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).aggregate(pipeline).toArray()
          if (response) {
            res.status(200).json(response)
          }
          else {
            res.sendStatus(400)
          }
        })
        .catch(error => {
          logger.log(error)
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while retrieving intent names list. Please try again later' })
        })
        .finally(() => {

        })
    }
  })

router.post('/save-intent-data', async (req, res) => {
  var schemaValidationResult;
  logger.log(req.body)
  schemaValidationResult = jsonSchemaValidator.validate(req.body, schema_intent_data);


  if (!schemaValidationResult.valid) {
    logger.log(schemaValidationResult)
    return res.status(400).json({ 'code': 400, 'message': schemaValidationResult.errors[0].path[schemaValidationResult.errors[0].path.length - 1] + ' ' + schemaValidationResult.errors[0].message })
  }
  else if (schemaValidationResult.valid) {

    logger.log(req.body)
    const query = {
      'useremail': req.cookies.useremail,
      'projectName': req.body.projectName,
      'datasets.locale': req.body.locale,
      'datasets.intents.intent': { $ne: req.body.payload.intent }, //to ensure that no duplicate intents will be written for a locale
    }

    await getConnectionObject()
      .then(async (connectionObject) => {
        const response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(query, {
          $push: {
            "datasets.$.intents": { ...req.body.payload, 'linkedScript': '' }
          }
        }, { upsert: true }
        )
        logger.log(response)

        if (response.modifiedCount == 1) {
          res.status(200).json({ 'code': 200, 'message': '' })
        }
        else throw new Error()
      })
      .catch(error => {
        logger.log(error)
        return res.status(500).json({ severity: 'error', message: 'Database error has occured while saving intent data. Please try again later' })
      })
      .finally(() => {
        //closeConnection()
      })
  }

})

//function to upload and script data
router.post('/save-script-data', async (req, res) => {

  var schemaValidationResult, queryUpdateIntent, updateScriptResponse, updateIntentResponse;
  logger.log(req.body)

  schemaValidationResult = jsonSchemaValidator.validate(req.body, schema_script_data);

  logger.log(schemaValidationResult)
  if (!schemaValidationResult.valid) {
    logger.log(schemaValidationResult)
    return res.status(400).json({ severity: 'error', message: schemaValidationResult.errors[0].path[schemaValidationResult.errors[0].path.length - 1] + ' ' + schemaValidationResult.errors[0].message })
  }
  else if (schemaValidationResult.valid) {

    var hasTriggeringIntent = req.body.payload.triggeringIntent == '' ? false : true

    const queryUpdateScripts = {
      'useremail': req.cookies.useremail,
      'projectName': req.body.projectName,
      'datasets.locale': req.body.locale,
    }


    if (hasTriggeringIntent) {
      queryUpdateIntent = {
        'useremail': req.cookies.useremail,
        'projectName': req.body.projectName,
        'datasets.locale': req.body.locale,
        'datasets.intents.intent': req.body.payload.triggeringIntent //to ensure that no duplicate for script names will be there
      }
    }


    await getConnectionObject()
      .then(async (connectionObject) => {

        const checkpoint = await connectionObject.collection(PROJECTS_COLLECTION_NAME).find({
          'useremail': req.cookies.useremail,
          'projectName': req.body.projectName,
          'datasets.locale': req.body.locale,
          'datasets.scripts.scriptName': { $eq: req.body.payload.scriptName }, //to ensure that no duplicate for script names will be there
        }).toArray()
        logger.log(checkpoint)
        if (checkpoint.length != 0) {
          return res.status(500).json({ severity: 'error', message:  'Please choose different script name.' })
        }

        //processing each step in order to update related documents in database
        const finalScript = req.body.payload.scriptFlow.map(async (step) => {
          switch (step.stepTypeIndex) {
            case 1:
              const responseAddResponseName = await connectionObject
                .collection(PROJECTS_COLLECTION_NAME)
                .updateOne({
                  'useremail': req.cookies.useremail,
                  'projectName': req.body.projectName,
                  'datasets.locale': req.body.locale,
                },
                  {
                    $push: {
                      "datasets.$.actions": {
                        'actionName': step.actionName
                      }
                    }
                  }
                )

              if (responseAddResponseName.modifiedCount == 1) {
                return step
              }
              break;
            case 2:
              const responseAddResponseVariable = await connectionObject
                .collection(PROJECTS_COLLECTION_NAME)
                .updateOne({
                  'useremail': req.cookies.useremail,
                  'projectName': req.body.projectName,
                  'datasets.locale': req.body.locale,
                },
                  {
                    $push: {
                      "datasets.$.responseVariables": {
                        'label': step.label,
                        'inputType': step.inputType
                      }
                    }
                  }
                )

              if (responseAddResponseVariable.modifiedCount == 1) {
                return step
              }

              break;

            default:
              return step
              break;
          }
        })

        Promise.all(finalScript).then(async (scriptFlow) => {
          req.body.payload.scriptFlow = scriptFlow

          updateScriptResponse = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(queryUpdateScripts, {
            $push: {
              "datasets.$.scripts": req.body.payload
            }
          }, { upsert: true }
          )

          if (hasTriggeringIntent) {
            updateIntentResponse = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(queryUpdateIntent, {
              $set: {
                "datasets.$[locale].intents.$[intent].linkedScript": req.body.payload.scriptName,
              }
            }, {
              arrayFilters: [
                { 'locale.locale': req.body.locale },
                { 'intent.intent': req.body.payload.triggeringIntent }
              ]
            }
            )
          }
          if (hasTriggeringIntent) {
            if (updateIntentResponse.modifiedCount == 1 && updateScriptResponse.modifiedCount == 1) {
              return res.status(200).json({ severity: 'success', message:  'Script data saved successfully.' })
            }
          }
          else {
            if (updateScriptResponse.modifiedCount == 1) {
              return res.status(200).json({ severity: 'success', message:  'Script data saved successfully.' })
            }
          }
        })
          .catch(error => {
            logger.log(error)
            return res.status(500).json({ severity: 'error', message: 'Database error has occured while saving individual steps in the script. Please try again later' })
          })
      }).catch(error => {
        logger.log(error)
        return res.status(500).json({ severity: 'error', message: 'Database error has occured while saving the complete script. Please try again later' })
      })
  }
})



//function to update existing script 
router.post('/update-script-data', async (req, res) => {

  var schemaValidationResult, queryUpdateIntent, updateScriptResponse, updateIntentResponse;
  logger.log(req.body)

  schemaValidationResult = jsonSchemaValidator.validate(req.body, schema_script_data);

  logger.log(schemaValidationResult)
  if (!schemaValidationResult.valid) {
    logger.log(schemaValidationResult)
    return res.status(400).json({ 'code': 400, 'message': schemaValidationResult.errors[0].path[schemaValidationResult.errors[0].path.length - 1] + ' ' + schemaValidationResult.errors[0].message })
  }
  else if (schemaValidationResult.valid) {

    var hasTriggeringIntent = req.body.payload.triggeringIntent == '' ? false : true

    const queryUpdateScripts = {
      'useremail': req.cookies.useremail,
      'projectName': req.body.projectName,
      'datasets.locale': req.body.locale,
    }


    if (hasTriggeringIntent) {
      queryUpdateIntent = {
        'useremail': req.cookies.useremail,
        'projectName': req.body.projectName,
        'datasets.locale': req.body.locale,
        'datasets.intents.intent': req.body.payload.triggeringIntent //to ensure that no duplicate for script names will be there
      }
    }


    await getConnectionObject()
      .then(async (connectionObject) => {

        const checkpoint = await connectionObject.collection(PROJECTS_COLLECTION_NAME).find({
          'useremail': req.cookies.useremail,
          'projectName': req.body.projectName,
          'datasets.locale': req.body.locale,
          'datasets.scripts.scriptName': { $eq: req.body.payload.scriptName }, //to ensure that no duplicate for script names will be there
        }).toArray()
        if (checkpoint.length == 0) {
          return res.status(500).json({ 'code': 500, 'message': 'Internal server error occured.' })
        }

        //processing each step in order to update related documents in database
        const finalScript = req.body.payload.scriptFlow.map(async (step) => {
          switch (step.stepTypeIndex) {
            case 1:
              const responseAddResponseName = await connectionObject
                .collection(PROJECTS_COLLECTION_NAME)
                .updateOne({
                  'useremail': req.cookies.useremail,
                  'projectName': req.body.projectName,
                  'datasets.locale': req.body.locale,
                },
                  {
                    $push: {
                      "datasets.$.actions": {
                        'actionName': step.actionName,
                        'actionCode': step.actionCode
                      }
                    }
                  }
                )

              if (responseAddResponseName.modifiedCount == 1) {
                return step
              }
              break;
            case 2:
              const responseAddResponseVariable = await connectionObject
                .collection(PROJECTS_COLLECTION_NAME)
                .updateOne({
                  'useremail': req.cookies.useremail,
                  'projectName': req.body.projectName,
                  'datasets.locale': req.body.locale,
                },
                  {
                    $push: {
                      "datasets.$.responseVariables": {
                        'label': step.label,
                        'inputType': step.inputType
                      }
                    }
                  }
                )

              if (responseAddResponseVariable.modifiedCount == 1) {
                return step
              }

              break;

            default:
              return step
              break;
          }
        })

        Promise.all(finalScript).then(async (scriptFlow) => {
          req.body.payload.scriptFlow = scriptFlow

          updateScriptResponse = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(queryUpdateScripts, {
            $push: {
              "datasets.$.scripts": req.body.payload
            }
          }, { upsert: true }
          )

          if (hasTriggeringIntent) {
            updateIntentResponse = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(queryUpdateIntent, {
              $set: {
                "datasets.$[locale].intents.$[intent].linkedScript": req.body.payload.scriptName,
              }
            }, {
              arrayFilters: [
                { 'locale.locale': req.body.locale },
                { 'intent.intent': req.body.payload.triggeringIntent }
              ]
            }
            )
          }
          if (hasTriggeringIntent) {
            if (updateIntentResponse.modifiedCount == 1 && updateScriptResponse.modifiedCount == 1) {
              res.status(200).json({ 'code': 200, 'message': '' })
            }
            else throw new Error()
          }
          else {
            if (updateScriptResponse.modifiedCount == 1) {
              res.status(200).json({ 'code': 200, 'message': '' })
            }
            else throw new Error()
          }
        })
          .catch(error => {
            logger.log(error)
            return res.status(500).json({ severity: 'error', message: 'Database error has occured while updating individual steps in the script. Please try again later' })
          })
      }).catch(error => {
        logger.log(error)
        return res.status(500).json({ severity: 'error', message: 'Database error has occured while updating the script. Please try again later' })
      })
  }
})



//function to upload and script data
router.post('/get-script-data',
  body('projectName').notEmpty().isString().trim().escape(),
  body('locale').notEmpty().isString().trim().escape(),
  body('currentPage').notEmpty().isNumeric(),
  body('batchSize').notEmpty().isNumeric(),
  async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.log(errors.array())
      return res.status(400).json({ severity: 'error', message: 'Required properties validation failed while retrieving the script data' });
    }
    else {
      const { currentPage, batchSize, projectName, locale } = req.body
      const { useremail } = req.cookies
      const pipeline = pipelineScriptData(useremail, projectName, locale)
      await getConnectionObject()
        .then(async (connectionObject) => {
          var response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).aggregate(pipeline)
            .skip((currentPage - 1) * batchSize)
            .limit(batchSize)
            .toArray()
          if (response) return res.status(200).json(response)
        })
        .catch(error => {
          logger.log(error)
          return res.status(500).json({ severity: 'error', message: 'Database error has occured while reading script data. Please try again later' })
        })
        .finally(() => {

        })
    }
  })

router.put('/update-intent-data', async (req, res) => {
  var schemaValidationResult;
  logger.log(req.body)

  schemaValidationResult = jsonSchemaValidator.validate(req.body, schema_intent_data);

  logger.log(schemaValidationResult)
  if (!schemaValidationResult.valid) {
    logger.log(schemaValidationResult)
    return res.status(400).json({ 'code': 400, 'message': schemaValidationResult.errors[0].path[schemaValidationResult.errors[0].path.length - 1] + ' ' + schemaValidationResult.errors[0].message })
  }
  else if (schemaValidationResult.valid) {

    logger.log(req.body)
    const query = {
      'useremail': req.cookies.useremail,
      'projectName': req.body.projectName,
      'datasets.locale': req.body.locale, //to ensure that no duplicate intents will be written for a locale
      'datasets.intents.intent': req.body.payload.intent
    }

    await getConnectionObject()
      .then(async (connectionObject) => {
        const response = await connectionObject.collection(PROJECTS_COLLECTION_NAME).updateOne(query, {
          $set: {
            "datasets.$[locale].intents.$[intent].description": req.body.payload.description,
            "datasets.$[locale].intents.$[intent].utterances": req.body.payload.utterances
          }
        }, {
          arrayFilters: [
            { 'locale.locale': req.body.locale },
            { 'intent.intent': req.body.payload.intent }
          ]
        }
        )
        logger.log(response)

        if (response.modifiedCount == 1) {
          res.status(200).json({ 'code': 200, 'message': '' })
        }
        else throw new Error()
      })
      .catch(error => {
        logger.log(error)
        return res.status(500).json({ severity: 'error', message: 'Database error has occured while updating the intent data. Please try again later' })
      })
      .finally(() => {
        //closeConnection()
      })
  }

})


app.use('/botmanagement', router)
app.listen(port, () => {
  logger.log(`Bot Admin application started running on prot  ${port} `)
})