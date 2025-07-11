# Context Provider

A Node.js CLI application that converts workspaces (folders with source code) into vector embeddings using Xenova/Transformers, bundled into a single binary using nexe.

## Features

- 🚀 **Single Binary**: Compiled with nexe for easy distribution
- 🤖 **AI-Powered**: Uses Xenova/all-MiniLM-L6-v2 for embeddings
- 📁 **External Models**: Models downloaded separately, not bundled
- 🔧 **Configurable**: Workspace-specific settings
- 🌐 **Cross-Platform**: Supports Linux, Windows, and macOS

## Installation

### From Source

```bash
git clone <repository-url>
cd context-provider
npm install
npm run build
```

### Binary Usage

The compiled binary will be available in the `dist/` directory.

## Usage

### 1. Initialize Workspace

```bash
./context-provider init -w /path/to/workspace
```

This creates a `.context-provider.json` configuration file in your workspace.

### 2. Process Workspace

```bash
./context-provider process -w /path/to/workspace -o ./embeddings
```

This processes all files in the workspace and generates vector embeddings.

## Model Configuration

### External Model Storage

The application uses **external model storage** to keep the binary size small:

- **Model**: `Xenova/all-MiniLM-L6-v2` (fixed)
- **Cache Location**: `~/.context-provider/models/`
- **Download**: Automatic on first use
- **Size**: ~90MB (downloaded separately)

### Why External Models?

1. **Smaller Binary**: The executable is ~50MB instead of ~150MB
2. **Faster Startup**: No model loading from bundle
3. **Shared Cache**: Multiple workspaces share the same model
4. **Updates**: Models can be updated independently

## Configuration

### Workspace Configuration (`.context-provider.json`)

```json
{
  "version": "1.0.0",
  "model": "Xenova/all-MiniLM-L6-v2",
  "modelCache": "/home/user/.context-provider/models",
  "settings": {
    "maxTokens": 512,
    "overlap": 50,
    "excludePatterns": [
      "node_modules/**",
      ".git/**",
      "dist/**",
      "build/**",
      "*.log"
    ],
    "includeExtensions": [
      ".js", ".ts", ".jsx", ".tsx",
      ".py", ".java", ".c", ".cpp", ".h",
      ".md", ".txt", ".json", ".yaml", ".yml"
    ]
  }
}
```

### Ignore Files

Create a `.contextignore` file to exclude specific files:

```
# Large data files
*.csv
*.json
data/

# Temporary files
*.tmp
*.temp

# Build artifacts
dist/
build/
```

## CLI Commands

### `init` - Initialize Workspace

```bash
./context-provider init [options]

Options:
  -w, --workspace <path>  Workspace path (default: current directory)
  -f, --force            Force reinitialize if already exists
  -h, --help             Display help
```

### `process` - Process Workspace

```bash
./context-provider process [options]

Options:
  -w, --workspace <path>     Workspace path (default: current directory)
  -o, --output <path>        Output directory (default: ./embeddings)
  -m, --model <model>        Model name (default: Xenova/all-MiniLM-L6-v2)
  --max-tokens <number>      Max tokens per chunk (default: 512)
  --overlap <number>         Overlap tokens between chunks (default: 50)
  -h, --help                 Display help
```

## Output Format

The application generates two files:

### `embeddings.json`
```json
[
  {
    "file": "src/index.js",
    "chunk": 0,
    "totalChunks": 2,
    "text": "const fs = require('fs');...",
    "embedding": [0.1, -0.2, 0.5, ...],
    "metadata": {
      "size": 1024,
      "extension": ".js",
      "lastModified": "2024-01-01T00:00:00.000Z",
      "chunkIndex": 0,
      "chunkSize": 512
    }
  }
]
```

### `metadata.json`
```json
{
  "workspace": "/path/to/workspace",
  "model": "Xenova/all-MiniLM-L6-v2",
  "processedAt": "2024-01-01T00:00:00.000Z",
  "totalFiles": 25,
  "totalChunks": 150,
  "maxTokens": 512,
  "overlap": 50,
  "modelCache": "/home/user/.context-provider/models"
}
```

## Nexe Build Configuration

The application is built with nexe using the following configuration:

```javascript
{
  input: 'src/index.js',
  output: 'dist/context-provider',
  target: 'linux-x64-18.17.0',
  build: true,
  excludes: [
    'node_modules/@xenova/transformers/dist/models/**/*',
    'node_modules/@xenova/transformers/models/**/*'
  ]
}
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
npm install
```

### Build

```bash
npm run build         # Linux binary
npm run build:win     # Windows binary
npm run build:mac     # macOS binary
npm run build:all     # All platforms
```

### Local Development

```bash
npm start -- init -w .
npm start -- process -w . -o ./test-embeddings
```

## Troubleshooting

### Model Download Issues

If model download fails:

1. Check internet connection
2. Clear model cache: `rm -rf ~/.context-provider/models`
3. Try again

### Large Files

Files larger than 1MB are skipped by default. To include them:

```json
{
  "settings": {
    "maxFileSize": 5242880  // 5MB in bytes
  }
}
```

### Binary Issues

If the binary doesn't work:

1. Check executable permissions: `chmod +x context-provider`
2. Verify target platform matches your system
3. Try building locally: `npm run build`

## License

MIT
