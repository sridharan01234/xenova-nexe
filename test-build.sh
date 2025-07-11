#!/bin/bash

# Test script for nexe build validation
echo "🧪 Testing nexe build process..."

# Clean up previous builds
echo "🧹 Cleaning up previous builds..."
rm -rf dist/
rm -rf .nexe-temp/

# Test Node.js environment
echo "🔍 Testing Node.js environment..."
node --version
npm --version

# Test main entry point
echo "🔧 Testing main entry point..."
node src/index.js --help

# Test simple build
echo "🔨 Testing simple build..."
export NEXE_FORCE_BUILD=false
npm run build:optimized

# Verify binary
if [ -f "dist/context-provider" ]; then
    echo "✅ Binary created successfully!"
    
    # Test binary
    chmod +x dist/context-provider
    
    echo "🧪 Testing binary..."
    timeout 5 ./dist/context-provider --help || echo "⚠️ Binary test failed"
    
    # Check binary info
    file dist/context-provider
    ldd dist/context-provider | head -5
    
    # Test with workspace
    echo "🔧 Testing with workspace..."
    mkdir -p test-workspace
    echo "console.log('test');" > test-workspace/test.js
    
    timeout 10 ./dist/context-provider init -w test-workspace || echo "⚠️ Init test failed"
    
    if [ -f "test-workspace/.context-provider.json" ]; then
        echo "✅ Init test passed!"
    else
        echo "❌ Init test failed!"
    fi
    
    # Clean up
    rm -rf test-workspace
    
else
    echo "❌ Binary not created!"
    exit 1
fi

echo "✅ All tests completed!"
