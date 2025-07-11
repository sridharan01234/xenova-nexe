const { compile } = require('nexe');
const fs = require('fs-extra');
const path = require('path');

async function buildExecutable() {
  try {
    console.log('🚀 Simple Nexe build starting...');
    
    // Ensure dist directory exists
    await fs.ensureDir('dist');
    
    // Environment detection
    const isCI = process.env.CI === 'true';
    const forceBuild = process.env.NEXE_FORCE_BUILD === 'true';
    
    console.log(`🔧 Environment: ${isCI ? 'CI' : 'Local'}`);
    console.log(`🔧 Force build: ${forceBuild}`);
    
    // Simple, reliable configuration
    const nexeConfig = {
      input: 'src/index.js',
      output: 'dist/context-provider',
      target: process.env.NEXE_TARGET || 'linux-x64-18.0.0',
      build: forceBuild,
      verbose: isCI,
      temp: './.nexe-temp',
      
      // Minimal resources
      resources: [
        'package.json'
      ],
      
      // Essential exclusions to reduce size
      excludes: [
        'node_modules/@xenova/transformers/dist/models/**/*',
        'node_modules/@xenova/transformers/models/**/*',
        'node_modules/**/*.md',
        'node_modules/**/README*',
        'node_modules/**/test/**/*',
        'node_modules/**/tests/**/*'
      ]
    };
    
    console.log('⚙️ Nexe configuration:');
    console.log(`   Input: ${nexeConfig.input}`);
    console.log(`   Output: ${nexeConfig.output}`);
    console.log(`   Target: ${nexeConfig.target}`);
    console.log(`   Build from source: ${nexeConfig.build}`);
    
    // Build strategy
    if (forceBuild) {
      console.log('🔄 Building from source...');
      await compile(nexeConfig);
    } else {
      try {
        console.log('🔄 Trying prebuilt binary...');
        await compile(nexeConfig);
        console.log('✅ Successfully used prebuilt binary!');
      } catch (error) {
        console.log('⚠️ Prebuilt failed, building from source...');
        nexeConfig.build = true;
        await compile(nexeConfig);
        console.log('✅ Successfully built from source!');
      }
    }
    
    // Verify the binary was created
    if (!await fs.pathExists(nexeConfig.output)) {
      throw new Error('Binary was not created');
    }
    
    const stats = await fs.stat(nexeConfig.output);
    console.log(`📦 Binary size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Clean up temp directory
    if (await fs.pathExists(nexeConfig.temp)) {
      await fs.remove(nexeConfig.temp);
    }
    
    console.log('✅ Build completed successfully!');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    console.error('Stack:', error.stack);
    
    // Clean up on failure
    const tempPath = path.join(__dirname, '.nexe-temp');
    if (await fs.pathExists(tempPath)) {
      await fs.remove(tempPath);
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  buildExecutable();
}

module.exports = { buildExecutable };
