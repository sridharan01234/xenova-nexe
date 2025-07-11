const { compile } = require('nexe');
const fs = require('fs-extra');
const path = require('path');

// Helper function to find the best available Node.js version
function getBestNodeVersion() {
  // Common Node.js versions that are likely to have prebuilt binaries
  const commonVersions = [
    'linux-x64-20.17.0',
    'linux-x64-20.0.0',
    'linux-x64-16.20.0',
    'linux-x64-14.21.3',
    'linux-x64-18.0.0',
    'linux-x64-16.0.0',
    'linux-x64-14.0.0'
  ];
  
  // Return the first one as default, nexe will fallback if not available
  return commonVersions[0];
}

async function buildExecutable() {
  try {
    console.log('🔧 Building context-provider executable...');
    
    // Ensure dist directory exists
    await fs.ensureDir('dist');
    
    // Determine build strategy
    const usePrebuilt = process.env.NEXE_PREBUILT === 'true';
    const forceBuild = process.env.NEXE_BUILD === 'true';
    const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
    
    // Nexe configuration for external model handling
    const nexeConfig = {
      input: 'src/index.js',
      output: 'dist/context-provider',
      target: getBestNodeVersion(), // Use helper function to get best version
      build: false, // Start with prebuilt
      
      // Performance optimizations
      verbose: isCI,
      temp: path.join(__dirname, '.nexe-temp'),
      
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
    
    // Add build flags if building from source
    if (forceBuild) {
      nexeConfig.build = true;
      nexeConfig.flags = [
        '--fully-static',
        '--enable-static'
      ];
      
      // Use parallel compilation if available
      if (process.env.JOBS) {
        nexeConfig.make = [`-j${process.env.JOBS}`];
      }
    }
    
    console.log('⚙️ Nexe configuration:');
    console.log(`   Target: ${nexeConfig.target}`);
    console.log(`   Input: ${nexeConfig.input}`);
    console.log(`   Output: ${nexeConfig.output}`);
    console.log(`   Build strategy: ${usePrebuilt ? 'Prebuilt only' : forceBuild ? 'Build from source' : 'Prebuilt first, fallback to build'}`);
    console.log('   External models: Models will be downloaded to ~/.context-provider/models');
    
    // Smart build strategy with better error handling
    if (usePrebuilt) {
      console.log('🔄 Using prebuilt binary only...');
      nexeConfig.build = false;
      await compile(nexeConfig);
      console.log('✅ Successfully used prebuilt binary!');
    } else if (forceBuild) {
      console.log('🔄 Building from source (forced)...');
      console.log('⏱️  This will take 10-20 minutes...');
      nexeConfig.build = true;
      await compile(nexeConfig);
      console.log('✅ Successfully built from source!');
    } else {
      // Try prebuilt first, then build if needed
      try {
        console.log('🔄 Attempting to use prebuilt Node.js binary...');
        nexeConfig.build = false;
        await compile(nexeConfig);
        console.log('✅ Successfully used prebuilt binary!');
      } catch (error) {
        console.log('⚠️ Prebuilt binary not available, building from source...');
        console.log('⏱️  This will take 10-20 minutes...');
        
        // Fallback to building from source
        nexeConfig.build = true;
        nexeConfig.flags = [
          '--fully-static',
          '--enable-static'
        ];
        
        if (process.env.JOBS) {
          nexeConfig.make = [`-j${process.env.JOBS}`];
        }
        
        try {
          await compile(nexeConfig);
          console.log('✅ Successfully built from source!');
        } catch (buildError) {
          console.log('⚠️ Build from source failed, trying alternative Node.js version...');
          
          // Try with a different Node.js version
          nexeConfig.target = 'linux-x64-14.21.3';
          try {
            await compile(nexeConfig);
            console.log('✅ Successfully built with alternative Node.js version!');
          } catch (altError) {
            console.log('⚠️ Alternative version failed, trying latest stable...');
            nexeConfig.target = 'linux-x64-18.0.0';
            await compile(nexeConfig);
            console.log('✅ Successfully built with latest stable Node.js!');
          }
        }
      }
    }
    
    // Clean up temp directory
    if (await fs.pathExists(nexeConfig.temp)) {
      await fs.remove(nexeConfig.temp);
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
