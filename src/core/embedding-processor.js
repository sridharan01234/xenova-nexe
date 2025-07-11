const fs = require('fs-extra');
const os = require('os');
const path = require('path');

class EmbeddingProcessor {
  constructor(options = {}) {
    this.model = options.model || 'Xenova/all-MiniLM-L6-v2';
    this.maxTokens = options.maxTokens || 512;
    this.overlap = options.overlap || 50;
    this.pipeline = null;
    this.transformers = null;
    
    // Configure Xenova to use external model directory
    this.setupModelCache();
  }

  async loadTransformers() {
    if (!this.transformers) {
      // Dynamic import for ES module
      this.transformers = await import('@xenova/transformers');
    }
    return this.transformers;
  }

  setupModelCache() {
    // Set up external model cache directory
    const modelCacheDir = path.join(os.homedir(), '.context-provider', 'models');
    
    // Ensure the cache directory exists
    fs.ensureDirSync(modelCacheDir);
    
    console.log(`📁 Model cache directory: ${modelCacheDir}`);
  }

  async initializePipeline() {
    if (this.pipeline) {
      return this.pipeline;
    }

    try {
      console.log(`🔄 Loading embedding model: ${this.model}`);
      console.log('📦 Model will be downloaded to external cache on first use');
      
      // Load transformers dynamically
      const { pipeline, env } = await this.loadTransformers();
      
      // Configure Xenova to use external cache
      const modelCacheDir = path.join(os.homedir(), '.context-provider', 'models');
      env.cacheDir = modelCacheDir;
      env.allowLocalModels = true;
      env.allowRemoteModels = true;
      
      // Create feature extraction pipeline
      this.pipeline = await pipeline('feature-extraction', this.model, {
        quantized: true, // Use quantized model for better performance
        progress_callback: (progress) => {
          if (progress.status === 'downloading') {
            console.log(`📥 Downloading model: ${Math.round(progress.loaded / progress.total * 100)}%`);
          }
        }
      });
      
      console.log('✅ Model loaded successfully');
      return this.pipeline;
      
    } catch (error) {
      console.error('❌ Error loading model:', error.message);
      throw new Error(`Failed to load embedding model: ${error.message}`);
    }
  }

  async processFiles(files) {
    const pipeline = await this.initializePipeline();
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`🔄 Processing file ${i + 1}/${files.length}: ${file.relativePath}`);
      
      try {
        const chunks = this.chunkText(file.content, this.maxTokens, this.overlap);
        
        for (let j = 0; j < chunks.length; j++) {
          const chunk = chunks[j];
          
          // Generate embedding for chunk
          const embedding = await this.generateEmbedding(pipeline, chunk);
          
          results.push({
            file: file.relativePath,
            chunk: j,
            totalChunks: chunks.length,
            text: chunk,
            embedding: Array.from(embedding.data),
            metadata: {
              size: file.size,
              extension: file.extension,
              lastModified: file.lastModified,
              chunkIndex: j,
              chunkSize: chunk.length
            }
          });
        }
        
      } catch (error) {
        console.warn(`⚠️ Error processing file ${file.relativePath}:`, error.message);
      }
    }

    return results;
  }

  async generateEmbedding(pipeline, text) {
    try {
      // Generate embedding using the pipeline
      const embedding = await pipeline(text, {
        pooling: 'mean',
        normalize: true
      });
      
      return embedding;
      
    } catch (error) {
      console.error('❌ Error generating embedding:', error.message);
      throw error;
    }
  }

  chunkText(text, maxTokens, overlap) {
    // Simple chunking strategy - split by sentences/paragraphs
    const chunks = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    let currentTokens = 0;
    
    for (const sentence of sentences) {
      const sentenceTokens = this.estimateTokens(sentence);
      
      if (currentTokens + sentenceTokens > maxTokens && currentChunk.length > 0) {
        // Add current chunk
        chunks.push(currentChunk.trim());
        
        // Start new chunk with overlap
        const overlapText = this.getOverlapText(currentChunk, overlap);
        currentChunk = overlapText + sentence;
        currentTokens = this.estimateTokens(currentChunk);
      } else {
        currentChunk += sentence + '. ';
        currentTokens += sentenceTokens;
      }
    }
    
    // Add final chunk
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.length > 0 ? chunks : [text];
  }

  estimateTokens(text) {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  getOverlapText(text, overlapTokens) {
    const words = text.trim().split(/\s+/);
    const overlapWords = Math.min(overlapTokens, words.length);
    return words.slice(-overlapWords).join(' ') + ' ';
  }

  async cleanup() {
    if (this.pipeline) {
      // Clean up pipeline resources
      this.pipeline = null;
    }
  }
}

module.exports = { EmbeddingProcessor };
