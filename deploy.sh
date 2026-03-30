#!/bin/bash

# 🚀 Quick Deployment Script for Badminton Court Manager
# Choose your deployment method by uncommenting the relevant section

echo "🏸 Badminton Court Manager - Quick Deployment"
echo "============================================="

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "Choose deployment method:"
echo "1. Vercel (Recommended)"
echo "2. Netlify" 
echo "3. GitHub Pages"
echo "4. Local preview"

read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo "🚀 Deploying to Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod
        else
            echo "❌ Vercel CLI not installed. Install with: npm install -g vercel"
            echo "Then run: vercel login && vercel --prod"
        fi
        ;;
    2)
        echo "🚀 Deploying to Netlify..."
        if command -v netlify &> /dev/null; then
            netlify deploy --prod --dir=build
        else
            echo "❌ Netlify CLI not installed. Install with: npm install -g netlify-cli"
            echo "Then run: netlify login && netlify deploy --prod --dir=build"
        fi
        ;;
    3)
        echo "🚀 Deploying to GitHub Pages..."
        npm run deploy
        ;;
    4)
        echo "🖥️  Starting local preview..."
        if command -v serve &> /dev/null; then
            serve -s build -p 5000
        else
            echo "Installing serve globally..."
            npm install -g serve
            serve -s build -p 5000
        fi
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        ;;
esac
