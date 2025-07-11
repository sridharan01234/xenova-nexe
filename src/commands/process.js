const fs = require('fs-extra');
const path = require('path');
const { EmbeddingProcessor } = require('../core/embedding-processor');
const { WorkspaceScanner } = require('../core/workspace-scanner');

async function processWorkspace(options) {
  try {
    console.log('🔄 Processing workspace...');
    
    const workspacePath = options.workspace || process.cwd();
    const configPath = path.join(workspacePath, '.context-provider.json');
    
    // Load configuration if exists
    let config = {};
    if (await fs.pathExists(configPath)) {
      config = await fs.readJson(configPath);
      console.log('📋 Using workspace configuration');
    } else {
      console.log('⚠️ No workspace configuration found, using defaults');
      console.log('💡 Run "context-provider init -w ." to create configuration');
    }
    
    const outputPath = options.output || './embeddings';
    const model = options.model || config.model || 'Xenova/all-MiniLM-L6-v2';
    
    // Validate workspace path
    if (!await fs.pathExists(workspacePath)) {
      throw new Error(`Workspace path does not exist: ${workspacePath}`);
    }
    
    // Create output directory
    await fs.ensureDir(outputPath);
    
    console.log(`📁 Workspace: ${workspacePath}`);
    console.log(`📂 Output: ${outputPath}`);
    console.log(`🤖 Model: ${model}`);
    
    // Initialize embedding processor
    const processor = new EmbeddingProcessor({
      model,
      maxTokens: parseInt(options.maxTokens) || config.settings?.maxTokens || 512,
      overlap: parseInt(options.overlap) || config.settings?.overlap || 50
    });
    
    // Initialize workspace scanner
    const scanner = new WorkspaceScanner(workspacePath, config.settings);
    
    // Scan workspace
    console.log('🔍 Scanning workspace...');
    const files = await scanner.scanFiles();
    console.log(`📄 Found ${files.length} files`);
    
    // Process files and generate embeddings
    console.log('🔄 Processing files and generating embeddings...');
    const results = await processor.processFiles(files);
    
    // Save results with metadata
    const outputFile = path.join(outputPath, 'embeddings.json');
    const metadataFile = path.join(outputPath, 'metadata.json');
    
    await fs.writeJson(outputFile, results, { spaces: 2 });
    await fs.writeJson(metadataFile, {
      workspace: workspacePath,
      model,
      processedAt: new Date().toISOString(),
      totalFiles: files.length,
      totalChunks: results.length,
      maxTokens: parseInt(options.maxTokens) || config.settings?.maxTokens || 512,
      overlap: parseInt(options.overlap) || config.settings?.overlap || 50,
      modelCache: config.modelCache || path.join(require('os').homedir(), '.context-provider', 'models')
    }, { spaces: 2 });
    
    console.log('✅ Workspace processing complete!');
    console.log(`📊 Generated embeddings for ${results.length} chunks`);
    console.log(`💾 Embeddings saved to: ${outputFile}`);
    console.log(`📋 Metadata saved to: ${metadataFile}`);
    
  } catch (error) {
    console.error('❌ Error processing workspace:', error.message);
    process.exit(1);
  }
}

module.exports = { processWorkspace };
