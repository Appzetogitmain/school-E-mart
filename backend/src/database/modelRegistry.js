const fs = require('fs');
const path = require('path');

const models = {};
const modelsPath = path.join(__dirname, 'models');

/**
 * Central Model Registry
 * Dynamically loads and registers all Mongoose models in the models directory.
 * This guarantees that all schemas compile properly and plugins are attached.
 */
fs.readdirSync(modelsPath).forEach(file => {
  if (file.endsWith('.js')) {
    const model = require(path.join(modelsPath, file));
    // model.modelName contains the Mongoose model name (e.g., 'User')
    models[model.modelName] = model;
  }
});

module.exports = models;
