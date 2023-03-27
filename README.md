The application developed mainly has 3 components. They are as follows:
1. Backend application (Node JS application)
2. Frontend application (React web app consisting of chatbot widget)

**BACKEND APPLICATION**

The back-end application has been created JavaScript and runs in node JS environment. The purpose of the backend application is to avail HTTP endpoints the operations: user login, chatbot dataset handling and chatbot managements. Backend application has used following features:

- MongoDB database for dataset storage.
- Aggregation pipelines for manipulating chatbot datasets.
- Deploys chatbot as a child process for the provider.

The backend application can be incorporated into the existing SDK and make them avail by wrapping them into suitable functions.

The backend application has the following folder structure.
 
File and folder descriptions are as follows:

**FOLDER: BOT_TEMPLATE**

The folder contains the required set up files for chatbot. The template files present adheres to the file content found inside the repository.

https://github.com/jesus-seijas-sp/nlpjs-examples/tree/master/04.bot 

However, the files corpus.dlg and script.dlg are absent in our case as these files hold the training datasets and datasets can be different from user to user. These files are generated when the user trains the model using the front-end application.
Some descriptions about the files are present below:
- conf.json :  This file holds the configurations and settings for the chatbot. This file is modified by the script while altering the bot settings. The bot settings contained on this file are classification threshold, port that the bot server runs on etc but other settings regarding the module can be also mentioned on this file later on.
- Index.js :  The file holds the code for running the launching the bot in event loop. The bot can also be launched as a standalone application by running the command shown below inside the bot_template folder:

  `node index.js`

  But during actual run time this file is run as a child process using exec function from the parent node application.

**FOLDER: APPLICATION**

This folder is a collection of the files that are used as a helper files for the main backend application. Without these files, application's functionality will be incomplete. Some descriptions about the files present inside this folder are as follows:
- Datamanagement.js
This file contains the information required for database connection They are as follows:
 - MongoDB SRV string (consisting of both username and password)
 - Database name
 - Collections names

 Now, MongoDB database is being used.
- Dataschemas.js
This file holds all the JSON schema definitions for the JSON object the main backend application will be receiving from the REST APIs. Basic schemas used are for validating JSON objects representing Q&A data, conversation flows or scripts, entity definitions etc.
- Pipelines.js
This file is a collection of pipelines used for aggregation by MongoDB.  Many pipelines have been defined for retrieving the required data from the collections. The pipelines are equivalent to complex SQL queries in MongoDB realm.
- FileHandle.js
The model cannot be treated directly using the data retrieved from the database. It has to be converted into the structure and file format understood by the chatbot. This file holds the functions that are responsible for creating visible dataset files using the data provided from the database. The training data stored in MongoDB data is looped through and transformed into files format that is used by the chatbot for training the dataset.  This file also has a function to write the chatbot configuration obtained from the database into a file.

**FILE: BOT_ADMIN_APPLICATION.JS**

This file is the main application file that when run spins the main node js application. The file links all the rest of the files described above during the operation. Following are the points to observe about this file.
- The port specified is 4000, initially.
-	The file has a function to set up and run a bot server.
-	The application when run exposes all the REST APIs that are used by the front application.

Following are the list of the APIs and their descriptions which are present in this file.

| Endpoint	| Usage|
| --------- | ------|
|/login	| For allowing the user to login using the login credentials|
| /create-chatbot-project |	The endpoint to create a chatbot project initially.|
|/check-email-usability	|For checking if the user provided email already exists or not in the database.
|/trainmodel|	Used for training of the model
|/update-botserver-status	|Used for turning on or off of the chatbot server
|/insert-qana-data/:type	|Used for inserting faq data instance into the database. The type could either be static or dynamic. Static type means that the FAQ data consists of the utterances and the pre-defined responses. Dynamic type means that the FAQ data needs data from the action server. The structure of incoming dataset payload will be different according to the type specified as a URL parameter.
|/get-project-data	|Used for sending the project data after the login process is successful. Before the client app is routed to home page. This route will be triggered and the project data such as: selected language, chatbot settings, project name etc are transferred to the client application.
|/save-project-data	|Used for saving the project data such as: model settings, chatbot configuration and project name
|/get-qana-data	|Used for retrieving FAQ data in the paginated form as requested from the client side. The parameters: batch size and the page number is specified from the client application. Batch size specifies the number of FAQ dataset to retrieve and page number specifies that offset value.
|/search-qana-data	|Used for searching the FAQ data in the database. Search is done across only the intent name and the intent descriptions but not across the utterances or the answers.
|/search-script-data	|Used for searching the scripts in the database. The search is made across the script name and the script description stored in the database.
|/check-acitonName-availability	|Used to ensure that the across name for a project remains unique because if more than one actions are found then the lastly created action overrides the previous one.
|/update-qana-data/:type	|Used for updating the existing FAQ dataset. Either FAQ with static answer or the dynamic response can be updated as specified by the type and the payload received.
|/delete-intent	| Used for deleting a FAQ dataset using the intent name since the intent name is unique across the dataset.
|/delete-script	|Used for deleting a script from the database using a script name
|/update-entity-data/:entityType	| Used for updating the entity definition. The type could be either synonym or the regex one.
|/insert-entity-data/:entityType	| Used for creating an entity. The entity could either be synonym or regex as specified by the entityType param received and the payload received via HTTP request body.
|/get-entity-list	| Used for retrieving and displaying existing list of entities for a project. Helps user to see what entities exists and what value they hold
|/get-entity-name-list	|Used for retrieving the list of entities when annotating the entity at the time of FAQ dataset creation. The list of the entity appears as a popover box content while annotating the utterance or static response during the creation of FAQ dataset.|
|/get-intent-data| used for retrieving the list of intents created. The difference between the Q&A dataset and intent only dataset is that the Q&A dataset has fixed response but intent only dataset have intent data consisting of the intent category and the utterances only. The reason of creating intent only dataset is to be able create a sequence of conversation or conversation flow. |
|/get-qandadata-count | an endpoint for retrieving the count for Q&A dataset to apply pagination feature while showing Q&A data |
|/get-scripts-count | an endpoint for retrieving the count for script dataset while showing them in the form of pages. |
|/get-script-names | Used for retrieving the list of names of existing scripts. We need list of scripts while we are creating script and since one script can invoke another script. We need to see list of scripts while linking a current script to the next script. |
|/get-intent-to-link-names | Response present in any Q&A dataset can be triggered by a step in conversation flow. This endpoint retrieves intents from Q&A dataset list. |
|/get-intent-only-names | The endpoint returns the list of intents having only utterances. Those intents will be used to trigger a conversation script. Therefore, these intents will not have any responses predefined and they are candidate intents for invoking the script or conversation flow. |
| /save-intent-data | The endpoint is used for saving newly created QandA data (either with static response or action code ) into the database. |
|/save-script-data | Used for saving newly created script flow to the database |
|/update-script-data | The endpoint is used for updatig the existing script data into the database. |
|/get-script-data | Used for retrieving all the existing scirpt data for showing them on page. |
|/update-intent-data | Used for updating the existing intent only dataset. The changes could be addition or removal of utterance from the utterance list. |
|
