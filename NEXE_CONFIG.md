# Nexe Configuration for Context Provider

This document explains how the Context Provider CLI application is configured with nexe to handle external model downloads and create a standalone binary.

## Overview

The Context Provider uses nexe to compile a Node.js application into a standalone executable. The key challenge is handling the large AI model files (Xenova/all-MiniLM-L6-v2) which are ~90MB in size.

## Configuration Strategy

### 1. External Model Storage

Instead of bundling the model files within the binary, we use an external model cache:

```javascript
// In embedding-processor.js
const modelCacheDir = path.join(os.homedir(), '.context-provider', 'models');
env.cacheDir = modelCacheDir;
```

**Benefits:**
- Smaller binary size (~50MB vs ~150MB)
- Faster startup time
- Shared model cache across multiple workspaces
- Independent model updates

### 2. Nexe Build Configuration

The nexe configuration excludes model files from the bundle:

```javascript
// In build.js
const nexeConfig = {
  input: 'src/index.js',
  output: 'dist/context-provider',
  target: 'linux-x64-18.17.0',
  build: true,
  
  // Exclude model files from bundle
  excludes: [
    'node_modules/@xenova/transformers/dist/models/**/*',
    'node_modules/@xenova/transformers/models/**/*'
  ]
};
```

### 3. Model Download Process

The model download happens automatically:

1. **First Run**: Model is downloaded to `~/.context-provider/models/`
2. **Subsequent Runs**: Model is loaded from cache
3. **Progress**: Download progress is displayed to user

## File Structure

```
context-provider/
├── src/
│   ├── index.js                    # Main CLI entry point
│   ├── commands/
│   │   ├── init.js                 # Initialize workspace
│   │   └── process.js              # Process workspace
│   └── core/
│       ├── embedding-processor.js  # AI model handling
│       └── workspace-scanner.js    # File scanning
├── build.js                        # Nexe build script
├── package.json                    # Dependencies & nexe config
└── deploy.sh                       # Deployment script
```

## Model Configuration

### Xenova/all-MiniLM-L6-v2 Model

- **Size**: ~90MB
- **Type**: Sentence transformer for embeddings
- **Format**: ONNX/SafeTensors
- **Cache Location**: `~/.context-provider/models/`

### Model Loading Code

```javascript
// Configure external model cache
env.cacheDir = modelCacheDir;
env.allowLocalModels = true;
env.allowRemoteModels = true;

// Load model with progress tracking
this.pipeline = await pipeline('feature-extraction', this.model, {
  quantized: true,
  progress_callback: (progress) => {
    if (progress.status === 'downloading') {
      console.log(`📥 Downloading model: ${Math.round(progress.loaded / progress.total * 100)}%`);
    }
  }
});
```

## Build Process

### Local Build

```bash
# Install dependencies
npm ci

# Build binary
npm run build

# Test binary
./dist/context-provider --help
```

### GitHub Actions Build

The CI/CD pipeline automatically:

1. **Builds** the binary using nexe
2. **Tests** the binary functionality
3. **Uploads** to S3 bucket
4. **Creates** release artifacts

## Deployment

### S3 Upload Structure

```
s3://test-dev-figma-cs/
├── binaries/
│   ├── context-provider_20240101_123456_abc123f    # Timestamped
│   └── context-provider-latest                     # Latest from main
└── releases/
    ├── v1.0.0/
    │   └── context-provider                        # Tagged release
    └── stable/
        └── context-provider                        # Stable release
```

### Download URLs

```bash
# Latest development build
curl -o context-provider https://test-dev-figma-cs.s3.eu-north-1.amazonaws.com/binaries/context-provider-latest

# Stable release
curl -o context-provider https://test-dev-figma-cs.s3.eu-north-1.amazonaws.com/releases/stable/context-provider

# Make executable
chmod +x context-provider
```

## Testing

### Model Download Test

```bash
# Test external model download
./test-model-download.sh
```

This script:
1. Creates a test workspace
2. Runs the CLI application
3. Verifies model download
4. Checks cache directory
5. Validates embeddings generation

### Binary Test

```bash
# Test binary functionality
./dist/context-provider init -w test-workspace
./dist/context-provider process -w test-workspace -o embeddings
```

## Troubleshooting

### Common Issues

1. **Model Download Timeout**
   - Solution: Increase timeout or retry
   - The model is large (~90MB) and may take time

2. **Cache Directory Permissions**
   - Solution: Ensure `~/.context-provider/models/` is writable
   - Binary creates directory automatically

3. **Binary Not Executable**
   - Solution: `chmod +x context-provider`
   - Check if binary is for correct platform

### Debug Information

```bash
# Check model cache
ls -la ~/.context-provider/models/

# Verify binary
file context-provider
ldd context-provider  # Check dependencies

# Test with verbose output
./context-provider process -w . -o test --verbose
```

## Performance Characteristics

### Binary Size
- **With bundled models**: ~150MB
- **With external models**: ~50MB
- **Reduction**: 66% smaller

### Startup Time
- **Cold start** (first run): ~30-60s (model download)
- **Warm start** (cached): ~2-5s (model loading)
- **Processing**: ~1-2s per file

### Memory Usage
- **Base**: ~100MB
- **With model loaded**: ~300MB
- **Peak processing**: ~500MB

## Security Considerations

### Model Integrity
- Models are downloaded from HuggingFace Hub
- Checksums are verified automatically
- Cache is user-specific (`~/.context-provider/`)

### S3 Access
- Uses AWS credentials from GitHub Secrets
- Bucket access is limited to CI/CD pipeline
- Public read access for binary downloads

## Future Enhancements

### Model Configuration
- Support for multiple models
- Model version pinning
- Custom model URLs

### Performance
- Model quantization options
- Parallel processing
- Streaming embeddings

### Deployment
- Multi-platform binaries
- Docker containers
- Package managers (brew, apt, etc.)

## References

- [Nexe Documentation](https://github.com/nexe/nexe)
- [Xenova/Transformers](https://github.com/xenova/transformers.js)
- [AWS S3 CLI](https://docs.aws.amazon.com/cli/latest/reference/s3/)
- [GitHub Actions](https://docs.github.com/en/actions)
