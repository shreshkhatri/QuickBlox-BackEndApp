const { dockStart } = require('@nlpjs/basic');
const { listFilesAbsolute } = require('@nlpjs/core-loader');

(async () => {
  const dock = await dockStart();
  const nlp = dock.get('nlp');
  const bot = dock.get('bot');
  nlp.addNerRegexRule('en', 'email', '/\\b(\\w[-._\\w]*\\w@\\w[-._\\w]*\\w\\.\\w{2,3})\\b/gi');
  const files = listFilesAbsolute('./actions');
  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    if (file.endsWith('.js')) {
      const loaded = require(file);
      
        const keys = Object.keys(loaded);
        for (let i = 0; i < keys.length; i += 1) {
          bot.registerAction(keys[i], loaded[keys[i]]);
        }

    }
  }
})();