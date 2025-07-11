# Local Development Guide

## 🚀 Quick Start (No Build Required)

For local development and testing, you don't need to build the nexe binary. Just use Node.js directly:

```bash
# Install dependencies
npm install

# Initialize a workspace
npm start init -w /path/to/workspace

# Process a workspace
npm start process -w /path/to/workspace -o ./embeddings
```

## 📝 Development Commands

```bash
# Run with Node.js (recommended for development)
npm start init -w .
npm start process -w . -o ./test-embeddings

# Alternative development command
npm run dev init -w .
npm run dev process -w . -o ./test-embeddings
```

## 🔧 Building (Only for Production)

### GitHub Actions (Recommended)

The binary is automatically built and uploaded to S3 when you push to GitHub:

```bash
git add .
git commit -m "Update application"
git push origin main
```

**Download URLs:**
- Latest: `https://test-dev-figma-cs.s3.eu-north-1.amazonaws.com/binaries/context-provider-latest`
- Releases: `https://test-dev-figma-cs.s3.eu-north-1.amazonaws.com/releases/stable/context-provider`

### Local Build (If Really Needed)

⚠️ **Warning**: This takes 10-30 minutes and requires significant system resources.

```bash
# Force local build (not recommended)
npm run build:force

# Or with environment variable
NEXE_BUILD=true npm run build
```

### Deploy Script

```bash
# Deploy without building (uses existing binary)
./deploy.sh

# Deploy with forced build (takes long time)
NEXE_BUILD=true ./deploy.sh
```

## 🧪 Testing

```bash
# Test model download functionality
./test-model-download.sh

# Test with sample workspace
mkdir test-workspace
echo "console.log('hello');" > test-workspace/test.js
npm start init -w test-workspace
npm start process -w test-workspace -o test-embeddings
```

## 📦 Production Usage

Download the pre-built binary from S3:

```bash
# Download latest binary
curl -o context-provider https://test-dev-figma-cs.s3.eu-north-1.amazonaws.com/binaries/context-provider-latest
chmod +x context-provider

# Use the binary
./context-provider init -w /path/to/workspace
./context-provider process -w /path/to/workspace -o ./embeddings
```

## 🔄 Workflow

### For Development
1. Edit code in `src/`
2. Test with `npm start`
3. Commit and push
4. Binary is built automatically in GitHub Actions

### For Production
1. Download binary from S3
2. Run on target system
3. Models download automatically on first use

## 📊 Performance

### Local Development (Node.js)
- **Startup**: ~1-2 seconds
- **Model loading**: ~3-5 seconds (first time)
- **Processing**: ~1-2 seconds per file

### Production Binary
- **Startup**: ~1-2 seconds
- **Model loading**: ~3-5 seconds (first time)
- **Processing**: ~1-2 seconds per file
- **Binary size**: ~50MB
- **Model cache**: ~90MB (external)

## 🛠️ Troubleshooting

### "No binary found" Error
```bash
# This means you're trying to deploy without a binary
# Solution: Use GitHub Actions or force build locally
NEXE_BUILD=true ./deploy.sh
```

### Local Build Takes Too Long
```bash
# Don't build locally, use GitHub Actions instead
git push origin main
# Then download from S3
```

### Model Download Issues
```bash
# Clear model cache
rm -rf ~/.context-provider/models
# Try again
npm start process -w . -o ./embeddings
```
