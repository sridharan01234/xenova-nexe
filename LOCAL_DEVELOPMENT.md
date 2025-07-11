# Local Development Guide (Low-End PC Optimized)

## 🚀 Quick Start (No Build Required)

**Perfect for low-end PCs** - No heavy nexe builds locally, just Node.js development!

```bash
# Install dependencies
npm install

# Run local tests
npm run test:local

# Initialize a workspace
npm start init -w /path/to/workspace

# Process a workspace
npm start process -w /path/to/workspace -o ./embeddings
```

## 🧪 Local Testing

```bash
# Run comprehensive local tests
node test-local.js

# Quick CLI test
npm test

# Manual testing
node src/index.js --help
node src/index.js init -w test-workspace
node src/index.js process -w test-workspace -o embeddings
```

## � Local Build (Disabled)

Building the nexe binary is **disabled on local machines** to save resources:

```bash
# This will show an error message
npm run build
# ❌ Build disabled on local machine. Use GitHub Actions for deployment.
```

## 🚀 GitHub Actions Deployment

**All builds happen in GitHub Actions** - perfect for low-end PCs!

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Update application"
git push origin main
```

### Step 2: GitHub Actions Builds Automatically
- ✅ Installs dependencies
- ✅ Builds nexe binary (~50MB)
- ✅ Tests the binary
- ✅ Uploads to S3
- ✅ Provides download links

### Step 3: Download Built Binary
```bash
# Download latest binary
curl -o context-provider https://test-dev-figma-cs.s3.eu-north-1.amazonaws.com/binaries/context-provider-latest
chmod +x context-provider

# Test it
./context-provider --help
```

## � Performance Characteristics

### Local Development (Node.js only)
- **CPU Usage**: Minimal
- **Memory**: ~100MB
- **Disk**: No build artifacts
- **Time**: Instant startup

### GitHub Actions Build
- **Duration**: 15-25 minutes
- **Resources**: GitHub's servers
- **Output**: ~50MB binary
- **Cost**: Free (GitHub Actions)
