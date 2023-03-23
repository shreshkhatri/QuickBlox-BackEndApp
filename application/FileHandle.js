<<<<<<< HEAD
const { logger } = require('@nlpjs/logger');
const fse = require('fs-extra')
//just for reference
=======
const fs = require('fs')
//just for reference
<<<<<<< HEAD
<<<<<<< HEAD

=======
>>>>>>> 1c9fe975d7e9bb11bf4b8811799f5261789540f1
=======
>>>>>>> 1c9fe975d7e9bb11bf4b8811799f5261789540f1
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
const stepList = [
    { stepLabel: 'Bot Text Response', stepTypeIndex: 0 },
    { stepLabel: 'Dynamic Response', stepTypeIndex: 1 },
    { stepLabel: 'Read Response', stepTypeIndex: 2 },
    { stepLabel: 'Condition Evaluation', stepTypeIndex: 3 },
    { stepLabel: 'Link Existing script', stepTypeIndex: 4 },
<<<<<<< HEAD
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
=======
<<<<<<< HEAD
<<<<<<< HEAD
    { stepLabel: 'Trigger an Intent', stepTypeIndex: 5 }
]


=======
    { stepLabel: 'Link Existing Action', stepTypeIndex: 5 }
]

>>>>>>> 1c9fe975d7e9bb11bf4b8811799f5261789540f1
=======
    { stepLabel: 'Link Existing Action', stepTypeIndex: 5 }
]

>>>>>>> 1c9fe975d7e9bb11bf4b8811799f5261789540f1
//variabl with predefined header like content for 'script.dlg' file
var scriptFileContent=`# Script for a simple turn conversation

import corpus.dlg

dialog main
  nlp

`

//function to create action file inside the action folder and also write the action code inside the same action file
function createAction(actionName, actionCode) {
    fs.writeFile('./actions/' + actionName + '.js', actionCode, (error) => {
        if (error) {
            console.log(error)
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
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

<<<<<<< HEAD

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

=======
<<<<<<< HEAD
<<<<<<< HEAD
//function for looping through actions and writing them into files
function createActions(actions){
    actions.forEach((action)=>{
        createAction(action.actionName,action.actionCode)
    })
}



function registerDialogForAction(actionName) {
    scriptFileContent += '\n\ndialog ' + actionName + '\n' + ' call ' + actionName + '\n\n'
}

function createCorpusFile(trainingData) {
    var content = ''
    if (trainingData && Object.keys(trainingData).length != 0) {
        try {
            content = 'language ' + trainingData.locale + '\n\n'
            trainingData.intents.forEach(data => {
                if (data.hasOwnProperty('linkedScript') && data.linkedScript==""){
                    return
                }
                content += 'intent ' + data.intent + '\n'
                content += ' utterances\n'

                data.utterances.forEach((utterance) => {
                    content += ' - ' + utterance + '\n'
                })

                content += ' answers\n'

                if (data.hasOwnProperty('actionName')) {
                    content += ' - /' + data.actionName
                    registerDialogForAction(data.actionName)
                }
                else if (data.hasOwnProperty('answers')){
                    data.answers.forEach((answer) => {
                        content += ' - ' + answer + '\n'
                    })
                }
                else if (data.hasOwnProperty('linkedScript')){
                    content += ' - /' + data.linkedScript+ '\n'
                }
                content += '\n'

            })

            content += '\n\n'

            //now processing entities data
            if (trainingData.hasOwnProperty('entities')) {

                trainingData.entities.forEach((entity) => {
                    content += 'entity ' + entity.entity + '\n'

                    if (entity.type == 'regex') {
                        content += ' regex ' + entity.value.regex + '\n\n'
                    }
                    else if (entity.type == 'synonym') {
                        entity.value.forEach(({ synonym, values }) => {
                            content += ' - ' + synonym + ': ' + values + '\n'
                        })
                    }
                    content += '\n\n'
                })
            }

        }
        catch (e) {
            console.log(e)
        }
        fs.writeFile('corpus.dlg', content, (error, success) => {
            if (error) {
                console.log(error)
            }
    
            if (success) {
                content=''
                console.log(success)
            }
        })
    }
}

function createScriptFile(trainingData) {
    //const responseVariables= trainingData.hasOwnProperty('responseVariables') && trainingData.trainingData
    var scriptData=trainingData.scripts
    scriptData.forEach((scriptdata) => {
        scriptFileContent += '\n\ndialog ' + scriptdata.scriptName + '\n'

        if (scriptdata.hasOwnProperty('scriptFlow') && scriptdata.scriptFlow.length != 0) {
            scriptdata.scriptFlow.forEach((step) => {
                switch (step.stepTypeIndex) {
                    //'say' response
                    case 0:
                        scriptFileContent += ' say ' + step.botResponse + '\n'
                        break;
                    // create action and 'call'
                    case 1:
                        //createAction(step.actionName, step.actionCode)
                        scriptFileContent += ' call ' + step.actionName + '\n'
                        break;

                    //'ask'
                    case 2:
                        scriptFileContent += ' ask ' + step.name + '\n'
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
                                condition +='\"'+rule.value+'\"'
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
                                    condition +='\"'+rule.value+'\"'
                                    condition += logicalOperator
                                })
                                condition += ']'
                            }


                            //processing step to run next
                            const stepToRunIfTrue=step.stepToRunIfTrue
                            switch (stepToRunIfTrue.stepTypeIndex) {
                                //bot response
                                case 0:
                                    nextStepToRun = ' say ' + stepToRunIfTrue.botResponse + '\n'
                                    break;
                                // create action and call action
                                case 1:
                                    //createAction(stepToRunIfTrue.actionName, stepToRunIfTrue.actionCode)
                                    nextStepToRun = ' call ' + stepToRunIfTrue.actionName + '\n'
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

                            scriptFileContent += condition + nextStepToRun

                        }

                        break;

                    //'run'
                    case 4:
                        scriptFileContent += ' run ' + step.linkedScript + '\n'
                        break;
                    // 'nlp intent name
                    case 5:
                        scriptFileContent += ' nlp ' + step.intentToTrigger + '\n'
                        break;
                    default:
                        break;
                }

            })
        }
    })

    fs.writeFile('script.dlg', scriptFileContent, (error,success) => {
        if (error) {
            console.log(error)
        }

        if (success) {
            console.log(success)
//variabl with predefined header like content for 'script.dlg' file
scriptFileContent=`# Script for a simple turn conversation

import corpus.dlg

dialog main
  nlp

`
        }
    })

}

function readEntitiesFromFile(filename) {
    try {
        const data = fs.readFileSync(filename, 'utf8');

        return data.split('\n')
    }
    catch (error) {
        console.log(error)
    }

}

module.exports = { createCorpusFile, createActions, readEntitiesFromFile, createScriptFile }
=======
=======
>>>>>>> 1c9fe975d7e9bb11bf4b8811799f5261789540f1

function registerDialogForAction(actionName) {
    scriptFileContent += '\n\ndialog ' + actionName + '\n' + ' call ' + actionName + '\n\n'
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
    

}

<<<<<<< HEAD
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
=======
function createCorpusFile(trainingData) {
    var content = ''
    if (trainingData && Object.keys(trainingData).length != 0) {
        try {
            content = 'language ' + trainingData.locale + '\n\n'
            trainingData.qanda.forEach(qandadata => {
                content += 'intent ' + qandadata.intent + '\n'
                content += ' utterances\n'

                qandadata.utterances.forEach((utterance) => {
                    content += ' - ' + utterance + '\n'
                })

                content += ' answers\n'

                if (qandadata.hasOwnProperty('actionCode')) {
                    content += ' - /' + qandadata.answers[0]
                    createAction(qandadata.answers[0], qandadata.actionCode)
                    registerDialogForAction(qandadata.answers[0])
                }
                else {
                    qandadata.answers.forEach((answer) => {
                        content += ' - ' + answer + '\n'
                    })
                }
                content += '\n'

            })
            content += '\n'

            //now processing intent with linked script data 
            content += '\n'
            if (trainingData.hasOwnProperty('intents')) {

                trainingData.intents.forEach((intentdata) => {

                    if (intentdata.hasOwnProperty('linkedScript')) {
                        content += 'intent ' + intentdata.intent + '\n'
                        content += ' utterances\n'

                        intentdata.utterances.forEach((utterance) => {
                            content += ' - ' + utterance + '\n'
                        })
                        content += ' answers\n'
                        content += ' - /' + intentdata.linkedScript + '\n'
                    }
                })
            }

            content += '\n\n'

            //now processing entities data
            if (trainingData.hasOwnProperty('entities')) {

                trainingData.entities.forEach((entity) => {
                    content += 'entity ' + entity.entity + '\n'

                    if (entity.type == 'regex') {
                        content += ' regex ' + entity.value.regex + '\n\n'
                    }
                    else if (entity.type == 'synonym') {
                        entity.value.forEach(({ synonym, values }) => {
                            content += ' - ' + synonym + ': ' + values + '\n'
                        })
                    }
                    content += '\n\n'
                })
            }

        }
        catch (e) {
            console.log(e)
        }
    }
    console.log(content)
    fs.writeFile('corpus.dlg', content, (error, success) => {
        if (error) {
            console.log(error)
        }

        if (success) {
            console.log(success)
        }
    })
}

function createScriptFile(trainingData) {

    var scriptData=trainingData.scripts
    scriptData.forEach((scriptdata) => {
        scriptFileContent += 'dialog ' + scriptdata.scriptName + '\n'

        if (scriptdata.hasOwnProperty('scriptFlow') && scriptdata.scriptFlow.length != 0) {
            scriptdata.scriptFlow.forEach((step) => {
                switch (step.stepTypeIndex) {
                    //'say' response
                    case 0:
                        scriptFileContent += ' say ' + step.botResponse + '\n'
                        break;
                    // create action and 'call'
                    case 1:
                        createAction(step.actionName, step.actionCode)
                        scriptFileContent += ' call ' + step.actionName + '\n'
                        break;

                    //'ask'
                    case 2:
                        scriptFileContent += ' ask ' + step.name + '\n'
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
                                condition +='\"'+rule.value+'\"'
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
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
                                    condition += rule.field.trim()
                                    if (rule.operator.trim() == "=") {
                                        condition += "=="
                                    } else {
                                        condition += rule.operator
                                    }
<<<<<<< HEAD
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



module.exports = { copyBotTemplateFiles, updateBotConfigurationOnFile, prepareTrainingData }
=======
                                    condition +='\"'+rule.value+'\"'
                                    condition += logicalOperator
                                })
                                condition += ']'
                            }


                            //processing step to run next
                            const stepToRunIfTrue=step.stepToRunIfTrue
                            switch (stepToRunIfTrue.stepTypeIndex) {
                                //bot response
                                case 0:
                                    nextStepToRun = ' say ' + stepToRunIfTrue.botResponse + '\n'
                                    break;
                                // create action and call action
                                case 1:
                                    createAction(stepToRunIfTrue.actionName, stepToRunIfTrue.actionCode)
                                    nextStepToRun = ' call ' + stepToRunIfTrue.actionName + '\n'
                                    break;
                                //'run' script name
                                case 4:
                                    nextStepToRun = ' run ' + stepToRunIfTrue.linkedScript + '\n'
                                    break;
                                //'call' action name
                                case 5:
                                    nextStepToRun = ' call ' + stepToRunIfTrue.linkedActionName + '\n'
                                    break;
                                default:
                                    break;
                            }

                            scriptFileContent += condition + nextStepToRun

                        }

                        break;

                    //'run'
                    case 4:
                        scriptFileContent += ' run ' + step.linkedScript + '\n'
                        break;
                    // 'call'
                    case 5:
                        scriptFileContent += ' call ' + step.linkedActionName + '\n'
                        break;
                    default:
                        break;
                }

            })
        }
    })

    fs.writeFile('script.dlg', scriptFileContent, (error) => {
        if (error) {
            console.log(error)
        }
    })

}

function readEntitiesFromFile(filename) {
    try {
        const data = fs.readFileSync(filename, 'utf8');

        return data.split('\n')
    }
    catch (error) {
        console.log(error)
    }

}

<<<<<<< HEAD
module.exports = { createCorpusFile, createAction, readEntitiesFromFile, createScriptFile }
>>>>>>> 1c9fe975d7e9bb11bf4b8811799f5261789540f1
=======
module.exports = { createCorpusFile, createAction, readEntitiesFromFile, createScriptFile }
>>>>>>> 1c9fe975d7e9bb11bf4b8811799f5261789540f1
>>>>>>> b60442086acbd022b27141726f7da23642ec8ec4
