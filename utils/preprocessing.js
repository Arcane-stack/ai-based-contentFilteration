// utils/preprocessing.js

/**
 * Loads text data from a CSV file.
 * @param {string} filePath - Path to the CSV file.
 * @param {number} textColumn - Index of the column containing text data.
 * @returns {Promise<string[]>} - An array of text strings.
 */
async function loadDataset(filePath, textColumn) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${filePath}: ${response.status}`);
      }
      const text = await response.text();
      const lines = text.split('\n').slice(1); // Skip header row
      return lines.map(line => {
        const values = line.split(',');
        return values[textColumn];
      }).filter(text => text); // Remove empty values
    } catch (error) {
      console.error(`Error loading dataset from ${filePath}:`, error);
      return []; // Return empty array on error
    }
  }
  
  /**
   * Creates a vocabulary from the provided datasets.
   * @param {string[]} datasetPaths - Array of paths to the CSV files.
   * @param {number[]} textColumns - Array of column indices for text data in each file.
   * @returns {Promise<object>} - A vocabulary object (word: index).
   */
  async function createVocabulary(datasetPaths, textColumns) {
    const vocabulary = {};
    let wordIndex = 1;
  
    try {
      for (let i = 0; i < datasetPaths.length; i++) {
        const texts = await loadDataset(datasetPaths[i], textColumns[i]);
  
        texts.forEach(text => {
          const cleanedText = cleanText(text);
          const tokens = tokenize(cleanedText);
  
          tokens.forEach(token => {
            if (token && !vocabulary[token]) {
              vocabulary[token] = wordIndex++;
            }
          });
        });
      }
    } catch (error) {
      console.error("Error creating vocabulary:", error);
    }
  
    return vocabulary;
  }
  
  /**
   * Cleans the input text by removing HTML tags, special characters, and normalizing case.
   * @param {string} text - The input text.
   * @returns {string} - The cleaned text.
   */
  function cleanText(text) {
    return text.replace(/<[^>]*>/g, "")
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .toLowerCase()
      .trim();
  }
  
  /**
   * Tokenizes the input text into an array of words.
   * @param {string} text - The input text.
   * @returns {string[]} - An array of tokens.
   */
  function tokenize(text) {
    return text.split(/\s+/);
  }
  
  /**
   * Preprocesses the input text using the generated vocabulary.
   * @param {string} text - The input text.
   * @param {object} vocabulary - The vocabulary object.
   * @returns {Promise<number[]>} - A promise that resolves to a padded sequence of encoded tokens.
   */
  async function preprocess(text, vocabulary) {
    const cleanedText = cleanText(text);
    const tokens = tokenize(cleanedText);
    const encoded = tokens.map(token => vocabulary[token] || 0); // 0 for unknown tokens
    const MAX_SEQUENCE_LENGTH = 50; // Adjust as needed
    const padding = Array(MAX_SEQUENCE_LENGTH - encoded.length).fill(0);
    return encoded.slice(0, MAX_SEQUENCE_LENGTH).concat(padding);
  }
  
  // Example Usage (in content.js or background.js):
  /**
   * Analyzes text using the preprocessed data and a TensorFlow.js model.
   * @param {string} text - The text to analyze.
   * @returns {Promise<number>} - A promise that resolves to the model's prediction.
   */
  async function analyzeText(text) {
    // Updated file paths based on your folder structure
    const datasetPaths = [
      './data/archive/train.csv',
      './data/archive2/cyberbullying_tweets.csv',
      './data/archive3/Liar_Dataset.csv'
    ];
    // Assuming the text data is in the first column (index 0) of each CSV file
    const textColumns = [0, 0, 0]; 
  
    try {
      const vocabulary = await createVocabulary(datasetPaths, textColumns);
      const padded = await preprocess(text, vocabulary);
      const tensor = tf.tensor2d([padded]);
      const model = await tf.loadLayersModel(chrome.runtime.getURL('model/model.json'));
      const prediction = await model.predict(tensor).data();
      return prediction[0];
    } catch (error) {
      console.error("Error during text analysis:", error);
      return 0.5; // Default neutral prediction in case of error
    }
  }
