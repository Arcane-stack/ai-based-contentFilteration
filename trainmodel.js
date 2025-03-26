// train_model.js

const tf = require('@tensorflow/tfjs-node');
const csv = require('csv-parser');
const fs = require('fs');
const preprocessing = require('./utils/preprocessing');

async function loadDataset(filePath, textColumn, labelColumn) {
  return new Promise((resolve, reject) => {
    const data = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', async (row) => {
        const text = await preprocessing.preprocess(row[textColumn]);
        const label = parseInt(row[labelColumn]);
        data.push({ text, label });
      })
      .on('end', () => resolve(data))
      .on('error', reject);
  });
}

async function createModel() {
  const model = tf.sequential();
  model.add(tf.layers.embedding({ inputDim: 10000, outputDim: 16, inputLength: 50 })); // Adjust inputDim
  model.add(tf.layers.globalAveragePooling1d());
  model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

  model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });
  return model;
}

async function train() {
  const hateSpeechData = await loadDataset('./data/archive/train.csv', 'tweet', 'class');
  const liarData = await loadDataset('./data/archive 3/Liar_Dataset.csv', 'statement', 'label');
  const cyberbullyingData = await loadDataset('./data/archive 2/cyberbullying.csv', 'tweet', 'label');

  const combinedData = [...hateSpeechData, ...liarData, ...cyberbullyingData];

  const xs = tf.tensor2d(combinedData.map(item => item.text));
  const ys = tf.tensor1d(combinedData.map(item => item.label));

  const model = await createModel();
  await model.fit(xs, ys, { epochs: 10, validationSplit: 0.2 });

  await model.save('file://./model');
  console.log('Model trained and saved.');
}

train();