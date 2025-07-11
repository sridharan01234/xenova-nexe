const { compile } = require('nexe');
const fs = require('fs-extra');
const path = require('path');

async function buildStableExecutable() {
  try {
    console.log('🚀 Modern Nexe build starting...');
    
    // Ensure dist directory exists
    await fs.ensureDir('dist');
    
    // Modern Node.js versions - prioritize current LTS versions
    const modernTargets = [
      // Node.js 20 LTS (Current LTS)
      'linux-x64-20.11.1',
      'linux-x64-20.10.0',
      'linux-x64-20.9.0',
      
      // Node.js 18 LTS (Previous LTS)
      'linux-x64-18.19.1',
      'linux-x64-18.18.2',
      'linux-x64-18.17.0',
      
      // Node.js 22 (Current)
      'linux-x64-22.11.0',
      'linux-x64-22.9.0',
      'linux-x64-22.8.0',
      
      // Fallback to older stable versions with prebuilt binaries
      'linux-x64-14.15.3',
      'linux-x64-14.15.2',
      'linux-x64-12.16.2',
      'linux-x64-10.15.3'
    ];
    
    const nexeConfig = {
      input: 'src/index.js',
      output: 'dist/context-provider',
      target: modernTargets[0],
      build: false, // Start without building from source
      verbose: true,
      temp: './.nexe-temp-modern',
      
      // Minimal resources for faster build
      resources: [
        'package.json'
      ]
    };
    
    console.log('⚙️ Modern Nexe configuration:');
    console.log(`   Input: ${nexeConfig.input}`);
    console.log(`   Output: ${nexeConfig.output}`);
    console.log(`   Strategy: Modern Node.js versions with fallback`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Try each modern target until one works
    let buildSuccess = false;
    let lastError = null;
    let usedTarget = null;
    
    console.log('🔍 Attempting prebuilt binaries first...');
    
    for (const target of modernTargets) {
      try {
        console.log(`🔄 Trying prebuilt binary for ${target}...`);
        nexeConfig.target = target;
        nexeConfig.build = false;
        
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
    
    // If no prebuilt binary worked, try building from source with modern versions
    if (!buildSuccess) {
      console.log('');
      console.log('🔧 No prebuilt binaries available. Attempting build from source...');
      console.log('⚠️ This may take 10-30 minutes depending on your system.');
      
      // Modern versions to build from source
      const modernBuildTargets = [
        'linux-x64-20.11.1',  // Node.js 20 LTS
        'linux-x64-18.19.1',  // Node.js 18 LTS  
        'linux-x64-22.11.0'   // Node.js 22 Current
      ];
      
      for (const target of modernBuildTargets) {
        try {
          console.log(`🔨 Building from source for ${target}...`);
          nexeConfig.target = target;
          nexeConfig.build = true;
          
          // Set build optimizations
          nexeConfig.configure = ['--enable-shared'];
          nexeConfig.make = [`-j${require('os').cpus().length}`];
          
          await compile(nexeConfig);
          console.log(`✅ Successfully built from source for ${target}!`);
          buildSuccess = true;
          usedTarget = target;
          break;
        } catch (error) {
          console.log(`❌ Build from source failed for ${target}: ${error.message}`);
          lastError = error;
          continue;
        }
      }
    }
    
    if (!buildSuccess) {
      console.log('');
      console.log('❌ All modern Node.js versions failed.');
      console.log('💡 This usually means:');
      console.log('   1. Network connectivity issues (for prebuilt binaries)');
      console.log('   2. Missing build tools (for source builds)');
      console.log('   3. Incompatible system configuration');
      console.log('');
      console.log('🛠️  Solutions:');
      console.log('   1. Check internet connection');
      console.log('   2. Install build tools: sudo apt-get install build-essential python3');
      console.log('   3. Try older version: npm run build:legacy');
      console.log('   4. Use Docker for consistent builds');
      console.log('');
      console.log('🔍 System info:');
      console.log(`   Node.js: ${process.version}`);
      console.log(`   Platform: ${process.platform}`);
      console.log(`   Arch: ${process.arch}`);
      console.log(`   CPU cores: ${require('os').cpus().length}`);
      console.log(`   Total memory: ${Math.round(require('os').totalmem() / 1024 / 1024 / 1024)} GB`);
      throw new Error(`All modern targets failed. Last error: ${lastError.message}`);
    }
    
    // Verify the binary was created
    if (!await fs.pathExists(nexeConfig.output)) {
      throw new Error('Modern binary was not created');
    }
    
    const stats = await fs.stat(nexeConfig.output);
    console.log(`📦 Binary size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🎯 Target used: ${usedTarget}`);
    
    // Clean up temp directory
    if (await fs.pathExists(nexeConfig.temp)) {
      await fs.remove(nexeConfig.temp);
    }
    
    console.log('');
    console.log('✅ Modern build completed successfully!');
    console.log(`📦 Executable created: ${nexeConfig.output}`);
    console.log(`🎯 Node.js version: ${usedTarget}`);
    console.log('');
    console.log('📋 Usage:');
    console.log('  ./dist/context-provider init -w /path/to/workspace');
    console.log('  ./dist/context-provider process -w /path/to/workspace -o ./embeddings');
    console.log('');
    console.log('📁 Models will be automatically downloaded to:');
    console.log('  ~/.context-provider/models/');
    console.log('');
    console.log('🚀 Ready for deployment!');
    
  } catch (error) {
    console.error('❌ Modern build failed:', error.message);
    console.error('Stack:', error.stack);
    
    // Clean up on failure
    const tempPath = path.join(__dirname, '.nexe-temp-modern');
    if (await fs.pathExists(tempPath)) {
      await fs.remove(tempPath);
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  buildStableExecutable();
}

module.exports = { buildStableExecutable };
