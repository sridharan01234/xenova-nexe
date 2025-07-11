const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const ignore = require('ignore');
const mime = require('mime-types');

class WorkspaceScanner {
  constructor(workspacePath, settings = {}) {
    this.workspacePath = workspacePath;
    this.settings = settings;
    
    // Default settings
    this.excludePatterns = settings.excludePatterns || [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      '*.log',
      '.DS_Store',
      'Thumbs.db'
    ];
    
    this.includeExtensions = settings.includeExtensions || [
      '.js', '.ts', '.jsx', '.tsx',
      '.py', '.java', '.c', '.cpp', '.h',
      '.md', '.txt', '.json', '.yaml', '.yml',
      '.html', '.css', '.scss', '.sass',
      '.go', '.rs', '.php', '.rb', '.swift'
    ];
    
    this.maxFileSize = settings.maxFileSize || 1024 * 1024; // 1MB default
  }

  async scanFiles() {
    try {
      console.log('🔍 Scanning workspace for files...');
      
      // Initialize ignore instance
      const ig = ignore();
      
      // Add exclude patterns
      ig.add(this.excludePatterns);
      
      // Check for .gitignore
      const gitignorePath = path.join(this.workspacePath, '.gitignore');
      if (await fs.pathExists(gitignorePath)) {
        const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
        ig.add(gitignoreContent);
        console.log('📄 Loaded .gitignore patterns');
      }
      
      // Check for .contextignore
      const contextignorePath = path.join(this.workspacePath, '.contextignore');
      if (await fs.pathExists(contextignorePath)) {
        const contextignoreContent = await fs.readFile(contextignorePath, 'utf8');
        ig.add(contextignoreContent);
        console.log('📄 Loaded .contextignore patterns');
      }
      
      // Find all files
      const allFiles = await this.findFiles('**/*');
      
      // Filter files
      const filteredFiles = [];
      
      for (const filePath of allFiles) {
        const relativePath = path.relative(this.workspacePath, filePath);
        
        // Check if file should be ignored
        if (ig.ignores(relativePath)) {
          continue;
        }
        
        // Check file extension
        const ext = path.extname(filePath).toLowerCase();
        if (!this.includeExtensions.includes(ext)) {
          continue;
        }
        
        try {
          const stats = await fs.stat(filePath);
          
          // Skip if file is too large
          if (stats.size > this.maxFileSize) {
            console.log(`⚠️ Skipping large file: ${relativePath} (${this.formatBytes(stats.size)})`);
            continue;
          }
          
          // Skip if not a regular file
          if (!stats.isFile()) {
            continue;
          }
          
          // Read file content
          const content = await fs.readFile(filePath, 'utf8');
          
          // Skip binary files
          if (this.isBinaryContent(content)) {
            continue;
          }
          
          filteredFiles.push({
            path: filePath,
            relativePath,
            content,
            size: stats.size,
            extension: ext,
            lastModified: stats.mtime.toISOString(),
            mimeType: mime.lookup(ext) || 'text/plain'
          });
          
        } catch (error) {
          console.warn(`⚠️ Error reading file ${relativePath}:`, error.message);
        }
      }
      
      console.log(`📄 Found ${filteredFiles.length} processable files`);
      return filteredFiles;
      
    } catch (error) {
      throw new Error(`Failed to scan workspace: ${error.message}`);
    }
  }

  async findFiles(pattern) {
    return new Promise((resolve, reject) => {
      glob(pattern, {
        cwd: this.workspacePath,
        absolute: true,
        nodir: true,
        dot: false
      }, (error, files) => {
        if (error) {
          reject(error);
        } else {
          resolve(files);
        }
      });
    });
  }

  isBinaryContent(content) {
    // Simple binary detection: check for null bytes
    return content.includes('\u0000');
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = { WorkspaceScanner };
