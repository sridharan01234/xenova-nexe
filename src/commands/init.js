const fs = require('fs-extra');
const path = require('path');

async function initWorkspace(options) {
  try {
    console.log('🚀 Initializing context-provider workspace...');
    
    const workspacePath = options.workspace || process.cwd();
    const configPath = path.join(workspacePath, '.context-provider.json');
    
    // Validate workspace path
    if (!await fs.pathExists(workspacePath)) {
      throw new Error(`Workspace path does not exist: ${workspacePath}`);
    }
    
    console.log(`📁 Workspace: ${workspacePath}`);
    
    // Check if already initialized
    if (await fs.pathExists(configPath)) {
      console.log('⚠️ Workspace already initialized');
      
      if (!options.force) {
        console.log('Use --force to reinitialize');
        return;
      }
      
      console.log('🔄 Reinitializing workspace...');
    }
    
    // Create configuration
    const config = {
      version: '1.0.0',
      model: 'Xenova/all-MiniLM-L6-v2',
      modelCache: path.join(require('os').homedir(), '.context-provider', 'models'),
      settings: {
        maxTokens: 512,
        overlap: 50,
        excludePatterns: [
          'node_modules/**',
          '.git/**',
          'dist/**',
          'build/**',
          '*.log',
          '.DS_Store',
          'Thumbs.db'
        ],
        includeExtensions: [
          '.js', '.ts', '.jsx', '.tsx',
          '.py', '.java', '.c', '.cpp', '.h',
          '.md', '.txt', '.json', '.yaml', '.yml',
          '.html', '.css', '.scss', '.sass',
          '.go', '.rs', '.php', '.rb', '.swift'
        ]
      }
    };
    
    // Write configuration
    await fs.writeJson(configPath, config, { spaces: 2 });
    
    // Create model cache directory
    await fs.ensureDir(config.modelCache);
    
    console.log('✅ Workspace initialized successfully!');
    console.log(`� Configuration saved to: ${configPath}`);
    console.log('');
    console.log('🤖 Model Configuration:');
    console.log(`   Model: ${config.model}`);
    console.log(`   Cache: ${config.modelCache}`);
    console.log('   Note: Model will be downloaded automatically on first use');
    console.log('');
    console.log('🔧 Settings:');
    console.log(`   Max tokens per chunk: ${config.settings.maxTokens}`);
    console.log(`   Overlap tokens: ${config.settings.overlap}`);
    console.log(`   Supported extensions: ${config.settings.includeExtensions.join(', ')}`);
    console.log('');
    console.log('� Next steps:');
    console.log('   Run: context-provider process -w . -o ./embeddings');
    
  } catch (error) {
    console.error('❌ Error initializing workspace:', error.message);
    process.exit(1);
  }
}

module.exports = { initWorkspace };
