const { compile } = require('nexe');
const fs = require('fs-extra');
const path = require('path');

async function build() {
  try {
    console.log('🚀 Building context-provider...');
    
    // Create a simple build that works around path issues
    const projectDir = process.cwd();
    const tempDir = path.join(require('os').tmpdir(), 'nexe-build-' + Date.now());
    
    console.log('📁 Working directory:', projectDir);
    console.log('📁 Temp directory:', tempDir);
    
    // Ensure dist directory exists
    await fs.ensureDir('dist');
    
    try {
      console.log('🔨 Building with Node.js 20...');
      
      // Use a simple configuration that should work
      await compile({
        input: 'src/index.js',
        output: 'dist/context-provider',
        target: 'linux-x64-20.11.1',
        build: false, // Don't build from source to avoid path issues
        verbose: false, // Reduce verbosity to avoid log spam
        temp: tempDir,
        resources: ['package.json'],
        
        // Minimal configuration
        configure: [
          '--dest-cpu=x64',
          '--dest-os=linux'
        ]
      });
      
      console.log('✅ Build completed!');
      
      // Verify the binary
      if (await fs.pathExists('dist/context-provider')) {
        const stats = await fs.stat('dist/context-provider');
        console.log(`📦 Binary size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        
        // Make executable
        await fs.chmod('dist/context-provider', 0o755);
        console.log('✅ Binary is ready!');
        
        // Test the binary
        console.log('🧪 Testing binary...');
        const { execSync } = require('child_process');
        try {
          const result = execSync('./dist/context-provider --help', { 
            encoding: 'utf8',
            timeout: 5000
          });
          console.log('✅ Binary test passed!');
        } catch (testError) {
          console.log('⚠️ Binary test failed, but build completed');
        }
        
        return;
      }
      
    } catch (error) {
      console.log(`⚠️ Build failed: ${error.message}`);
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    console.log('\n💡 Try running from a directory without spaces in the path');
    process.exit(1);
  }
}

if (require.main === module) {
  build();
}

module.exports = { build };
