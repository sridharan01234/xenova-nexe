const { compile } = require('nexe');
const fs = require('fs-extra');
const path = require('path');

async function buildExecutable() {
  try {
    // Check if we're in GitHub Actions
    const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
    const forceBuild = process.env.NEXE_BUILD === 'true';
    
    if (!isGitHubActions && !forceBuild) {
      console.log('🚫 Nexe build skipped (use GitHub Actions for building)');
      console.log('💡 For local development, use: npm start');
      console.log('� To force build locally: NEXE_BUILD=true npm run build');
      return;
    }
    
    console.log('�🔧 Building context-provider executable...');
    console.log(`   Environment: ${isGitHubActions ? 'GitHub Actions' : 'Local (forced)'}`);
    
    // Ensure dist directory exists
    await fs.ensureDir('dist');
    
    // Nexe configuration for external model handling
    const nexeConfig = {
      input: 'src/index.js',
      output: 'dist/context-provider',
      target: 'linux-x64-18.17.0',
      build: true, // Always build in CI/CD
      
      // Resources to include (exclude model files)
      resources: [
        'package.json'
      ],
      
      // Patches to handle external model loading
      patches: [
        async (compiler, next) => {
          // Patch to ensure external model cache directory works
          await compiler.setFileContentsAsync(
            'lib/xenova-patch.js',
            `
            const path = require('path');
            const os = require('os');
            
            // Ensure model cache directory is properly set
            const originalEnv = process.env.TRANSFORMERS_CACHE;
            if (!originalEnv) {
              process.env.TRANSFORMERS_CACHE = path.join(os.homedir(), '.context-provider', 'models');
            }
            
            module.exports = {};
            `
          );
          
          return next();
        }
      ],
      
      // Exclude model files from bundle
      excludes: [
        'node_modules/@xenova/transformers/dist/models/**/*',
        'node_modules/@xenova/transformers/models/**/*'
      ]
    };
    
    console.log('⚙️ Nexe configuration:');
    console.log(`   Target: ${nexeConfig.target}`);
    console.log(`   Input: ${nexeConfig.input}`);
    console.log(`   Output: ${nexeConfig.output}`);
    console.log('   Build: Trying prebuilt first, will build from source if needed');
    console.log('   External models: Models will be downloaded to ~/.context-provider/models');
    
    // Try to compile with prebuilt binary first
    try {
      console.log('🔄 Attempting to use prebuilt Node.js binary...');
      await compile(nexeConfig);
      console.log('✅ Successfully used prebuilt binary!');
    } catch (error) {
      console.log('⚠️ Prebuilt binary not available, building from source...');
      console.log('   This will take 10-20 minutes...');
      
      // Fallback to building from source
      nexeConfig.build = true;
      await compile(nexeConfig);
      console.log('✅ Successfully built from source!');
    }
    
    console.log('✅ Build completed successfully!');
    console.log(`📦 Executable created: ${nexeConfig.output}`);
    console.log('');
    console.log('📋 Usage:');
    console.log('  ./dist/context-provider init -w /path/to/workspace');
    console.log('  ./dist/context-provider process -w /path/to/workspace -o ./embeddings');
    console.log('');
    console.log('📁 Models will be automatically downloaded to:');
    console.log('  ~/.context-provider/models/');
    console.log('');
    console.log('🚀 The executable is now ready for deployment!');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  buildExecutable();
}

module.exports = { buildExecutable };
