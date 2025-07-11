const { compile } = require('nexe');
const fs = require('fs-extra');
const path = require('path');

async function buildDebugExecutable() {
  try {
    console.log('🚀 Debug Nexe build starting...');
    
    // Ensure dist directory exists
    await fs.ensureDir('dist');
    
    // Simple debug configuration
    const nexeConfig = {
      input: 'src/index-debug.js',
      output: 'dist/context-provider-debug',
      target: process.env.NEXE_TARGET || 'linux-x64-18.0.0',
      build: false, // Always try prebuilt first for debug
      verbose: true,
      temp: './.nexe-temp-debug',
      
      // Include all dependencies for debugging
      resources: [
        'package.json',
        'src/**/*.js'
      ]
    };
    
    console.log('⚙️ Debug Nexe configuration:');
    console.log(`   Input: ${nexeConfig.input}`);
    console.log(`   Output: ${nexeConfig.output}`);
    console.log(`   Target: ${nexeConfig.target}`);
    
    // Try prebuilt first
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
    
    // Verify the binary was created
    if (!await fs.pathExists(nexeConfig.output)) {
      throw new Error('Debug binary was not created');
    }
    
    const stats = await fs.stat(nexeConfig.output);
    console.log(`📦 Debug binary size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('✅ Debug build completed successfully!');
    
  } catch (error) {
    console.error('❌ Debug build failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  buildDebugExecutable();
}

module.exports = { buildDebugExecutable };
