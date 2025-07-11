const { compile } = require('nexe');
const fs = require('fs-extra');

async function build() {
  try {
    console.log('🚀 Building with latest Node.js...');
    
    // Ensure dist directory exists
    await fs.ensureDir('dist');
    
    // Modern Node.js versions - try latest first
    const targets = [
      'linux-x64-22.0.0',   // Node.js 22 LTS
      'linux-x64-20.11.1',  // Node.js 20 LTS
      'linux-x64-18.19.0'   // Node.js 18 LTS fallback
    ];
    
    for (const target of targets) {
      try {
        console.log(`🔨 Building for ${target}...`);
        
        await compile({
          input: 'src/index.js',
          output: 'dist/context-provider',
          target: target,
          build: true, // Build from source for latest Node.js
          verbose: true,
          temp: './.nexe-temp',
          resources: ['package.json'],
          
          // Optimize build
          patches: [
            async (compiler, next) => {
              // Remove unnecessary files to reduce size
              await compiler.replaceInFileAsync(
                'lib/internal/process/warning.js',
                'require(\'util\').debuglog',
                '() => () => {}'
              );
              return next();
            }
          ]
        });
        
        console.log(`✅ Successfully built for ${target}!`);
        
        // Verify the binary
        if (await fs.pathExists('dist/context-provider')) {
          const stats = await fs.stat('dist/context-provider');
          console.log(`📦 Binary size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
          
          // Make executable
          await fs.chmod('dist/context-provider', 0o755);
          console.log('✅ Build completed successfully!');
          return;
        }
        
      } catch (error) {
        console.log(`⚠️ Build failed for ${target}: ${error.message}`);
        if (target === targets[targets.length - 1]) {
          throw error;
        }
        continue;
      }
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  build();
}

module.exports = { build };
