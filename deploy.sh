#!/bin/bash
# Deployment script for Encubation Management System
# Run this on the Ubuntu server

set -e

echo "🚀 Starting deployment..."

# Navigate to project directory
# cd ~/incubation/encubation_management_system

# Pull latest changes if it's a git repo
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes..."
    git pull origin main || git pull origin master || echo "Could not pull, continuing..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Create production .env file
# echo "⚙️  Creating environment file..."
# cat > .env << 'EOF'
# # API Configuration
# VITE_API_BASE_URL=http://encubation-backend.excellusi.com/api
# VITE_SOCKET_URL=http://encubation-backend.excellusi.com

# # Application Environment
# VITE_APP_ENV=production
# VITE_DEBUG=false

# # Server Port
# PORT=55221
# EOF

# Build the application
echo "🔨 Building application..."
npm run build

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Create PM2 ecosystem config
echo "⚙️  Creating PM2 config..."
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'encubation-frontend',
    script: 'npm',
    args: 'run start',
    cwd: '/home/library/incubation/encubation_management_system',
    env: {
      NODE_ENV: 'production',
      PORT: 55221
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Create logs directory
mkdir -p logs

# Stop existing process if running
echo "🛑 Stopping existing process..."
pm2 delete encubation-frontend 2>/dev/null || true

# Start with PM2
echo "▶️  Starting application with PM2..."
pm2 start ecosystem.config.cjs

# Save PM2 process list
pm2 save

echo ""
echo "✅ Deployment complete!"
echo "🌐 Application running at: http://$(hostname -I | awk '{print $1}'):55221"
echo ""
echo "📋 Useful PM2 commands:"
echo "   pm2 list              - List all processes"
echo "   pm2 logs              - View logs"
echo "   pm2 restart all       - Restart all"
echo "   pm2 monit             - Monitor processes"
echo ""

# Show status
pm2 list
