#!/bin/bash

# Deployment script for tRPC SaaS Starter (Next.js + tRPC)

set -e

echo "🚀 Starting deployment process..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "   Please create .env file with required environment variables:"
    echo "   - DATABASE_URL"
    echo "   - JWT_SECRET"
    echo "   - NODE_ENV"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run db:generate

# Build Next.js application
echo "🏗️  Building Next.js application..."
npm run build

# Database migration (optional - uncomment if needed)
# echo "🗄️  Running database migrations..."
# npm run db:push

echo ""
echo "✅ Build complete! Ready for deployment."
echo ""
echo "📋 Deployment Options:"
echo ""
echo "1. 🐳 Docker:"
echo "   docker build -t trpc-saas-starter ."
echo "   docker run -p 3000:3000 \\"
echo "     -e DATABASE_URL=\"your-database-url\" \\"
echo "     -e JWT_SECRET=\"your-secret-key\" \\"
echo "     trpc-saas-starter"
echo ""
echo "2. 🐳 Docker Compose:"
echo "   docker-compose up -d"
echo ""
echo "3. ☁️  Render.com:"
echo "   Push to GitHub and connect repository to Render"
echo "   Render will use render.yaml for configuration"
echo ""
echo "4. 🚀 Fly.io:"
echo "   flyctl launch"
echo "   flyctl secrets set DATABASE_URL=\"your-database-url\""
echo "   flyctl secrets set JWT_SECRET=\"your-secret-key\""
echo "   flyctl deploy"
echo ""
echo "5. 🚂 Railway:"
echo "   railway login"
echo "   railway link"
echo "   railway variables set DATABASE_URL=\"your-database-url\""
echo "   railway variables set JWT_SECRET=\"your-secret-key\""
echo "   railway up"
echo ""
echo "6. ▲ Vercel (Recommended for Next.js):"
echo "   vercel --prod"
echo ""
echo "📝 Note: Make sure to set environment variables:"
echo "   - DATABASE_URL (MongoDB connection string)"
echo "   - JWT_SECRET (Secure random string)"
echo "   - NODE_ENV=production"
echo ""
