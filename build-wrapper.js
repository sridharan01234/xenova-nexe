const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

async function buildWrapper() {
  try {
    console.log('🚀 Starting build process...');
    
    const originalDir = process.cwd();
    const tempBuildDir = '/tmp/xenova-nexe-build';
    
    console.log('📁 Original directory:', originalDir);
    console.log('📁 Temp build directory:', tempBuildDir);
    
    // Step 1: Copy project to temp directory (without spaces)
    console.log('📦 Copying project to temp directory...');
    await fs.remove(tempBuildDir);
    await fs.copy(originalDir, tempBuildDir, {
      filter: (src) => {
        // Don't copy node_modules, dist, or temp directories
        const relativePath = path.relative(originalDir, src);
        return !relativePath.includes('node_modules') && 
               !relativePath.includes('dist') && 
               !relativePath.includes('.nexe-temp') &&
               !relativePath.includes('.git');
      }
    });
    
    // Step 2: Install dependencies in temp directory
    console.log('📦 Installing dependencies...');
    execSync('npm install', { cwd: tempBuildDir, stdio: 'inherit' });
    
    // Step 3: Build in temp directory
    console.log('🔨 Building application...');
    execSync('npm run build', { cwd: tempBuildDir, stdio: 'inherit' });
    
    // Step 4: Copy binary back to original directory
    console.log('📦 Copying binary back...');
    await fs.ensureDir(path.join(originalDir, 'dist'));
    
    const tempBinary = path.join(tempBuildDir, 'dist', 'context-provider');
    const originalBinary = path.join(originalDir, 'dist', 'context-provider');
    
    if (await fs.pathExists(tempBinary)) {
      await fs.copy(tempBinary, originalBinary);
      await fs.chmod(originalBinary, 0o755);
      
      const stats = await fs.stat(originalBinary);
      console.log(`✅ Build completed successfully!`);
      console.log(`📦 Binary size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`📁 Binary location: ${originalBinary}`);
      
      // Test the binary
      try {
        const result = execSync(`"${originalBinary}" --help`, { encoding: 'utf8', timeout: 5000 });
        console.log('✅ Binary test passed!');
      } catch (testError) {
        console.log('⚠️ Binary test failed, but build completed');
      }
    } else {
      throw new Error('Binary not found after build');
    }
    
    // Step 5: Clean up temp directory
    console.log('🧹 Cleaning up...');
    await fs.remove(tempBuildDir);
    
    console.log('🎉 Build process completed successfully!');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  buildWrapper();
}

module.exports = { buildWrapper };
