# Deployment Instructions

## 🚀 Automated Deployment via GitHub Actions

### Prerequisites
1. GitHub repository with this code
2. AWS credentials configured in GitHub Secrets:
   - `AWS_ACCESS_KEY_ID_TEST`
   - `AWS_SECRET_ACCESS_KEY_TEST`

### Steps

1. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/username/context-provider.git
   git push -u origin main
   ```

2. **GitHub Actions will automatically**:
   - Build the nexe binary
   - Test the binary
   - Upload to S3 bucket: `test-dev-figma-cs`
   - Generate download URLs

3. **Download the binary**:
   ```bash
   curl -o context-provider https://test-dev-figma-cs.s3.eu-north-1.amazonaws.com/binaries/context-provider-latest
   chmod +x context-provider
   ```

### Manual Deployment (Local)

⚠️ **Warning**: Takes 10-30 minutes

```bash
# Force build locally (not recommended)
NEXE_BUILD=true ./deploy.sh
```

### GitHub Secrets Required

Add these secrets to your GitHub repository:

```
AWS_ACCESS_KEY_ID_TEST=your_access_key
AWS_SECRET_ACCESS_KEY_TEST=your_secret_key
```

### S3 Bucket Structure

```
test-dev-figma-cs/
├── binaries/
│   ├── context-provider-latest              # Latest build
│   └── context-provider_TIMESTAMP_COMMIT    # Timestamped builds
└── releases/
    ├── v1.0.0/context-provider             # Tagged releases
    └── stable/context-provider             # Stable release
```

### Download URLs

After successful deployment:

- **Latest**: https://test-dev-figma-cs.s3.eu-north-1.amazonaws.com/binaries/context-provider-latest
- **Stable**: https://test-dev-figma-cs.s3.eu-north-1.amazonaws.com/releases/stable/context-provider

## 🧪 Testing Deployed Binary

```bash
# Download and test
curl -o context-provider https://test-dev-figma-cs.s3.eu-north-1.amazonaws.com/binaries/context-provider-latest
chmod +x context-provider

# Test functionality
./context-provider --help
./context-provider init -w test-workspace
./context-provider process -w test-workspace -o embeddings

# Verify model download
ls -la ~/.context-provider/models/
```

## ✅ Deployment Checklist

- [ ] GitHub repository created
- [ ] AWS credentials added to GitHub Secrets
- [ ] Code pushed to main branch
- [ ] GitHub Actions workflow triggered
- [ ] Binary built successfully
- [ ] Binary uploaded to S3
- [ ] Download URLs working
- [ ] Binary tested and functional
- [ ] Model downloads working externally

## 🔧 Troubleshooting

### GitHub Actions fails
- Check AWS credentials in GitHub Secrets
- Verify S3 bucket permissions
- Check build logs for nexe errors

### Binary download fails
- Verify S3 bucket is accessible
- Check if build completed successfully
- Try timestamped URL instead of latest

### Model download fails
- Check internet connectivity
- Verify `~/.context-provider/models/` permissions
- Clear cache and retry: `rm -rf ~/.context-provider/models/`
