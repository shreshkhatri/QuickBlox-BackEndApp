const { removeStopwords } = require('stopword')
const customStopwordsQandA = ['user', 'usr', 'asks', 'ask', 'gets', 'take', 'for', 'to', 'you', 'he', 'they', 'i', 'is', 'are', 'they', 'the']
const customStopwordsScrits = ['user', 'usr', 'asks', 'ask', 'gets', 'take', 'for', 'to', 'you', 'he', 'they', 'i', 'script', 'story']

function piplineModelTrainingLog(useremail, projectName,) {
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
        'log': '$trainingLog.log'
      }
    }, {
      '$sort': {
        'log': 1
      }
    }, {
      '$limit': 100
    }
  ]
}


function pipelineQandAdataWithStaticResponse(useremail, projectName, locale) {
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
        'datasets.intents.linkedScript': { '$exists': false }
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
    }
  ]
}

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
          '$exists': true,
          '$in': [null, '']
        }
      }
    }, {
      '$project': {
        'intent': '$datasets.intents.intent'
      }
    }
  ]

}


function pipelineTrainingDataAndSettings(useremail, projectName, locale) {
  return [
    {
      '$match': {
        'useremail': useremail,
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
        'projectFolderName': 1,
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
function pipelinetListOfEntities(useremail, projectName, locale) {
  return [
    {
      '$match': {
        'useremail': useremail,
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

function pipelinetListOfEntityNames(useremail, projectName, locale) {
  return [
    {
      '$match': {
        'useremail': useremail,
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

function piplineListOfScriptNames(useremail, projectName, locale) {
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
      '$project': {
        'scriptName': '$datasets.scripts.scriptName',
        'scripDescription': '$datasets.scripts.scriptDescription'
      }
    }
  ]
}

//pipeline for retrieving list of fully defined (i.e. intent with either static response or dynamic response)
function piplineListOfIntentToLinkNames(useremail, projectName, locale) {
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

function queryFindActionName(useremail, projectName, locale, actionName) {
  return {
    'useremail': useremail,
    'projectName': projectName,
    'datasets.locale': locale,
    'datasets.actions.actionName': actionName
  }
}


function pipelineQandAdataWithDynamicResponse(useremail, projectName, locale) {
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

function pipelineScriptData(useremail, projectName, locale) {
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

function pipelineActionCode(useremail, projectName, locale, actionName) {
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


function getQndAdataCount(useremail, projectName, locale) {
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
          '$exists': false
        }
      }
    }, {
      '$count': 'datasetCount'
    }
  ]
}


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
  var tokens = removeStopwords(searchText.split(' '), customStopwordsQandA)
  tokens.push(searchText)
  tokens = tokens.map(token => new RegExp(token))
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
        'intents': '$datasets.intents'
      }
    }, {
      '$unwind': {
        'path': '$intents'
      }
    }, {
      '$match': {
        'intents.linkedScript': {
          '$exists': false
        }
      }
    }, {
      '$project': {
        'intent': '$intents.intent',
        'description': '$intents.description',
        'utterances': '$intents.utterances',
        'answers': '$intents.answers',
        'actionName': '$intents.actionName',
        'actionCode': '$intents.actionCode'
      }
    }, {
      '$match': {
        '$or': [
          {
            'intent': {
              '$in': tokens
            }
          },
          {
            'description': {
              '$in': tokens
            }
          }
        ]
      }
    }
  ]
}


function searchScript(useremail, projectName, locale, searchText) {
  var tokens = removeStopwords(searchText.split(' '), customStopwordsScrits)
  tokens.push(searchText)
  tokens = tokens.map(token => new RegExp(token))
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
            }
          }
        ]
      }
    }
  ]
}

function pipelineGetScriptDataForUpdate(useremail, projectName, locale, scriptName) {
  return [
    {
      '$match': {
        'useremail': useremail,
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
        'path': '$datasets.scripts'
      }
    }, {
      '$match': {
        'datasets.scripts.scriptName': scriptName
      }
    }, {
      '$project': {
        '_id': 0,
        'triggeringIntent': '$datasets.scripts.triggeringIntent'
      }
    }
  ]
}



module.exports = {
  pipelineQandAdataWithStaticResponse,
  pipelineTrainingDataAndSettings,
  pipelinetListOfEntities,
  pipelinetListOfEntityNames,
  pipelineIntentData,
  pipelineIntentName,
  piplineListOfScriptNames,
  piplineListOfIntentToLinkNames,
  queryFindActionName,
  pipelineQandAdataWithDynamicResponse,
  pipelineScriptData,
  pipelineActionCode,
  getQndAdataCount,
  getScriptsCount,
  searchQandAData,
  searchScript,
  piplineModelTrainingLog,
  pipelineGetScriptDataForUpdate
};