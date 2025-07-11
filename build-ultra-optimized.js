const { compile } = require('nexe');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

async function buildExecutable() {
  try {
    console.log('🚀 Ultra-optimized Nexe build starting...');
    
    // Environment detection
    const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
    const usePrebuilt = process.env.NEXE_PREBUILT === 'true';
    const verbose = process.env.NEXE_VERBOSE === 'true';
    const tempDir = process.env.NEXE_TEMP || path.join(__dirname, '.nexe-temp');
    
    // Performance settings
    const cpuCount = os.cpus().length;
    const maxMemory = Math.floor(os.totalmem() / 1024 / 1024); // MB
    console.log(`💻 System: ${cpuCount} CPUs, ${Math.floor(maxMemory/1024)}GB RAM`);
    
    // Ensure directories exist
    await fs.ensureDir('dist');
    await fs.ensureDir(tempDir);
    
    // Ultra-optimized Nexe configuration
    const nexeConfig = {
      input: 'src/index.js',
      output: 'dist/context-provider',
      target: 'linux-x64-18.17.0',
      build: false, // Try prebuilt first
      
      // Performance optimizations
      verbose: verbose,
      temp: tempDir,
      
      // Advanced caching
      cache: path.join(os.homedir(), '.nexe'),
      
      // Resources (minimal)
      resources: [
        'package.json'
      ],
      
      // Optimized exclusions
      excludes: [
        'node_modules/@xenova/transformers/dist/models/**/*',
        'node_modules/@xenova/transformers/models/**/*',
        'node_modules/@xenova/transformers/src/models/**/*',
        'node_modules/**/*.md',
        'node_modules/**/*.txt',
        'node_modules/**/README*',
        'node_modules/**/CHANGELOG*',
        'node_modules/**/LICENSE*',
        'node_modules/**/*.d.ts',
        'node_modules/**/*.map',
        'node_modules/**/test/**/*',
        'node_modules/**/tests/**/*',
        'node_modules/**/spec/**/*',
        'node_modules/**/docs/**/*',
        'node_modules/**/examples/**/*',
        'node_modules/**/bench/**/*',
        'node_modules/**/benchmark/**/*'
      ],
      
      // Compiler optimizations
      flags: [
        '--max-old-space-size=' + Math.min(6144, Math.floor(maxMemory * 0.8)),
        '--optimize-for-size',
        '--no-lazy',
        '--no-flush-bytecode'
      ],
      
      // Build options for faster compilation
      make: [
        `-j${cpuCount}`,
        'BUILDTYPE=Release',
        'V=0' // Quiet output
      ],
      
      // Patches for optimization
      patches: [
        async (compiler, next) => {
          console.log('📦 Applying optimization patches...');
          
          // Patch for external model loading
          await compiler.setFileContentsAsync(
            'lib/xenova-optimized.js',
            `
            const path = require('path');
            const os = require('os');
            
            // Optimized model cache setup
            const modelCacheDir = path.join(os.homedir(), '.context-provider', 'models');
            process.env.TRANSFORMERS_CACHE = modelCacheDir;
            process.env.HF_HUB_CACHE = modelCacheDir;
            process.env.TOKENIZERS_PARALLELISM = 'false'; // Avoid warnings
            
            // Performance optimizations
            process.env.OMP_NUM_THREADS = '1';
            process.env.OPENBLAS_NUM_THREADS = '1';
            process.env.MKL_NUM_THREADS = '1';
            process.env.VECLIB_MAXIMUM_THREADS = '1';
            process.env.NUMEXPR_NUM_THREADS = '1';
            
            module.exports = {};
            `
          );
          
          // Patch for faster startup
          await compiler.setFileContentsAsync(
            'lib/startup-optimized.js',
            `
            // Disable unnecessary warnings
            process.removeAllListeners('warning');
            process.on('warning', () => {}); // Suppress warnings
            
            // Optimize garbage collection
            if (global.gc) {
              setInterval(() => {
                global.gc();
              }, 30000);
            }
            
            module.exports = {};
            `
          );
          
          return next();
        }
      ]
    };
    
    console.log('⚙️ Ultra-optimized configuration:');
    console.log(`   Target: ${nexeConfig.target}`);
    console.log(`   Strategy: ${usePrebuilt ? 'Prebuilt preferred' : 'Build from source'}`);
    console.log(`   Temp dir: ${tempDir}`);
    console.log(`   Cache: ${nexeConfig.cache}`);
    console.log(`   CPU cores: ${cpuCount}`);
    console.log(`   Memory limit: ${Math.min(6144, Math.floor(maxMemory * 0.8))}MB`);
    
    const startTime = Date.now();
    
    try {
      console.log('🔄 Phase 1: Attempting prebuilt binary...');
      nexeConfig.build = false;
      await compile(nexeConfig);
      console.log('✅ SUCCESS: Used prebuilt binary!');
      
    } catch (error) {
      console.log('⚠️ Phase 2: Prebuilt failed, building from source...');
      console.log('   This may take 5-15 minutes depending on cache...');
      
      // Enhanced build configuration
      nexeConfig.build = true;
      nexeConfig.verbose = true; // Enable verbose for build phase
      
      try {
        await compile(nexeConfig);
        console.log('✅ SUCCESS: Built from source!');
      } catch (buildError) {
        console.error('❌ Build from source failed:', buildError.message);
        
        // Last resort: minimal build
        console.log('🔄 Phase 3: Attempting minimal build...');
        nexeConfig.excludes = []; // Remove all excludes
        nexeConfig.resources = []; // Remove all resources
        nexeConfig.patches = []; // Remove all patches
        
        await compile(nexeConfig);
        console.log('✅ SUCCESS: Minimal build completed!');
      }
    }
    
    const buildTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`⏱️ Total build time: ${buildTime}s`);
    
    // Post-build optimizations
    const binaryPath = nexeConfig.output;
    const stats = await fs.stat(binaryPath);
    console.log(`📊 Binary size: ${Math.round(stats.size / 1024 / 1024)}MB`);
    
    // Cleanup temp directory
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
      console.log('🧹 Cleaned up temp directory');
    }
    
    console.log('✅ Ultra-optimized build completed successfully!');
    console.log(`📦 Executable: ${binaryPath}`);
    console.log('');
    console.log('🚀 Ready for deployment!');
    
  } catch (error) {
    console.error('❌ Ultra-optimized build failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  buildExecutable();
}

module.exports = { buildExecutable };
