const { removeStopwords } = require('stopword')
<<<<<<< HEAD
const customStopwordsQandA=['user','usr','asks','ask','gets','take','for','to','you','he','they','i','is','are','they','the']
const customStopwordsScrits=['user','usr','asks','ask','gets','take','for','to','you','he','they','i','script','story']

function piplineModelTrainingLog(useremail, projectName,){
=======
function pipelineQandAdataWithStaticResponse(email, projectName, locale) {
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
  return [
    {
      '$match': {
        'useremail': useremail, 
        'projectName': projectName
      }
    }, {
      '$project': {
        '_id': 0, 
        'trainingLog': 1
      }
    }, {
      '$unwind': {
        'path': '$trainingLog'
      }
    }, {
      '$project': {
<<<<<<< HEAD
        'log': '$trainingLog.log'
      }
    }, {
      '$sort': {
        'log': 1
      }
    }, {
      '$limit': 100
=======
        'datasets.intents': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets.intents'
      }
    }, {
      '$match': {
        'datasets.intents.linkedScript': { '$exists': false },
        'datasets.intents.actionName': { '$exists': false }
      }
    }
    , {
      '$project': {
        'intent': '$datasets.intents.intent',
        'description': "$datasets.intents.description",
        'utterances': '$datasets.intents.utterances',
        'answers': '$datasets.intents.answers',
        'actionName': '$datasets.intents.actionName',
        'actionCode': '$datasets.intents.actionCode'
      }
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
    }
  ]
}

<<<<<<< HEAD

function pipelineQandAdataWithStaticResponse(useremail, projectName, locale) {
=======
//retreiving list of intents having 'linkedScript' property
//this is for script section
function pipelineIntentData(email, projectName, locale) {
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
  return [
    {
      '$match': {
        'useremail': useremail,
        'projectName': projectName
      }
    }, {
      '$project': {
        '_id': 0,
        'datasets': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets'
      }
    }, {
      '$match': {
        'datasets.locale': locale
      }
    }, {
      '$project': {
        'datasets.intents': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets.intents'
      }
    }, {
      '$match': {
<<<<<<< HEAD
        'datasets.intents.linkedScript': { '$exists': false }
=======
        'datasets.intents.linkedScript': {
          '$exists': true
        }
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
      }
    }
    , {
      '$project': {
        'intent': '$datasets.intents.intent',
        'description': "$datasets.intents.description",
        'utterances': '$datasets.intents.utterances',
<<<<<<< HEAD
        'answers': '$datasets.intents.answers',
        'actionName': '$datasets.intents.actionName',
        'actionCode': '$datasets.intents.actionCode'
=======
        'linkedScript': '$datasets.intents.linkedScript'
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
      }
    }
  ]
}

<<<<<<< HEAD
//retreiving list of intents having 'linkedScript' property
//this is for script section
function pipelineIntentData(useremail, projectName, locale) {
  return [
    {
      '$match': {
        'useremail': useremail,
        'projectName': projectName
      }
    }, {
      '$project': {
        '_id': 0,
        'datasets': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets'
      }
    }, {
      '$match': {
        'datasets.locale': locale
      }
    }, {
      '$project': {
        'datasets.intents': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets.intents'
      }
    }, {
      '$match': {
        'datasets.intents.linkedScript': {
          '$exists': true
        }
      }
    }
    , {
      '$project': {
        'intent': '$datasets.intents.intent',
        'description': "$datasets.intents.description",
        'utterances': '$datasets.intents.utterances',
        'linkedScript': '$datasets.intents.linkedScript'
      }
    }
  ]
}

//pipeline for retrieving intents which are not linked to any script yet
//this will be used as list of intents for triggering the stript
function pipelineIntentName(useremail, projectName, locale) {
  return [
    {
      '$match': {
        'useremail': useremail,
=======
//pipeline for retrieving intents which are not linked to any script yet
<<<<<<< HEAD
<<<<<<< HEAD
//this will be used as list of intents for triggering the stript
function pipelineIntentName(email, projectName, locale) {
=======
=======
>>>>>>> 1c9fe975d7e9bb11bf4b8811799f5261789540f1
function pipelineIntentName(email, projectName, locale) {
  return [
    {
      '$match': {
        'email': email,
        'projectName': projectName
      }
    }, {
      '$project': {
        '_id': 0,
        'datasets': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets'
      }
    }, {
      '$match': {
        'datasets.locale': locale
      }
    }, {
      '$project': {
        'datasets.intents': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets.intents'
      }
    }, {
      '$match': {
        'datasets.intents.linkedScript': {
          '$exists': false
        }
      }
    }, {
      '$project': {
        'intent': '$datasets.intents.intent'
      }
    }
  ]
  
}


function pipelineQAndADataForTrainingModel(email,projectName,locale){
return [
  {
    '$match': {
      'email': email, 
      'projectName': projectName
    }
  }, {
    '$unwind': {
      'path': '$datasets'
    }
  }, {
    '$match': {
      'datasets.locale': locale
    }
  }, {
    '$project': {
      '_id': 0, 
      'languages': 1, 
      'settings': 1, 
      'locale': '$datasets.locale', 
      'qanda': '$datasets.qanda', 
      'entities': '$datasets.entities',
      'intents': '$datasets.intents',
      'scripts': '$datasets.scripts'
    }
  }
]
}

//function to get the list of details for every entities
function pipelinetListOfEntities(email,projectName,locale){
>>>>>>> 1c9fe975d7e9bb11bf4b8811799f5261789540f1
  return [
    {
      '$match': {
        'email': email,
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
        'projectName': projectName
      }
    }, {
      '$project': {
        '_id': 0,
        'datasets': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets'
      }
    }, {
      '$match': {
        'datasets.locale': locale
      }
    }, {
      '$project': {
        'datasets.intents': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets.intents'
      }
    }, {
      '$match': {
        'datasets.intents.linkedScript': ''
      }
    }, {
      '$project': {
        'intent': '$datasets.intents.intent'
      }
    }
  ]

}


<<<<<<< HEAD
function pipelineTrainingDataAndSettings(useremail, projectName, locale) {
  return [
    {
      '$match': {
        'useremail': useremail,
=======
function pipelineQAndADataForTrainingModel(email, projectName, locale) {
  return [
    {
      '$match': {
        'email': email,
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
        'projectName': projectName
      }
    }, {
      '$unwind': {
        'path': '$datasets'
      }
    }, {
      '$match': {
        'datasets.locale': locale
      }
    }, {
      '$project': {
        '_id': 0,
        'languages': 1,
        'settings': 1,
<<<<<<< HEAD
        'projectFolderName':1,
=======
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
        'locale': '$datasets.locale',
        'entities': '$datasets.entities',
        'intents': '$datasets.intents',
        'responseVariables': '$datasets.responseVariables',
        'scripts': '$datasets.scripts',
        'actions': '$datasets.actions',
      }
    }
  ]
}

//function to get the list of details for every entities
<<<<<<< HEAD
function pipelinetListOfEntities(useremail, projectName, locale) {
  return [
    {
      '$match': {
        'useremail': useremail,
=======
function pipelinetListOfEntities(email, projectName, locale) {
  return [
    {
      '$match': {
        'email': email,
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
        'projectName': projectName
      }
    }, {
      '$unwind': {
        'path': '$datasets'
      }
    }, {
      '$match': {
        'datasets.locale': locale
      }
    }, {
      '$unwind': {
        'path': '$datasets.entities'
      }
    }, {
      '$project': {
        '_id': 0,
        'entity': '$datasets.entities.entity',
        'description': '$datasets.entities.description',
        'type': '$datasets.entities.type',
        'value': '$datasets.entities.value'
      }
    }
  ]
}

<<<<<<< HEAD
function pipelinetListOfEntityNames(useremail, projectName, locale) {
  return [
    {
      '$match': {
        'useremail': useremail,
=======
function pipelinetListOfEntityNames(email, projectName, locale) {
  return [
    {
      '$match': {
        'email': email,
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
        'projectName': projectName
      }
    }, {
      '$unwind': {
        'path': '$datasets'
      }
    }, {
      '$match': {
        'datasets.locale': locale
      }
    }, {
      '$unwind': {
        'path': '$datasets.entities'
      }
    }, {
      '$project': {
        '_id': 0,
        'entity': '$datasets.entities.entity'
      }
    }
  ]
}

<<<<<<< HEAD
function piplineListOfScriptNames(useremail, projectName, locale) {
  return [
    {
      '$match': {
        'useremail': useremail,
=======
<<<<<<< HEAD
<<<<<<< HEAD
function piplineListOfScriptNames(email, projectName, locale) {
  return [
    {
      '$match': {
        'email': email,
=======
=======
>>>>>>> 1c9fe975d7e9bb11bf4b8811799f5261789540f1
function piplineListOfScriptNames(email,projectName,locale){
  return [
    {
      '$match': {
        'email': email, 
<<<<<<< HEAD
>>>>>>> 1c9fe975d7e9bb11bf4b8811799f5261789540f1
=======
>>>>>>> 1c9fe975d7e9bb11bf4b8811799f5261789540f1
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
        'projectName': projectName
      }
    }, {
      '$project': {
<<<<<<< HEAD
        '_id': 0,
=======
<<<<<<< HEAD
<<<<<<< HEAD
        '_id': 0,
=======
        '_id': 0, 
>>>>>>> 1c9fe975d7e9bb11bf4b8811799f5261789540f1
=======
        '_id': 0, 
>>>>>>> 1c9fe975d7e9bb11bf4b8811799f5261789540f1
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
        'datasets': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets'
      }
    }, {
      '$match': {
        'datasets.locale': locale
      }
    }, {
      '$project': {
        'datasets.scripts': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets.scripts'
      }
    }, {
      '$project': {
<<<<<<< HEAD
        'scriptName': '$datasets.scripts.scriptName',
=======
<<<<<<< HEAD
<<<<<<< HEAD
        'scriptName': '$datasets.scripts.scriptName',
=======
        'scriptName': '$datasets.scripts.scriptName', 
>>>>>>> 1c9fe975d7e9bb11bf4b8811799f5261789540f1
=======
        'scriptName': '$datasets.scripts.scriptName', 
>>>>>>> 1c9fe975d7e9bb11bf4b8811799f5261789540f1
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
        'scripDescription': '$datasets.scripts.scriptDescription'
      }
    }
  ]
}

<<<<<<< HEAD
//pipeline for retrieving list of fully defined (i.e. intent with either static response or dynamic response)
function piplineListOfIntentToLinkNames(useremail, projectName, locale) {
  return [
    {
      '$match': {
        'useremail': useremail,
=======
<<<<<<< HEAD
<<<<<<< HEAD
//pipeline for retrieving list of fully defined (i.e. intent with either static response or dynamic response)
function piplineListOfIntentToLinkNames(email, projectName, locale) {
  return [
    {
      '$match': {
        'email': email,
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
        'projectName': projectName
      }
    }, {
      '$project': {
        '_id': 0,
        'datasets': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets'
      }
    }, {
      '$match': {
        'datasets.locale': locale
      }
    }, {
      '$project': {
        'datasets.intents': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets.intents'
      }
    }, {
      '$match': {
        'datasets.intents.linkedScript': {
          '$exists': false
        }
      }
    }, {
      '$project': {
        'intentName': '$datasets.intents.intent',
        'description': '$datasets.intents.description'
      }
    }
  ]
}

<<<<<<< HEAD
function queryFindActionName(useremail, projectName, locale, actionName) {
  return {
    'useremail': useremail,
=======
function queryFindActionName(email, projectName, locale, actionName) {
  return {
    'email': email,
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
    'projectName': projectName,
    'datasets.locale': locale,
    'datasets.actions.actionName': actionName
  }
}


<<<<<<< HEAD
function pipelineQandAdataWithDynamicResponse(useremail, projectName, locale) {
  return [
    {
      '$match': {
        'useremail': useremail,
=======
function pipelineQandAdataWithDynamicResponse(email, projectName, locale) {
  return [
    {
      '$match': {
        'email': email,
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
        'projectName': projectName
      }
    }, {
      '$project': {
        '_id': 0,
        'datasets': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets'
      }
    }, {
      '$match': {
        'datasets.locale': locale
      }
    }, {
      '$project': {
        'datasets.intents': 1,
        'datasets.actions': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets.intents'
      }
    }, {
      '$match': {
        'datasets.intents.linkedScript': {
          '$exists': false
        },
        'datasets.intents.actionName': {
          '$exists': true
        }
      }
    }, {
      '$unwind': {
        'path': '$datasets.actions'
      }
    }, {
      '$match': {
        '$expr': {
          '$eq': [
            '$datasets.intents.actionName', '$datasets.actions.actionName'
          ]
        }
      }
    }, {
      '$project': {
        'intent': '$datasets.intents.intent',
        'description': '$datasets.intents.description',
        'utterances': '$datasets.intents.utterances',
        'answers': '$datasets.intents.answers',
        'actionName': '$datasets.intents.actionName',
        'actionCode': '$datasets.actions.actionCode'
      }
    }
  ]
}

<<<<<<< HEAD
function pipelineScriptData(useremail, projectName, locale) {
  return [
    {
      '$match': {
        'useremail': useremail,
=======
function pipelineScriptData(email, projectName, locale) {
  return [
    {
      '$match': {
        'email': email,
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
        'projectName': projectName
      }
    }, {
      '$project': {
        '_id': 0,
        'datasets': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets'
      }
    }, {
      '$match': {
        'datasets.locale': locale
      }
    }, {
      '$project': {
        'datasets.scripts': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets.scripts'
      }
    }, {
      '$project': {
        'scriptName': '$datasets.scripts.scriptName',
        'scriptDescription': '$datasets.scripts.scriptDescription',
        'listOfResponseNames': '$datasets.scripts.listOfResponseNames',
        'triggeringIntent': '$datasets.scripts.triggeringIntent',
        'scriptFlow': '$datasets.scripts.scriptFlow'
      }
    }
  ]
}

<<<<<<< HEAD
function pipelineActionCode(useremail, projectName, locale, actionName) {
  return [
    {
      '$match': {
        'useremail': useremail,
=======
function pipelineActionCode(email, projectName, locale, actionName) {
  return [
    {
      '$match': {
        'email': email,
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
        'projectName': projectName
      }
    }, {
      '$project': {
        '_id': 0,
        'datasets': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets'
      }
    }, {
      '$match': {
        'datasets.locale': locale
      }
    }, {
      '$project': {
        'datasets.actions': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets.actions'
      }
    }, {
      '$match': {
        'datasets.actions.actionName': actionName
      }
    }, {
      '$project': {
        'actionCode': '$datasets.actions.actionCode'
      }
    }
  ]
}


<<<<<<< HEAD
function getQndAdataCount(useremail, projectName, locale) {
  return [
    {
      '$match': {
        'useremail': useremail,
=======
function getQndAdataCount(email, projectName, locale) {
  return [
    {
      '$match': {
        'email': email,
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
        'projectName': projectName
      }
    }, {
      '$project': {
        '_id': 0,
        'datasets': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets'
      }
    }, {
      '$match': {
        'datasets.locale': locale
      }
    }, {
      '$project': {
        'datasets.intents': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets.intents'
      }
    }, {
      '$match': {
        'datasets.intents.linkedScript': {
          '$exists': false
        }
      }
    }, {
      '$count': 'datasetCount'
    }
  ]
}


<<<<<<< HEAD
//pipeline for getting script count
function getScriptsCount(useremail, projectName, locale) {
  return [
    {
      '$match': {
        'useremail': useremail,
        'projectName': projectName
      }
    }, {
      '$project': {
        '_id': 0,
        'datasets': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets'
      }
    }, {
      '$match': {
        'datasets.locale': locale
      }
    }, {
      '$project': {
        'datasets.scripts': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets.scripts'
      }
    }, {
      '$count': 'scriptsCount'
    }
  ]
}


function searchQandAData(useremail, projectName, locale, searchText) {
  var tokens = removeStopwords(searchText.split(' '),customStopwordsQandA)
  tokens.push(searchText)
  tokens = tokens.map(token=>new RegExp(token))
  return [
    {
      '$match': {
        'useremail': useremail,
=======
function searchQandAData(email, projectName, locale, searchText) {
  var tokens = removeStopwords(searchText.split(' '))
  tokens.push(searchText)
  return [
    {
      '$match': {
        'email': email,
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
        'projectName': projectName
      }
    }, {
      '$project': {
        '_id': 0,
        'datasets': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets'
      }
    }, {
      '$match': {
        'datasets.locale': locale
      }
    }, {
      '$project': {
        'intents': '$datasets.intents'
      }
    }, {
      '$unwind': {
        'path': '$intents'
      }
    }, {
      '$match': {
        'intents.linkedScript': {
<<<<<<< HEAD
             '$exists': false
=======
          '$exists': false
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
        }
      }
    }, {
      '$project': {
        'intent': '$intents.intent',
        'description': '$intents.description',
        'utterances': '$intents.utterances',
<<<<<<< HEAD
        'answers': '$intents.answers',
        'actionName': '$intents.actionName',
        'actionCode': '$intents.actionCode'
=======
        'answers': '$intents.answers'
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
      }
    }, {
      '$match': {
        '$or': [
          {
            'intent': {
<<<<<<< HEAD
              '$in': tokens
=======
              '$in': tokens.map(token => new RegExp(token))
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
            }
          },
          {
            'description': {
<<<<<<< HEAD
              '$in': tokens
            }
          }
        ]
      }
    }
  ]
}


function searchScript(useremail, projectName, locale, searchText) {
  var tokens = removeStopwords(searchText.split(' '),customStopwordsScrits)
  tokens.push(searchText)
  tokens = tokens.map(token=>new RegExp(token))
  return [
    {
      '$match': {
        'useremail': useremail, 
        'projectName': projectName
      }
    }, {
      '$project': {
        '_id': 0, 
        'datasets': 1
      }
    }, {
      '$unwind': {
        'path': '$datasets'
      }
    }, {
      '$match': {
        'datasets.locale': locale
      }
    }, {
      '$project': {
        'scripts': '$datasets.scripts'
      }
    }, {
      '$unwind': {
        'path': '$scripts'
      }
    }, {
      '$project': {
        'scriptName': '$scripts.scriptName', 
        'scriptDescription': '$scripts.scriptDescription', 
        'triggeringIntent': '$scripts.triggeringIntent', 
        'listOfResponseNames': '$scripts.listOfResponseNames', 
        'scriptFlow': '$scripts.scriptFlow'
      }
    }, {
      '$match': {
        '$or': [
          {
            'scriptName': {
              '$in': tokens
            }
          }, {
            'description': {
              '$in': tokens
=======
              '$in': tokens.map(token => new RegExp(token))
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
            }
          }
        ]
      }
    }
  ]
}

module.exports = {
  pipelineQandAdataWithStaticResponse,
<<<<<<< HEAD
  pipelineTrainingDataAndSettings,
=======
=======
=======
>>>>>>> 1c9fe975d7e9bb11bf4b8811799f5261789540f1
module.exports = { 
  pipelineQandAdata,
>>>>>>> 1c9fe975d7e9bb11bf4b8811799f5261789540f1
  pipelineQAndADataForTrainingModel,
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
  pipelinetListOfEntities,
  pipelinetListOfEntityNames,
  pipelineIntentData,
  pipelineIntentName,
<<<<<<< HEAD
=======
<<<<<<< HEAD
<<<<<<< HEAD
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
  piplineListOfScriptNames,
  piplineListOfIntentToLinkNames,
  queryFindActionName,
  pipelineQandAdataWithDynamicResponse,
  pipelineScriptData,
  pipelineActionCode,
  getQndAdataCount,
<<<<<<< HEAD
  getScriptsCount,
  searchQandAData,
  searchScript,
  piplineModelTrainingLog
=======
  searchQandAData
=======
  piplineListOfScriptNames
>>>>>>> 1c9fe975d7e9bb11bf4b8811799f5261789540f1
=======
  piplineListOfScriptNames
>>>>>>> 1c9fe975d7e9bb11bf4b8811799f5261789540f1
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
};