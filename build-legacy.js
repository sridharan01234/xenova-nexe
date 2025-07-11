const { compile } = require('nexe');
const fs = require('fs-extra');
const path = require('path');

async function buildLegacyExecutable() {
  try {
    console.log('🚀 Legacy Nexe build starting...');
    
    // Ensure dist directory exists
    await fs.ensureDir('dist');
    
    // Use only the actual available prebuilt binaries from nexe releases
    const legacyTargets = [
      'linux-x64-14.15.3',    // Latest Node.js 14 LTS with prebuilt binary
      'linux-x64-14.15.2',    // Fallback Node.js 14 LTS
      'linux-x64-12.16.2',    // Latest Node.js 12 LTS with prebuilt binary
      'linux-x64-12.16.1',    // Fallback Node.js 12 LTS
      'linux-x64-10.15.3',    // Stable Node.js 10
      'linux-x64-10.15.2',    // Fallback Node.js 10
      'linux-x64-10.15.1',    // More fallbacks
      'linux-x64-10.15.0'
    ];
    
    const nexeConfig = {
      input: 'src/index.js',
      output: 'dist/context-provider',
      target: legacyTargets[0],
      build: false, // Never build from source for legacy
      verbose: true,
      temp: './.nexe-temp-legacy',
      
      // Minimal resources
      resources: [
        'package.json'
      ]
    };
    
    console.log('⚙️ Legacy Nexe configuration:');
    console.log(`   Input: ${nexeConfig.input}`);
    console.log(`   Output: ${nexeConfig.output}`);
    console.log(`   Strategy: Legacy prebuilt binaries only`);
    
    // Try each legacy target until one works
    let buildSuccess = false;
    let lastError = null;
    let usedTarget = null;
    
    for (const target of legacyTargets) {
      try {
        console.log(`🔄 Trying legacy prebuilt binary for ${target}...`);
        nexeConfig.target = target;
        await compile(nexeConfig);
        console.log(`✅ Successfully used prebuilt binary for ${target}!`);
        buildSuccess = true;
        usedTarget = target;
        break;
      } catch (error) {
        console.log(`⚠️ Prebuilt failed for ${target}: ${error.message}`);
        lastError = error;
        continue;
      }
    }
    
    if (!buildSuccess) {
      console.log('❌ All legacy prebuilt binaries failed.');
      console.log('💡 This usually means:');
      console.log('   1. Network connectivity issues');
      console.log('   2. Nexe version compatibility issues');
      console.log('   3. Missing dependencies');
      console.log('');
      console.log('🛠️  Solutions:');
      console.log('   1. Check internet connection');
      console.log('   2. Update nexe: npm install nexe@latest');
      console.log('   3. Try: npm run build:modern (with source build)');
      console.log('   4. Use Docker for consistent builds');
      throw new Error(`All legacy prebuilt targets failed. Last error: ${lastError.message}`);
    }
    
    // Verify the binary was created
    if (!await fs.pathExists(nexeConfig.output)) {
      throw new Error('Legacy binary was not created');
    }
    
    const stats = await fs.stat(nexeConfig.output);
    console.log(`📦 Binary size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🎯 Target used: ${usedTarget}`);
    
    // Clean up temp directory
    if (await fs.pathExists(nexeConfig.temp)) {
      await fs.remove(nexeConfig.temp);
    }
    
    console.log('');
    console.log('✅ Legacy build completed successfully!');
    console.log(`📦 Executable created: ${nexeConfig.output}`);
    console.log(`🎯 Node.js version: ${usedTarget}`);
    console.log('');
    console.log('⚠️ Note: This binary uses an older Node.js version for compatibility.');
    console.log('   Modern features may not be available.');
    console.log('');
    console.log('📋 Usage:');
    console.log('  ./dist/context-provider init -w /path/to/workspace');
    console.log('  ./dist/context-provider process -w /path/to/workspace -o ./embeddings');
    console.log('');
    console.log('📁 Models will be automatically downloaded to:');
    console.log('  ~/.context-provider/models/');
    
  } catch (error) {
    console.error('❌ Legacy build failed:', error.message);
    console.error('Stack:', error.stack);
    
    // Clean up on failure
    const tempPath = path.join(__dirname, '.nexe-temp-legacy');
    if (await fs.pathExists(tempPath)) {
      await fs.remove(tempPath);
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  buildLegacyExecutable();
}

module.exports = { buildLegacyExecutable };
