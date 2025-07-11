#!/bin/bash

# Deploy script for Context Provider
# This script builds the binary and uploads it to S3

set -e

echo "🚀 Context Provider Deployment Script"
echo "======================================"

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ AWS credentials not configured"
    echo "Please run: aws configure"
    exit 1
fi

# Check if required environment variables are set
if [ -z "$AWS_S3_BUCKET_TEST" ]; then
    export AWS_S3_BUCKET_TEST="test-dev-figma-cs"
fi

if [ -z "$AWS_REGION_TEST" ]; then
    export AWS_REGION_TEST="eu-north-1"
fi

echo "📋 Configuration:"
echo "   S3 Bucket: $AWS_S3_BUCKET_TEST"
echo "   AWS Region: $AWS_REGION_TEST"
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/.cache/

# Install dependencies
echo "📦 Installing dependencies..."
if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi

# Build binary (only if in CI or forced)
echo "🔨 Building binary..."
if [ "$GITHUB_ACTIONS" = "true" ] || [ "$NEXE_BUILD" = "true" ]; then
    npm run build
else
    echo "⚠️ Skipping nexe build (use GitHub Actions for building)"
    echo "💡 For local development, use: npm start"
    echo "🚀 To force build locally: NEXE_BUILD=true ./deploy.sh"
    
    # Check if binary exists from previous build
    if [ -f "dist/context-provider" ]; then
        echo "📦 Using existing binary from previous build"
    else
        echo "❌ No binary found and build is disabled"
        echo "🔧 Either:"
        echo "   1. Run: NEXE_BUILD=true ./deploy.sh (to build locally)"
        echo "   2. Use GitHub Actions for automated builds"
        exit 1
    fi
fi

# Verify binary
echo "🔍 Verifying binary..."
if [ ! -f "dist/context-provider" ]; then
    echo "❌ Binary not found!"
    exit 1
fi

chmod +x dist/context-provider
echo "✅ Binary built successfully"

# Test binary
echo "🧪 Testing binary..."
./dist/context-provider --help > /dev/null 2>&1 || {
    echo "❌ Binary test failed!"
    exit 1
}
echo "✅ Binary test passed"

# Generate metadata
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
COMMIT_SHORT=$(git rev-parse --short HEAD)
BRANCH=$(git rev-parse --abbrev-ref HEAD)
FILENAME="context-provider_${TIMESTAMP}_${COMMIT_SHORT}"

echo "📊 Build metadata:"
echo "   Timestamp: $TIMESTAMP"
echo "   Commit: $COMMIT_SHORT"
echo "   Branch: $BRANCH"
echo "   Filename: $FILENAME"
echo ""

# Upload to S3
echo "☁️ Uploading to S3..."

# Upload timestamped version
aws s3 cp dist/context-provider s3://$AWS_S3_BUCKET_TEST/binaries/$FILENAME \
    --region $AWS_REGION_TEST \
    --metadata commit=$COMMIT_SHORT,timestamp=$TIMESTAMP,branch=$BRANCH

echo "✅ Uploaded: s3://$AWS_S3_BUCKET_TEST/binaries/$FILENAME"

# Upload as latest if on main branch
if [ "$BRANCH" == "main" ]; then
    aws s3 cp dist/context-provider s3://$AWS_S3_BUCKET_TEST/binaries/context-provider-latest \
        --region $AWS_REGION_TEST \
        --metadata commit=$COMMIT_SHORT,timestamp=$TIMESTAMP,branch=$BRANCH
    echo "✅ Uploaded: s3://$AWS_S3_BUCKET_TEST/binaries/context-provider-latest"
fi

# Generate download URLs
echo ""
echo "📥 Download URLs:"
echo "   Timestamped: https://$AWS_S3_BUCKET_TEST.s3.$AWS_REGION_TEST.amazonaws.com/binaries/$FILENAME"

if [ "$BRANCH" == "main" ]; then
    echo "   Latest: https://$AWS_S3_BUCKET_TEST.s3.$AWS_REGION_TEST.amazonaws.com/binaries/context-provider-latest"
fi

echo ""
echo "📋 Usage:"
echo "   curl -o context-provider https://$AWS_S3_BUCKET_TEST.s3.$AWS_REGION_TEST.amazonaws.com/binaries/$FILENAME"
echo "   chmod +x context-provider"
echo "   ./context-provider --help"

echo ""
echo "✅ Deployment completed successfully!"
