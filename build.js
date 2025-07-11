const { compile } = require('nexe');
const fs = require('fs-extra');

async function build() {
  try {
    console.log('🚀 Building with latest Node.js...');
    
    // Ensure dist directory exists
    await fs.ensureDir('dist');
    
    // Latest Node.js versions - build from source since prebuilt binaries aren't available
    const targets = [
      'linux-x64-22.11.0',  // Node.js 22 Latest
      'linux-x64-20.18.0',  // Node.js 20 Latest  
      'linux-x64-18.20.4'   // Node.js 18 Latest fallback
    ];
    
    for (const target of targets) {
      try {
        console.log(`🔨 Building for ${target}...`);
        console.log('⏳ This will take several minutes as Node.js is compiled from source...');
        
        const result = await compile({
          input: 'src/index.js',
          output: 'dist/context-provider',
          target: target,
          build: true, // Enable building from source for latest Node.js
          verbose: true,
          temp: './.nexe-temp',
          resources: ['package.json'],
          
          // Build configuration for latest Node.js
          make: ['-j4'], // Use 4 parallel jobs for faster compilation
          configure: [
            '--enable-static',
            '--fully-static'
          ],
          
          // Python path for Node.js build
          python: process.env.PYTHON || 'python3'
        });
        
        console.log(`✅ Successfully built for ${target}!`);
        
        // Verify the binary
        if (await fs.pathExists('dist/context-provider')) {
          const stats = await fs.stat('dist/context-provider');
          console.log(`📦 Binary size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
          
          // Make executable
          await fs.chmod('dist/context-provider', 0o755);
          
          // Test the binary
          try {
            const { execSync } = require('child_process');
            const testResult = execSync('./dist/context-provider --help', { 
              encoding: 'utf8', 
              timeout: 10000 
            });
            console.log('✅ Binary test passed!');
          } catch (testError) {
            console.log('⚠️ Binary test failed, but build completed');
          }
          
          console.log('🎉 Build completed successfully!');
          return;
        }
        
      } catch (error) {
        console.log(`⚠️ Build failed for ${target}: ${error.message}`);
        if (target === targets[targets.length - 1]) {
          throw error;
        }
        console.log('🔄 Trying next Node.js version...');
        continue;
      }
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    console.error('💡 Try running with PYTHON=python3 npm run build if Python path is incorrect');
    process.exit(1);
  }
}

if (require.main === module) {
  build();
}

module.exports = { build };
