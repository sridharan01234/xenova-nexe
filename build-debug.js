const { compile } = require('nexe');
const fs = require('fs-extra');
const path = require('path');

async function buildDebugExecutable() {
  try {
    console.log('🚀 Debug Nexe build starting...');
    
    // Ensure dist directory exists
    await fs.ensureDir('dist');
    
    // Simple debug configuration - use known stable versions
    const stableTargets = [
      'linux-x64-18.0.0',
      'linux-x64-16.20.0',
      'linux-x64-14.21.3',
      'linux-x64-20.0.0'
    ];
    
    const nexeConfig = {
      input: 'src/index-debug.js',
      output: 'dist/context-provider-debug',
      target: process.env.NEXE_TARGET || stableTargets[0],
      build: false, // Never build from source for debug
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
    
    // Try multiple prebuilt targets instead of building from source
    let buildSuccess = false;
    let lastError = null;
    
    for (const target of stableTargets) {
      try {
        console.log(`🔄 Trying prebuilt binary for ${target}...`);
        nexeConfig.target = target;
        await compile(nexeConfig);
        console.log(`✅ Successfully used prebuilt binary for ${target}!`);
        buildSuccess = true;
        break;
      } catch (error) {
        console.log(`⚠️ Prebuilt failed for ${target}: ${error.message}`);
        lastError = error;
        continue;
      }
    }
    
    if (!buildSuccess) {
      console.log('❌ All prebuilt binaries failed. Not attempting build from source to avoid compilation errors.');
      console.log('💡 Try using a different Node.js version or check nexe compatibility.');
      throw new Error(`All prebuilt targets failed. Last error: ${lastError.message}`);
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
