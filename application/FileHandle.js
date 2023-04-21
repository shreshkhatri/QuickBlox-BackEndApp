const { logger } = require('@nlpjs/logger');
const fse = require('fs-extra')
//just for reference
const stepList = [
    { stepLabel: 'Bot Text Response', stepTypeIndex: 0 },
    { stepLabel: 'Dynamic Response', stepTypeIndex: 1 },
    { stepLabel: 'Read Response', stepTypeIndex: 2 },
    { stepLabel: 'Condition Evaluation', stepTypeIndex: 3 },
    { stepLabel: 'Link Existing script', stepTypeIndex: 4 },
    { stepLabel: 'Trigger an Intent', stepTypeIndex: 5 }
]


//function for initializing the header content for the script
function initializeScriptContent() {
    return `# Script for a simple turn conversation
import corpus.dlg
    
dialog main
  nlp

`
}

function createdotEnvFile(destination_dir,data){
    fse.writeFileSync(`${destination_dir}/.env`,data)
}

//function to copy bot template files to user's project file
function copyBotTemplateFiles(source_dir, destination_dir) {
    return fse.copy(source_dir, destination_dir)
}

//function to initialize and creating training file
function prepareTrainingData(working_dir, trainingData) {
    var actionsObject = {}
    var corpusVariable = ''
    var scriptVariable = initializeScriptContent()
    try {

        // STEP 1 FIRST OF ALL READING TRAINING DATA INTO OBJECTS/VARIABLE

        //reading Intent or the Q&A dataset
        var updated_variables = readCorpusData(trainingData, corpusVariable, scriptVariable, actionsObject)

        corpusVariable = updated_variables.corpusVariable
        scriptVariable = updated_variables.scriptVariable
        actionsObject = updated_variables.actionsObject

        //reading Script dataset
        updated_variables = readScripts(trainingData, scriptVariable, actionsObject)
        scriptVariable = updated_variables.scriptVariable
        actionsObject = updated_variables.actionsObject

        //STEP 2 NOW SYNCHRONOUS WRITING THEM INTO THEIR RESPECTIVE FILE LOCATIONS
        const corpus_file = fse.outputFileSync(working_dir + '/corpus.dlg', corpusVariable)
        logger.info(`corpus.dlg file created on directory path : ${working_dir}`)
        const script_file = fse.outputFileSync(working_dir + '/script.dlg', scriptVariable)
        logger.info(`script.dlg file created on directory path : ${working_dir}`)
        
        for (const [actionName, actionCode] of Object.entries(actionsObject)){
            const r = fse.outputFileSync(working_dir + '/actions/' + actionName + '.js', actionCode)
            console.log(r)
            logger.info(`The action ${actionName}.js is created on directory path : ${working_dir}/actions`)
        }

        /*
        actionsObject.forEach(action=>{
            const r = fse.outputFileSync(working_dir + '/actions/' + action.actionName + '.js', action.actionCode)
            console.log(r)
            logger.info(`The action ${action.actionName}.js is created on directory path : ${working_dir}/actions`)
        }) */

        return true

    }
    catch (error) {
        logger.error(error)
        return false
    }

}


async function updateBotConfigurationOnFile(destination_dir, settings) {
    
    return await fse.readJSON(destination_dir + '/conf.json')
        .then(async object => {

            //replacing the exisiting port number with the integer
            object['settings']['api-server']['port'] = parseInt(settings.botServerPort)
            
            //replacing the threshold vlue for the unerlying NLP model
            object['settings']['nlp']['threshold'] = parseFloat(settings.nlu.threshold)
            return await fse.writeJson(destination_dir + '/conf.json', object)
                .then(() => {
                    return 'Bot Configuration on file update successful!'
                })
                .catch(error => {
                    return 'Bot configuration on file update failed.'
                })
        })
        .catch(error => {
            return 'Bot configuration file could not be read'
        })

}

//function to read the Intent data 
function readCorpusData(trainingData, corpusVariable, scriptVariable, actionsObject) {

    try {
        logger.info('Reading Intent data ...')
        corpusVariable = 'language ' + trainingData.locale + '\n\n'
        trainingData.intents.forEach(data => {
            if (data.hasOwnProperty('linkedScript') && data.linkedScript == "") {
                return
            }
            corpusVariable += 'intent ' + data.intent + '\n'
            corpusVariable += ' utterances\n'

            data.utterances.forEach((utterance) => {
                corpusVariable += ' - ' + utterance + '\n'
            })

            corpusVariable += ' answers\n'

            if (data.hasOwnProperty('actionName') && data.hasOwnProperty('actionCode')) {
                corpusVariable += ' - /' + data.actionName
                //readAction(actionsVariable, data.actionName, data.actionCode)
                actionsObject[data.actionName] = data.actionCode
                scriptVariable += '\n\ndialog ' + data.actionName + '\n' + ' call ' + data.actionName + '\n\n'
            }
            else if (data.hasOwnProperty('answers')) {
                data.answers.forEach((answer) => {
                    corpusVariable += ' - ' + answer + '\n'
                })
            }
            else if (data.hasOwnProperty('linkedScript')) {
                corpusVariable += ' - /' + data.linkedScript + '\n'
            }
            corpusVariable += '\n'

        })

        corpusVariable += '\n\n'
        logger.info('Reading entities ...')
        //now processing entities data
        if (trainingData.hasOwnProperty('entities')) {

            trainingData.entities.forEach((entity) => {
                corpusVariable += 'entity ' + entity.entity + '\n'

                if (entity.type == 'regex') {
                    corpusVariable += ' regex ' + entity.value.regex + '\n\n'
                }
                else if (entity.type == 'synonym') {
                    entity.value.forEach(({ synonym, values }) => {
                        corpusVariable += ' - ' + synonym + ': ' + values + '\n'
                    })
                }
                corpusVariable += '\n\n'
            })
        }

        return { corpusVariable, scriptVariable, actionsObject }

    }
    catch (error) {
        throw error
    }

    

}

//function to read script data into memory
function readScripts(trainingData, scriptVariable, actionsObject) {
    //const responseVariables= trainingData.hasOwnProperty('responseVariables') && trainingData.trainingData

    try {
        var scriptData = trainingData.scripts
        scriptData.forEach((scriptdata) => {
            scriptVariable += '\n\ndialog ' + scriptdata.scriptName + '\n'

            if (scriptdata.hasOwnProperty('scriptFlow') && scriptdata.scriptFlow.length != 0) {
                scriptdata.scriptFlow.forEach((step) => {
                    switch (step.stepTypeIndex) {
                        //'say' response
                        case 0:
                            scriptVariable += ' say ' + step.botResponse + '\n'
                            break;
                        // create action and 'call'
                        case 1:
                            //readAction(step.actionName, step.actionCode)
                            scriptVariable += ' call ' + step.actionName + '\n'
                            actionsObject[step.actionName] = step.actionCode
                            break;

                        //'ask'
                        case 2:
                            scriptVariable += ' ask ' + step.name + '\n'
                            break;
                        //[condition evaluation]
                        case 3:

                            if (step.hasOwnProperty('query') && step.hasOwnProperty('stepToRunIfTrue')) {
                                var condition = ''
                                var nextStepToRun = ''
                                const query = step.query

                                //processing just a rule
                                if (query.hasOwnProperty('rules') && query.rules.length == 1) {
                                    var rule = query.rules[0]

                                    condition = ' ['
                                    condition += rule.field.trim()
                                    if (rule.operator.trim() == "=") {
                                        condition += "=="
                                    } else {
                                        condition += rule.operator
                                    }
                                    condition += '\"' + rule.value + '\"'
                                    condition += ']'
                                }


                                //processing rules 
                                if (query.hasOwnProperty('rules') && query.rules.length > 1) {
                                    const logicalOperatorString = query.combinator.trim().toLowerCase()
                                    var logicalOperator = undefined
                                    if (logicalOperatorString == "and") {
                                        logicalOperator = ' && '
                                    }
                                    else if (logicalOperatorString == "or") {
                                        logicalOperator = ' || '
                                    }
                                    condition = ' ['
                                    query.rules.forEach((rule) => {
                                        condition += rule.field.trim()
                                        if (rule.operator.trim() == "=") {
                                            condition += "=="
                                        } else {
                                            condition += rule.operator
                                        }
                                        condition += '\"' + rule.value + '\"'
                                        condition += logicalOperator
                                    })
                                    condition += ']'
                                }


                                //processing step to run next
                                const stepToRunIfTrue = step.stepToRunIfTrue
                                switch (stepToRunIfTrue.stepTypeIndex) {
                                    //bot response
                                    case 0:
                                        nextStepToRun = ' say ' + stepToRunIfTrue.botResponse + '\n'
                                        break;
                                    // create action and call action
                                    case 1:
                                        //readAction(stepToRunIfTrue.actionName, stepToRunIfTrue.actionCode)
                                        nextStepToRun = ' call ' + stepToRunIfTrue.actionName + '\n'
                                        actionsObject[stepToRunIfTrue.actionName] = stepToRunIfTrue.actionCode
                                        break;
                                    //'run' script name
                                    case 4:
                                        nextStepToRun = ' run ' + stepToRunIfTrue.linkedScript + '\n'
                                        break;
                                    //'nlp' intent name
                                    case 5:
                                        nextStepToRun = ' nlp ' + stepToRunIfTrue.intentToTrigger + '\n'
                                        break;
                                    default:
                                        break;
                                }

                                scriptVariable += condition + nextStepToRun

                            }

                            break;

                        //'run'
                        case 4:
                            scriptVariable += ' run ' + step.linkedScript + '\n'
                            break;
                        // 'nlp intent name
                        case 5:
                            scriptVariable += ' nlp ' + step.intentToTrigger + '\n'
                            break;
                        default:
                            break;
                    }

                })
            }
        })

        return { scriptVariable, actionsObject }
    }
    catch (error) {
        throw error
    }
}



module.exports = { copyBotTemplateFiles, updateBotConfigurationOnFile, prepareTrainingData ,createdotEnvFile}
