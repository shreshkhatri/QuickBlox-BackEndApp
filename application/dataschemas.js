const schema_project_data = {
  "title": "Project Data ",
  "description": "JSON structure for incoming project data",
  "type": "object",
  "properties": {
    "projectName": {
      "description": "string representation for the project",
      "type": "string",
      "minLength": 5
    },
    "settings": {
      "description": "settings for the API server and the chatbot itself",
      "type": "object",
      "properties": {
        "nlu": {
          "description": "Object holding NLU setting information",
          "type": "object",
          "properties": {
            "threshold": {
              "type": "number",
              "description": "float number representing the threshold classification value",
            }
          },
          "required": ["threshold"]
        },
        "botName": {
          "description": "The Bot name that will be displayed as title for the widget",
          "type": "string",
          "minLength": 5
        },
        "botServerPort": {
          "description": "the port using which the user can talk to the chatbot",
          "type": "integer",
          "minimum":3000,
          "maximum":5000
        },
        "required": ["nlu", "botName", "botServerPort"]
      },

    },
    "required": ["projectName", "settings"]
  }
}


const schema_qanda_data = {
  "title": "QandA data",
  "description": "JSON structure for incoming qanda data consisting of questions and static answers only ",
  "type": "object",
  "properties": {
    "email": {
      "description": "a part of primary key for identifying the project in MongoDB",
      "type": "string",
      "pattern": "^\\b(\\w[-._\\w]*\\w@\\w[-._\\w]*\\w\\.\\w{2,3})\\b$" //this is to ensure that the action name always starts with '/'
    },
    "projectName": {
      "description": "jstring representation for the project",
      "type": "string",
      "minLength": 5
    },
    "locale": {
      "description": "international code for identifying languages",
      "type": "string",
      "pattern": "^[a-zA-Z]{1,2}$" //regex for handlnig locale code
    },
    "payload": {
      "description": "this payload will be added to the database as a qnada data",
      "type": "object",
      "properties": {
        "intent": {
          "description": "Name of the intent",
          "type": "string",
          "minLength": 5
        },
        "description": {
          "description": "The description about the intnet ",
          "type": "string",
          "minLength": 5
        },
        "utterances": {
          "description": "list of the utterances",
          "type": "array",
          "items": {
            "type": "string"
          },
          "minItems": 1,
        },
        "answers": {
          "description": "list of the bot answers",
          "type": "array",
          "items": {
            "type": "string"
          },
          "minItems": 1,
        }

      },
      "required": ["intent", "utterances", "answers", "description"]
    },
    "required": ["email", "projectName", "locale", "payload"]
  }
}

const schema_qanda_data_with_action = {
  "title": "QandA data",
  "description": "JSON structure for incoming qanda data consisting of questions and and action code",
  "type": "object",
  "properties": {
    "email": {
      "description": "a part of primary key for identifying the project in MongoDB",
      "type": "string",
      "pattern": "^\\b(\\w[-._\\w]*\\w@\\w[-._\\w]*\\w\\.\\w{2,3})\\b$" //this is to ensure that the email is in correct format '/'
    },
    "projectName": {
      "description": "jstring representation for the project",
      "type": "string",
      "minLength": 5
    },
    "locale": {
      "description": "international code for identifying languages",
      "type": "string",
      "pattern": "^[a-zA-Z]{1,2}$" //regex for handlnig locale code
    },
    "payload": {
      "description": "this payload will be added to the database as a qnada data",
      "type": "object",
      "properties": {
        "intent": {
          "description": "Name of the intent",
          "type": "string",
          "minLength": 5
        },
        "description": {
          "description": "The description about the intnet ",
          "type": "string",
          "minLength": 5
        },
        "utterances": {
          "description": "list of the utterances",
          "type": "array",
          "items": {
            "type": "string"
          },
          "minItems": 1,
        },
        "actionName": {
          "description": "just the name for the action starting with '/' i.e. forward slash",
          "type": "string",
          "minLength": 5,
          "pattern": "^[a-zA-Z0-9_]+$" //this is to ensure that the action name always starts with '/'
        },
        "actionCode": {
          "description": "action code that will be converted to code and run when chatbot is run",
          "type": "string",
          "minLength": 15,
        }

      },
      "required": ["intent", "utterances", "actionName", "description", "actionCode"]
    },
    "required": ["email", "projectName", "locale", "payload"]
  }
}

const schema_qanda_entity_synonym = {
  "title": "Entity Data synonym",
  "description": "JSON structure for incoming entity data information containing synonym definition ",
  "type": "object",
  "properties": {
    "email": {
      "description": "a part of primary key for identifying the project in MongoDB",
      "type": "string",
      "pattern": "^\\b(\\w[-._\\w]*\\w@\\w[-._\\w]*\\w\\.\\w{2,3})\\b$" //this is to ensure that the action name always starts with '/'
    },
    "projectName": {
      "description": "jstring representation for the project",
      "type": "string",
      "minLength": 5
    },
    "locale": {
      "description": "international code for identifying languages",
      "type": "string",
      "pattern": "^[a-zA-Z]{1,2}$" //regex for handlnig locale code
    },
    "payload": {
      "description": "this payload will be added to the database as an entity data",
      "type": "object",
      "properties": {
        "entity": {
          "description": "Name of the entity",
          "type": "string",
          "minLength": 5
        },
        "description": {
          "description": "The description about the entity ",
          "type": "string",
        },
        "type": {
          "type": "string",
          "minLength": 5
        },
        "value": {
          "description": "an arry of synonym term and its definition",
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "synonym": {
                "description": " a synonym term for the entity defined",
                "type": "string",
                "minLength": 2
              },
              "values": {
                "description": "comma seperated values for the synonym term defined",
                "type": "string",
                "minLength": 2
              }
            },
            "required": ["synonym", "values"],
            "minItems": 1,
          }

        },

      },
      "required": ["entity", "type", "value", "description"]
    }
  },
  "required": ["email", "projectName", "locale", "payload"]
}

const schema_qanda_entity_regex = {
  "title": "Entity Data synonym",
  "description": "JSON structure for incoming entity data containing regex definition",
  "type": "object",
  "properties": {
    "email": {
      "description": "a part of primary key for identifying the project in MongoDB",
      "type": "string",
      "pattern": "^\\b(\\w[-._\\w]*\\w@\\w[-._\\w]*\\w\\.\\w{2,3})\\b$" //this is to ensure that the action name always starts with '/'
    },
    "projectName": {
      "description": "jstring representation for the project",
      "type": "string",
      "minLength": 5
    },
    "locale": {
      "description": "international code for identifying languages",
      "type": "string",
      "pattern": "^[a-zA-Z]{1,2}$" //regex for handlnig locale code
    },
    "payload": {
      "description": "this payload will be added to the database as an entity data",
      "type": "object",
      "properties": {
        "entity": {
          "description": "Name of the entity",
          "type": "string",
          "minLength": 5
        },
        "description": {
          "description": "The description about the entity ",
          "type": "string",
        },
        "type": {
          "type": "string",
          "minLength": 5
        },
        "value": {
          "description": "an arry of synonym term and its definition",
          "type": "object",
          "properties": {
            "regex": {
              "description": " a regex definition for the entity defined",
              "type": "string",
              "minLength": 2
            }
          },
          "required": ["regex"],
          "minItems": 1,
        }

      },
      "required": ["entity", "type", "value", "description"]
    }
  },
  "required": ["email", "projectName", "locale", "payload"]
}


const schema_intent_data = {
  "title": "Intent data",
  "description": "JSON structure for incoming Intent data consisting of questions only ",
  "type": "object",
  "properties": {
    "projectName": {
      "description": "jstring representation for the project",
      "type": "string",
      "minLength": 5
    },
    "locale": {
      "description": "international code for identifying languages",
      "type": "string",
      "pattern": "^[a-zA-Z]{1,2}$" //regex for handlnig locale code
    },
    "payload": {
      "description": "this payload will be added to the database as an intent data",
      "type": "object",
      "properties": {
        "intent": {
          "description": "Name of the intent",
          "type": "string",
          "minLength": 5
        },
        "description": {
          "description": "The description about the intnet ",
          "type": "string",
          "minLength": 5
        },
        "utterances": {
          "description": "list of the utterances",
          "type": "array",
          "items": {
            "type": "string"
          },
          "minItems": 1,
        }

      },
      "required": ["intent", "utterances", "description"]
    },
  },
  "required": ["projectName", "locale", "payload"]
}




const schema_script_data = {
  "title": "Script Data",
  "description": "JSON structure for incoming script data ",
  "type": "object",
  "properties": {
    "email": {
      "description": "a part of primary key for identifying the project in MongoDB",
      "type": "string",
      "pattern": "^\\b(\\w[-._\\w]*\\w@\\w[-._\\w]*\\w\\.\\w{2,3})\\b$" //this is to ensure that the action name always starts with '/'
    },
    "projectName": {
      "description": "jstring representation for the project",
      "type": "string",
      "minLength": 5
    },
    "locale": {
      "description": "international code for identifying languages",
      "type": "string",
      "pattern": "^[a-zA-Z]{1,2}$" //regex for handlnig locale code
    },
    "payload": {
      "description": "this payload will be added to the database as a script data",
      "type": "object",
      "properties": {
        "scriptName": {
          "description": "Name of the script",
          "type": "string",
          "minLength": 5
        },
        "scriptDescription": {
          "description": "The description about the script ",
          "type": "string",
          "minLength": 5
        },
        "triggeringIntent": {
          "description": "the triggering intent for the script",
          "type": "string"
        },
        "scriptFlow": {
          "description": "list of steps for the script",
          "type": "array",
          "items": {
            "type": "object"
          },
          "minItems": 1,
        }
      },
      "required": ["scriptName", "scriptDescription", "scriptFlow"]
    },
    "required": ["email", "projectName", "locale", "payload"]
  }
}


module.exports = {
  schema_qanda_data,
  schema_qanda_data_with_action,
  schema_qanda_entity_regex,
  schema_qanda_entity_synonym,
  schema_intent_data,
  schema_script_data,
  schema_project_data
}
